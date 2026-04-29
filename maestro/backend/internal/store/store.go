package store

import (
	"database/sql"
)

type Store struct {
	db *sql.DB
}

func New(db *sql.DB) *Store {
	return &Store{db: db}
}

func defaultActor(actor Actor) Actor {
	if actor.Type == "" {
		actor.Type = "maestro"
	}
	if actor.ID == "" {
		actor.ID = actor.Type
	}
	return actor
}

func defaultString(value string, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func maybeString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func valueOr(current string, patch *string) string {
	if patch == nil {
		return current
	}
	return *patch
}

func deref(value *string) any {
	if value == nil {
		return nil
	}
	return *value
}
