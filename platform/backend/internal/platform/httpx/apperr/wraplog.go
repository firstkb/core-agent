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
	var appErr *AppError
	fields := []any{"code", code, "error", err}
	if errors.As(err, &appErr) && appErr != nil {
		if appErr.Err != nil {
			fields = append(fields, "cause", appErr.Err)
		}
		fields = append(fields, kv...)
		logger.Error(msg, fields...)
		return &AppError{
			Code:       appErr.Code,
			Message:    appErr.Message,
			StatusCode: appErr.StatusCode,
			Err:        err,
		}
	}

	fields = append(fields, kv...)
	logger.Error(msg, fields...)
	return Wrap(err, code, status, msg)
}
