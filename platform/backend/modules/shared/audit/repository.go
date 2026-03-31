package eventsvc

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type Repo struct {
	client *postgres.Client
	logger *slog.Logger
}

func eventAddress(data EventData) interface{} {
	if data == nil {
		return nil
	}
	address, ok := data["address"].(string)
	if !ok {
		return nil
	}
	address = strings.TrimSpace(address)
	if address == "" {
		return nil
	}
	return address
}

func eventSummary(eventType EventType, data EventData) interface{} {
	if data == nil {
		return string(eventType)
	}

	status, _ := data["status"].(string)
	reason, _ := data["reason"].(string)

	switch {
	case strings.TrimSpace(status) != "" && strings.TrimSpace(reason) != "":
		return fmt.Sprintf("%s status=%s reason=%s", eventType, status, reason)
	case strings.TrimSpace(status) != "":
		return fmt.Sprintf("%s status=%s", eventType, status)
	case strings.TrimSpace(reason) != "":
		return fmt.Sprintf("%s reason=%s", eventType, reason)
	default:
		return string(eventType)
	}
}

func eventText(eventType EventType, data EventData) interface{} {
	if data != nil {
		if text, ok := data["text"].(string); ok {
			text = strings.TrimSpace(text)
			if text != "" {
				return text
			}
		}
		if code, ok := data["code"].(string); ok {
			code = strings.TrimSpace(code)
			if code != "" {
				return code
			}
		}
	}
	return eventSummary(eventType, data)
}

func NewRepo(client *postgres.Client, logger *slog.Logger) *Repo {
	return &Repo{
		client: client,
		logger: logger,
	}
}

func (r *Repo) insert(ctx context.Context, event Event) error {
	tenantInfo, ok := requestctx.Tenant(ctx)
	var (
		db       *postgres.Database
		err      error
		tenantID *int64
	)
	if ok && tenantInfo.ID != "" {
		db, err = r.client.OpenDBTenant(ctx, tenantInfo.DBName, tenantInfo.DBInstanceCode)
		if err != nil {
			return fmt.Errorf("eventsvc: open tenant db: %w", err)
		}

		parsedTenantID, parseErr := strconv.ParseInt(strings.TrimSpace(tenantInfo.ID), 10, 64)
		if parseErr != nil {
			return fmt.Errorf("eventsvc: invalid tenant id")
		}
		tenantID = &parsedTenantID
	} else {
		db, err = r.client.OpenDBMaster(ctx)
		if err != nil {
			return fmt.Errorf("eventsvc: open master db: %w", err)
		}
	}

	var principalID interface{}
	if event.PrincipalID != nil && *event.PrincipalID != uuid.Nil {
		principalID = *event.PrincipalID
	}

	var userBusinessID interface{}
	if event.UserBusinessID != nil && *event.UserBusinessID > 0 {
		userBusinessID = *event.UserBusinessID
	}

	eventDataJSON := []byte(`{}`)
	if len(event.EventData) > 0 {
		eventDataJSON, err = json.Marshal(event.EventData)
		if err != nil {
			return fmt.Errorf("eventsvc: marshal event data: %w", err)
		}
	}

	var ipAddr interface{}
	if parsed := net.ParseIP(event.IPAddress); parsed != nil {
		ipAddr = parsed.String()
	}

	const query = `
INSERT INTO events (
  events_tenant_id,
  events_date,
  events_event,
  events_module,
  events_text,
  events_time,
  events_users_id,
  events_principal_guid,
  events_users_ip,
  events_to,
  events_data,
  events_created_at,
  events_updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("eventsvc: begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if tenantID != nil {
		if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(*tenantID, 10)); err != nil {
			return fmt.Errorf("eventsvc: set tenant rls context: %w", err)
		}
	}

	var tenantValue interface{}
	if tenantID != nil {
		tenantValue = *tenantID
	}

	if _, err := tx.ExecContext(ctx, query,
		tenantValue,
		event.CreatedAt.UTC().Format("2006-01-02"),
		string(event.EventType),
		event.Module,
		eventText(event.EventType, event.EventData),
		event.CreatedAt,
		userBusinessID,
		principalID,
		ipAddr,
		eventAddress(event.EventData),
		eventDataJSON,
		event.CreatedAt,
		event.CreatedAt,
	); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("eventsvc: commit tx: %w", err)
	}

	return nil
}
