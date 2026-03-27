INSERT INTO users (users_firstname,users_lastname)
OUTPUT GETDATE(),INSERTED.users_id INTO @logs_users
SELECT DISTINCT RTrim(LTrim(SUBSTRING({{FIELD}},0,CHARINDEX(',',{{FIELD}})))),RTrim(LTrim(SUBSTRING({{FIELD}},CHARINDEX(',',{{FIELD}})+1,len({{FIELD}}))))
FROM @{{TABLE}} WHERE RTrim(LTrim({{FIELD}})) NOT IN (select users_firstname+', '+users_lastname from users) AND LEN(RTrim(LTrim({{FIELD}})))>0

INSERT INTO [events] (events_users_id,events_users_ip,events_event,events_table,events_date,events_time,events_module,events_record,events_text)
SELECT {{events_users_id}},'{{events_users_ip}}','DBImport','users',GetDate(),GetDate(),'ExtDB',id,'Bulk Insert by Import'
FROM @logs_users
