INSERT [ExtDBtbl] ([ExtDBtbl_title], [ExtDBtbl_type], [ExtDBtbl_report], [ExtDBtbl_lib]) VALUES (N'OSHA Injuries', 1, 1, N'OSHA');

DECLARE @tbl1_id int; SET @tbl1_id = (SELECT top 1 ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title = 'OSHA Injuries');

INSERT INTO [ExtDBfld] ( [ExtDBfld_ExtDBtbl_id], [ExtDBfld_title], [ExtDBfld_type], [ExtDBfld_param], [ExtDBfld_req], [ExtDBfld_order], [ExtDBfld_lib] ) 
    VALUES
        (@tbl1_id, N'Main', N'80', N'', N'No', 1, N'OSHA'),
        (@tbl1_id, N'Location', N'202', N'', N'Yes', 2, N'OSHA'),
        (@tbl1_id, N'Employee', N'202', N'', N'Yes', 3, N'OSHA'),
        (@tbl1_id, N'Job Title', N'202', N'', N'Yes', 4, N'OSHA'),
        (@tbl1_id, N'Date of Injury', N'135', N'', N'Yes' ,5, N'OSHA'),
        (@tbl1_id, N'OSHA Reportable', N'2031', N'Yes|No', N'No', 6, N'OSHA'),
        (@tbl1_id, N'Injury Severity', N'2030', N'First Aid/Jobsite|First Aid/Doctor|Lost Workdays|Fatality|Job Transfer or Restriction|Other Recordable', N'No', 7, N'OSHA'),
        (@tbl1_id, N'OSHA Class', N'2030', N'Injury|Skin Disorder|Respiratory Condition|Poisoning|Hearing Loss|All other illnesses', N'No', 8, N'OSHA'),
        (@tbl1_id, N'Part of Body', N'200', N'', N'No', 9, N'OSHA'),
        (@tbl1_id, N'Type of Injury', N'202', N'', N'No', 10, N'OSHA'),
        (@tbl1_id, N'Description of Injury', N'201', N'', N'No', 11, N'OSHA'),
        (@tbl1_id, N'Unable to Return to Work for At Least One Day?', N'2031', N'Yes|No', N'No', 12, N'OSHA'),
        (@tbl1_id, N'Employee Treated in Emergency Room?', N'2031', N'Yes|No', N'No', 13, N'OSHA'),
        (@tbl1_id, N'Where the event occurred', N'201', N'', N'No', 14, N'OSHA'),
        (@tbl1_id, N'Area Where Incident Occurred', N'201', N'', N'No', 15, N'OSHA'),
        (@tbl1_id, N'Equipment or Materials involved in Injury', N'200', N'', N'No', 16, N'OSHA'),
        (@tbl1_id, N'Equipment or Materials being Used when Incident Occurred', N'201', N'', N'No', 17, N'OSHA'),
        (@tbl1_id, N'Time Injured Employee Began Work', N'200', N'', N'No', 18, N'OSHA'),
        (@tbl1_id, N'Employee`s Work Activity When Injury or illness Occurred', N'201', N'', N'No', 19, N'OSHA'),
        (@tbl1_id, N'Time of Death', N'200', N'', N'No', 21, N'OSHA'),
        (@tbl1_id, N'Job Transfer or Restriction (days)', N'3', N'', N'No', 22, N'OSHA'),
        (@tbl1_id, N'Days away from work (days)', N'3', N'', N'No', 23, N'OSHA'),
        (@tbl1_id, N'Details', N'80', N'', N'No', 24, N'OSHA'),
        (@tbl1_id, N'Hospitalized?', N'2031', N'Yes|No', N'No', 25, N'OSHA'),
        (@tbl1_id, N'Name of physician or other health care professional', N'200', N'', N'No', 26, N'OSHA'),
        (@tbl1_id, N'Facility Address', N'200', N'', N'No', 27, N'OSHA'),
        (@tbl1_id, N'Facility City', N'200', N'', N'No', 28, N'OSHA'),
        (@tbl1_id, N'Facility Name', N'200', N'', N'No', 29, N'OSHA'),
        (@tbl1_id, N'Facility State', N'200', N'', N'No', 30, N'OSHA'),
        (@tbl1_id, N'Facility ZIP', N'200', N'', N'No', 31, N'OSHA'),
        (@tbl1_id, N'Employee Sex', N'2030', N'Male|Female', N'No', 32, N'OSHA'),
        (@tbl1_id, N'Employee Home Address', N'200', N'', N'No', 33, N'OSHA'),
        (@tbl1_id, N'Employee Home City', N'200', N'', N'No', 34, N'OSHA'),
        (@tbl1_id, N'Employee Home State', N'200', N'', N'No', 35, N'OSHA'),
        (@tbl1_id, N'Employee Home ZIP', N'200', N'', N'No', 36, N'OSHA'),
        (@tbl1_id, N'Employee DOB', N'135', N'', N'No', 37, N'OSHA'),
        (@tbl1_id, N'Date of Hire', N'135', N'', N'No', 38, N'OSHA');

