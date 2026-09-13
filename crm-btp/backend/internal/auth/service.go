package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"crm-btp/internal/audit"
	"crm-btp/internal/company"
	"crm-btp/internal/database"
	"crm-btp/internal/user"
	"crm-btp/pkg/hash"
	"crm-btp/pkg/token"
	"crm-btp/pkg/validator"
	"github.com/google/uuid"
)

var (
	ErrInvalidCredentials = errors.New("identifiants invalides")
	ErrAccountInactive    = errors.New("votre compte ou entreprise est inactif")
	ErrTokenRevoked       = errors.New("le token de rafraîchissement a été révoqué ou a expiré")
)

type Service interface {
	Register(ctx context.Context, req RegisterRequest, ip, ua string) (*AuthResponse, error)
	Login(ctx context.Context, req LoginRequest, ip, ua string) (*AuthResponse, error)
	Refresh(ctx context.Context, rawRefreshToken string, ip, ua string) (*AuthResponse, error)
	Logout(ctx context.Context, rawRefreshToken string, ip, ua string) error
	GetMe(ctx context.Context, companyID, userID uuid.UUID) (*user.User, *company.Company, error)
	ChangePassword(ctx context.Context, companyID, userID uuid.UUID, req ChangePasswordRequest, ip, ua string) error
}

type service struct {
	db           *sql.DB
	authRepo     Repository
	companyRepo  company.Repository
	userRepo     user.Repository
	tokenManager *token.TokenManager
	cache        database.Cache
	auditService audit.Service
}

func NewService(
	db *sql.DB,
	authRepo Repository,
	companyRepo company.Repository,
	userRepo user.Repository,
	tokenManager *token.TokenManager,
	cache database.Cache,
	auditService audit.Service,
) Service {
	return &service{
		db:           db,
		authRepo:     authRepo,
		companyRepo:  companyRepo,
		userRepo:     userRepo,
		tokenManager: tokenManager,
		cache:        cache,
		auditService: auditService,
	}
}

func (s *service) Register(ctx context.Context, req RegisterRequest, ip, ua string) (*AuthResponse, error) {
	if !validator.IsValidWilaya(req.Wilaya) {
		return nil, fmt.Errorf("wilaya algérienne invalide: %s", req.Wilaya)
	}

	if !validator.IsValidAlgerianPhone(req.CompanyPhone) {
		return nil, errors.New("numéro de téléphone algérien invalide (ex: 0550123456)")
	}

	if !validator.IsValidEmail(req.Email) {
		return nil, errors.New("adresse email du gérant invalide")
	}

	if ok, msg := validator.IsStrongPassword(req.Password); !ok {
		return nil, errors.New(msg)
	}

	// Check if user already exists
	existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("un compte avec cet email existe déjà")
	}

	// Begin atomic transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	newCompany := &company.Company{
		ID:        uuid.New(),
		Name:      req.CompanyName,
		TradeName: req.TradeName,
		LegalForm: req.LegalForm,
		Phone:     req.CompanyPhone,
		Email:     req.CompanyEmail,
		Wilaya:    req.Wilaya,
		Currency:  "DZD",
		Plan:      "STARTER",
		Status:    "ACTIVE",
		Settings:  []byte(`{"modules": ["crm", "sales", "projects", "finance", "stock"]}`),
	}
	if newCompany.LegalForm == "" {
		newCompany.LegalForm = "SARL"
	}

	if err := s.companyRepo.Create(ctx, tx, newCompany); err != nil {
		return nil, fmt.Errorf("création entreprise échouée: %w", err)
	}

	roleID, err := s.userRepo.GetRoleIDByCode(ctx, "ADMIN")
	if err != nil {
		return nil, fmt.Errorf("rôle ADMIN introuvable: %w", err)
	}

	pwdHash, err := hash.GenerateFromPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("erreur de hachage: %w", err)
	}

	newUser := &user.User{
		ID:           uuid.New(),
		CompanyID:    newCompany.ID,
		RoleID:       roleID,
		RoleCode:     "ADMIN",
		RoleName:     "Gérant / Administrateur",
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		Phone:        &req.CompanyPhone,
		JobTitle:     stringPtr("Gérant / Fondateur"),
		PasswordHash: pwdHash,
		Status:       "ACTIVE",
	}

	if err := s.userRepo.Create(ctx, tx, newUser); err != nil {
		return nil, fmt.Errorf("création utilisateur échouée: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, expiresAt, err := s.tokenManager.GenerateAccessToken(newUser.ID, newCompany.ID, newUser.RoleCode, newUser.Email)
	if err != nil {
		return nil, err
	}

	rawRefresh, refreshHash, refreshExpiresAt, err := s.tokenManager.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	session := &RefreshTokenSession{
		ID:        uuid.New(),
		UserID:    newUser.ID,
		CompanyID: newCompany.ID,
		TokenHash: refreshHash,
		IPAddress: ip,
		UserAgent: ua,
		ExpiresAt: refreshExpiresAt,
	}

	if err := s.authRepo.SaveRefreshToken(ctx, session); err != nil {
		return nil, err
	}

	// Audit log
	compBytes, _ := json.Marshal(newCompany)
	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  newCompany.ID,
		UserID:     &newUser.ID,
		Action:     "REGISTER",
		EntityName: "COMPANY",
		EntityID:   newCompany.ID.String(),
		NewValues:  compBytes,
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		ExpiresAt:    expiresAt,
		User:         newUser,
		Company:      newCompany,
	}, nil
}

