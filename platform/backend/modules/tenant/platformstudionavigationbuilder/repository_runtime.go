package platformstudionavigationbuilder

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) LoadRuntimeNavigationState(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	configKey string,
	userGUID string,
	rootAccess bool,
) (*runtimeNavigationState, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin runtime navigation tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContextTx(ctx, tx, tenant); err != nil {
		return nil, err
	}

	if rootAccess {
		user := runtimeNavigationUserContext{
			Authenticated: true,
			IsRoot:        true,
			UserID:        strings.TrimSpace(userGUID),
		}
		items, err := listRuntimeNavigationItemsTx(ctx, tx, configKeyOrDefault(configKey))
		if err != nil {
			return nil, err
		}
		policies, err := listRuntimeNavigationAccessPoliciesTx(ctx, tx, configKeyOrDefault(configKey))
		if err != nil {
			return nil, err
		}
		subjects, err := listRuntimeNavigationAccessSubjectsTx(ctx, tx, configKeyOrDefault(configKey))
		if err != nil {
			return nil, err
		}
		if err := tx.Commit(); err != nil {
			return nil, fmt.Errorf("navigation builder: commit root runtime navigation tx: %w", err)
		}
		return &runtimeNavigationState{
			User:     user,
			Items:    items,
			Policies: policies,
			Subjects: subjects,
		}, nil
	}

	user, err := loadRuntimeNavigationUserContextTx(ctx, tx, userGUID)
	if err != nil {
		return nil, err
	}
	if !user.Authenticated {
		if err := tx.Commit(); err != nil {
			return nil, fmt.Errorf("navigation builder: commit empty runtime navigation tx: %w", err)
		}
		return &runtimeNavigationState{User: user}, nil
	}

	items, err := listRuntimeNavigationItemsTx(ctx, tx, configKeyOrDefault(configKey))
	if err != nil {
		return nil, err
	}
	policies, err := listRuntimeNavigationAccessPoliciesTx(ctx, tx, configKeyOrDefault(configKey))
	if err != nil {
		return nil, err
	}
	subjects, err := listRuntimeNavigationAccessSubjectsTx(ctx, tx, configKeyOrDefault(configKey))
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit runtime navigation tx: %w", err)
	}

	return &runtimeNavigationState{
		User:     user,
		Items:    items,
		Policies: policies,
		Subjects: subjects,
	}, nil
}

func loadRuntimeNavigationUserContextTx(
	ctx context.Context,
	tx *sql.Tx,
	userGUID string,
) (runtimeNavigationUserContext, error) {
	const query = `
SELECT u.id::text,
       COALESCE(u.company_id::text, '') AS company_id,
       COALESCE(c.company_type_id::text, '') AS company_type_id,
       COALESCE(u.job_type_id::text, '') AS job_type_id
  FROM users u
  LEFT JOIN company c
    ON c.id = u.company_id
   AND c.tenant_id = u.tenant_id
 WHERE u.tenant_id = current_setting('app.tenant_id', true)::bigint
   AND u.guid::text = $1
   AND u.active IS TRUE
 LIMIT 1`

	var user runtimeNavigationUserContext
	err := tx.QueryRowContext(ctx, query, strings.TrimSpace(userGUID)).Scan(
		&user.UserID,
		&user.CompanyID,
		&user.CompanyTypeID,
		&user.JobTypeID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return runtimeNavigationUserContext{}, nil
		}
		return runtimeNavigationUserContext{}, fmt.Errorf("navigation builder: load runtime user context: %w", err)
	}

	user.Authenticated = true
	return user, nil
}

