package notify

import (
	"context"
	"errors"
	"log/slog"
	"strings"

	"dtriton.com/platform/backend/internal/platform/appenv"
	"dtriton.com/platform/backend/internal/platform/config"
)

// Service provides notification sending functionality.
type Service interface {
	SendEmail(ctx context.Context, in EmailInput) (MessageID, error)
	SendSMS(ctx context.Context, in SMSInput) (MessageID, error)
}

type NotifyProvider struct {
	sender Sender
	logger *slog.Logger
}

// Config holds configuration for the notification service.
type Config struct {
	ProviderEmail   string `json:"provideremail"`   // "debug", "ses", ...
	ProviderSMS     string `json:"providersms"`     // "debug", "sns", ...
	DisableExternal bool   `json:"disableexternal"` // force debug/no-send mode
}

type rootConfig struct {
	Runtime appenv.Config `json:"runtime"`
	Notify  Config        `json:"notify"`
}

// NewService creates a new notification service.
func NewService(config *config.Config, logger *slog.Logger) (*NotifyProvider, error) {
	if logger == nil {
		logger = slog.Default()
	}

	var cfg rootConfig
	_ = config.Unmarshal("", &cfg)

	runtimeEnv := appenv.Normalize(cfg.Runtime.Environment)
	emailProvider := strings.ToLower(strings.TrimSpace(cfg.Notify.ProviderEmail))
	smsProvider := strings.ToLower(strings.TrimSpace(cfg.Notify.ProviderSMS))

	useDebug := cfg.Notify.DisableExternal || runtimeEnv.IsDevelopmentLike() || (emailProvider == "" && smsProvider == "")
	if emailProvider == "debug" || smsProvider == "debug" {
		useDebug = true
	}

	if useDebug {
		logger.Info("notify provider configured in debug mode",
			"environment", runtimeEnv.String(),
			"disable_external", cfg.Notify.DisableExternal,
			"email_provider", firstNonEmpty(emailProvider, "debug"),
			"sms_provider", firstNonEmpty(smsProvider, "debug"),
		)

		return &NotifyProvider{
			sender: NewDebugSender(logger),
			logger: logger,
		}, nil
	}

	return nil, errors.New("notify: non-debug providers are not implemented yet")
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func (s *NotifyProvider) SendEmail(ctx context.Context, in EmailInput) (MessageID, error) {
	if len(in.To) == 0 {
		return "", errors.New("notify: email recipients required")
	}
	return s.sender.SendEmail(ctx, in)
}

func (s *NotifyProvider) SendSMS(ctx context.Context, in SMSInput) (MessageID, error) {
	if in.To == "" {
		return "", errors.New("notify: sms recipient required")
	}
	return s.sender.SendSMS(ctx, in)
}
