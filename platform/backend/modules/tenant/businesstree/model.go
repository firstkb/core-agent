package businesstree

const (
	parentRoot = "root"

	nodeKindCompany       = "company"
	nodeKindContactsGroup = "contactsGroup"
	nodeKindProjectsGroup = "projectsGroup"
	nodeKindContact       = "contact"
	nodeKindProject       = "project"
)

type Node struct {
	ChildCount int    `json:"childCount"`
	Expandable bool   `json:"expandable"`
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Label      string `json:"label"`
}

type NodesResponse struct {
	Nodes    []Node `json:"nodes"`
	ParentID string `json:"parentId"`
}

type CompanyRecord struct {
	ChildCompanyCount int64
	ContactCount      int64
	ID                int64
	Name              string
	ProjectCount      int64
	TypeName          string
}

type ContactRecord struct {
	DisplayName string
	ID          int64
	JobTypeName string
}

type ProjectRecord struct {
	ID            int64
	Name          string
	ProjectNumber string
}
