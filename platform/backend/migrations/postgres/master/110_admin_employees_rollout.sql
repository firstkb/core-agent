UPDATE admin_module
SET title = 'Employees',
    description = 'Platform admin employee directory and access management.',
    icon = CASE
      WHEN COALESCE(btrim(icon), '') = '' THEN 'users'
      ELSE icon
    END,
    status = 'active'
WHERE module_key = 'users';

UPDATE admin_module_section s
SET title = 'List of Employees',
    description = 'Platform admin employee directory.',
    route_path = '/admin/employees',
    status = 'active'
FROM admin_module m
WHERE s.module_id = m.id
  AND m.module_key = 'users'
  AND s.section_key = 'list_of_users';
