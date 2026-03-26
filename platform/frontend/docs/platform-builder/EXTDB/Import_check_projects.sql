INSERT INTO projects (projects_num,projects_name)
OUTPUT GETDATE(),INSERTED.projects_id INTO @logs_projects
SELECT DISTINCT RTrim(LTrim(SUBSTRING({{FIELD}},0,CHARINDEX(',',{{FIELD}})))),RTrim(LTrim(SUBSTRING({{FIELD}},CHARINDEX(',',{{FIELD}})+1,len({{FIELD}}))))
FROM @{{TABLE}} WHERE RTrim(LTrim({{FIELD}})) NOT IN (select projects_num+', '+projects_name from projects) AND LEN(RTrim(LTrim({{FIELD}})))>0

INSERT INTO [events] (events_users_id,events_users_ip,events_event,events_table,events_date,events_time,events_module,events_record,events_text)
SELECT {{events_users_id}},'{{events_users_ip}}','DBImport','projects',GetDate(),GetDate(),'ExtDB',id,'Bulk Insert by Import'
FROM @logs_projects
