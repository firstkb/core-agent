<%

Sub LoadMenu()
    Dim strModule : strModule = "EXTDB"
    Dim arrMenuBar : arrMenuBar = Array()
    Call GetUserLevel(SESSION("USER.ID"),strModule)
    
    Dim RS,str
    Dim mList : Set mList = Server.CreateObject("ADODB.Recordset")
    mList.Fields.Append "page", adVarChar, 255
    mList.Fields.Append "link", adVarChar, 255
    mList.Fields.Append "module", adVarChar, 255
    mList.Fields.Append "tbl", adVarChar, 255
    mList.Open

    If SESSION("USER.LEVELNAME") = "Admin" Then 
        mList.AddNew
        mList.Fields("page").Value = "Configuration"
        mList.Fields("link").Value = "config"
        mList.Fields("module").Value = ""
        mList.Fields("tbl").Value = ""
        mList.MoveNext
    End If
    
    If SESSION("USER.ADMIN")=True Then
        Set RS = ExecuteStat("SELECT ExtDBmdl_title,ExtDBpg_id as [id],ExtDBpg_title AS [title],ExtDBpg_ExtDBtbl_id "&_
            "FROM ExtDBpg "&_
            "	LEFT JOIN ExtDBmdl ON ExtDBmdl_id=ExtDBpg_ExtDBmdl_id "&_
            "WHERE ExtDBmdl_type in ('MAIN') AND ExtDBmdl_act=1 AND ExtDBpg_act=1 "&_
            "ORDER BY ExtDBmdl_title,[title] ")
    Else
        Set RS = ExecuteStat("SELECT ExtDBmdl_title,ExtDBpg_id as [id],ExtDBpg_title AS [title],ExtDBpg_ExtDBtbl_id "&_
            "FROM ExtDBpg "&_
            "	LEFT JOIN ExtDBmdl ON ExtDBmdl_id=ExtDBpg_ExtDBmdl_id "&_
            "WHERE ExtDBpg_id in (select id from dbo.ExtDBaccessByType("&SESSION("USER.ID")&",1,'MAIN')) "&_
            "ORDER BY ExtDBmdl_title,[title] ")
    End If
    While Not RS.Eof
        mList.AddNew
        mList.Fields("page").Value = RS("title").Value
        mList.Fields("link").Value = "ExtDBpg&param="&RS("id").Value&""
        mList.Fields("module").Value = RS("ExtDBmdl_title").Value
        mList.Fields("tbl").Value = RS("ExtDBpg_ExtDBtbl_id").Value
        mList.MoveNext
        RS.MoveNext
    Wend
    
    Set RS = ExecuteStat("SELECT COUNT(1) FROM ExtDBtbl WHERE ExtDBtbl_lib='OSHA'")
    If RS(0).Value>0 Then
        mList.AddNew
        mList.Fields("page").Value = "OSHA300 Report"
        mList.Fields("link").Value = "LIB&param=osha300"
        mList.Fields("module").Value = "OSHA"
        mList.Fields("tbl").Value = ""
        mList.MoveNext
        mList.AddNew
        mList.Fields("page").Value = "OSHA300/Cal Report"
        mList.Fields("link").Value = "LIB&param=osha300CAL"
        mList.Fields("module").Value = "OSHA"
        mList.Fields("tbl").Value = ""
        mList.MoveNext
        mList.AddNew
        mList.Fields("page").Value = "OSHA300A Report"
        mList.Fields("link").Value = "LIB&param=osha300a"
        mList.Fields("module").Value = "OSHA"
        mList.Fields("tbl").Value = ""
        mList.MoveNext
        mList.AddNew
        mList.Fields("page").Value = "OSHA300A/Cal Report"
        mList.Fields("link").Value = "LIB&param=osha300aCAL"
        mList.Fields("module").Value = "OSHA"
        mList.Fields("tbl").Value = ""
        mList.MoveNext
    End If

    mList.Sort = "module,page"
    If mList.RecordCount>0 Then mList.MoveFirst
    
    str = "Array("
    While Not mList.Eof
        If Len(str)>7 Then str = str & ","
        str = str & "Array("""&mList("page").Value&""", """&mList("link").Value&""","""&mList("module").Value&""","""&mList("tbl").Value&""")"
        mList.MoveNext
    Wend
    str = str & ")"
    arrMenuBar = Eval(str)

    Session("ModulesList").Item(UCase(strModule)).Item("MenuBar") = arrMenuBar
    SESSION("LEFT_PANEL") = ""
End Sub

Sub CheckLibs(page)
    Select Case page
        Case "osha300"
            GUI.Init "..\addon\lib_osha300.htm"
            GUI.PageTitle = "OSHA300"
            GUI.Template.SetVariable "AddNew", "none"
            GUI.Template.SetVariable "Filters", "none"
            GUI.Template.SetVariable "YEAR1", Year(Now())
            GUI.Template.SetVariable "YEAR2", Year(Now())-1
            GUI.Template.SetVariable "YEAR3", Year(Now())-2
            GUI.Template.SetVariable "YEAR4", Year(Now())-3
            GUI.Template.SetVariable "YEAR5", Year(Now())-4
            GUI.Template.SetVariable "YEAR6", Year(Now())-5
            GUI.Template.SetVariable "YEAR7", Year(Now())-6
            GUI.Template.SetVariable "YEAR8", Year(Now())-7
            GUI.Draw
            Response.End
        Case "osha300CAL"
            GUI.Init "..\addon\lib_osha300CAL.htm"
            GUI.PageTitle = "OSHA300/CAL"
            GUI.Template.SetVariable "AddNew", "none"
            GUI.Template.SetVariable "Filters", "none"
            GUI.Template.SetVariable "YEAR1", Year(Now())
            GUI.Template.SetVariable "YEAR2", Year(Now())-1
            GUI.Template.SetVariable "YEAR3", Year(Now())-2
            GUI.Template.SetVariable "YEAR4", Year(Now())-3
            GUI.Template.SetVariable "YEAR5", Year(Now())-4
            GUI.Template.SetVariable "YEAR6", Year(Now())-5
            GUI.Template.SetVariable "YEAR7", Year(Now())-6
            GUI.Template.SetVariable "YEAR8", Year(Now())-7
            GUI.Draw
            Response.End
        Case "osha300a"
            GUI.Init "..\addon\lib_osha300a.htm"
            GUI.PageTitle = "OSHA300A"
            GUI.Template.SetVariable "AddNew", "none"
            GUI.Template.SetVariable "Filters", "none"
            GUI.Template.SetVariable "YEAR1", Year(Now())
            GUI.Template.SetVariable "YEAR2", Year(Now())-1
            GUI.Template.SetVariable "YEAR3", Year(Now())-2
            GUI.Template.SetVariable "YEAR4", Year(Now())-3
            GUI.Template.SetVariable "YEAR5", Year(Now())-4
            GUI.Template.SetVariable "YEAR6", Year(Now())-5
            GUI.Template.SetVariable "YEAR7", Year(Now())-6
            GUI.Template.SetVariable "YEAR8", Year(Now())-7
            GUI.Draw
            Response.End
        Case "osha300aCAL"
            GUI.Init "..\addon\lib_osha300aCAL.htm"
            GUI.PageTitle = "OSHA300A/CAL"
            GUI.Template.SetVariable "AddNew", "none"
            GUI.Template.SetVariable "Filters", "none"
            GUI.Template.SetVariable "YEAR1", Year(Now())
            GUI.Template.SetVariable "YEAR2", Year(Now())-1
            GUI.Template.SetVariable "YEAR3", Year(Now())-2
            GUI.Template.SetVariable "YEAR4", Year(Now())-3
            GUI.Template.SetVariable "YEAR5", Year(Now())-4
            GUI.Template.SetVariable "YEAR6", Year(Now())-5
            GUI.Template.SetVariable "YEAR7", Year(Now())-6
            GUI.Template.SetVariable "YEAR8", Year(Now())-7
            GUI.Draw
            Response.End
    End Select
End Sub

Function WEBFORMS_LIST()
	Dim RS, list
	Set RS = Query("SELECT * FROM ExtDBpg LEFT JOIN ExtDBmdl ON ExtDBpg_ExtDBmdl_id = ExtDBmdl_id WHERE ExtDBpg_web=1 ORDER BY ExtDBmdl_title,ExtDBpg_title")
	Set list = SESSION("ess107_AppLibWSC").jsArray()
	While Not RS.Eof
		Set list(Null) = SESSION("ess107_AppLibWSC").jsObject()
		list(Null)("ExtDBtbl_id") = RS("ExtDBpg_ExtDBtbl_id")
		list(Null)("ExtDBmdl_title") = ""
		list(Null)("ExtDBtbl_title") = RS("ExtDBpg_title")
		RS.MoveNext
	Wend
	WEBFORMS_LIST = list.jsString()
End Function

Function GenerateWebForm(vAct,vId,valId)
	Dim config,RS,crossRS,rec : rec = 0
	Set config = SESSION("ess107_AppLibWSC").jsObject()
	Set RS = Execute("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&valId)
	config("id") = RS("ExtDBtbl_id").Value
	config("table") = "ExtDB"&RS("ExtDBtbl_id").Value
	config("title") = RS("ExtDBtbl_title").Value
	config("type") = RS("ExtDBtbl_type").Value
	config("status") = ""
	If vAct="form_save" Then config("status") = "saved"
	Set config("fields") = SESSION("ess107_AppLibWSC").jsArray()
	Set RS = Execute("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valId&" ORDER BY ExtDBfld_order")
	While Not RS.Eof
		Set config("fields")(Null) = SESSION("ess107_AppLibWSC").jsObject()
		config("fields")(Null)("index") = rec
		config("fields")(Null)("id") = "ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")
		config("fields")(Null)("title") = RS("ExtDBfld_title")
		config("fields")(Null)("type") = RS("ExtDBfld_type")
		config("fields")(Null)("param") = RS("ExtDBfld_param")
		config("fields")(Null)("filter") = RS("ExtDBfld_filter")
		config("fields")(Null)("req") = RS("ExtDBfld_req")
		config("fields")(Null)("related") = RS("ExtDBfld_related")
		config("fields")(Null)("tooltip") = RS("ExtDBfld_tooltip")
		If RS("ExtDBfld_type")=60 Then config("fields")(Null)("surv") = "ExtDB"&valId&"surv"&RS("ExtDBfld_id")
		rec = rec + 1
		Select Case RS("ExtDBfld_type")
			Case 90
				Set crossRS = Query("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&RS("ExtDBfld_param")&" AND ExtDBfld_web='Yes' ORDER BY ExtDBfld_order")
				Set config("fields")(Null)("form") = SESSION("ess107_AppLibWSC").jsObject()
				Set config("fields")(Null)("form")("fields") = SESSION("ess107_AppLibWSC").jsArray()
				While Not crossRS.Eof
					Set config("fields")(Null)("form")("fields")(Null) = SESSION("ess107_AppLibWSC").jsObject()
					config("fields")(Null)("form")("fields")(Null)("id") = "ExtDB"&RS("ExtDBfld_param")&"_Fld"&crossRS("ExtDBfld_id")
					config("fields")(Null)("form")("fields")(Null)("title") = crossRS("ExtDBfld_title")
					config("fields")(Null)("form")("fields")(Null)("type") = crossRS("ExtDBfld_type")
					config("fields")(Null)("form")("fields")(Null)("param") = crossRS("ExtDBfld_param")
					config("fields")(Null)("form")("fields")(Null)("filter") = crossRS("ExtDBfld_filter")
					config("fields")(Null)("form")("fields")(Null)("req") = crossRS("ExtDBfld_req")
					config("fields")(Null)("form")("fields")(Null)("related") = crossRS("ExtDBfld_related")
					config("fields")(Null)("form")("fields")(Null)("tooltip") = crossRS("ExtDBfld_tooltip")
					If crossRS("ExtDBfld_type")=60 Then config("fields")(Null)("form")("fields")(Null)("surv") = "ExtDB"&RS("ExtDBfld_param")&"surv"&crossRS("ExtDBfld_id")
					crossRS.MoveNext
				Wend
		End Select
		If vAct="form_save" and vId>0 Then
			Set crossRS = Query("SELECT TOP 1 * FROM ExtDB"&valId&" WHERE ExtDB"&valId&"_id="&vId)
			Select Case RS("ExtDBfld_type")
				Case 31
					If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
						Set crossRS = Query("SELECT TOP 1 projects_num+', '+projects_name FROM projects WHERE projects_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
						config("fields")(Null)("value") = crossRS(0).Value
					Else
						config("fields")(Null)("value") = "&nbsp;"
					End If
				Case 32
					If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
						Set crossRS = Query("SELECT TOP 1 users_firstname+', '+users_lastname FROM users WHERE users_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
						config("fields")(Null)("value") = crossRS(0).Value
					Else
						config("fields")(Null)("value") = "&nbsp;"
					End If
				Case 33
					If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
						Set crossRS = Query("SELECT TOP 1 company_name FROM company WHERE company_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
						config("fields")(Null)("value") = crossRS(0).Value
					Else
						config("fields")(Null)("value") = "&nbsp;"
					End If
				Case 135,200,3,6,201,2030,2031
					config("fields")(Null)("value") = crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value
			End Select
		End If
		RS.MoveNext
	Wend
	'echo 1,config.jsString
	GenerateWebForm = config.jsString
End Function

Function GeneratePgWebForm(vAct,vId,valId,pgId)
	Dim config,RS,crossRS,rec : rec = 0
	Set config = SESSION("ess107_AppLibWSC").jsObject()
	Set RS = Execute("SELECT * FROM ExtDBpg LEFT JOIN ExtDBtbl ON ExtDBtbl_id=ExtDBpg_ExtDBtbl_id WHERE ExtDBpg_id="&pgId)
	config("id") = RS("ExtDBtbl_id").Value
	config("table") = "ExtDB"&RS("ExtDBtbl_id").Value
	config("title") = RS("ExtDBtbl_title").Value
	config("type") = RS("ExtDBtbl_type").Value
	config("status") = ""
	If vAct="form_save" Then config("status") = "saved"
	Set config("fields") = SESSION("ess107_AppLibWSC").jsArray()
	Set RS = Execute("SELECT *,(select top 1 ExtDBpgfld_access from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&pgId&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as access FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valId&" ORDER BY ExtDBfld_order")
	While Not RS.Eof
		If RS("access")="" Or RS("access")="edit" Then
			Set config("fields")(Null) = SESSION("ess107_AppLibWSC").jsObject()
			config("fields")(Null)("index") = rec
			config("fields")(Null)("id") = "ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")
			config("fields")(Null)("title") = RS("ExtDBfld_title")
			config("fields")(Null)("type") = RS("ExtDBfld_type")
			config("fields")(Null)("param") = RS("ExtDBfld_param")
			config("fields")(Null)("filter") = RS("ExtDBfld_filter")
			config("fields")(Null)("req") = RS("ExtDBfld_req")
			config("fields")(Null)("related") = RS("ExtDBfld_related")
			config("fields")(Null)("tooltip") = RS("ExtDBfld_tooltip")
			If RS("ExtDBfld_type")=60 Then config("fields")(Null)("surv") = "ExtDB"&valId&"surv"&RS("ExtDBfld_id")
			rec = rec + 1
			Select Case RS("ExtDBfld_type")
				Case 90
					Set crossRS = Query("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&RS("ExtDBfld_param")&" AND ExtDBfld_web='Yes' ORDER BY ExtDBfld_order")
					Set config("fields")(Null)("form") = SESSION("ess107_AppLibWSC").jsObject()
					Set config("fields")(Null)("form")("fields") = SESSION("ess107_AppLibWSC").jsArray()
					While Not crossRS.Eof
						Set config("fields")(Null)("form")("fields")(Null) = SESSION("ess107_AppLibWSC").jsObject()
						config("fields")(Null)("form")("fields")(Null)("id") = "ExtDB"&RS("ExtDBfld_param")&"_Fld"&crossRS("ExtDBfld_id")
						config("fields")(Null)("form")("fields")(Null)("title") = crossRS("ExtDBfld_title")
						config("fields")(Null)("form")("fields")(Null)("type") = crossRS("ExtDBfld_type")
						config("fields")(Null)("form")("fields")(Null)("param") = crossRS("ExtDBfld_param")
						config("fields")(Null)("form")("fields")(Null)("filter") = crossRS("ExtDBfld_filter")
						config("fields")(Null)("form")("fields")(Null)("req") = crossRS("ExtDBfld_req")
						config("fields")(Null)("form")("fields")(Null)("related") = crossRS("ExtDBfld_related")
						config("fields")(Null)("form")("fields")(Null)("tooltip") = crossRS("ExtDBfld_tooltip")
						If crossRS("ExtDBfld_type")=60 Then config("fields")(Null)("form")("fields")(Null)("surv") = "ExtDB"&RS("ExtDBfld_param")&"surv"&crossRS("ExtDBfld_id")
						crossRS.MoveNext
					Wend
			End Select
			If vAct="form_save" and vId>0 Then
				Set crossRS = Query("SELECT TOP 1 * FROM ExtDB"&valId&" WHERE ExtDB"&valId&"_id="&vId)
				Select Case RS("ExtDBfld_type")
					Case 31
						If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
							Set crossRS = Query("SELECT TOP 1 projects_num+', '+projects_name FROM projects WHERE projects_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
							config("fields")(Null)("value") = crossRS(0).Value
						Else
							config("fields")(Null)("value") = "&nbsp;"
						End If
					Case 32
						If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
							Set crossRS = Query("SELECT TOP 1 users_firstname+', '+users_lastname FROM users WHERE users_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
							config("fields")(Null)("value") = crossRS(0).Value
						Else
							config("fields")(Null)("value") = "&nbsp;"
						End If
					Case 33
						If crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value>0 Then
							Set crossRS = Query("SELECT TOP 1 company_name FROM company WHERE company_id="&crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value)
							config("fields")(Null)("value") = crossRS(0).Value
						Else
							config("fields")(Null)("value") = "&nbsp;"
						End If
					Case 135,200,3,6,201,2030,2031
						config("fields")(Null)("value") = crossRS("ExtDB"&valId&"_Fld"&RS("ExtDBfld_id")).Value
				End Select
			End If
		End If
		RS.MoveNext
	Wend
	'echo 1,config.jsString
	GeneratePgWebForm = config.jsString
End Function

%>