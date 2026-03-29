package onboardingsvc

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"log/slog"

	"github.com/firstkb/sc-api/internal/config"
	"github.com/firstkb/sc-api/internal/postgres"
)

type Service struct {
	repo        *Repository
	provisioner *Provisioner
	logger      *slog.Logger
	cfg         OnboardingConfig
}

func NewService(client *postgres.Client, cfg *config.Config, logger *slog.Logger) (*Service, error) {
	var c Config
	if cfg != nil {
		_ = cfg.Unmarshal("", &c)
	}
	oc := c.Onboarding
	
	repo := NewRepo(client, logger)
	provisioner := NewProvisioner(client, oc, logger)

	ctx := context.Background()
	if _, err := repo.GetDefaultSandboxPool(ctx); err != nil {
		return nil, err
	}
	if _, err := repo.GetDedicatedPoolByPlan(ctx, PlanPro); err != nil {
		return nil, err
	}

	return &Service{
		repo:        repo,
		provisioner: provisioner,
		logger:      logger,
		cfg:         oc,
	}, nil
}

func (s *Service) OnboardTenant(ctx context.Context, input OnboardTenantInput) (*OnboardTenantOutput, error) {
	if strings.TrimSpace(input.Name) == "" {
		return nil, errors.New("tenant name required")
	}
	host := normalizeHost(input.Host)
	if host == "" {
		return nil, errors.New("tenant host required")
	}

	plan, sandboxPool, dedicatedPool, err := s.resolvePlanAndPools(ctx, input)
	if err != nil {
		return nil, err
	}

	var (
		targetDBName string
		isolation    IsolationMode
		instanceID   int64
		instanceCode string
	)

	switch {
	case isSandboxPlan(plan):
		targetDBName = sandboxPool.DBName
		isolation = IsolationSandbox
		instanceID = sandboxPool.InstanceID
		instanceCode = sandboxPool.InstanceCode
	case isDedicatedPlan(plan):
		targetDBName = proDBName(dedicatedPool.DBPrefix, input.Subdomain, input.Name)
		isolation = IsolationDedicatedDB
		instanceID = dedicatedPool.InstanceID
		instanceCode = dedicatedPool.InstanceCode
	default:
		return nil, fmt.Errorf("unsupported plan %s", plan)
	}

	existing, err := s.repo.GetTenantByHost(ctx, host)
	if err != nil {
		return nil, err
	}
	if existing == nil && isDedicatedPlan(plan) {
		existing, err = s.repo.GetTenantByDB(ctx, targetDBName)
		if err != nil {
			return nil, err
		}
		// DB name collisions must be treated as conflicts even if host differs.
		if existing != nil && !strings.EqualFold(existing.Host, host) {
			return nil, fmt.Errorf("database %s already assigned to tenant %s", targetDBName, existing.Host)
		}
	}

	if existing != nil {
		currentPlan := existing.Plan
		if currentPlan == "" {
			currentPlan = PlanLight
		}
		if currentPlan == plan {
			return recordToOutput(existing, nil), nil
		}
		if isSandboxPlan(currentPlan) && isDedicatedPlan(plan) {
			return s.upgradeToDedicated(ctx, existing, input, dedicatedPool, targetDBName)
		}
		return nil, fmt.Errorf("cannot change tenant plan from %s to %s", currentPlan, plan)
	}

	tx, err := s.repo.BeginTxMaster(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	params := createTenantParams{
		Name:       strings.TrimSpace(input.Name),
		Host:       host,
		Isolation:  isolation,
		Plan:       plan,
		DBName:     targetDBName,
		InstanceID: instanceID,
	}

	tenantID, err := s.repo.CreateTenant(ctx, tx, params)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit onboarding tx: %w", err)
	}

	var applied []string
	if isDedicatedPlan(plan) {
		applied, err = s.provisioner.ProvisionProTenant(ctx, ProvisionParams{
			TenantID:       tenantID,
			TargetDB:       targetDBName,
			TargetInstance: instanceCode,
		})
		if err != nil {
			_ = s.repo.DeleteTenant(ctx, tenantID)
			return nil, fmt.Errorf("provision pro database: %w", err)
		}
	}

	record, err := s.repo.GetTenantByID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return recordToOutput(record, applied), nil
}

