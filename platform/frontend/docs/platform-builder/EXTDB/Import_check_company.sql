INSERT INTO company (company_name)
OUTPUT GETDATE(),INSERTED.company_id INTO @logs_company
SELECT DISTINCT RTrim(LTrim({{FIELD}})) 
FROM @{{TABLE}} WHERE RTrim(LTrim({{FIELD}})) NOT IN (select company_name from company) AND LEN(RTrim(LTrim({{FIELD}})))>0

INSERT INTO [events] (events_users_id,events_users_ip,events_event,events_table,events_date,events_time,events_module,events_record,events_text)
SELECT {{events_users_id}},'{{events_users_ip}}','DBImport','company',GetDate(),GetDate(),'ExtDB',id,'Bulk Insert by Import'
FROM @logs_company
