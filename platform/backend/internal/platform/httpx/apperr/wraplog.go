package apperr

import (
	"context"
	"errors"
	"log/slog"
)

// WrapAndLog — перенос логики из server.errors.go без привязки к типу Server.
func WrapAndLog(
	logger *slog.Logger,
	_ context.Context,
	code string,
	status int,
	msg string,
	err error,
	kv ...any,
) *AppError {
	fields := append([]any{"code", code, "error", err}, kv...)
	logger.Error(msg, fields...)

	var appErr *AppError
	if errors.As(err, &appErr) && appErr != nil {
		return &AppError{
			Code:       appErr.Code,
			Message:    appErr.Message,
			StatusCode: appErr.StatusCode,
			Err:        err,
		}
	}

	return Wrap(err, code, status, msg)
}
