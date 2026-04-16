package eventsvc

import (
	"time"

	"github.com/google/uuid"
)

// EventType represents the type of event being logged
type EventType string

const (
	ModuleAuth = "auth"

	// Auth events
	EventTypeOTPRequest       EventType = "otp_request"
	EventTypeOTPRequestFail   EventType = "otp_request_fail"
	EventTypeOTPVerify        EventType = "otp_verify"
	EventTypeOTPVerifyFail    EventType = "otp_verify_fail"
	EventTypeLogin            EventType = "login"
	EventTypeDelegatedRootLogin EventType = "delegated_root_login"
	EventTypeLogout           EventType = "logout"
	EventTypeLogoutFail       EventType = "logout_fail"
	EventTypeTokenRefresh     EventType = "token_refresh"
	EventTypeTokenRefreshFail EventType = "token_refresh_fail"
	EventTypeSessionCreated   EventType = "session_created"
	EventTypeSessionRotated   EventType = "session_rotated"
	EventTypeSessionRevoked   EventType = "session_revoked"
	EventTypeSessionReuse     EventType = "session_reuse_detected"

	// User events
	EventTypeUserCreate     EventType = "user_create"
	EventTypeUserUpdate     EventType = "user_update"
	EventTypeUserDeactivate EventType = "user_deactivate"
	EventTypeUserActivate   EventType = "user_activate"
	EventTypeUserDelete     EventType = "user_delete"
)

// EventData represents additional event data as a map
type EventData map[string]interface{}

// Event represents a single event to be logged
type Event struct {
	PrincipalID    *uuid.UUID // nullable canonical actor identity
	UserBusinessID *int64     // nullable tenant users.id for business/user joins
	Module         string
	EventType      EventType
	EventData      EventData
	IPAddress      string
	UserAgent      string
	CreatedAt      time.Time
}
