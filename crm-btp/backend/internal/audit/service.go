package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
)

type LogEntry struct {
	ID         int64           `json:"id"`
	CompanyID  uuid.UUID       `json:"company_id"`
	UserID     *uuid.UUID      `json:"user_id"`
	Action     string          `json:"action"`
	EntityName string          `json:"entity_name"`
	EntityID   string          `json:"entity_id"`
	OldValues  json.RawMessage `json:"old_values,omitempty"`
	NewValues  json.RawMessage `json:"new_values,omitempty"`
	IPAddress  string          `json:"ip_address"`
	UserAgent  string          `json:"user_agent"`
	CreatedAt  time.Time       `json:"created_at"`
}

type Service interface {
	Record(ctx context.Context, entry LogEntry) error
}

type auditService struct {
	db *sql.DB
}

func NewService(db *sql.DB) Service {
	return &auditService{db: db}
}

func (s *auditService) Record(ctx context.Context, entry LogEntry) error {
	query := `
		INSERT INTO audit_logs (company_id, user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
	`

	var oldVal, newVal interface{}
	if len(entry.OldValues) > 0 {
		oldVal = entry.OldValues
	}
	if len(entry.NewValues) > 0 {
		newVal = entry.NewValues
	}

	_, err := s.db.ExecContext(ctx, query,
		entry.CompanyID,
		entry.UserID,
		entry.Action,
		entry.EntityName,
		entry.EntityID,
		oldVal,
		newVal,
		entry.IPAddress,
		entry.UserAgent,
	)

	if err != nil {
		log.Printf("Error recording audit log: %v\n", err)
		return err
	}
	return nil
}
