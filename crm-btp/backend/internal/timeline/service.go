package timeline

import (
	"context"

	"github.com/google/uuid"
)

// TimelineService defines the interface for timeline operations
type TimelineService interface {
	CreateEvent(ctx context.Context, companyID uuid.UUID, req CreateEventRequest) (*TimelineEvent, error)
	ListEventsByClient(ctx context.Context, companyID, clientID uuid.UUID, limit, offset int) ([]*TimelineEvent, error)
	ListEventsByLead(ctx context.Context, companyID, leadID uuid.UUID, limit, offset int) ([]*TimelineEvent, error)
}

type timelineService struct {
	repo TimelineRepository
}

// NewTimelineService creates a new timeline service
func NewTimelineService(repo TimelineRepository) TimelineService {
	return &timelineService{repo: repo}
}

// CreateEventRequest represents the data to create a timeline event
type CreateEventRequest struct {
	ClientID    *uuid.UUID `json:"client_id,omitempty"`
	LeadID      *uuid.UUID `json:"lead_id,omitempty"`
	EventType   string     `json:"event_type" binding:"required"` // CALL, EMAIL, VISIT, NOTE, STATUS_CHANGE
	Description string     `json:"description" binding:"required"`
	CreatedBy   *uuid.UUID `json:"created_by,omitempty"`
}

func (s *timelineService) CreateEvent(ctx context.Context, companyID uuid.UUID, req CreateEventRequest) (*TimelineEvent, error) {
	event := &TimelineEvent{
		CompanyID:   companyID,
		ClientID:    req.ClientID,
		LeadID:      req.LeadID,
		EventType:   req.EventType,
		Description: req.Description,
		CreatedBy:   req.CreatedBy,
	}

	if err := s.repo.Create(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *timelineService) ListEventsByClient(ctx context.Context, companyID, clientID uuid.UUID, limit, offset int) ([]*TimelineEvent, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.ListByClient(ctx, companyID, clientID, limit, offset)
}

func (s *timelineService) ListEventsByLead(ctx context.Context, companyID, leadID uuid.UUID, limit, offset int) ([]*TimelineEvent, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.ListByLead(ctx, companyID, leadID, limit, offset)
}
