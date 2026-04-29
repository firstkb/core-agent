package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

type PoolConfig struct {
	MaxIdle     int
	MaxOpen     int
	MaxLifetime time.Duration
	MaxIdleTime time.Duration
}

func Open(ctx context.Context, databaseURL string, pool PoolConfig) (*sql.DB, error) {
	conn, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}

	if pool.MaxIdle <= 0 {
		pool.MaxIdle = 5
	}
	if pool.MaxOpen <= 0 {
		pool.MaxOpen = 20
	}
	if pool.MaxLifetime <= 0 {
		pool.MaxLifetime = 30 * time.Minute
	}

	conn.SetMaxIdleConns(pool.MaxIdle)
	conn.SetMaxOpenConns(pool.MaxOpen)
	conn.SetConnMaxLifetime(pool.MaxLifetime)
	if pool.MaxIdleTime > 0 {
		conn.SetConnMaxIdleTime(pool.MaxIdleTime)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := conn.PingContext(pingCtx); err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	return conn, nil
}
