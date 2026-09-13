package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

func NewPostgresDB(databaseURL string) (*DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL successfully")
	return &DB{db}, nil
}

// RunMigrations executes migration files from migrations directory if needed.
func (db *DB) RunMigrations(migrationFilePath string) error {
	content, err := os.ReadFile(migrationFilePath)
	if err != nil {
		// Try fallback relative path
		altPath := filepath.Join("migrations", filepath.Base(migrationFilePath))
		content, err = os.ReadFile(altPath)
		if err != nil {
			return fmt.Errorf("could not read migration file %s: %w", migrationFilePath, err)
		}
	}

	_, err = db.Exec(string(content))
	if err != nil {
		return fmt.Errorf("failed to execute migration %s: %w", migrationFilePath, err)
	}

	log.Printf("Successfully executed migration: %s\n", migrationFilePath)
	return nil
}
