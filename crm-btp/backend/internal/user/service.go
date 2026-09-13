package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"crm-btp/internal/audit"
	"crm-btp/internal/rbac"
	"crm-btp/pkg/hash"
	"crm-btp/pkg/validator"
	"github.com/google/uuid"
)

type Service interface {
	ListUsers(ctx context.Context, companyID uuid.UUID, page, limit int) ([]User, int64, error)
	GetUser(ctx context.Context, companyID, userID uuid.UUID) (*User, error)
	CreateUser(ctx context.Context, companyID, currentUserID uuid.UUID, req CreateUserRequest, ip, ua string) (*User, error)
	UpdateUser(ctx context.Context, companyID, currentUserID, targetUserID uuid.UUID, req UpdateUserRequest, ip, ua string) (*User, error)
}

type service struct {
	repo         Repository
	auditService audit.Service
}

func NewService(repo Repository, auditService audit.Service) Service {
	return &service{
		repo:         repo,
		auditService: auditService,
	}
}

func (s *service) ListUsers(ctx context.Context, companyID uuid.UUID, page, limit int) ([]User, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.repo.ListByCompany(ctx, companyID, limit, offset)
}

func (s *service) GetUser(ctx context.Context, companyID, userID uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, companyID, userID)
}

func (s *service) CreateUser(ctx context.Context, companyID, currentUserID uuid.UUID, req CreateUserRequest, ip, ua string) (*User, error) {
	if !validator.IsValidEmail(req.Email) {
		return nil, errors.New("adresse email invalide")
	}

	if ok, msg := validator.IsStrongPassword(req.Password); !ok {
		return nil, errors.New(msg)
	}

	if !rbac.IsValidRole(req.RoleCode) {
		return nil, fmt.Errorf("rôle invalide: %s", req.RoleCode)
	}

	if req.Phone != nil && *req.Phone != "" {
		if !validator.IsValidAlgerianPhone(*req.Phone) {
			return nil, errors.New("numéro de téléphone algérien invalide (ex: 0550123456)")
		}
	}

	// Check email uniqueness
	existing, err := s.repo.GetByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return nil, ErrUserAlreadyExists
	}

	roleID, err := s.repo.GetRoleIDByCode(ctx, req.RoleCode)
	if err != nil {
		return nil, fmt.Errorf("role introuvable: %w", err)
	}

	pwdHash, err := hash.GenerateFromPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("erreur de hachage du mot de passe: %w", err)
	}

	newUser := &User{
		ID:           uuid.New(),
		CompanyID:    companyID,
		RoleID:       roleID,
		RoleCode:     req.RoleCode,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		Phone:        req.Phone,
		JobTitle:     req.JobTitle,
		PasswordHash: pwdHash,
		Status:       "ACTIVE",
	}

	if err := s.repo.Create(ctx, nil, newUser); err != nil {
		return nil, fmt.Errorf("impossible de créer le collaborateur: %w", err)
	}

	// Audit log
	newVals, _ := json.Marshal(newUser)
	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  companyID,
		UserID:     &currentUserID,
		Action:     "CREATE",
		EntityName: "USER",
		EntityID:   newUser.ID.String(),
		NewValues:  newVals,
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return newUser, nil
}

func (s *service) UpdateUser(ctx context.Context, companyID, currentUserID, targetUserID uuid.UUID, req UpdateUserRequest, ip, ua string) (*User, error) {
	if !rbac.IsValidRole(req.RoleCode) {
		return nil, fmt.Errorf("rôle invalide: %s", req.RoleCode)
	}

	if req.Phone != nil && *req.Phone != "" {
		if !validator.IsValidAlgerianPhone(*req.Phone) {
			return nil, errors.New("numéro de téléphone algérien invalide")
		}
	}

	existing, err := s.repo.GetByID(ctx, companyID, targetUserID)
	if err != nil {
		return nil, err
	}

	roleID, err := s.repo.GetRoleIDByCode(ctx, req.RoleCode)
	if err != nil {
		return nil, err
	}

	oldVals, _ := json.Marshal(existing)

	existing.FirstName = req.FirstName
	existing.LastName = req.LastName
	existing.Phone = req.Phone
	existing.JobTitle = req.JobTitle
	existing.RoleID = roleID
	existing.RoleCode = req.RoleCode
	existing.Status = req.Status

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	newVals, _ := json.Marshal(existing)
	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  companyID,
		UserID:     &currentUserID,
		Action:     "UPDATE",
		EntityName: "USER",
		EntityID:   targetUserID.String(),
		OldValues:  oldVals,
		NewValues:  newVals,
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return existing, nil
}
