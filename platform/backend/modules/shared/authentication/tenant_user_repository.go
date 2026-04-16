package authsvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

var ErrTenantUserNotFound = errors.New("tenant user not found")

type TenantUser struct {
	ID         uuid.UUID
	BusinessID int64
	TenantID   int64
	Email      string
	FirstName  string
	LastName   string
	Phone      string
	Access     bool
	Active     bool
	Admin      bool
	Role       string
	Level      int
}

type TenantUserRepository interface {
	FindByEmail(ctx context.Context, tenant requestctx.TenantInfo, email string) (*TenantUser, error)
	FindByPhone(ctx context.Context, tenant requestctx.TenantInfo, phone string) (*TenantUser, error)
	GetByID(ctx context.Context, tenant requestctx.TenantInfo, userID uuid.UUID) (*TenantUser, error)
}

type tenantUserRepository struct {
	client *postgres.Client
}

func NewTenantUserRepository(client *postgres.Client) TenantUserRepository {
	return &tenantUserRepository{client: client}
}

func (r *tenantUserRepository) FindByEmail(ctx context.Context, tenant requestctx.TenantInfo, email string) (*TenantUser, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		return nil, ErrTenantUserNotFound
	}

	const query = `
SELECT guid,
       id,
       tenant_id,
       email,
       COALESCE(first_name, '') AS auth_first_name,
       COALESCE(last_name, '') AS auth_last_name,
       COALESCE(NULLIF(mobile_phone, ''), NULLIF(phone, '')) AS auth_phone,
       COALESCE(system_access, false) AS auth_access,
       active AS auth_active,
       (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) AS auth_admin,
       CASE
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 'admin'
         ELSE 'member'
       END AS auth_role,
       CASE
         WHEN COALESCE(auth_level, 0) > 0 THEN auth_level
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 80
         ELSE 20
       END AS auth_level
  FROM users
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND email = $1
 LIMIT 1`

	return r.queryOne(ctx, tenant, query, email)
}

func (r *tenantUserRepository) FindByPhone(ctx context.Context, tenant requestctx.TenantInfo, phone string) (*TenantUser, error) {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil, ErrTenantUserNotFound
	}

	const query = `
SELECT guid,
       id,
       tenant_id,
       email,
       COALESCE(first_name, '') AS auth_first_name,
       COALESCE(last_name, '') AS auth_last_name,
       COALESCE(NULLIF(mobile_phone, ''), NULLIF(phone, '')) AS auth_phone,
       COALESCE(system_access, false) AS auth_access,
       active AS auth_active,
       (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) AS auth_admin,
       CASE
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 'admin'
         ELSE 'member'
       END AS auth_role,
       CASE
         WHEN COALESCE(auth_level, 0) > 0 THEN auth_level
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 80
         ELSE 20
       END AS auth_level
  FROM users
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND ($1 = mobile_phone OR $1 = phone)
 LIMIT 1`

	return r.queryOne(ctx, tenant, query, phone)
}

func (r *tenantUserRepository) GetByID(ctx context.Context, tenant requestctx.TenantInfo, userID uuid.UUID) (*TenantUser, error) {
	if userID == uuid.Nil {
		return nil, ErrTenantUserNotFound
	}

	const query = `
SELECT guid,
       id,
       tenant_id,
       email,
       COALESCE(first_name, '') AS auth_first_name,
       COALESCE(last_name, '') AS auth_last_name,
       COALESCE(NULLIF(mobile_phone, ''), NULLIF(phone, '')) AS auth_phone,
       COALESCE(system_access, false) AS auth_access,
       active AS auth_active,
       (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) AS auth_admin,
       CASE
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 'admin'
         ELSE 'member'
       END AS auth_role,
       CASE
         WHEN COALESCE(auth_level, 0) > 0 THEN auth_level
         WHEN (COALESCE(admin_access, false) OR COALESCE(ets_admin, false)) THEN 80
         ELSE 20
       END AS auth_level
  FROM users
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND guid = $1
 LIMIT 1`

	return r.queryOne(ctx, tenant, query, userID)
}

func (r *tenantUserRepository) queryOne(ctx context.Context, tenant requestctx.TenantInfo, query string, args ...interface{}) (*TenantUser, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("tenant user: open tenant db: %w", err)
	}

	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID == 0 {
		return nil, fmt.Errorf("tenant user: invalid tenant id")
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("tenant user: begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(tenantID, 10)); err != nil {
		return nil, fmt.Errorf("tenant user: set tenant rls context: %w", err)
	}

	var user TenantUser
	if err := tx.QueryRowContext(ctx, query, args...).Scan(
		&user.ID,
		&user.BusinessID,
		&user.TenantID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Phone,
		&user.Access,
		&user.Active,
		&user.Admin,
		&user.Role,
		&user.Level,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrTenantUserNotFound
		}
		return nil, fmt.Errorf("tenant user: query user: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("tenant user: commit tx: %w", err)
	}

	return &user, nil
}
