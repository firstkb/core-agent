SET NOCOUNT ON
SET ANSI_NULLS ON
BEGIN TRANSACTION;
BEGIN TRY
-------------------
{{CLEAR}}
-------------------
DECLARE @logs TABLE (rec datetime, id int );
DECLARE @logs_projects TABLE (rec datetime, id int );
DECLARE @logs_company TABLE (rec datetime, id int );
DECLARE @logs_users TABLE (rec datetime, id int );
-------------------
DECLARE @xml nvarchar(max), @i INT
SET @xml = (SELECT import_xml AS xmlData from import where import_id={{IMPORTID}} ) 
SET @xml = REPLACE(@xml,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','')
EXEC sp_xml_preparedocument @i OUTPUT, @xml
-------------------
DECLARE @{{TABLE}} TABLE ( {{BLOCK1}} )
-------------------
INSERT INTO @{{TABLE}} ({{BLOCK4}})
SELECT {{BLOCK4d}} FROM OPENXML(@i, '/csv_data_records/record', 1)
WITH ( {{BLOCK2}} )
-------------------
{{BLOCK3}}
-------------------
INSERT INTO {{TABLE}} ({{BLOCK4}})
OUTPUT GETDATE(),INSERTED.{{TABLE}}_id INTO @logs
SELECT
	{{BLOCK5}}
FROM @{{TABLE}} as t
{{BLOCK6}}
{{BLOCK9}}

INSERT INTO [events] (events_users_id,events_users_ip,events_event,events_table,events_date,events_time,events_module,events_record,events_text)
SELECT {{events_users_id}},'{{events_users_ip}}','DBImport','{{TABLE}}',GetDate(),GetDate(),'ExtDB',id,'Bulk Insert by Import'
FROM @logs
-------------------
SELECT 'Added Records',COUNT(rec) FROM @logs
UNION SELECT 'Added Projects',COUNT(rec) FROM @logs_projects
UNION SELECT 'Added Companies',COUNT(rec) FROM @logs_company
UNION SELECT 'Added Contacts',COUNT(rec) FROM @logs_users
-------------------
END TRY
BEGIN CATCH
    SELECT 'ERROR',ERROR_MESSAGE() AS ErrorMessage;
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
END CATCH

IF @@TRANCOUNT > 0
    COMMIT TRANSACTION;
