package authsvc

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

type TenantAuthPolicy struct {
	TenantID                 int64
	OTPLength                int
	OTPTTL                   time.Duration
	OTPMaxAttempts           int
	OTPEmailEnabled          bool
	OTPPhoneEnabled          bool
	LoginRequiresUsersAccess bool
	LoginRequiresUsersAct    bool
}

type TenantAuthPolicyRepository interface {
	GetByTenantID(ctx context.Context, tenantID int64) (*TenantAuthPolicy, error)
}

type tenantAuthPolicyRepository struct {
	client *postgres.Client
}

func NewTenantAuthPolicyRepository(client *postgres.Client) TenantAuthPolicyRepository {
	return &tenantAuthPolicyRepository{client: client}
}

func (r *tenantAuthPolicyRepository) GetByTenantID(ctx context.Context, tenantID int64) (*TenantAuthPolicy, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("auth policy: open master db: %w", err)
	}

	const query = `
SELECT tenant_id,
       otp_length,
       otp_ttl_seconds,
       otp_max_attempts,
       otp_email_enabled,
       otp_phone_enabled,
       login_requires_users_access,
       login_requires_users_act
  FROM tenant_auth_policy
 WHERE tenant_id = $1`

	var policy TenantAuthPolicy
	var otpTTLSeconds int
	if err := db.QueryRow(query, tenantID).Scan(
		&policy.TenantID,
		&policy.OTPLength,
		&otpTTLSeconds,
		&policy.OTPMaxAttempts,
		&policy.OTPEmailEnabled,
		&policy.OTPPhoneEnabled,
		&policy.LoginRequiresUsersAccess,
		&policy.LoginRequiresUsersAct,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("auth policy: query tenant policy: %w", err)
	}

	policy.OTPTTL = time.Duration(otpTTLSeconds) * time.Second
	return &policy, nil
}