func (s *service) Login(ctx context.Context, req LoginRequest, ip, ua string) (*AuthResponse, error) {
	u, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if u.Status != "ACTIVE" {
		return nil, ErrAccountInactive
	}

	// Check password with Argon2id
	matched, err := hash.ComparePasswordAndHash(req.Password, u.PasswordHash)
	if err != nil || !matched {
		return nil, ErrInvalidCredentials
	}

	// Check company status
	comp, err := s.companyRepo.GetByID(ctx, u.CompanyID)
	if err != nil || comp.Status != "ACTIVE" {
		return nil, ErrAccountInactive
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(ctx, u.ID)

	// Generate tokens
	accessToken, expiresAt, err := s.tokenManager.GenerateAccessToken(u.ID, comp.ID, u.RoleCode, u.Email)
	if err != nil {
		return nil, err
	}

	rawRefresh, refreshHash, refreshExpiresAt, err := s.tokenManager.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	session := &RefreshTokenSession{
		ID:        uuid.New(),
		UserID:    u.ID,
		CompanyID: comp.ID,
		TokenHash: refreshHash,
		IPAddress: ip,
		UserAgent: ua,
		ExpiresAt: refreshExpiresAt,
	}

	if err := s.authRepo.SaveRefreshToken(ctx, session); err != nil {
		return nil, err
	}

	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  comp.ID,
		UserID:     &u.ID,
		Action:     "LOGIN",
		EntityName: "USER",
		EntityID:   u.ID.String(),
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		ExpiresAt:    expiresAt,
		User:         u,
		Company:      comp,
	}, nil
}

func (s *service) Refresh(ctx context.Context, rawRefreshToken string, ip, ua string) (*AuthResponse, error) {
	tokenHash := token.HashRefreshToken(rawRefreshToken)

	// Check Redis blacklist
	blacklisted, err := s.cache.Get(ctx, "bl:"+tokenHash)
	if err == nil && blacklisted != "" {
		return nil, ErrTokenRevoked
	}

	session, err := s.authRepo.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		return nil, ErrTokenRevoked
	}

	if session.RevokedAt != nil || time.Now().After(session.ExpiresAt) {
		return nil, ErrTokenRevoked
	}

	// Revoke old refresh token (rotation)
	_ = s.authRepo.RevokeRefreshToken(ctx, tokenHash)
	_ = s.cache.Set(ctx, "bl:"+tokenHash, "revoked", 24*time.Hour)

	// Fetch user and company
	u, err := s.userRepo.GetByID(ctx, session.CompanyID, session.UserID)
	if err != nil || u.Status != "ACTIVE" {
		return nil, ErrAccountInactive
	}

	comp, err := s.companyRepo.GetByID(ctx, session.CompanyID)
	if err != nil || comp.Status != "ACTIVE" {
		return nil, ErrAccountInactive
	}

	// Generate new token pair
	accessToken, expiresAt, err := s.tokenManager.GenerateAccessToken(u.ID, comp.ID, u.RoleCode, u.Email)
	if err != nil {
		return nil, err
	}

	newRawRefresh, newRefreshHash, newRefreshExpiresAt, err := s.tokenManager.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	newSession := &RefreshTokenSession{
		ID:        uuid.New(),
		UserID:    u.ID,
		CompanyID: comp.ID,
		TokenHash: newRefreshHash,
		IPAddress: ip,
		UserAgent: ua,
		ExpiresAt: newRefreshExpiresAt,
	}

	if err := s.authRepo.SaveRefreshToken(ctx, newSession); err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRawRefresh,
		ExpiresAt:    expiresAt,
		User:         u,
		Company:      comp,
	}, nil
}

func (s *service) Logout(ctx context.Context, rawRefreshToken string, ip, ua string) error {
	tokenHash := token.HashRefreshToken(rawRefreshToken)
	_ = s.authRepo.RevokeRefreshToken(ctx, tokenHash)
	_ = s.cache.Set(ctx, "bl:"+tokenHash, "revoked", 7*24*time.Hour)
	return nil
}

func (s *service) GetMe(ctx context.Context, companyID, userID uuid.UUID) (*user.User, *company.Company, error) {
	u, err := s.userRepo.GetByID(ctx, companyID, userID)
	if err != nil {
		return nil, nil, err
	}
	comp, err := s.companyRepo.GetByID(ctx, companyID)
	if err != nil {
		return nil, nil, err
	}
	return u, comp, nil
}

func (s *service) ChangePassword(ctx context.Context, companyID, userID uuid.UUID, req ChangePasswordRequest, ip, ua string) error {
	u, err := s.userRepo.GetByID(ctx, companyID, userID)
	if err != nil {
		return err
	}

	matched, err := hash.ComparePasswordAndHash(req.OldPassword, u.PasswordHash)
	if err != nil || !matched {
		return errors.New("l'ancien mot de passe est incorrect")
	}

	if ok, msg := validator.IsStrongPassword(req.NewPassword); !ok {
		return errors.New(msg)
	}

	newHash, err := hash.GenerateFromPassword(req.NewPassword)
	if err != nil {
		return err
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, newHash); err != nil {
		return err
	}

	// Revoke existing sessions to enforce re-login
	_ = s.authRepo.RevokeAllUserTokens(ctx, userID)

	_ = s.auditService.Record(ctx, audit.LogEntry{
		CompanyID:  companyID,
		UserID:     &userID,
		Action:     "CHANGE_PASSWORD",
		EntityName: "USER",
		EntityID:   userID.String(),
		IPAddress:  ip,
		UserAgent:  ua,
	})

	return nil
}

func stringPtr(s string) *string {
	return &s
}
