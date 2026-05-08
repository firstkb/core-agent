BEGIN;

SET LOCAL app.tenant_id = '101';

INSERT INTO companytype (name, risk)
VALUES
  ('Corporate', 'executive governance and portfolio oversight'),
  ('Regional Division', 'multi-site regional operations'),
  ('Operations Group', 'field operations management'),
  ('Project Office', 'site-facing delivery team'),
  ('Safety Partner', 'safety program partner'),
  ('Specialty Contractor', 'specialty trade contractor'),
  ('Logistics Partner', 'materials and equipment logistics'),
  ('Training Center', 'training and certification center'),
  ('Main', 'primary tenant company'),
  ('Contractor', 'contractor or vendor company')
ON CONFLICT (tenant_id, name) DO UPDATE
SET risk = EXCLUDED.risk,
    updated_at = now();

UPDATE company
   SET name = 'Atlas Safety Holdings',
       company_type_id = (SELECT id FROM companytype WHERE tenant_id = 101 AND name = 'Corporate' ORDER BY id LIMIT 1),
       address_line_1 = '100 Safety Plaza',
       city = 'Boston',
       state_id = (SELECT id FROM state WHERE code = 'MA'),
       zip = '02110',
       phone = '+1 617 555 0100',
       email = 'operations@atlas-safety.example',
       url = 'https://atlas-safety.example',
       description = 'National safety management group coordinating VSM customer operations.',
       vendor_code = 'BT-ROOT-001',
       tax_id = 'demo-tax-atlas',
       liaison = 'Maya Chen',
       contact_name = 'Maya Chen',
       naics_code = '541690',
       product_code = 'VSM-DEMO',
       company_number = 'ASH-001',
       record_group = 'Business Tree Demo',
       contract_number = 'MSA-2026-ASH',
       joined_at = DATE '2022-01-15',
       demo = true,
       active = true,
       updated_at = now()
 WHERE tenant_id = 101
   AND name = 'Test Company'
   AND NOT EXISTS (
     SELECT 1
       FROM company existing
      WHERE existing.tenant_id = 101
        AND existing.name = 'Atlas Safety Holdings'
   );

WITH wanted(name, type_name, parent_name, city, state_code, zip, phone, contact_name, description, company_number, vendor_code, joined_at) AS (
  VALUES
    ('Atlas Safety Holdings', 'Corporate', NULL, 'Boston', 'MA', '02110', '+1 617 555 0100', 'Maya Chen', 'National safety management group coordinating VSM customer operations.', 'ASH-001', 'BT-ROOT-001', DATE '2022-01-15'),
    ('Horizon Construction Group', 'Corporate', NULL, 'Austin', 'TX', '78701', '+1 512 555 0110', 'Ethan Brooks', 'Construction portfolio partner for commercial and infrastructure programs.', 'HCG-001', 'BT-ROOT-002', DATE '2021-10-04'),
    ('Northstar Industrial Partners', 'Corporate', NULL, 'Chicago', 'IL', '60606', '+1 312 555 0120', 'Priya Raman', 'Industrial owner and specialty services partner for high-risk worksites.', 'NIP-001', 'BT-ROOT-003', DATE '2021-06-21')
)
INSERT INTO company (
  name, company_type_id, main_company_id, address_line_1, city, state_id, zip,
  phone, email, url, description, vendor_code, tax_id, liaison, contact_name,
  naics_code, product_code, company_number, record_group, contract_number,
  joined_at, demo, active
)
SELECT
  wanted.name,
  ct.id,
  NULL,
  '100 ' || wanted.city || ' Operations Center',
  wanted.city,
  st.id,
  wanted.zip,
  wanted.phone,
  lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '@business-tree.example',
  'https://' || lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '.example',
  wanted.description,
  wanted.vendor_code,
  'demo-tax-' || lower(regexp_replace(wanted.company_number, '[^a-zA-Z0-9]+', '-', 'g')),
  wanted.contact_name,
  wanted.contact_name,
  '541690',
  'VSM-DEMO',
  wanted.company_number,
  'Business Tree Demo',
  'MSA-2026-' || wanted.company_number,
  wanted.joined_at,
  true,
  true
FROM wanted
JOIN companytype ct ON ct.tenant_id = 101 AND ct.name = wanted.type_name
LEFT JOIN state st ON st.code = wanted.state_code
WHERE NOT EXISTS (
  SELECT 1 FROM company existing WHERE existing.tenant_id = 101 AND existing.name = wanted.name
);

