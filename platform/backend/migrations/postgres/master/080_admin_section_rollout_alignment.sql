UPDATE admin_module_section s
   SET status = 'planned',
       updated_at = now()
  FROM admin_module m
 WHERE s.module_id = m.id
   AND m.module_key = 'tenant'
   AND s.section_key = 'list_of_tenants'
   AND s.status <> 'planned';

UPDATE admin_module_section s
   SET status = 'active',
       updated_at = now()
  FROM admin_module m
 WHERE s.module_id = m.id
   AND m.module_key = 'tenant'
   AND s.section_key = 'onboarding'
   AND s.status <> 'active';
