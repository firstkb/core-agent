package platformstudioformbuilder

const (
	rootSchemaScopeID     = "root"
	scopeRootPlacementKey = "__scope_root__"
)

var acceptedBlueprintContainerTypes = map[string]struct{}{
	"accordion":      {},
	"accordion_item": {},
	"column":         {},
	"grid":           {},
	"group":          {},
	"section":        {},
	"subform":        {},
	"tab_item":       {},
	"tabs":           {},
}

type subformScopeMeta struct {
	DisplayName string
	ID          string
	SubformType string
	TableKey    string
}

type legacyViewScope struct {
	FilterDefinitions   any
	Nodes               []map[string]any
	ParentSubformNodeID string
	SchemaScopeID       string
	SubformType         string
	TableKey            string
	ViewSettings        any
}

type legacyViewDocument struct {
	FilterDefinitions any
	Nodes             []map[string]any
	SelectedNodeID    string
	SystemFields      any
	SubformScopes     []legacyViewScope
	ViewDescription   string
	ViewKind          string
	ViewSettings      any
	ViewTitle         string
}
