package businesstree

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrInvalidParent = errors.New("business tree invalid parent")
	ErrTenantMissing = errors.New("business tree tenant missing")
	ErrUnauthorized  = errors.New("business tree unauthorized")
)

type Repository interface {
	GetCompany(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) (*CompanyRecord, error)
	ListChildCompanies(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]CompanyRecord, error)
	ListContacts(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]ContactRecord, error)
	ListProjects(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]ProjectRecord, error)
	ListRootCompanies(ctx context.Context, tenant requestctx.TenantInfo) ([]CompanyRecord, error)
}

type Service struct {
	repo Repository
}

type parentRef struct {
	companyID int64
	kind      string
	raw       string
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListNodes(ctx context.Context, parentID string) (*NodesResponse, error) {
	if s == nil || s.repo == nil {
		return nil, fmt.Errorf("business tree service is not configured")
	}

	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return nil, ErrUnauthorized
	}

	tenant, ok := requestctx.Tenant(ctx)
	if !ok || strings.TrimSpace(tenant.ID) == "" || strings.TrimSpace(tenant.DBName) == "" {
		return nil, ErrTenantMissing
	}

	parent, err := parseParentRef(parentID)
	if err != nil {
		return nil, err
	}

	switch parent.kind {
	case parentRoot:
		companies, err := s.repo.ListRootCompanies(ctx, tenant)
		if err != nil {
			return nil, err
		}
		return &NodesResponse{ParentID: parent.raw, Nodes: mapCompanyNodes(companies)}, nil
	case nodeKindCompany:
		parentCompany, err := s.repo.GetCompany(ctx, tenant, parent.companyID)
		if err != nil {
			return nil, err
		}
		if parentCompany == nil {
			return &NodesResponse{ParentID: parent.raw, Nodes: []Node{}}, nil
		}

		companies, err := s.repo.ListChildCompanies(ctx, tenant, parent.companyID)
		if err != nil {
			return nil, err
		}
		nodes := mapCompanyNodes(companies)
		nodes = append(nodes, mapCompanyGroupNodes(*parentCompany)...)
		return &NodesResponse{ParentID: parent.raw, Nodes: nodes}, nil
	case nodeKindContactsGroup:
		contacts, err := s.repo.ListContacts(ctx, tenant, parent.companyID)
		if err != nil {
			return nil, err
		}
		return &NodesResponse{ParentID: parent.raw, Nodes: mapContactNodes(contacts)}, nil
	case nodeKindProjectsGroup:
		projects, err := s.repo.ListProjects(ctx, tenant, parent.companyID)
		if err != nil {
			return nil, err
		}
		return &NodesResponse{ParentID: parent.raw, Nodes: mapProjectNodes(projects)}, nil
	default:
		return nil, ErrInvalidParent
	}
}

func parseParentRef(value string) (parentRef, error) {
	normalized := strings.TrimSpace(value)
	if normalized == "" || normalized == parentRoot {
		return parentRef{kind: parentRoot, raw: parentRoot}, nil
	}

	prefix, rawID, ok := strings.Cut(normalized, ":")
	if !ok || strings.TrimSpace(rawID) == "" {
		return parentRef{}, ErrInvalidParent
	}

	id, err := strconv.ParseInt(strings.TrimSpace(rawID), 10, 64)
	if err != nil || id <= 0 {
		return parentRef{}, ErrInvalidParent
	}

	switch prefix {
	case nodeKindCompany, "contacts", "projects":
		kind := prefix
		if prefix == "contacts" {
			kind = nodeKindContactsGroup
		}
		if prefix == "projects" {
			kind = nodeKindProjectsGroup
		}
		return parentRef{companyID: id, kind: kind, raw: normalized}, nil
	default:
		return parentRef{}, ErrInvalidParent
	}
}

func mapCompanyNodes(records []CompanyRecord) []Node {
	nodes := make([]Node, 0, len(records))
	for _, record := range records {
		childCount := int(record.ChildCompanyCount)
		if record.ContactCount > 0 {
			childCount++
		}
		if record.ProjectCount > 0 {
			childCount++
		}

		nodes = append(nodes, Node{
			ChildCount: childCount,
			Expandable: childCount > 0,
			ID:         fmt.Sprintf("company:%d", record.ID),
			Kind:       nodeKindCompany,
			Label:      formatCompanyLabel(record),
		})
	}
	return nodes
}

func mapContactNodes(records []ContactRecord) []Node {
	nodes := make([]Node, 0, len(records))
	for _, record := range records {
		nodes = append(nodes, Node{
			ID:    fmt.Sprintf("contact:%d", record.ID),
			Kind:  nodeKindContact,
			Label: formatContactLabel(record),
		})
	}
	return nodes
}

func mapCompanyGroupNodes(record CompanyRecord) []Node {
	nodes := make([]Node, 0, 2)
	if record.ContactCount > 0 {
		nodes = append(nodes, Node{
			ChildCount: int(record.ContactCount),
			Expandable: true,
			ID:         fmt.Sprintf("contacts:%d", record.ID),
			Kind:       nodeKindContactsGroup,
			Label:      fmt.Sprintf("Contacts (%d)", record.ContactCount),
		})
	}
	if record.ProjectCount > 0 {
		nodes = append(nodes, Node{
			ChildCount: int(record.ProjectCount),
			Expandable: true,
			ID:         fmt.Sprintf("projects:%d", record.ID),
			Kind:       nodeKindProjectsGroup,
			Label:      fmt.Sprintf("Projects (%d)", record.ProjectCount),
		})
	}
	return nodes
}

func mapProjectNodes(records []ProjectRecord) []Node {
	nodes := make([]Node, 0, len(records))
	for _, record := range records {
		nodes = append(nodes, Node{
			ID:    fmt.Sprintf("project:%d", record.ID),
			Kind:  nodeKindProject,
			Label: formatProjectLabel(record),
		})
	}
	return nodes
}

func formatCompanyLabel(record CompanyRecord) string {
	name := strings.TrimSpace(record.Name)
	typeName := strings.TrimSpace(record.TypeName)
	if name == "" {
		name = fmt.Sprintf("Company %d", record.ID)
	}
	if typeName == "" {
		return name
	}
	return fmt.Sprintf("%s @ %s", typeName, name)
}

func formatContactLabel(record ContactRecord) string {
	displayName := strings.TrimSpace(record.DisplayName)
	if displayName == "" {
		displayName = fmt.Sprintf("User %d", record.ID)
	}
	jobTypeName := strings.TrimSpace(record.JobTypeName)
	if jobTypeName == "" {
		return displayName
	}
	return fmt.Sprintf("%s @ %s", jobTypeName, displayName)
}

func formatProjectLabel(record ProjectRecord) string {
	name := strings.TrimSpace(record.Name)
	if name == "" {
		name = fmt.Sprintf("Project %d", record.ID)
	}
	projectNumber := strings.TrimSpace(record.ProjectNumber)
	if projectNumber == "" {
		return name
	}
	return fmt.Sprintf("[%s] %s", projectNumber, name)
}
