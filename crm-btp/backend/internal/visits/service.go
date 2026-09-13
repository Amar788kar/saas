package visits

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// VisitService defines the interface for visit operations
type VisitService interface {
	CreateVisit(ctx context.Context, companyID uuid.UUID, req CreateVisitRequest) (*Visit, error)
	GetVisit(ctx context.Context, companyID, id uuid.UUID) (*Visit, error)
	UpdateVisit(ctx context.Context, companyID, id uuid.UUID, req UpdateVisitRequest) (*Visit, error)
	DeleteVisit(ctx context.Context, companyID, id uuid.UUID) error
	ListVisits(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Visit, error)
}

type visitService struct {
	repo VisitRepository
}

// NewVisitService creates a new visit service
func NewVisitService(repo VisitRepository) VisitService {
	return &visitService{repo: repo}
}

// CreateVisitRequest represents the data to create a visit
type CreateVisitRequest struct {
	ClientID    *uuid.UUID `json:"client_id,omitempty"`
	LeadID      *uuid.UUID `json:"lead_id,omitempty"`
	ScheduledAt time.Time  `json:"scheduled_at" binding:"required"`
	Address     string     `json:"address" binding:"omitempty"`
	Description string     `json:"description" binding:"omitempty"`
	Notes       string     `json:"notes" binding:"omitempty"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
}

// UpdateVisitRequest represents the data to update a visit
type UpdateVisitRequest struct {
	ClientID    *uuid.UUID `json:"client_id,omitempty"`
	LeadID      *uuid.UUID `json:"lead_id,omitempty"`
	ScheduledAt time.Time  `json:"scheduled_at" binding:"required"`
	Address     string     `json:"address" binding:"omitempty"`
	Description string     `json:"description" binding:"omitempty"`
	Notes       string     `json:"notes" binding:"omitempty"`
	Status      string     `json:"status" binding:"required,oneof=PLANIFIEE CONFIRMEE TERMINEE ANNULEE"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
}

func (s *visitService) CreateVisit(ctx context.Context, companyID uuid.UUID, req CreateVisitRequest) (*Visit, error) {
	visit := &Visit{
		CompanyID:   companyID,
		ClientID:    req.ClientID,
		LeadID:      req.LeadID,
		ScheduledAt: req.ScheduledAt,
		Address:     req.Address,
		Description: req.Description,
		Notes:       req.Notes,
		Status:      StatusPlanifiee,
		AssignedTo:  req.AssignedTo,
	}

	if err := s.repo.Create(ctx, visit); err != nil {
		return nil, err
	}
	return visit, nil
}

func (s *visitService) GetVisit(ctx context.Context, companyID, id uuid.UUID) (*Visit, error) {
	return s.repo.GetByID(ctx, companyID, id)
}

func (s *visitService) UpdateVisit(ctx context.Context, companyID, id uuid.UUID, req UpdateVisitRequest) (*Visit, error) {
	visit, err := s.repo.GetByID(ctx, companyID, id)
	if err != nil {
		return nil, err
	}

	visit.ClientID = req.ClientID
	visit.LeadID = req.LeadID
	visit.ScheduledAt = req.ScheduledAt
	visit.Address = req.Address
	visit.Description = req.Description
	visit.Notes = req.Notes
	visit.Status = VisitStatus(req.Status)
	visit.AssignedTo = req.AssignedTo

	if err := s.repo.Update(ctx, visit); err != nil {
		return nil, err
	}
	return visit, nil
}

func (s *visitService) DeleteVisit(ctx context.Context, companyID, id uuid.UUID) error {
	return s.repo.Delete(ctx, companyID, id)
}

func (s *visitService) ListVisits(ctx context.Context, companyID uuid.UUID, limit, offset int) ([]*Visit, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.List(ctx, companyID, limit, offset)
}
