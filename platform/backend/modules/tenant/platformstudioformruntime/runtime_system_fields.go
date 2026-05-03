package platformstudioformruntime

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) applyCreateSystemDefaults(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	claims requestctx.ClaimsInfo,
	scope runtimeRootScopePlan,
	values map[string]any,
) error {
	if statusField := findField(scope, scope.SystemFields.WorkflowStatus.FieldID); statusField != nil && validOptionValue(*statusField, scope.SystemFields.WorkflowStatus.InitialValue) {
		if isEmptyRuntimeValue(values[statusField.FieldID]) {
			values[statusField.FieldID] = scope.SystemFields.WorkflowStatus.InitialValue
		}
	}

	if dateField := findField(scope, scope.SystemFields.ReportedDate); dateField != nil {
		if isEmptyRuntimeValue(values[dateField.FieldID]) {
			now := s.now().UTC()
			if dateField.Kind == "date_time" {
				values[dateField.FieldID] = now.Format(time.RFC3339)
			} else {
				values[dateField.FieldID] = now.Format("2006-01-02")
			}
		}
	}

	if byField := findField(scope, scope.SystemFields.ReportedBy); byField != nil {
		if isEmptyRuntimeValue(values[byField.FieldID]) {
			value, err := s.reportedByValue(ctx, tenant, claims, *byField)
			if err != nil {
				return err
			}
			if value != nil {
				values[byField.FieldID] = value
			}
		}
	}

	return nil
}

func (s *Service) reportedByValue(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	claims requestctx.ClaimsInfo,
	field runtimeFieldPlan,
) (any, error) {
	switch field.Kind {
	case "db_lookup":
		userID := strings.TrimSpace(claims.UserID)
		if userID == "" {
			return nil, nil
		}
		businessID, err := s.repo.ResolveCurrentUserBusinessID(ctx, tenant, userID)
		if err != nil {
			return nil, err
		}
		if businessID == 0 {
			return nil, nil
		}
		return businessID, nil
	default:
		displayName := strings.TrimSpace(strings.Join([]string{claims.FirstName, claims.LastName}, " "))
		return chooseString(displayName, chooseString(claims.Email, claims.UserID)), nil
	}
}

func findField(scope runtimeRootScopePlan, fieldID string) *runtimeFieldPlan {
	fieldID = strings.TrimSpace(fieldID)
	if fieldID == "" {
		return nil
	}
	for index := range scope.Fields {
		if scope.Fields[index].FieldID == fieldID {
			return &scope.Fields[index]
		}
	}
	return nil
}

func validOptionValue(field runtimeFieldPlan, value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}
	if len(field.OptionValue) == 0 {
		return true
	}
	for _, optionValue := range field.OptionValue {
		if optionValue == value {
			return true
		}
	}
	return false
}

func statusValue(scope runtimeRootScopePlan, values map[string]any) string {
	statusFieldID := strings.TrimSpace(scope.SystemFields.WorkflowStatus.FieldID)
	if statusFieldID == "" {
		return ""
	}
	if value, ok := values[statusFieldID]; ok {
		return strings.TrimSpace(fmt.Sprint(value))
	}
	return ""
}
