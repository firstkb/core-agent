package sessions

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

var (
	ErrRefreshTokenNotFound = errors.New("refresh token not found")
	ErrRefreshTokenExpired  = errors.New("refresh token expired")
	ErrRefreshTokenRevoked  = errors.New("refresh token revoked")
	ErrRefreshTokenRotated  = errors.New("refresh token rotated")
)

const (
	RefreshSurfaceUnknown = "unknown"
	RefreshSurfaceTenant  = "tenant"
	RefreshSurfaceAdmin   = "admin"
)

type RefreshTokenState string

const (
	RefreshTokenStateActive  RefreshTokenState = "active"
	RefreshTokenStateExpired RefreshTokenState = "expired"
	RefreshTokenStateRevoked RefreshTokenState = "revoked"
	RefreshTokenStateRotated RefreshTokenState = "rotated"
)

// RefreshToken represents a refresh token
type RefreshToken struct {
	ID            uuid.UUID
	SessionID     uuid.UUID
	TenantID      int64
	UserID        uuid.UUID
	Surface       string
	TokenHash     string // SHA256 hash of the token
	TokenFamilyID uuid.UUID
	ClientID      *string
	DeviceID      *string
	IPAddress     *string
	UserAgent     *string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	ExpiresAt     time.Time
	RevokedAt     *time.Time
	RotatedAt     *time.Time
}

func (t *RefreshToken) StateAt(now time.Time) RefreshTokenState {
	if t == nil {
		return RefreshTokenStateRevoked
	}
	if t.RotatedAt != nil {
		return RefreshTokenStateRotated
	}
	if t.RevokedAt != nil {
		return RefreshTokenStateRevoked
	}
	if !t.ExpiresAt.IsZero() && now.After(t.ExpiresAt) {
		return RefreshTokenStateExpired
	}
	return RefreshTokenStateActive
}

// RefreshTokenRepository handles refresh token database operations
type RefreshTokenRepository interface {
	CreateToken(ctx context.Context, token *RefreshToken) error
	GetToken(ctx context.Context, tokenHash string) (*RefreshToken, error)
	GetTokenRecord(ctx context.Context, tokenHash string) (*RefreshToken, error)
	RotateToken(ctx context.Context, currentTokenHash string, token *RefreshToken) error
	RevokeToken(ctx context.Context, tokenHash string) error
	RevokeTokenFamily(ctx context.Context, tokenFamilyID uuid.UUID) error
	RevokeUserTokens(ctx context.Context, tenantID int64, userID uuid.UUID, exceptTokenHash *string) error
	DeleteExpiredTokens(ctx context.Context, tenantID int64) error
}

type refreshTokenRepository struct {
	client *postgres.Client
}

type refreshTokenScanner interface {
	Scan(dest ...any) error
}

const insertRefreshTokenQuery = `
	INSERT INTO auth_refresh_token (
		id,
		session_id,
		tenant_id,
		user_id,
		surface,
		token_hash,
		token_family_id,
		client_id,
		device_id,
		ip_address,
		user_agent,
		created_at,
		updated_at,
		expires_at,
		revoked_at,
		rotated_at
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
`

const selectRefreshTokenByHashQuery = `
	SELECT
		id,
		session_id,
		tenant_id,
		user_id,
		surface,
		token_hash,
		token_family_id,
		client_id,
		device_id,
		ip_address::text,
		user_agent,
		created_at,
		updated_at,
		expires_at,
		revoked_at,
		rotated_at
	FROM auth_refresh_token
	WHERE token_hash = $1
`

const selectRefreshTokenByHashForUpdateQuery = selectRefreshTokenByHashQuery + ` FOR UPDATE`

// NewRefreshTokenRepository creates a new refresh token repository.
func NewRefreshTokenRepository(client *postgres.Client) RefreshTokenRepository {
	return &refreshTokenRepository{client: client}
}

