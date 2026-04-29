package migrations

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDirOrdersSQLMigrations(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "020_second.sql"), "select 2;")
	writeFile(t, filepath.Join(dir, "010_first.sql"), "select 1;")
	writeFile(t, filepath.Join(dir, "README.md"), "ignore")

	migrations, err := LoadDir(dir)
	if err != nil {
		t.Fatalf("load dir: %v", err)
	}

	if len(migrations) != 2 {
		t.Fatalf("len = %d, want 2", len(migrations))
	}
	if migrations[0].Version != "010_first" {
		t.Fatalf("first version = %q", migrations[0].Version)
	}
	if migrations[1].Version != "020_second" {
		t.Fatalf("second version = %q", migrations[1].Version)
	}
}

func writeFile(t *testing.T, path string, body string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatalf("write file: %v", err)
	}
}
