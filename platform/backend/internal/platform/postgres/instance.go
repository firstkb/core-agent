package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

func (c *Client) LoadInstancesFromMaster(ctx context.Context) error {
	rows, err := c.masterDB.QueryContext(ctx, `
		SELECT code, dns, secret_name, updated_at
		FROM db_instance`)
	if err != nil {
		return fmt.Errorf("load instances: %w", err)
	}
	defer rows.Close()

	tmp := make(map[string]instanceCfg)

	for rows.Next() {
		var (
			code, dns, secretName sql.NullString
			updatedAt             time.Time
		)
		if err := rows.Scan(&code, &dns, &secretName, &updatedAt); err != nil {
			return fmt.Errorf("scan instance: %w", err)
		}
		if !code.Valid || code.String == "" {
			continue
		}

		dsn, err := resolveInstanceDSN(code.String, dns.String, secretName.String, c.instanceResolv)
		if err != nil {
			c.logger.Error("instance dsn resolve failed", "code", code.String, "error", err)
		}
		if dsn == "" {
			// if dns and secret are empty, skip, will fallback to baseParms
			continue
		}

		params, err := ParseDSN(c.logger, dsn)
		if err != nil {
			c.logger.Error("instance dsn parse failed", "code", code.String, "dsn", dsn, "error", err)
			continue
		}
		// clear dbname — here it will be set by tenant_db
		params.DBName = ""
		tmp[code.String] = instanceCfg{
			params:    params,
			source:    instanceSource(dns.String, secretName.String),
			updatedAt: updatedAt,
		}
		c.logger.Info(fmt.Sprintf("instance loaded %s - %s", code.String, updatedAt.Format(time.DateTime)))
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("rows err: %w", err)
	}

	c.instancesMu.Lock()
	c.instances = tmp
	c.instancesMu.Unlock()

	//c.logger.Info("instances loaded", "count", len(tmp), "instances", tmp)
	return nil
}

func resolveInstanceDSN(code, dns, secretName string, resolver InstanceResolver) (string, error) {
	dns = strings.TrimSpace(dns)
	secretName = strings.TrimSpace(secretName)

	if secretName != "" {
		if resolver == nil {
			return "", fmt.Errorf("instance resolver is not configured for secret_name")
		}
		return resolver(code, secretName)
	}

	return dns, nil
}

func instanceSource(dns, secretName string) string {
	if strings.TrimSpace(secretName) != "" {
		return "secret_name"
	}
	if strings.TrimSpace(dns) != "" {
		return "dns"
	}
	return ""
}

func (c *Client) SeedBaseInstance(code string) {
	code = strings.TrimSpace(code)
	if code == "" {
		return
	}
	c.instancesMu.Lock()
	defer c.instancesMu.Unlock()
	if _, ok := c.instances[code]; ok {
		return
	}
	p := c.baseParms
	p.DBName = "" // db name is selected by tenant_db
	c.instances[code] = instanceCfg{params: p, source: "base_env", updatedAt: time.Now()}
}