// HashToken hashes a refresh token using SHA256
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func normalizeRefreshTokenRecord(token *RefreshToken) {
	now := time.Now()
	if token.ID == uuid.Nil {
		token.ID = uuid.New()
	}
	if token.SessionID == uuid.Nil {
		token.SessionID = uuid.New()
	}
	if token.TokenFamilyID == uuid.Nil {
		token.TokenFamilyID = uuid.New()
	}
	if token.CreatedAt.IsZero() {
		token.CreatedAt = now
	}
	if token.UpdatedAt.IsZero() {
		token.UpdatedAt = token.CreatedAt
	}

	token.Surface = strings.TrimSpace(token.Surface)
	if token.Surface == "" {
		token.Surface = RefreshSurfaceUnknown
	}
}

func refreshTokenValues(token *RefreshToken) []any {
	return []any{
		token.ID,
		token.SessionID,
		token.TenantID,
		token.UserID,
		token.Surface,
		token.TokenHash,
		token.TokenFamilyID,
		token.ClientID,
		token.DeviceID,
		token.IPAddress,
		token.UserAgent,
		token.CreatedAt,
		token.UpdatedAt,
		token.ExpiresAt,
		token.RevokedAt,
		token.RotatedAt,
	}
}

func insertRefreshTokenDB(db *postgres.Database, token *RefreshToken) error {
	normalizeRefreshTokenRecord(token)

	_, err := db.Exec(insertRefreshTokenQuery, refreshTokenValues(token)...)
	return err
}

func insertRefreshTokenTx(ctx context.Context, tx *sql.Tx, token *RefreshToken) error {
	normalizeRefreshTokenRecord(token)

	_, err := tx.ExecContext(ctx, insertRefreshTokenQuery, refreshTokenValues(token)...)
	return err
}

func scanRefreshToken(row refreshTokenScanner) (*RefreshToken, error) {
	var (
		token     RefreshToken
		ipAddress sql.NullString
		userAgent sql.NullString
	)
	err := row.Scan(
		&token.ID,
		&token.SessionID,
		&token.TenantID,
		&token.UserID,
		&token.Surface,
		&token.TokenHash,
		&token.TokenFamilyID,
		&token.ClientID,
		&token.DeviceID,
		&ipAddress,
		&userAgent,
		&token.CreatedAt,
		&token.UpdatedAt,
		&token.ExpiresAt,
		&token.RevokedAt,
		&token.RotatedAt,
	)
	if err != nil {
		return nil, err
	}

	if ipAddress.Valid {
		token.IPAddress = &ipAddress.String
	}
	if userAgent.Valid {
		token.UserAgent = &userAgent.String
	}

	return &token, nil
}

func (r *refreshTokenRepository) CreateToken(ctx context.Context, token *RefreshToken) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	return insertRefreshTokenDB(db, token)
}

func (r *refreshTokenRepository) GetTokenRecord(ctx context.Context, tokenHash string) (*RefreshToken, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("refresh: open master db: %w", err)
	}

	token, err := scanRefreshToken(db.QueryRow(selectRefreshTokenByHashQuery, tokenHash))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRefreshTokenNotFound
		}
		return nil, fmt.Errorf("get refresh token record: %w", err)
	}

	return token, nil
}

func (r *refreshTokenRepository) GetToken(ctx context.Context, tokenHash string) (*RefreshToken, error) {
	token, err := r.GetTokenRecord(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	switch token.StateAt(time.Now()) {
	case RefreshTokenStateExpired:
		return nil, ErrRefreshTokenExpired
	case RefreshTokenStateRotated:
		return nil, ErrRefreshTokenRotated
	case RefreshTokenStateRevoked:
		return nil, ErrRefreshTokenRevoked
	default:
		return token, nil
	}
}

func getTokenRecordForUpdate(ctx context.Context, tx *sql.Tx, tokenHash string) (*RefreshToken, error) {
	token, err := scanRefreshToken(tx.QueryRowContext(ctx, selectRefreshTokenByHashForUpdateQuery, tokenHash))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRefreshTokenNotFound
		}
		return nil, fmt.Errorf("get refresh token record for update: %w", err)
	}

	return token, nil
}