func listRuntimeNavigationItemsTx(ctx context.Context, tx *sql.Tx, configKey string) ([]derivedNavigationItem, error) {
	const query = `
SELECT owner_type,
       item_id,
       COALESCE(parent_item_id, '') AS parent_item_id,
       node_type,
       COALESCE(target_type, '') AS target_type,
       COALESCE(target_model_id, '') AS target_model_id,
       COALESCE(target_view_id, '') AS target_view_id,
       COALESCE(target_page_id, '') AS target_page_id,
       COALESCE(target_module_id, '') AS target_module_id,
       COALESCE(target_route, '') AS target_route,
       COALESCE(target_path, '') AS target_path,
       COALESCE(external_url, '') AS external_url,
       label,
       COALESCE(icon, '') AS icon,
       COALESCE(channel, '') AS channel,
       active,
       sort_order,
       depth,
       breadcrumb_json::text
  FROM ps_navigation_runtime_item
 WHERE config_key = $1
 ORDER BY owner_type,
          COALESCE(parent_item_id, ''),
          sort_order,
          item_id`

	rows, err := tx.QueryContext(ctx, query, configKeyOrDefault(configKey))
	if err != nil {
		return nil, fmt.Errorf("navigation builder: query runtime items: %w", err)
	}
	defer func() { _ = rows.Close() }()

	items := []derivedNavigationItem{}
	for rows.Next() {
		var item derivedNavigationItem
		var breadcrumbRaw string
		if err := rows.Scan(
			&item.OwnerType,
			&item.ItemID,
			&item.ParentItemID,
			&item.NodeType,
			&item.TargetType,
			&item.TargetModelID,
			&item.TargetViewID,
			&item.TargetPageID,
			&item.TargetModuleID,
			&item.TargetRoute,
			&item.TargetPath,
			&item.ExternalURL,
			&item.Label,
			&item.Icon,
			&item.Channel,
			&item.Active,
			&item.SortOrder,
			&item.Depth,
			&breadcrumbRaw,
		); err != nil {
			return nil, fmt.Errorf("navigation builder: scan runtime item: %w", err)
		}
		item.Breadcrumb = decodeRuntimeBreadcrumb(breadcrumbRaw)
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("navigation builder: iterate runtime items: %w", err)
	}
	return items, nil
}

func listRuntimeNavigationAccessPoliciesTx(ctx context.Context, tx *sql.Tx, configKey string) ([]derivedNavigationAccessPolicy, error) {
	const query = `
SELECT owner_type,
       owner_id,
       access_mode
  FROM ps_navigation_access_policy
 WHERE config_key = $1`

	rows, err := tx.QueryContext(ctx, query, configKeyOrDefault(configKey))
	if err != nil {
		return nil, fmt.Errorf("navigation builder: query runtime access policies: %w", err)
	}
	defer func() { _ = rows.Close() }()

	policies := []derivedNavigationAccessPolicy{}
	for rows.Next() {
		var policy derivedNavigationAccessPolicy
		if err := rows.Scan(&policy.OwnerType, &policy.OwnerID, &policy.Mode); err != nil {
			return nil, fmt.Errorf("navigation builder: scan runtime access policy: %w", err)
		}
		policies = append(policies, policy)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("navigation builder: iterate runtime access policies: %w", err)
	}
	return policies, nil
}

func listRuntimeNavigationAccessSubjectsTx(ctx context.Context, tx *sql.Tx, configKey string) ([]derivedNavigationAccessSubject, error) {
	const query = `
SELECT owner_type,
       owner_id,
       subject_type,
       subject_id
  FROM ps_navigation_access_subject
 WHERE config_key = $1`

	rows, err := tx.QueryContext(ctx, query, configKeyOrDefault(configKey))
	if err != nil {
		return nil, fmt.Errorf("navigation builder: query runtime access subjects: %w", err)
	}
	defer func() { _ = rows.Close() }()

	subjects := []derivedNavigationAccessSubject{}
	for rows.Next() {
		var subject derivedNavigationAccessSubject
		if err := rows.Scan(&subject.OwnerType, &subject.OwnerID, &subject.SubjectType, &subject.SubjectID); err != nil {
			return nil, fmt.Errorf("navigation builder: scan runtime access subject: %w", err)
		}
		subjects = append(subjects, subject)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("navigation builder: iterate runtime access subjects: %w", err)
	}
	return subjects, nil
}

func decodeRuntimeBreadcrumb(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []string{}
	}
	var values []string
	if err := json.Unmarshal([]byte(raw), &values); err != nil {
		return []string{}
	}
	return normalizeRuntimeBreadcrumb(values)
}
