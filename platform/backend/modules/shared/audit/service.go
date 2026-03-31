package eventsvc

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

// Service writes audit events to the tenant application database.
type EventService struct {
	client *postgres.Client
	repo   *Repo
	logger *slog.Logger
}

type tenantTarget struct {
	ID           string
	DBName       string
	InstanceCode string
}

// NewService wires repository with postgres client.
func NewService(sqlClient *postgres.Client, _ *config.Config, logger *slog.Logger) (*EventService, error) {

	repo := NewRepo(sqlClient, logger)

	return &EventService{
		client: sqlClient,
		repo:   repo,
		logger: logger,
	}, nil
}

// Log builds event payload from context/request and writes it to tenant DB.
func (s *EventService) Log(ctx context.Context, module string, eventType EventType, r *http.Request, data EventData) error {
	module = strings.TrimSpace(module)
	if module == "" {
		module = ModuleAuth
	}

	enrichedData := EventData{}
	for k, v := range data {
		enrichedData[k] = v
	}

	event := Event{
		Module:    module,
		EventType: eventType,
		EventData: enrichedData,
		CreatedAt: time.Now(),
	}

	if claims, ok := requestctx.Claims(ctx); ok && claims.UserID != "" {
		if parsed, err := uuid.Parse(claims.UserID); err == nil {
			event.PrincipalID = &parsed
		}
	} else if user, ok := requestctx.User(ctx); ok && user.ID != "" {
		if parsed, err := uuid.Parse(user.ID); err == nil {
			event.PrincipalID = &parsed
		}
		if user.BusinessID > 0 {
			userBusinessID := user.BusinessID
			event.UserBusinessID = &userBusinessID
		}
	} else if identity, ok := requestctx.Identity(ctx); ok && identity.ID != "" {
		if parsed, err := uuid.Parse(identity.ID); err == nil {
			event.PrincipalID = &parsed
		}
	}

	if event.PrincipalID == nil {
		if userID, ok := event.EventData["user_id"].(string); ok {
			if parsed, err := uuid.Parse(strings.TrimSpace(userID)); err == nil {
				event.PrincipalID = &parsed
			}
		}
	}

	if event.UserBusinessID == nil {
		switch userBusinessID := event.EventData["users_id"].(type) {
		case int64:
			if userBusinessID > 0 {
				id := userBusinessID
				event.UserBusinessID = &id
			}
		case int:
			if userBusinessID > 0 {
				id := int64(userBusinessID)
				event.UserBusinessID = &id
			}
		case float64:
			if userBusinessID > 0 {
				id := int64(userBusinessID)
				event.UserBusinessID = &id
			}
		case string:
			if parsed, err := strconv.ParseInt(strings.TrimSpace(userBusinessID), 10, 64); err == nil && parsed > 0 {
				id := parsed
				event.UserBusinessID = &id
			}
		}
	}

	if r != nil {
		event.IPAddress = extractIP(r)
		event.UserAgent = summarizeUserAgent(r.Header.Get("User-Agent"))
		if event.IPAddress != "" {
			event.EventData["ip_address"] = event.IPAddress
		}
		if event.UserAgent != "" {
			event.EventData["user_agent"] = event.UserAgent
		}
	}

	return s.repo.insert(ctx, event)
}