func (r *refreshTokenRepository) RotateToken(ctx context.Context, currentTokenHash string, token *RefreshToken) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin refresh token rotation tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	current, err := getTokenRecordForUpdate(ctx, tx, currentTokenHash)
	if err != nil {
		return err
	}

	switch current.StateAt(time.Now()) {
	case RefreshTokenStateExpired:
		return ErrRefreshTokenExpired
	case RefreshTokenStateRotated:
		return ErrRefreshTokenRotated
	case RefreshTokenStateRevoked:
		return ErrRefreshTokenRevoked
	}

	if token.UserID == uuid.Nil {
		token.UserID = current.UserID
	}
	if token.SessionID == uuid.Nil {
		token.SessionID = current.SessionID
	}
	if token.TokenFamilyID == uuid.Nil {
		token.TokenFamilyID = current.TokenFamilyID
	}
	if token.TenantID == 0 && current.TenantID != 0 {
		token.TenantID = current.TenantID
	}
	if strings.TrimSpace(token.Surface) == "" {
		token.Surface = current.Surface
	}
	if token.ClientID == nil {
		token.ClientID = current.ClientID
	}
	if token.DeviceID == nil {
		token.DeviceID = current.DeviceID
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE auth_refresh_token
		SET rotated_at = COALESCE(rotated_at, NOW()),
		    revoked_at = COALESCE(revoked_at, NOW()),
		    updated_at = NOW()
		WHERE id = $1
	`, current.ID)
	if err != nil {
		return fmt.Errorf("mark refresh token rotated: %w", err)
	}

	if err := insertRefreshTokenTx(ctx, tx, token); err != nil {
		return fmt.Errorf("insert rotated refresh token: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit refresh token rotation tx: %w", err)
	}

	return nil
}

func (r *refreshTokenRepository) RevokeToken(ctx context.Context, tokenHash string) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	query := `
		UPDATE auth_refresh_token
		SET revoked_at = NOW(), updated_at = NOW()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`

	result, err := db.Exec(query, tokenHash)
	if err != nil {
		return fmt.Errorf("revoke token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrRefreshTokenNotFound
	}

	return nil
}

func (r *refreshTokenRepository) RevokeTokenFamily(ctx context.Context, tokenFamilyID uuid.UUID) error {
	if tokenFamilyID == uuid.Nil {
		return ErrRefreshTokenNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	result, err := db.Exec(`
		UPDATE auth_refresh_token
		SET revoked_at = NOW(), updated_at = NOW()
		WHERE token_family_id = $1 AND revoked_at IS NULL
	`, tokenFamilyID)
	if err != nil {
		return fmt.Errorf("revoke refresh token family: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get family revoke rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return ErrRefreshTokenNotFound
	}

	return nil
}

func (r *refreshTokenRepository) RevokeUserTokens(ctx context.Context, tenantID int64, userID uuid.UUID, exceptTokenHash *string) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	var query string
	var args []interface{}

	if exceptTokenHash != nil {
		query = `
			UPDATE auth_refresh_token
			SET revoked_at = NOW(), updated_at = NOW()
			WHERE tenant_id = $1 AND user_id = $2 AND revoked_at IS NULL AND token_hash != $3
		`
		args = []interface{}{tenantID, userID, *exceptTokenHash}
	} else {
		query = `
			UPDATE auth_refresh_token
			SET revoked_at = NOW(), updated_at = NOW()
			WHERE tenant_id = $1 AND user_id = $2 AND revoked_at IS NULL
		`
		args = []interface{}{tenantID, userID}
	}

	_, err = db.Exec(query, args...)
	return err
}

func (r *refreshTokenRepository) DeleteExpiredTokens(ctx context.Context, tenantID int64) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("refresh: open master db: %w", err)
	}

	query := `DELETE FROM auth_refresh_token WHERE tenant_id = $1 AND expires_at < NOW()`
	_, err = db.Exec(query, tenantID)
	return err
}
