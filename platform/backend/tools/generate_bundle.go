package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type bundleConfig struct {
	Name       string
	SourceDirs []string
	OutputPath string
	Required   []bundleRequirement
}

type bundleRequirement struct {
	Name     string
	Patterns []string
}

type migration struct {
	Version string
	Name    string
	Path    string
}

func main() {
	configs := []bundleConfig{
		{
			Name:       "tenant_schema_full.sql",
			SourceDirs: []string{"migrations/postgres/archive", "migrations/postgres/tenant"},
			OutputPath: "bundle/tenant_schema_full.sql",
			Required: []bundleRequirement{
				{Name: "users table", Patterns: []string{"create table if not exists users", "tenant_id"}},
				{Name: "company table", Patterns: []string{"create table if not exists company", "tenant_id"}},
				{Name: "public code table", Patterns: []string{"create table if not exists public_code"}},
				{Name: "events table", Patterns: []string{"create table if not exists events", "tenant_id"}},
				{Name: "timezone table", Patterns: []string{"create table if not exists timezone"}},
			},
		},
	}

	for _, cfg := range configs {
		if err := generateBundle(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "Error generating %s: %v\n", cfg.Name, err)
			os.Exit(1)
		}
	}

	outputs := make([]string, 0, len(configs))
	for _, cfg := range configs {
		outputs = append(outputs, cfg.OutputPath)
	}
	fmt.Printf("✓ Generated bundles: %s\n", strings.Join(outputs, ", "))
}

func generateBundle(cfg bundleConfig) error {
	migrations, err := loadMigrationsFromDirs(cfg.SourceDirs)
	if err != nil {
		return fmt.Errorf("load migrations from %v: %w", cfg.SourceDirs, err)
	}
	if len(migrations) == 0 {
		return fmt.Errorf("no migrations found in %v", cfg.SourceDirs)
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Name < migrations[j].Name
	})

	var b strings.Builder
	var versions []string

	writeHeader(&b, cfg, migrations)

	for _, m := range migrations {
		content, err := os.ReadFile(m.Path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", m.Path, err)
		}
		b.WriteString("\n-- ============================================\n")
		b.WriteString(fmt.Sprintf("-- Migration: %s\n", m.Name))
		b.WriteString("-- ============================================\n\n")
		b.WriteString(string(content))
		b.WriteString("\n")
		versions = append(versions, m.Version)
	}

	writeFooter(&b, versions)

	contentBytes := []byte(b.String())
	checksum := sha256.Sum256(contentBytes)
	finalContent := strings.ReplaceAll(b.String(), "{{CHECKSUM}}", hex.EncodeToString(checksum[:]))

	if err := os.MkdirAll(filepath.Dir(cfg.OutputPath), 0755); err != nil {
		return fmt.Errorf("create bundle dir: %w", err)
	}
	if err := os.WriteFile(cfg.OutputPath, []byte(finalContent), 0644); err != nil {
		return fmt.Errorf("write bundle: %w", err)
	}
	if err := validateBundle(cfg, finalContent); err != nil {
		return fmt.Errorf("validate bundle: %w", err)
	}

	fmt.Printf("Bundle generated successfully:\n")
	fmt.Printf("  - Path: %s\n", cfg.OutputPath)
	fmt.Printf("  - Migrations: %d\n", len(migrations))
	fmt.Printf("  - Checksum: %s\n", hex.EncodeToString(checksum[:]))
	fmt.Printf("  - Size: %d bytes\n", len(finalContent))

	return nil
}

func loadMigrationsFromDirs(dirs []string) ([]migration, error) {
	var migrations []migration
	seen := make(map[string]string)

	for _, dir := range dirs {
		if strings.TrimSpace(dir) == "" {
			continue
		}
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			continue
		}

		err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() {
				return nil
			}
			if !strings.HasSuffix(d.Name(), ".sql") {
				return nil
			}
			if strings.HasPrefix(strings.ToLower(d.Name()), "readme") {
				return nil
			}

			version := strings.TrimSuffix(d.Name(), ".sql")
			if existing, ok := seen[version]; ok {
				return fmt.Errorf("duplicate migration version %q in %s and %s", version, existing, path)
			}
			seen[version] = path

			migrations = append(migrations, migration{
				Version: version,
				Name:    d.Name(),
				Path:    path,
			})
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	return migrations, nil
}

func writeHeader(b *strings.Builder, cfg bundleConfig, migrations []migration) {
	b.WriteString("-- ============================================\n")
	b.WriteString(fmt.Sprintf("-- Golden Schema Bundle: %s\n", cfg.Name))
	b.WriteString("-- ============================================\n")
	b.WriteString("--\n")
	b.WriteString(fmt.Sprintf("-- Generated: %s\n", time.Now().Format(time.RFC3339)))
	b.WriteString(fmt.Sprintf("-- Source: migrations from %s\n", strings.Join(cfg.SourceDirs, ", ")))
	b.WriteString("--\n")
	b.WriteString("-- Checksum: {{CHECKSUM}}\n")
	b.WriteString("--\n")
	b.WriteString("-- Migrations included:\n")
	for _, m := range migrations {
		b.WriteString(fmt.Sprintf("--   - %s\n", m.Name))
	}
	b.WriteString("-- ============================================\n\n")
}

func writeFooter(b *strings.Builder, versions []string) {
	b.WriteString("\n-- ============================================\n")
	b.WriteString("-- Bundle End\n")
	b.WriteString("-- ============================================\n")
	b.WriteString(fmt.Sprintf("-- Total migrations: %d\n", len(versions)))
	b.WriteString("-- Versions: " + strings.Join(versions, ", ") + "\n")
	b.WriteString("-- ============================================\n")
}

func validateBundle(cfg bundleConfig, content string) error {
	contentLower := strings.ToLower(content)
	var missing []string

	for _, req := range cfg.Required {
		found := true
		for _, pattern := range req.Patterns {
			if !strings.Contains(contentLower, strings.ToLower(pattern)) {
				found = false
				break
			}
		}
		if !found {
			missing = append(missing, req.Name)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required objects: %s", strings.Join(missing, ", "))
	}

	return nil
}