func (s *Service) upgradeToDedicated(ctx context.Context, existing *TenantRecord, input OnboardTenantInput, pool *DedicatedPool, targetDBName string) (*OnboardTenantOutput, error) {
	if pool == nil {
		return nil, errors.New("dedicated pool required")
	}

	tx, err := s.repo.BeginTxMaster(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	if err := s.repo.UpgradeTenant(ctx, tx, upgradeTenantParams{
		TenantID:      existing.ID,
		NewPlan:       pool.Plan,
		NewIsolation:  IsolationDedicatedDB,
		NewDBName:     targetDBName,
		NewInstanceID: pool.InstanceID,
	}); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit upgrade tx: %w", err)
	}

	applied, err := s.provisioner.ProvisionProTenant(ctx, ProvisionParams{
		TenantID:        existing.ID,
		TargetDB:        targetDBName,
		TargetInstance:  pool.InstanceCode,
		CopyFromSandbox: true,
		SourceDB:        existing.DBName,
		SourceInstance:  existing.InstanceCode,
	})
	if err != nil {
		return nil, fmt.Errorf("provision upgraded database: %w", err)
	}

	record, err := s.repo.GetTenantByID(ctx, existing.ID)
	if err != nil {
		return nil, err
	}
	return recordToOutput(record, applied), nil
}

func recordToOutput(record *TenantRecord, applied []string) *OnboardTenantOutput {
	plan := record.Plan
	if plan == "" {
		plan = PlanLight
	}
	return &OnboardTenantOutput{
		TenantID:          record.ID,
		Name:              record.Name,
		DBName:            record.DBName,
		Plan:              plan,
		Isolation:         record.Isolation,
		Domains:           []string{record.Host},
		InstanceCode:      record.InstanceCode,
		IsSandbox:         isSandboxPlan(plan),
		AppliedMigrations: applied,
	}
}

func (s *Service) resolvePlanAndPools(ctx context.Context, input OnboardTenantInput) (Plan, *SandboxPool, *DedicatedPool, error) {
	userPlan := normalizePlan(input.Plan, "")
	var (
		sandboxPool   *SandboxPool
		dedicatedPool *DedicatedPool
		err           error
	)

	if userPlan == "" {
		switch {
		case strings.TrimSpace(input.SandboxPoolCode) != "":
			sandboxPool, err = s.repo.GetSandboxPoolByCode(ctx, input.SandboxPoolCode)
			if err != nil {
				return "", nil, nil, err
			}
			userPlan = sandboxPool.Plan
		case strings.TrimSpace(input.DedicatedPoolCode) != "":
			dedicatedPool, err = s.repo.GetDedicatedPoolByCode(ctx, input.DedicatedPoolCode)
			if err != nil {
				return "", nil, nil, err
			}
			userPlan = dedicatedPool.Plan
		default:
			sandboxPool, err = s.repo.GetDefaultSandboxPool(ctx)
			if err != nil {
				return "", nil, nil, err
			}
			userPlan = sandboxPool.Plan
		}
	}

	if isSandboxPlan(userPlan) {
		if strings.TrimSpace(input.DedicatedPoolCode) != "" {
			return "", nil, nil, fmt.Errorf("dedicated pool code cannot be used for plan %s", userPlan)
		}
		if sandboxPool == nil {
			if strings.TrimSpace(input.SandboxPoolCode) != "" {
				sandboxPool, err = s.repo.GetSandboxPoolByCode(ctx, input.SandboxPoolCode)
			} else {
				sandboxPool, err = s.repo.GetSandboxPoolByPlan(ctx, userPlan)
			}
			if err != nil {
				return "", nil, nil, err
			}
		}
		if sandboxPool.Plan != userPlan {
			return "", nil, nil, fmt.Errorf("sandbox pool %s configured for plan %s", sandboxPool.Code, sandboxPool.Plan)
		}
		return userPlan, sandboxPool, nil, nil
	}

	if isDedicatedPlan(userPlan) {
		if strings.TrimSpace(input.SandboxPoolCode) != "" {
			return "", nil, nil, fmt.Errorf("sandbox pool code cannot be used for plan %s", userPlan)
		}
		if dedicatedPool == nil {
			if strings.TrimSpace(input.DedicatedPoolCode) != "" {
				dedicatedPool, err = s.repo.GetDedicatedPoolByCode(ctx, input.DedicatedPoolCode)
			} else {
				dedicatedPool, err = s.repo.GetDedicatedPoolByPlan(ctx, userPlan)
			}
			if err != nil {
				return "", nil, nil, err
			}
		}
		if dedicatedPool.Plan != userPlan {
			return "", nil, nil, fmt.Errorf("dedicated pool %s configured for plan %s", dedicatedPool.Code, dedicatedPool.Plan)
		}
		return userPlan, nil, dedicatedPool, nil
	}

	return "", nil, nil, fmt.Errorf("unsupported plan %s", userPlan)
}
