package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"

	"github.com/firstkb/sc-api/cmd/scapi/internal/utils"
	"github.com/firstkb/sc-api/internal/httpx/requestctx"
	"github.com/firstkb/sc-api/internal/postgres"
)

// Repository is the repository for the application.
type Repository struct {
	Client *postgres.Client
	Logger *slog.Logger
	Claim  *utils.Claim
}

// NewRepository creates a new repository.
func NewRepository(client *postgres.Client, logger *slog.Logger) Repository {
	return Repository{
		Client: client,
		Logger: logger,
	}
}

func (r *Repository) OpenDB(ctx context.Context) (*postgres.Database, error) {
	tenantInfo, ok := requestctx.Tenant(ctx)
	if !ok {
		return nil, errors.New("tenant not found")
	}

	db, err := r.Client.OpenDBTenant(ctx, tenantInfo.DBName, tenantInfo.DBInstanceCode)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func (r *Repository) OpenDBMaster(ctx context.Context) (*postgres.Database, error) {
	return r.Client.OpenDBMaster(ctx)
}

func (r *Repository) BeginTxMaster(ctx context.Context) (*sql.Tx, error) {
	db, err := r.Client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}
	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin master tx: %w", err)
	}
	return tx, nil
}

func (r *Repository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	tenantInfo, ok := requestctx.Tenant(ctx)
	if !ok {
		return nil, errors.New("tenant not found")
	}

	db, err := r.Client.OpenDBTenant(ctx, tenantInfo.DBName, tenantInfo.DBInstanceCode)
	if err != nil {
		return nil, err
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin tenant tx: %w", err)
	}
	return tx, nil
}