INSERT [ExtDBtbl] ([ExtDBtbl_title], [ExtDBtbl_type], [ExtDBtbl_report], [ExtDBtbl_lib]) VALUES (N'OSHA Locations', 1, 1, N'OSHA');

DECLARE @tbl2_id int; SET @tbl2_id = (SELECT top 1 ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title = 'OSHA Locations');

INSERT INTO [ExtDBfld] ( [ExtDBfld_ExtDBtbl_id], [ExtDBfld_title], [ExtDBfld_type], [ExtDBfld_param], [ExtDBfld_req], [ExtDBfld_order], [ExtDBfld_lib] ) 
    VALUES
        (@tbl2_id, N'Location', N'202', N'', N'Yes', 1, N'OSHA'),
        (@tbl2_id, N'Main Company', N'202', N'', N'Yes', 2, N'OSHA'),
        (@tbl2_id, N'City', N'202', N'', N'No', 3, N'OSHA'),
        (@tbl2_id, N'Address', N'202', N'', N'No', 4, N'OSHA'),
        (@tbl2_id, N'State', N'202', N'', N'No', 5, N'OSHA'),
        (@tbl2_id, N'ZIP', N'202', N'', N'No', 6, N'OSHA'),
        (@tbl2_id, N'Year', N'3', N'', N'Yes', 7, N'OSHA'),
        (@tbl2_id, N'Total hours worked by all employees', N'3', N'', N'Yes', 8, N'OSHA'),
        (@tbl2_id, N'Annual average number of employees', N'3', N'', N'Yes', 9, N'OSHA'),
        (@tbl2_id, N'NAICS Code', N'202', N'', N'No', 10, N'OSHA'),
        (@tbl2_id, N'Industry Description', N'202', N'', N'No', 11, N'OSHA');

---
INSERT [ExtDBmdl] ([ExtDBmdl_title], [ExtDBmdl_act], [ExtDBmdl_lib]) VALUES (N'OSHA', 1, N'OSHA');

DECLARE @mdl_id int; SET @mdl_id = (SELECT top 1 ExtDBmdl_id FROM ExtDBmdl WHERE ExtDBmdl_title = 'OSHA');

---
INSERT [ExtDBpg] ([ExtDBpg_title], [ExtDBpg_ExtDBtbl_id], [ExtDBpg_ExtDBmdl_id], [ExtDBpg_act], [ExtDBpg_files], [ExtDBpg_web], [ExtDBpg_aEdit], [ExtDBpg_aDelete], [ExtDBpg_aNew], [ExtDBpg_share], [ExtDBpg_pwa], [ExtDBpg_lib]) 
    VALUES (N'Injuries', @tbl1_id, @mdl_id, 1, 0, 0, 1, 1, 1, N'4C429C56091641A6AB0653D495F6850D', 0, N'OSHA');

DECLARE @pg1_id int; SET @pg1_id = (SELECT top 1 ExtDBpg_id FROM ExtDBpg WHERE ExtDBpg_title = 'Injuries' AND ExtDBpg_lib = 'OSHA' );

INSERT INTO ExtDBpgfld ( ExtDBpgfld_ExtDBpg_id, ExtDBpgfld_ExtDBfld_id, ExtDBpgfld_ingrid )
    SELECT @pg1_id, ExtDBfld_id, N'hide' FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=@tbl1_id;

UPDATE ExtDBpgfld SET ExtDBpgfld_ingrid = N'' WHERE ExtDBpgfld_ExtDBfld_id IN (SELECT ExtDBfld_id FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=@tbl1_id
    AND ExtDBfld_title IN ('Location','Employee','Job Title','Date of Injury','OSHA Reportable','Injury Severity','OSHA Class') );

---
INSERT [ExtDBpg] ([ExtDBpg_title], [ExtDBpg_ExtDBtbl_id], [ExtDBpg_ExtDBmdl_id], [ExtDBpg_act], [ExtDBpg_files], [ExtDBpg_web], [ExtDBpg_aEdit], [ExtDBpg_aDelete], [ExtDBpg_aNew], [ExtDBpg_share], [ExtDBpg_pwa], [ExtDBpg_lib]) 
    VALUES (N'Locations', @tbl2_id, @mdl_id, 1, 0, 0, 1, 1, 1, N'29E463D305424BD7B960D727E25D79D7', 0, N'Locations');

DECLARE @pg2_id int; SET @pg2_id = (SELECT top 1 ExtDBpg_id FROM ExtDBpg WHERE ExtDBpg_title = 'Locations' AND ExtDBpg_lib = 'OSHA' );

INSERT INTO ExtDBpgfld ( ExtDBpgfld_ExtDBpg_id, ExtDBpgfld_ExtDBfld_id,ExtDBpgfld_ingrid )
    SELECT @pg2_id, ExtDBfld_id, N'hide' FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=@tbl2_id;
    
UPDATE ExtDBpgfld SET ExtDBpgfld_ingrid = N'' WHERE ExtDBpgfld_ExtDBfld_id IN (SELECT ExtDBfld_id FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=@tbl2_id
    AND ExtDBfld_title IN ('Location','Year') );
