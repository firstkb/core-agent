package notifysvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type Repo struct {
	client *postgres.Client
	logger *slog.Logger
}

func NewRepo(client *postgres.Client, logger *slog.Logger) *Repo {
	return &Repo{
		client: client,
		logger: logger,
	}
}

func (r *Repo) getTemplate(ctx context.Context, tenantID, kind, key, locale string) (*Template, error) {
	tenantInfo, ok := requestctx.Tenant(ctx)
	if !ok {
		return nil, errors.New("notifysvc: tenant not found")
	}
	db, err := r.client.OpenDBTenant(ctx, tenantInfo.DBName, tenantInfo.DBInstanceCode)
	if err != nil {
		return nil, err
	}
	var tpl Template
	queryTenant := `
SELECT id, tenant_id, kind, key, locale, subject, html, text
  FROM notification_template
 WHERE tenant_id = $1 AND kind = $2 AND key = $3 AND locale = $4
 LIMIT 1`

	err = db.QueryRow(queryTenant, tenantID, kind, key, locale).Scan(
		&tpl.ID, &tpl.TenantID, &tpl.Kind, &tpl.Key, &tpl.Locale, &tpl.Subject, &tpl.HTML, &tpl.Text,
	)
	switch {
	case err == nil:
		return &tpl, nil
	case errors.Is(err, sql.ErrNoRows):
		// fallback
	default:
		return nil, fmt.Errorf("notifysvc: tenant template query: %w", err)
	}

	queryGlobal := `
SELECT id, tenant_id, kind, key, locale, subject, html, text
  FROM notification_template
 WHERE tenant_id IS NULL AND kind = $1 AND key = $2 AND locale = $3
 LIMIT 1`

	err = db.QueryRow(queryGlobal, kind, key, locale).Scan(
		&tpl.ID, &tpl.TenantID, &tpl.Kind, &tpl.Key, &tpl.Locale, &tpl.Subject, &tpl.HTML, &tpl.Text,
	)
	switch {
	case err == nil:
		return &tpl, nil
	case errors.Is(err, sql.ErrNoRows):
		if locale != "default" {
			return r.getTemplate(ctx, tenantID, kind, key, "default")
		}
		return nil, fmt.Errorf("notifysvc: template %s/%s locale=%s not found", kind, key, locale)
	default:
		return nil, fmt.Errorf("notifysvc: global template query: %w", err)
	}
}