WITH wanted(name, type_name, parent_name, city, state_code, zip, phone, contact_name, description, company_number, vendor_code, joined_at) AS (
  VALUES
    ('Atlas Executive Office', 'Operations Group', 'Atlas Safety Holdings', 'Boston', 'MA', '02110', '+1 617 555 0130', 'Lena Ortiz', 'Executive operations, customer success, and VSM implementation leadership.', 'ASH-EXE', 'BT-ATL-EXE', DATE '2022-02-01'),
    ('Northeast Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'New York', 'NY', '10005', '+1 212 555 0140', 'Marcus Webb', 'Regional safety delivery for high-density commercial work.', 'ASH-NE', 'BT-ATL-NE', DATE '2022-03-03'),
    ('Central Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'Dallas', 'TX', '75201', '+1 214 555 0150', 'Nora Fields', 'Central region field safety and incident prevention programs.', 'ASH-CE', 'BT-ATL-CE', DATE '2022-03-18'),
    ('Pacific Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'Seattle', 'WA', '98101', '+1 206 555 0160', 'Owen Grant', 'West coast safety teams for infrastructure and life sciences projects.', 'ASH-PA', 'BT-ATL-PA', DATE '2022-04-12'),
    ('Atlas Safety Academy', 'Training Center', 'Atlas Safety Holdings', 'Denver', 'CO', '80202', '+1 303 555 0170', 'Iris Coleman', 'Training, onboarding, certifications, and toolbox talk programs.', 'ASH-ACA', 'BT-ATL-ACA', DATE '2022-05-09'),
    ('Commercial Buildings Division', 'Regional Division', 'Horizon Construction Group', 'Austin', 'TX', '78701', '+1 512 555 0180', 'Caleb Turner', 'Commercial building delivery teams and tenant improvement programs.', 'HCG-COM', 'BT-HCG-COM', DATE '2021-11-02'),
    ('Infrastructure Division', 'Regional Division', 'Horizon Construction Group', 'Phoenix', 'AZ', '85004', '+1 602 555 0190', 'Sofia Bennett', 'Civil, bridge, and rail infrastructure construction programs.', 'HCG-INF', 'BT-HCG-INF', DATE '2021-11-16'),
    ('Horizon Vendor Network', 'Logistics Partner', 'Horizon Construction Group', 'Charlotte', 'NC', '28202', '+1 704 555 0200', 'Graham Lee', 'Preferred partner network for materials, scaffolding, and field logistics.', 'HCG-VEN', 'BT-HCG-VEN', DATE '2022-01-08'),
    ('Energy and Utilities Division', 'Regional Division', 'Northstar Industrial Partners', 'Houston', 'TX', '77002', '+1 713 555 0210', 'Amara Singh', 'Energy, utility, and refinery maintenance programs.', 'NIP-ENE', 'BT-NIP-ENE', DATE '2021-07-15'),
    ('Manufacturing Division', 'Regional Division', 'Northstar Industrial Partners', 'Detroit', 'MI', '48226', '+1 313 555 0220', 'Victor Hayes', 'Manufacturing, robotics, and plant modernization safety programs.', 'NIP-MFG', 'BT-NIP-MFG', DATE '2021-08-10'),
    ('Northstar Specialty Contractors', 'Specialty Contractor', 'Northstar Industrial Partners', 'Pittsburgh', 'PA', '15222', '+1 412 555 0230', 'Elena Novak', 'Specialty trades supporting electrical, excavation, and fire systems.', 'NIP-SPC', 'BT-NIP-SPC', DATE '2021-09-12')
)
INSERT INTO company (
  name, company_type_id, main_company_id, address_line_1, city, state_id, zip,
  phone, email, url, description, vendor_code, tax_id, liaison, contact_name,
  naics_code, product_code, company_number, record_group, contract_number,
  joined_at, demo, active
)
SELECT
  wanted.name,
  ct.id,
  parent.id,
  '200 ' || wanted.city || ' Field Center',
  wanted.city,
  st.id,
  wanted.zip,
  wanted.phone,
  lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '@business-tree.example',
  'https://' || lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '.example',
  wanted.description,
  wanted.vendor_code,
  'demo-tax-' || lower(regexp_replace(wanted.company_number, '[^a-zA-Z0-9]+', '-', 'g')),
  wanted.contact_name,
  wanted.contact_name,
  '541690',
  'VSM-DEMO',
  wanted.company_number,
  'Business Tree Demo',
  'MSA-2026-' || wanted.company_number,
  wanted.joined_at,
  true,
  true
FROM wanted
JOIN companytype ct ON ct.tenant_id = 101 AND ct.name = wanted.type_name
JOIN company parent ON parent.tenant_id = 101 AND parent.name = wanted.parent_name
LEFT JOIN state st ON st.code = wanted.state_code
WHERE NOT EXISTS (
  SELECT 1 FROM company existing WHERE existing.tenant_id = 101 AND existing.name = wanted.name
);

WITH wanted(name, type_name, parent_name, city, state_code, zip, phone, contact_name, description, company_number, vendor_code, joined_at) AS (
  VALUES
    ('Boston Customer Success Pod', 'Project Office', 'Atlas Executive Office', 'Boston', 'MA', '02110', '+1 617 555 0240', 'Daphne Ellis', 'Customer onboarding, data readiness, and tenant launch support.', 'ASH-EXE-BOS', 'BT-ASH-024', DATE '2022-06-01'),
    ('Governance and Analytics Office', 'Project Office', 'Atlas Executive Office', 'Washington', 'DC', '20001', '+1 202 555 0250', 'Noah Price', 'Executive reporting, compliance analytics, and program governance.', 'ASH-EXE-DC', 'BT-ASH-025', DATE '2022-06-10'),
    ('New York High-Rise Office', 'Project Office', 'Northeast Safety Region', 'New York', 'NY', '10005', '+1 212 555 0260', 'Ava Morgan', 'High-rise construction safety services for dense urban jobsites.', 'ASH-NE-NYC', 'BT-ASH-026', DATE '2022-07-01'),
    ('Boston Healthcare Office', 'Project Office', 'Northeast Safety Region', 'Boston', 'MA', '02114', '+1 617 555 0270', 'Miles Carter', 'Healthcare and life-safety program delivery for active campuses.', 'ASH-NE-BOS', 'BT-ASH-027', DATE '2022-07-12'),
    ('Philadelphia Industrial Office', 'Project Office', 'Northeast Safety Region', 'Philadelphia', 'PA', '19103', '+1 215 555 0280', 'Ruby Stone', 'Industrial renovation safety oversight and contractor coordination.', 'ASH-NE-PHL', 'BT-ASH-028', DATE '2022-07-22'),
    ('Chicago Operations Office', 'Project Office', 'Central Safety Region', 'Chicago', 'IL', '60606', '+1 312 555 0290', 'Jonah Ross', 'Urban construction safety operations across the Great Lakes market.', 'ASH-CE-CHI', 'BT-ASH-029', DATE '2022-08-02'),
    ('Dallas Field Office', 'Project Office', 'Central Safety Region', 'Dallas', 'TX', '75201', '+1 214 555 0300', 'Mila Foster', 'Field safety and inspection teams for Texas commercial sites.', 'ASH-CE-DAL', 'BT-ASH-030', DATE '2022-08-15'),
    ('Denver Energy Office', 'Project Office', 'Central Safety Region', 'Denver', 'CO', '80202', '+1 303 555 0310', 'Eli Parker', 'Energy-sector site safety and contractor readiness programs.', 'ASH-CE-DEN', 'BT-ASH-031', DATE '2022-08-26'),
    ('Seattle Infrastructure Office', 'Project Office', 'Pacific Safety Region', 'Seattle', 'WA', '98101', '+1 206 555 0320', 'Grace Kim', 'Infrastructure, marine, and transit safety operations.', 'ASH-PA-SEA', 'BT-ASH-032', DATE '2022-09-05'),
    ('Bay Area Life Science Office', 'Project Office', 'Pacific Safety Region', 'San Francisco', 'CA', '94105', '+1 415 555 0330', 'Hugo Ramirez', 'Life science campus construction and lab fit-out safety support.', 'ASH-PA-SFO', 'BT-ASH-033', DATE '2022-09-18'),
    ('Los Angeles Transit Office', 'Project Office', 'Pacific Safety Region', 'Los Angeles', 'CA', '90012', '+1 213 555 0340', 'Zara Hughes', 'Transit, station, and right-of-way safety program delivery.', 'ASH-PA-LAX', 'BT-ASH-034', DATE '2022-09-28'),
    ('Mobile Training Unit', 'Training Center', 'Atlas Safety Academy', 'Denver', 'CO', '80202', '+1 303 555 0350', 'Felix Young', 'Mobile training trailers and regional field certification events.', 'ASH-ACA-MOB', 'BT-ASH-035', DATE '2022-10-03'),
    ('Digital Learning Studio', 'Training Center', 'Atlas Safety Academy', 'Atlanta', 'GA', '30303', '+1 404 555 0360', 'Naomi Cooper', 'Digital course production and remote training operations.', 'ASH-ACA-DIG', 'BT-ASH-036', DATE '2022-10-14'),
    ('Austin Tower Office', 'Project Office', 'Commercial Buildings Division', 'Austin', 'TX', '78701', '+1 512 555 0370', 'Theo Reed', 'Commercial tower project delivery and field safety coordination.', 'HCG-COM-AUS', 'BT-HCG-037', DATE '2022-02-02'),
    ('Orlando Hospitality Office', 'Project Office', 'Commercial Buildings Division', 'Orlando', 'FL', '32801', '+1 407 555 0380', 'Lara Bryant', 'Hospitality renovation and occupied-site safety programs.', 'HCG-COM-ORL', 'BT-HCG-038', DATE '2022-02-18'),
    ('Charlotte Mixed Use Office', 'Project Office', 'Commercial Buildings Division', 'Charlotte', 'NC', '28202', '+1 704 555 0390', 'Omar Powell', 'Mixed-use construction safety, access control, and logistics planning.', 'HCG-COM-CLT', 'BT-HCG-039', DATE '2022-03-04'),
    ('Phoenix Civil Office', 'Project Office', 'Infrastructure Division', 'Phoenix', 'AZ', '85004', '+1 602 555 0400', 'Ivy Simmons', 'Civil sitework and heat-stress program support.', 'HCG-INF-PHX', 'BT-HCG-040', DATE '2022-03-18'),
    ('Portland Bridge Office', 'Project Office', 'Infrastructure Division', 'Portland', 'OR', '97204', '+1 503 555 0410', 'Oscar Bell', 'Bridge repair, traffic control, and fall prevention programs.', 'HCG-INF-PDX', 'BT-HCG-041', DATE '2022-04-02'),
    ('Salt Lake Rail Office', 'Project Office', 'Infrastructure Division', 'Salt Lake City', 'UT', '84101', '+1 801 555 0420', 'Maya Torres', 'Rail corridor construction and right-of-way safety coordination.', 'HCG-INF-SLC', 'BT-HCG-042', DATE '2022-04-20'),
    ('Prime Steel Partners', 'Specialty Contractor', 'Horizon Vendor Network', 'Cleveland', 'OH', '44114', '+1 216 555 0430', 'Leo Jenkins', 'Steel erection partner with dedicated safety coordination.', 'HCG-VEN-STEEL', 'BT-HCG-043', DATE '2022-05-07'),
    ('Summit Scaffolding Services', 'Safety Partner', 'Horizon Vendor Network', 'Kansas City', 'MO', '64106', '+1 816 555 0440', 'Sienna Ward', 'Scaffold planning, inspections, and rescue readiness support.', 'HCG-VEN-SCAF', 'BT-HCG-044', DATE '2022-05-22'),
    ('ClearPath Logistics', 'Logistics Partner', 'Horizon Vendor Network', 'Nashville', 'TN', '37203', '+1 615 555 0450', 'Finn Russell', 'Fleet, equipment, and materials logistics partner.', 'HCG-VEN-LOG', 'BT-HCG-045', DATE '2022-06-06'),
    ('Houston Refinery Office', 'Project Office', 'Energy and Utilities Division', 'Houston', 'TX', '77002', '+1 713 555 0460', 'Clara Diaz', 'Refinery turnaround safety and permit-to-work coordination.', 'NIP-ENE-HOU', 'BT-NIP-046', DATE '2021-10-02'),
    ('Baton Rouge Maintenance Office', 'Project Office', 'Energy and Utilities Division', 'Baton Rouge', 'LA', '70801', '+1 225 555 0470', 'Mateo Flores', 'Industrial maintenance and outage safety management.', 'NIP-ENE-BTR', 'BT-NIP-047', DATE '2021-10-16'),
    ('Pittsburgh Power Office', 'Project Office', 'Energy and Utilities Division', 'Pittsburgh', 'PA', '15222', '+1 412 555 0480', 'Hazel Murphy', 'Power-generation project safety and contractor onboarding.', 'NIP-ENE-PIT', 'BT-NIP-048', DATE '2021-11-01'),
    ('Detroit Robotics Office', 'Project Office', 'Manufacturing Division', 'Detroit', 'MI', '48226', '+1 313 555 0490', 'Arlo Brooks', 'Robotics cell installation and machinery safety programs.', 'NIP-MFG-DET', 'BT-NIP-049', DATE '2021-11-19'),
    ('Indianapolis Fabrication Office', 'Project Office', 'Manufacturing Division', 'Indianapolis', 'IN', '46204', '+1 317 555 0500', 'June Peterson', 'Fabrication shop modernization and field observation programs.', 'NIP-MFG-IND', 'BT-NIP-050', DATE '2021-12-03'),
    ('Cleveland Plant Services', 'Project Office', 'Manufacturing Division', 'Cleveland', 'OH', '44114', '+1 216 555 0510', 'Nico Rivera', 'Plant services, lockout-tagout, and maintenance safety support.', 'NIP-MFG-CLE', 'BT-NIP-051', DATE '2021-12-18'),
    ('Apex Electrical Systems', 'Specialty Contractor', 'Northstar Specialty Contractors', 'Columbus', 'OH', '43215', '+1 614 555 0520', 'Mina Shah', 'Electrical contractor with energized-work planning support.', 'NIP-SPC-ELEC', 'BT-NIP-052', DATE '2022-01-12'),
    ('TerraForm Excavation', 'Specialty Contractor', 'Northstar Specialty Contractors', 'Oklahoma City', 'OK', '73102', '+1 405 555 0530', 'Rafael Ortiz', 'Excavation, trenching, and utility-location partner.', 'NIP-SPC-EXC', 'BT-NIP-053', DATE '2022-01-28'),
    ('Shield Fire Protection', 'Safety Partner', 'Northstar Specialty Contractors', 'Raleigh', 'NC', '27601', '+1 919 555 0540', 'Ella Watson', 'Fire protection, hot-work planning, and emergency readiness partner.', 'NIP-SPC-FIRE', 'BT-NIP-054', DATE '2022-02-11')
)
INSERT INTO company (
  name, company_type_id, main_company_id, address_line_1, city, state_id, zip,
  phone, email, url, description, vendor_code, tax_id, liaison, contact_name,
  naics_code, product_code, company_number, record_group, contract_number,
  joined_at, demo, active
)
SELECT
  wanted.name,
  ct.id,
  parent.id,
  '300 ' || wanted.city || ' Site Office',
  wanted.city,
  st.id,
  wanted.zip,
  wanted.phone,
  lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '@business-tree.example',
  'https://' || lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '.example',
  wanted.description,
  wanted.vendor_code,
  'demo-tax-' || lower(regexp_replace(wanted.company_number, '[^a-zA-Z0-9]+', '-', 'g')),
  wanted.contact_name,
  wanted.contact_name,
  '541690',
  'VSM-DEMO',
  wanted.company_number,
  'Business Tree Demo',
  'MSA-2026-' || wanted.company_number,
  wanted.joined_at,
  true,
  true
FROM wanted
JOIN companytype ct ON ct.tenant_id = 101 AND ct.name = wanted.type_name
JOIN company parent ON parent.tenant_id = 101 AND parent.name = wanted.parent_name
LEFT JOIN state st ON st.code = wanted.state_code
WHERE NOT EXISTS (
  SELECT 1 FROM company existing WHERE existing.tenant_id = 101 AND existing.name = wanted.name
);

WITH wanted(name, type_name, parent_name, city, state_code, zip, phone, contact_name, description, company_number, vendor_code, joined_at) AS (
  VALUES
    ('New England Safety Alliance', 'Safety Partner', 'Northeast Safety Region', 'Providence', 'RI', '02903', '+1 401 555 0550', 'Cora Bailey', 'Regional safety partner supporting audits and coaching.', 'ASH-NE-PART', 'BT-ASH-055', DATE '2022-10-22'),
    ('Texas Field Partner Network', 'Contractor', 'Central Safety Region', 'Fort Worth', 'TX', '76102', '+1 817 555 0560', 'Dylan Stewart', 'Field contractor network for central-region jobsite support.', 'ASH-CE-PART', 'BT-ASH-056', DATE '2022-11-04'),
    ('Pacific PPE Logistics', 'Logistics Partner', 'Pacific Safety Region', 'Tacoma', 'WA', '98402', '+1 253 555 0570', 'Lily Morris', 'PPE distribution, calibration, and field logistics partner.', 'ASH-PA-PPE', 'BT-ASH-057', DATE '2022-11-21'),
    ('Horizon Safety Consultants', 'Safety Partner', 'Horizon Construction Group', 'Atlanta', 'GA', '30303', '+1 404 555 0580', 'Andre Cox', 'Corporate safety consulting and audit support for Horizon programs.', 'HCG-SAFE', 'BT-HCG-058', DATE '2022-06-26'),
    ('Northstar Emergency Response Team', 'Safety Partner', 'Northstar Industrial Partners', 'Cincinnati', 'OH', '45202', '+1 513 555 0590', 'Paige Kelly', 'Emergency response planning and drill facilitation partner.', 'NIP-ERT', 'BT-NIP-059', DATE '2022-02-26')
)
INSERT INTO company (
  name, company_type_id, main_company_id, address_line_1, city, state_id, zip,
  phone, email, url, description, vendor_code, tax_id, liaison, contact_name,
  naics_code, product_code, company_number, record_group, contract_number,
  joined_at, demo, active
)
SELECT
  wanted.name,
  ct.id,
  parent.id,
  '400 ' || wanted.city || ' Partner Hub',
  wanted.city,
  st.id,
  wanted.zip,
  wanted.phone,
  lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '@business-tree.example',
  'https://' || lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '.example',
  wanted.description,
  wanted.vendor_code,
  'demo-tax-' || lower(regexp_replace(wanted.company_number, '[^a-zA-Z0-9]+', '-', 'g')),
  wanted.contact_name,
  wanted.contact_name,
  '541690',
  'VSM-DEMO',
  wanted.company_number,
  'Business Tree Demo',
  'MSA-2026-' || wanted.company_number,
  wanted.joined_at,
  true,
  true
FROM wanted
JOIN companytype ct ON ct.tenant_id = 101 AND ct.name = wanted.type_name
JOIN company parent ON parent.tenant_id = 101 AND parent.name = wanted.parent_name
LEFT JOIN state st ON st.code = wanted.state_code
WHERE NOT EXISTS (
  SELECT 1 FROM company existing WHERE existing.tenant_id = 101 AND existing.name = wanted.name
);

WITH wanted(name, type_name, parent_name, city, state_code, zip, phone, contact_name, description, company_number, vendor_code, joined_at) AS (
  VALUES
    ('Atlas Safety Holdings', 'Corporate', NULL, 'Boston', 'MA', '02110', '+1 617 555 0100', 'Maya Chen', 'National safety management group coordinating VSM customer operations.', 'ASH-001', 'BT-ROOT-001', DATE '2022-01-15'),
    ('Horizon Construction Group', 'Corporate', NULL, 'Austin', 'TX', '78701', '+1 512 555 0110', 'Ethan Brooks', 'Construction portfolio partner for commercial and infrastructure programs.', 'HCG-001', 'BT-ROOT-002', DATE '2021-10-04'),
    ('Northstar Industrial Partners', 'Corporate', NULL, 'Chicago', 'IL', '60606', '+1 312 555 0120', 'Priya Raman', 'Industrial owner and specialty services partner for high-risk worksites.', 'NIP-001', 'BT-ROOT-003', DATE '2021-06-21'),
    ('Atlas Executive Office', 'Operations Group', 'Atlas Safety Holdings', 'Boston', 'MA', '02110', '+1 617 555 0130', 'Lena Ortiz', 'Executive operations, customer success, and VSM implementation leadership.', 'ASH-EXE', 'BT-ATL-EXE', DATE '2022-02-01'),
    ('Northeast Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'New York', 'NY', '10005', '+1 212 555 0140', 'Marcus Webb', 'Regional safety delivery for high-density commercial work.', 'ASH-NE', 'BT-ATL-NE', DATE '2022-03-03'),
    ('Central Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'Dallas', 'TX', '75201', '+1 214 555 0150', 'Nora Fields', 'Central region field safety and incident prevention programs.', 'ASH-CE', 'BT-ATL-CE', DATE '2022-03-18'),
    ('Pacific Safety Region', 'Regional Division', 'Atlas Safety Holdings', 'Seattle', 'WA', '98101', '+1 206 555 0160', 'Owen Grant', 'West coast safety teams for infrastructure and life sciences projects.', 'ASH-PA', 'BT-ATL-PA', DATE '2022-04-12'),
    ('Atlas Safety Academy', 'Training Center', 'Atlas Safety Holdings', 'Denver', 'CO', '80202', '+1 303 555 0170', 'Iris Coleman', 'Training, onboarding, certifications, and toolbox talk programs.', 'ASH-ACA', 'BT-ATL-ACA', DATE '2022-05-09'),
    ('Commercial Buildings Division', 'Regional Division', 'Horizon Construction Group', 'Austin', 'TX', '78701', '+1 512 555 0180', 'Caleb Turner', 'Commercial building delivery teams and tenant improvement programs.', 'HCG-COM', 'BT-HCG-COM', DATE '2021-11-02'),
    ('Infrastructure Division', 'Regional Division', 'Horizon Construction Group', 'Phoenix', 'AZ', '85004', '+1 602 555 0190', 'Sofia Bennett', 'Civil, bridge, and rail infrastructure construction programs.', 'HCG-INF', 'BT-HCG-INF', DATE '2021-11-16'),
    ('Horizon Vendor Network', 'Logistics Partner', 'Horizon Construction Group', 'Charlotte', 'NC', '28202', '+1 704 555 0200', 'Graham Lee', 'Preferred partner network for materials, scaffolding, and field logistics.', 'HCG-VEN', 'BT-HCG-VEN', DATE '2022-01-08'),
    ('Energy and Utilities Division', 'Regional Division', 'Northstar Industrial Partners', 'Houston', 'TX', '77002', '+1 713 555 0210', 'Amara Singh', 'Energy, utility, and refinery maintenance programs.', 'NIP-ENE', 'BT-NIP-ENE', DATE '2021-07-15'),
    ('Manufacturing Division', 'Regional Division', 'Northstar Industrial Partners', 'Detroit', 'MI', '48226', '+1 313 555 0220', 'Victor Hayes', 'Manufacturing, robotics, and plant modernization safety programs.', 'NIP-MFG', 'BT-NIP-MFG', DATE '2021-08-10'),
    ('Northstar Specialty Contractors', 'Specialty Contractor', 'Northstar Industrial Partners', 'Pittsburgh', 'PA', '15222', '+1 412 555 0230', 'Elena Novak', 'Specialty trades supporting electrical, excavation, and fire systems.', 'NIP-SPC', 'BT-NIP-SPC', DATE '2021-09-12'),
    ('Boston Customer Success Pod', 'Project Office', 'Atlas Executive Office', 'Boston', 'MA', '02110', '+1 617 555 0240', 'Daphne Ellis', 'Customer onboarding, data readiness, and tenant launch support.', 'ASH-EXE-BOS', 'BT-ASH-024', DATE '2022-06-01'),
    ('Governance and Analytics Office', 'Project Office', 'Atlas Executive Office', 'Washington', 'DC', '20001', '+1 202 555 0250', 'Noah Price', 'Executive reporting, compliance analytics, and program governance.', 'ASH-EXE-DC', 'BT-ASH-025', DATE '2022-06-10'),
    ('New York High-Rise Office', 'Project Office', 'Northeast Safety Region', 'New York', 'NY', '10005', '+1 212 555 0260', 'Ava Morgan', 'High-rise construction safety services for dense urban jobsites.', 'ASH-NE-NYC', 'BT-ASH-026', DATE '2022-07-01'),
    ('Boston Healthcare Office', 'Project Office', 'Northeast Safety Region', 'Boston', 'MA', '02114', '+1 617 555 0270', 'Miles Carter', 'Healthcare and life-safety program delivery for active campuses.', 'ASH-NE-BOS', 'BT-ASH-027', DATE '2022-07-12'),
    ('Philadelphia Industrial Office', 'Project Office', 'Northeast Safety Region', 'Philadelphia', 'PA', '19103', '+1 215 555 0280', 'Ruby Stone', 'Industrial renovation safety oversight and contractor coordination.', 'ASH-NE-PHL', 'BT-ASH-028', DATE '2022-07-22'),
    ('Chicago Operations Office', 'Project Office', 'Central Safety Region', 'Chicago', 'IL', '60606', '+1 312 555 0290', 'Jonah Ross', 'Urban construction safety operations across the Great Lakes market.', 'ASH-CE-CHI', 'BT-ASH-029', DATE '2022-08-02'),
    ('Dallas Field Office', 'Project Office', 'Central Safety Region', 'Dallas', 'TX', '75201', '+1 214 555 0300', 'Mila Foster', 'Field safety and inspection teams for Texas commercial sites.', 'ASH-CE-DAL', 'BT-ASH-030', DATE '2022-08-15'),
    ('Denver Energy Office', 'Project Office', 'Central Safety Region', 'Denver', 'CO', '80202', '+1 303 555 0310', 'Eli Parker', 'Energy-sector site safety and contractor readiness programs.', 'ASH-CE-DEN', 'BT-ASH-031', DATE '2022-08-26'),
    ('Seattle Infrastructure Office', 'Project Office', 'Pacific Safety Region', 'Seattle', 'WA', '98101', '+1 206 555 0320', 'Grace Kim', 'Infrastructure, marine, and transit safety operations.', 'ASH-PA-SEA', 'BT-ASH-032', DATE '2022-09-05'),
    ('Bay Area Life Science Office', 'Project Office', 'Pacific Safety Region', 'San Francisco', 'CA', '94105', '+1 415 555 0330', 'Hugo Ramirez', 'Life science campus construction and lab fit-out safety support.', 'ASH-PA-SFO', 'BT-ASH-033', DATE '2022-09-18'),
    ('Los Angeles Transit Office', 'Project Office', 'Pacific Safety Region', 'Los Angeles', 'CA', '90012', '+1 213 555 0340', 'Zara Hughes', 'Transit, station, and right-of-way safety program delivery.', 'ASH-PA-LAX', 'BT-ASH-034', DATE '2022-09-28'),
    ('Mobile Training Unit', 'Training Center', 'Atlas Safety Academy', 'Denver', 'CO', '80202', '+1 303 555 0350', 'Felix Young', 'Mobile training trailers and regional field certification events.', 'ASH-ACA-MOB', 'BT-ASH-035', DATE '2022-10-03'),
    ('Digital Learning Studio', 'Training Center', 'Atlas Safety Academy', 'Atlanta', 'GA', '30303', '+1 404 555 0360', 'Naomi Cooper', 'Digital course production and remote training operations.', 'ASH-ACA-DIG', 'BT-ASH-036', DATE '2022-10-14'),
    ('Austin Tower Office', 'Project Office', 'Commercial Buildings Division', 'Austin', 'TX', '78701', '+1 512 555 0370', 'Theo Reed', 'Commercial tower project delivery and field safety coordination.', 'HCG-COM-AUS', 'BT-HCG-037', DATE '2022-02-02'),
    ('Orlando Hospitality Office', 'Project Office', 'Commercial Buildings Division', 'Orlando', 'FL', '32801', '+1 407 555 0380', 'Lara Bryant', 'Hospitality renovation and occupied-site safety programs.', 'HCG-COM-ORL', 'BT-HCG-038', DATE '2022-02-18'),
    ('Charlotte Mixed Use Office', 'Project Office', 'Commercial Buildings Division', 'Charlotte', 'NC', '28202', '+1 704 555 0390', 'Omar Powell', 'Mixed-use construction safety, access control, and logistics planning.', 'HCG-COM-CLT', 'BT-HCG-039', DATE '2022-03-04'),
    ('Phoenix Civil Office', 'Project Office', 'Infrastructure Division', 'Phoenix', 'AZ', '85004', '+1 602 555 0400', 'Ivy Simmons', 'Civil sitework and heat-stress program support.', 'HCG-INF-PHX', 'BT-HCG-040', DATE '2022-03-18'),
    ('Portland Bridge Office', 'Project Office', 'Infrastructure Division', 'Portland', 'OR', '97204', '+1 503 555 0410', 'Oscar Bell', 'Bridge repair, traffic control, and fall prevention programs.', 'HCG-INF-PDX', 'BT-HCG-041', DATE '2022-04-02'),
    ('Salt Lake Rail Office', 'Project Office', 'Infrastructure Division', 'Salt Lake City', 'UT', '84101', '+1 801 555 0420', 'Maya Torres', 'Rail corridor construction and right-of-way safety coordination.', 'HCG-INF-SLC', 'BT-HCG-042', DATE '2022-04-20'),
    ('Prime Steel Partners', 'Specialty Contractor', 'Horizon Vendor Network', 'Cleveland', 'OH', '44114', '+1 216 555 0430', 'Leo Jenkins', 'Steel erection partner with dedicated safety coordination.', 'HCG-VEN-STEEL', 'BT-HCG-043', DATE '2022-05-07'),
    ('Summit Scaffolding Services', 'Safety Partner', 'Horizon Vendor Network', 'Kansas City', 'MO', '64106', '+1 816 555 0440', 'Sienna Ward', 'Scaffold planning, inspections, and rescue readiness support.', 'HCG-VEN-SCAF', 'BT-HCG-044', DATE '2022-05-22'),
    ('ClearPath Logistics', 'Logistics Partner', 'Horizon Vendor Network', 'Nashville', 'TN', '37203', '+1 615 555 0450', 'Finn Russell', 'Fleet, equipment, and materials logistics partner.', 'HCG-VEN-LOG', 'BT-HCG-045', DATE '2022-06-06'),
    ('Houston Refinery Office', 'Project Office', 'Energy and Utilities Division', 'Houston', 'TX', '77002', '+1 713 555 0460', 'Clara Diaz', 'Refinery turnaround safety and permit-to-work coordination.', 'NIP-ENE-HOU', 'BT-NIP-046', DATE '2021-10-02'),
    ('Baton Rouge Maintenance Office', 'Project Office', 'Energy and Utilities Division', 'Baton Rouge', 'LA', '70801', '+1 225 555 0470', 'Mateo Flores', 'Industrial maintenance and outage safety management.', 'NIP-ENE-BTR', 'BT-NIP-047', DATE '2021-10-16'),
    ('Pittsburgh Power Office', 'Project Office', 'Energy and Utilities Division', 'Pittsburgh', 'PA', '15222', '+1 412 555 0480', 'Hazel Murphy', 'Power-generation project safety and contractor onboarding.', 'NIP-ENE-PIT', 'BT-NIP-048', DATE '2021-11-01'),
    ('Detroit Robotics Office', 'Project Office', 'Manufacturing Division', 'Detroit', 'MI', '48226', '+1 313 555 0490', 'Arlo Brooks', 'Robotics cell installation and machinery safety programs.', 'NIP-MFG-DET', 'BT-NIP-049', DATE '2021-11-19'),
    ('Indianapolis Fabrication Office', 'Project Office', 'Manufacturing Division', 'Indianapolis', 'IN', '46204', '+1 317 555 0500', 'June Peterson', 'Fabrication shop modernization and field observation programs.', 'NIP-MFG-IND', 'BT-NIP-050', DATE '2021-12-03'),
    ('Cleveland Plant Services', 'Project Office', 'Manufacturing Division', 'Cleveland', 'OH', '44114', '+1 216 555 0510', 'Nico Rivera', 'Plant services, lockout-tagout, and maintenance safety support.', 'NIP-MFG-CLE', 'BT-NIP-051', DATE '2021-12-18'),
    ('Apex Electrical Systems', 'Specialty Contractor', 'Northstar Specialty Contractors', 'Columbus', 'OH', '43215', '+1 614 555 0520', 'Mina Shah', 'Electrical contractor with energized-work planning support.', 'NIP-SPC-ELEC', 'BT-NIP-052', DATE '2022-01-12'),
    ('TerraForm Excavation', 'Specialty Contractor', 'Northstar Specialty Contractors', 'Oklahoma City', 'OK', '73102', '+1 405 555 0530', 'Rafael Ortiz', 'Excavation, trenching, and utility-location partner.', 'NIP-SPC-EXC', 'BT-NIP-053', DATE '2022-01-28'),
    ('Shield Fire Protection', 'Safety Partner', 'Northstar Specialty Contractors', 'Raleigh', 'NC', '27601', '+1 919 555 0540', 'Ella Watson', 'Fire protection, hot-work planning, and emergency readiness partner.', 'NIP-SPC-FIRE', 'BT-NIP-054', DATE '2022-02-11'),
    ('New England Safety Alliance', 'Safety Partner', 'Northeast Safety Region', 'Providence', 'RI', '02903', '+1 401 555 0550', 'Cora Bailey', 'Regional safety partner supporting audits and coaching.', 'ASH-NE-PART', 'BT-ASH-055', DATE '2022-10-22'),
    ('Texas Field Partner Network', 'Contractor', 'Central Safety Region', 'Fort Worth', 'TX', '76102', '+1 817 555 0560', 'Dylan Stewart', 'Field contractor network for central-region jobsite support.', 'ASH-CE-PART', 'BT-ASH-056', DATE '2022-11-04'),
    ('Pacific PPE Logistics', 'Logistics Partner', 'Pacific Safety Region', 'Tacoma', 'WA', '98402', '+1 253 555 0570', 'Lily Morris', 'PPE distribution, calibration, and field logistics partner.', 'ASH-PA-PPE', 'BT-ASH-057', DATE '2022-11-21'),
    ('Horizon Safety Consultants', 'Safety Partner', 'Horizon Construction Group', 'Atlanta', 'GA', '30303', '+1 404 555 0580', 'Andre Cox', 'Corporate safety consulting and audit support for Horizon programs.', 'HCG-SAFE', 'BT-HCG-058', DATE '2022-06-26'),
    ('Northstar Emergency Response Team', 'Safety Partner', 'Northstar Industrial Partners', 'Cincinnati', 'OH', '45202', '+1 513 555 0590', 'Paige Kelly', 'Emergency response planning and drill facilitation partner.', 'NIP-ERT', 'BT-NIP-059', DATE '2022-02-26')
)
UPDATE company c
   SET company_type_id = ct.id,
       main_company_id = parent.id,
       address_line_1 = CASE
         WHEN wanted.parent_name IS NULL THEN '100 ' || wanted.city || ' Operations Center'
         WHEN wanted.name LIKE '%Partner%' OR wanted.name LIKE '%Logistics%' THEN '400 ' || wanted.city || ' Partner Hub'
         WHEN wanted.name LIKE '%Office%' OR wanted.name LIKE '%Pod%' OR wanted.name LIKE '%Unit%' OR wanted.name LIKE '%Studio%' THEN '300 ' || wanted.city || ' Site Office'
         ELSE '200 ' || wanted.city || ' Field Center'
       END,
       city = wanted.city,
       state_id = st.id,
       zip = wanted.zip,
       phone = wanted.phone,
       email = lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '@business-tree.example',
       url = 'https://' || lower(regexp_replace(wanted.name, '[^a-zA-Z0-9]+', '-', 'g')) || '.example',
       description = wanted.description,
       vendor_code = wanted.vendor_code,
       tax_id = 'demo-tax-' || lower(regexp_replace(wanted.company_number, '[^a-zA-Z0-9]+', '-', 'g')),
       liaison = wanted.contact_name,
       contact_name = wanted.contact_name,
       naics_code = '541690',
       product_code = 'VSM-DEMO',
       company_number = wanted.company_number,
       record_group = 'Business Tree Demo',
       contract_number = 'MSA-2026-' || wanted.company_number,
       joined_at = wanted.joined_at,
       demo = true,
       active = true,
       updated_at = now()
  FROM wanted
  JOIN companytype ct ON ct.tenant_id = 101 AND ct.name = wanted.type_name
  LEFT JOIN company parent ON parent.tenant_id = 101 AND parent.name = wanted.parent_name
  LEFT JOIN state st ON st.code = wanted.state_code
 WHERE c.tenant_id = 101
   AND c.name = wanted.name;

WITH
company_pool AS (
  SELECT id, name, row_number() OVER (ORDER BY COALESCE(main_company_id, 0), name, id) AS rn
    FROM company
   WHERE tenant_id = 101
     AND active = true
     AND (
       record_group = 'Business Tree Demo'
       OR name IN ('Atlas Safety Holdings', 'Horizon Construction Group', 'Northstar Industrial Partners')
     )
),
company_count AS (
  SELECT COUNT(*)::int AS total FROM company_pool
),
first_names AS (
  SELECT ARRAY[
    'Aiden','Amelia','Andre','Anika','Blake','Camila','Celeste','Dante','Elena','Elliot',
    'Farah','Felix','Gianna','Harper','Isaac','Jasmine','Jonah','Kai','Lena','Luca',
    'Maya','Noah','Olivia','Priya','Quinn','Riley','Sofia','Theo','Uma','Victor'
  ] AS names
),
last_names AS (
  SELECT ARRAY[
    'Adams','Bennett','Carter','Diaz','Ellis','Foster','Garcia','Hayes','Ivanov','Johnson',
    'Kim','Lopez','Morgan','Nguyen','Ortiz','Patel','Reed','Singh','Torres','Walker'
  ] AS names
),
generated AS (
  SELECT
    n,
    (SELECT names[((n - 1) % array_length(names, 1)) + 1] FROM first_names) AS first_name,
    (SELECT names[(((n - 1) / 3) % array_length(names, 1)) + 1] FROM last_names) AS last_name,
    'btree.demo.' || lpad(n::text, 3, '0') || '@demo.local' AS email,
    'btree.demo.' || lpad(n::text, 3, '0') AS username,
    'BT-' || lpad(n::text, 4, '0') AS employee_number,
    ((n - 1) % (SELECT total FROM company_count)) + 1 AS company_rn,
    CASE WHEN n % 8 = 0 THEN 'Administrator' ELSE 'Manager' END AS job_name,
    CASE
      WHEN n % 6 = 0 THEN 'Safety Manager'
      WHEN n % 6 = 1 THEN 'Field Coordinator'
      WHEN n % 6 = 2 THEN 'Site Supervisor'
      WHEN n % 6 = 3 THEN 'Training Lead'
      WHEN n % 6 = 4 THEN 'Operations Analyst'
      ELSE 'Project Safety Representative'
    END AS occupation
  FROM generate_series(1, 150) AS n
),
user_rows AS (
  SELECT
    g.n,
    g.first_name,
    g.last_name,
    g.email,
    g.username,
    g.employee_number,
    cp.id AS company_id,
    jt.id AS job_type_id,
    g.occupation,
    c.city,
    c.state_id,
    c.zip
  FROM generated g
  JOIN company_pool cp ON cp.rn = g.company_rn
  JOIN company c ON c.id = cp.id
  LEFT JOIN jobtype jt ON jt.tenant_id = 101 AND jt.name = g.job_name
)
INSERT INTO users (
  active, system_access, admin_access, company_id, recorded_at, email,
  first_name, last_name, mobile_phone, phone, job_type_id, username, notes,
  hire_date, employee_number, last_seen_at, timezone_id, address_line_1, city,
  state_id, zip, terms_accepted, demo, status, occupation
)
SELECT
  true,
  CASE WHEN n % 11 = 0 THEN true ELSE false END,
  CASE WHEN n % 23 = 0 THEN true ELSE false END,
  company_id,
  now() - ((n % 30) || ' days')::interval,
  email::citext,
  first_name,
  last_name,
  '+1 555 ' || lpad(((1000 + n) % 10000)::text, 4, '0'),
  '+1 555 ' || lpad(((3000 + n) % 10000)::text, 4, '0'),
  job_type_id,
  username,
  'Business Tree demo contact assigned to a seeded company hierarchy.',
  DATE '2021-01-04' + ((n % 900)::int),
  employee_number,
  now() - ((n % 12) || ' hours')::interval,
  35,
  (500 + n)::text || ' Demo Way',
  city,
  state_id,
  zip,
  true,
  true,
  'Active',
  occupation
FROM user_rows
ON CONFLICT (tenant_id, email) WHERE email IS NOT NULL DO UPDATE
SET active = EXCLUDED.active,
    system_access = EXCLUDED.system_access,
    admin_access = EXCLUDED.admin_access,
    company_id = EXCLUDED.company_id,
    recorded_at = EXCLUDED.recorded_at,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_phone = EXCLUDED.mobile_phone,
    phone = EXCLUDED.phone,
    job_type_id = EXCLUDED.job_type_id,
    username = EXCLUDED.username,
    notes = EXCLUDED.notes,
    hire_date = EXCLUDED.hire_date,
    employee_number = EXCLUDED.employee_number,
    last_seen_at = EXCLUDED.last_seen_at,
    timezone_id = EXCLUDED.timezone_id,
    address_line_1 = EXCLUDED.address_line_1,
    city = EXCLUDED.city,
    state_id = EXCLUDED.state_id,
    zip = EXCLUDED.zip,
    terms_accepted = EXCLUDED.terms_accepted,
    demo = EXCLUDED.demo,
    status = EXCLUDED.status,
    occupation = EXCLUDED.occupation,
    updated_at = now();

WITH
company_pool AS (
  SELECT
    c.id,
    c.name,
    c.city,
    c.state_id,
    c.zip,
    row_number() OVER (ORDER BY COALESCE(c.main_company_id, 0), c.name, c.id) AS rn
  FROM company c
  WHERE c.tenant_id = 101
    AND c.active = true
    AND (
      c.record_group = 'Business Tree Demo'
      OR c.name IN ('Atlas Safety Holdings', 'Horizon Construction Group', 'Northstar Industrial Partners')
    )
),
company_count AS (
  SELECT COUNT(*)::int AS total FROM company_pool
),
company_users AS (
  SELECT
    u.id,
    u.company_id,
    row_number() OVER (PARTITION BY u.company_id ORDER BY u.id) AS user_rn
  FROM users u
  WHERE u.tenant_id = 101
    AND u.active = true
    AND (
      u.email::text LIKE 'btree.demo.%@demo.local'
      OR u.email::text IN ('owner@demo.local', 'user@demo.local')
    )
),
generated AS (
  SELECT
    n,
    'BT-P-' || lpad(n::text, 3, '0') AS project_number,
    CASE n % 12
      WHEN 0 THEN 'Confined Space Readiness'
      WHEN 1 THEN 'High-Rise Fall Protection'
      WHEN 2 THEN 'Heat Stress Prevention'
      WHEN 3 THEN 'Crane Lift Safety'
      WHEN 4 THEN 'Permit-to-Work Rollout'
      WHEN 5 THEN 'Emergency Drill Program'
      WHEN 6 THEN 'Site Orientation Launch'
      WHEN 7 THEN 'Incident Trend Review'
      WHEN 8 THEN 'PPE Distribution Upgrade'
      WHEN 9 THEN 'Lockout Tagout Refresh'
      WHEN 10 THEN 'Contractor Onboarding Sprint'
      ELSE 'Field Observation Program'
    END AS project_theme,
    ((n - 1) % (SELECT total FROM company_count)) + 1 AS company_rn,
    (((n + 6) - 1) % (SELECT total FROM company_count)) + 1 AS contractor_rn,
    CASE n % 5
      WHEN 0 THEN 'Planning'
      WHEN 1 THEN 'Active'
      WHEN 2 THEN 'Active'
      WHEN 3 THEN 'Review'
      ELSE 'Mobilizing'
    END AS status,
    DATE '2026-01-06' + ((n % 240)::int * INTERVAL '1 day') AS start_at,
    DATE '2026-01-06' + (((n % 240) + 60 + (n % 45))::int * INTERVAL '1 day') AS end_at
  FROM generate_series(1, 72) AS n
),
project_rows AS (
  SELECT
    g.n,
    g.project_number,
    g.project_theme || ' - ' || cp.city AS name,
    cp.id AS company_id,
    contractor.id AS contractor_company_id,
    cp.city,
    cp.state_id,
    cp.zip,
    owner_user.id AS owner_user_id,
    contact_user.id AS contact_id,
    pm_user.id AS project_manager_user_id,
    superintendent_user.id AS project_superintendent_user_id,
    safety_user.id AS project_safety_rep_user_id,
    g.status,
    g.start_at,
    g.end_at
  FROM generated g
  JOIN company_pool cp ON cp.rn = g.company_rn
  JOIN company_pool contractor ON contractor.rn = g.contractor_rn
  LEFT JOIN company_users owner_user ON owner_user.company_id = cp.id AND owner_user.user_rn = 1
  LEFT JOIN company_users contact_user ON contact_user.company_id = cp.id AND contact_user.user_rn = 2
  LEFT JOIN company_users pm_user ON pm_user.company_id = cp.id AND pm_user.user_rn = 3
  LEFT JOIN company_users superintendent_user ON superintendent_user.company_id = cp.id AND superintendent_user.user_rn = 4
  LEFT JOIN company_users safety_user ON safety_user.company_id = cp.id AND safety_user.user_rn = 5
)
INSERT INTO projects (
  owner_user_id, recorded_at, active, address_line_1, city, phone, email,
  company_id, contractor_company_id, start_date, end_date, description, info,
  name, project_number, state_id, url, contract_value, zip, status, year,
  contact_id, project_manager_user_id, project_superintendent_user_id,
  project_safety_rep_user_id, subcontractor_company_id, demo, naics_code,
  industry_description, geo_code
)
SELECT
  owner_user_id,
  now() - ((n % 20) || ' days')::interval,
  true,
  (700 + n)::text || ' Project Way',
  city,
  '+1 555 ' || lpad(((6000 + n) % 10000)::text, 4, '0'),
  lower(project_number) || '@projects.business-tree.example',
  company_id,
  contractor_company_id,
  start_at,
  end_at,
  'Business Tree demo project for safety program presentation and lazy project branch rendering.',
  'Generated demo project linked to seeded company and user teams.',
  name,
  project_number,
  state_id,
  'https://projects.business-tree.example/' || lower(project_number),
  (125000 + (n * 18500))::numeric(14,2),
  zip,
  status,
  '2026',
  contact_id,
  project_manager_user_id,
  project_superintendent_user_id,
  project_safety_rep_user_id,
  contractor_company_id,
  true,
  '236220',
  'Commercial and industrial safety program delivery',
  'BT-GEO-' || lpad(n::text, 3, '0')
FROM project_rows
WHERE NOT EXISTS (
  SELECT 1
    FROM projects existing
   WHERE existing.tenant_id = 101
     AND existing.project_number = project_rows.project_number
);

WITH
company_pool AS (
  SELECT
    c.id,
    c.name,
    c.city,
    c.state_id,
    c.zip,
    row_number() OVER (ORDER BY COALESCE(c.main_company_id, 0), c.name, c.id) AS rn
  FROM company c
  WHERE c.tenant_id = 101
    AND c.active = true
    AND (
      c.record_group = 'Business Tree Demo'
      OR c.name IN ('Atlas Safety Holdings', 'Horizon Construction Group', 'Northstar Industrial Partners')
    )
),
company_count AS (
  SELECT COUNT(*)::int AS total FROM company_pool
),
company_users AS (
  SELECT
    u.id,
    u.company_id,
    row_number() OVER (PARTITION BY u.company_id ORDER BY u.id) AS user_rn
  FROM users u
  WHERE u.tenant_id = 101
    AND u.active = true
    AND (
      u.email::text LIKE 'btree.demo.%@demo.local'
      OR u.email::text IN ('owner@demo.local', 'user@demo.local')
    )
),
generated AS (
  SELECT
    n,
    'BT-P-' || lpad(n::text, 3, '0') AS project_number,
    CASE n % 12
      WHEN 0 THEN 'Confined Space Readiness'
      WHEN 1 THEN 'High-Rise Fall Protection'
      WHEN 2 THEN 'Heat Stress Prevention'
      WHEN 3 THEN 'Crane Lift Safety'
      WHEN 4 THEN 'Permit-to-Work Rollout'
      WHEN 5 THEN 'Emergency Drill Program'
      WHEN 6 THEN 'Site Orientation Launch'
      WHEN 7 THEN 'Incident Trend Review'
      WHEN 8 THEN 'PPE Distribution Upgrade'
      WHEN 9 THEN 'Lockout Tagout Refresh'
      WHEN 10 THEN 'Contractor Onboarding Sprint'
      ELSE 'Field Observation Program'
    END AS project_theme,
    ((n - 1) % (SELECT total FROM company_count)) + 1 AS company_rn,
    (((n + 6) - 1) % (SELECT total FROM company_count)) + 1 AS contractor_rn,
    CASE n % 5
      WHEN 0 THEN 'Planning'
      WHEN 1 THEN 'Active'
      WHEN 2 THEN 'Active'
      WHEN 3 THEN 'Review'
      ELSE 'Mobilizing'
    END AS status,
    DATE '2026-01-06' + ((n % 240)::int * INTERVAL '1 day') AS start_at,
    DATE '2026-01-06' + (((n % 240) + 60 + (n % 45))::int * INTERVAL '1 day') AS end_at
  FROM generate_series(1, 72) AS n
),
project_rows AS (
  SELECT
    g.n,
    g.project_number,
    g.project_theme || ' - ' || cp.city AS name,
    cp.id AS company_id,
    contractor.id AS contractor_company_id,
    cp.city,
    cp.state_id,
    cp.zip,
    owner_user.id AS owner_user_id,
    contact_user.id AS contact_id,
    pm_user.id AS project_manager_user_id,
    superintendent_user.id AS project_superintendent_user_id,
    safety_user.id AS project_safety_rep_user_id,
    g.status,
    g.start_at,
    g.end_at
  FROM generated g
  JOIN company_pool cp ON cp.rn = g.company_rn
  JOIN company_pool contractor ON contractor.rn = g.contractor_rn
  LEFT JOIN company_users owner_user ON owner_user.company_id = cp.id AND owner_user.user_rn = 1
  LEFT JOIN company_users contact_user ON contact_user.company_id = cp.id AND contact_user.user_rn = 2
  LEFT JOIN company_users pm_user ON pm_user.company_id = cp.id AND pm_user.user_rn = 3
  LEFT JOIN company_users superintendent_user ON superintendent_user.company_id = cp.id AND superintendent_user.user_rn = 4
  LEFT JOIN company_users safety_user ON safety_user.company_id = cp.id AND safety_user.user_rn = 5
)
UPDATE projects p
   SET owner_user_id = project_rows.owner_user_id,
       recorded_at = now(),
       active = true,
       address_line_1 = (700 + project_rows.n)::text || ' Project Way',
       city = project_rows.city,
       phone = '+1 555 ' || lpad(((6000 + project_rows.n) % 10000)::text, 4, '0'),
       email = lower(project_rows.project_number) || '@projects.business-tree.example',
       company_id = project_rows.company_id,
       contractor_company_id = project_rows.contractor_company_id,
       start_date = project_rows.start_at,
       end_date = project_rows.end_at,
       description = 'Business Tree demo project for safety program presentation and lazy project branch rendering.',
       info = 'Generated demo project linked to seeded company and user teams.',
       name = project_rows.name,
       state_id = project_rows.state_id,
       url = 'https://projects.business-tree.example/' || lower(project_rows.project_number),
       contract_value = (125000 + (project_rows.n * 18500))::numeric(14,2),
       zip = project_rows.zip,
       status = project_rows.status,
       year = '2026',
       contact_id = project_rows.contact_id,
       project_manager_user_id = project_rows.project_manager_user_id,
       project_superintendent_user_id = project_rows.project_superintendent_user_id,
       project_safety_rep_user_id = project_rows.project_safety_rep_user_id,
       subcontractor_company_id = project_rows.contractor_company_id,
       demo = true,
       naics_code = '236220',
       industry_description = 'Commercial and industrial safety program delivery',
       geo_code = 'BT-GEO-' || lpad(project_rows.n::text, 3, '0'),
       updated_at = now()
  FROM project_rows
 WHERE p.tenant_id = 101
   AND p.project_number = project_rows.project_number;

WITH project_scope AS (
  SELECT id, company_id, project_number
    FROM projects
   WHERE tenant_id = 101
     AND project_number LIKE 'BT-P-%'
),
access_rows AS (
  SELECT
    p.id AS project_id,
    u.id AS user_id,
    CASE u.access_rn
      WHEN 1 THEN 'Project Manager'
      WHEN 2 THEN 'Safety Representative'
      WHEN 3 THEN 'Field Supervisor'
      ELSE 'Viewer'
    END AS role
  FROM project_scope p
  JOIN LATERAL (
    SELECT
      scoped_user.id,
      row_number() OVER (ORDER BY scoped_user.id) AS access_rn
    FROM users scoped_user
    WHERE scoped_user.tenant_id = 101
      AND scoped_user.company_id = p.company_id
      AND scoped_user.active = true
      AND (
        scoped_user.email::text LIKE 'btree.demo.%@demo.local'
        OR scoped_user.email::text IN ('owner@demo.local', 'user@demo.local')
      )
    ORDER BY scoped_user.id
    LIMIT 4
  ) u ON true
)
INSERT INTO projectsaccess (project_id, user_id, role)
SELECT project_id, user_id, role
FROM access_rows
ON CONFLICT (tenant_id, project_id, user_id) DO UPDATE
SET role = EXCLUDED.role,
    updated_at = now();

COMMIT;
