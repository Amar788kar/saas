package timeline

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// TimelineEvent represents an event in the CRM timeline
type TimelineEvent struct {
	ID          uuid.UUID  `json:"id"`
	CompanyID   uuid.UUID  `json:"company_id"`
	ClientID    *uuid.UUID `json:"client_id,omitempty"`
	LeadID      *uuid.UUID `json:"lead_id,omitempty"`
	EventType   string     `json:"event_type"` // CALL, EMAIL, VISIT, NOTE, STATUS_CHANGE
	Description string     `json:"description"`
	CreatedBy   *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// TimelineRepository defines the interface for timeline data access
type TimelineRepository interface {
	Create(ctx context.Context, event *TimelineEvent) error
	ListByClient(ctx context.Context, companyID, clientID uuid.UUID, limit, offset int) ([]*TimelineEvent, error)
	ListByLead(ctx context.Context, companyID, leadID uuid.UUID, limit, offset int) ([]*TimelineEvent, error)
}

type postgresTimelineRepository struct {
	db *sql.DB
}

// NewPostgresTimelineRepository creates a new PostgreSQL timeline repository
func NewPostgresTimelineRepository(db *sql.DB) TimelineRepository {
	return &postgresTimelineRepository{db: db}
}

func (r *postgresTimelineRepository) Create(ctx context.Context, event *TimelineEvent) error {
	query := `
		INSERT INTO timeline_events (
			company_id, client_id, lead_id, event_type, description, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6
		) RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query,
		event.CompanyID,
		event.ClientID,
		event.LeadID,
		event.EventType,
		event.Description,
		event.CreatedBy,
	).Scan(&event.ID, &event.CreatedAt)

	return err
}

func (r *postgresTimelineRepository) ListByClient(ctx context.Context, companyID, clientID uuid.UUID, limit, offset int) ([]*TimelineEvent, error) {
	query := `
		SELECT id, company_id, client_id, lead_id, event_type, description, created_by, created_at
		FROM timeline_events
		WHERE company_id = $1 AND client_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, clientID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*TimelineEvent
	for rows.Next() {
		event := &TimelineEvent{}
		if err := rows.Scan(
			&event.ID,
			&event.CompanyID,
			&event.ClientID,
			&event.LeadID,
			&event.EventType,
			&event.Description,
			&event.CreatedBy,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *postgresTimelineRepository) ListByLead(ctx context.Context, companyID, leadID uuid.UUID, limit, offset int) ([]*TimelineEvent, error) {
	query := `
		SELECT id, company_id, client_id, lead_id, event_type, description, created_by, created_at
		FROM timeline_events
		WHERE company_id = $1 AND lead_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(ctx, query, companyID, leadID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*TimelineEvent
	for rows.Next() {
		event := &TimelineEvent{}
		if err := rows.Scan(
			&event.ID,
			&event.CompanyID,
			&event.ClientID,
			&event.LeadID,
			&event.EventType,
			&event.Description,
			&event.CreatedBy,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}
