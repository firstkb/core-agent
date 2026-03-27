<!-- #include virtual='/include/global.asp' -->
<!-- #include file='lib.asp' -->
<% 
If Not Session("LOGIN") Then Response.Redirect "/Default.asp?ACTION=logout"

Session("MODULE") = "EXTDB"
Session("extMODULE") = ""
'--------------------------
Call GetUserlevel(SESSION("USER.ID"),Session("MODULE"))
'--------------------------
Dim varAction : varAction = Request("action") : If varAction = "" Then varAction = "page" End If
Dim varTable  : varTable  = Request("table")
Dim varParam  : varParam  = Request("param")
Dim varSearch : varSearch = Request("search")
Dim varPage   : varPage   = Request("page") 
If varPage = "" And varAction="page" Then 
    Dim mItem
    For Each mItem In Session("ModulesList").Item(UCase(Session("MODULE"))).Item("MenuBar")
        If varPage="" Then 
            varPage = mItem(1)
            If InStr(varPage,"&param=")>0 Then
                varParam = Split(varPage,"&param=")(1)
                varPage = Split(varPage,"&param=")(0)
            End If
        End If
    Next
    If varPage="" Then 
        varPage = "noaccess"
    End If
End If
Dim varSql    : varSql    = ""
Dim m_param,m_list
Dim id
Dim oFO, oProps, oRequest
Dim tmpRS,tmpRS2,ExtFile
Dim ExtDBtbl_files
Dim ExtDBtbl_id
Dim fld_view
Dim fld_edit
Dim cross_addon
Dim survey_addon
Dim where : where = ""
'--------------------------
SESSION("FILESDIR") = SITE_PATH&"Files\"&SESSION("SYSTEM.ID")&"\"
SESSION("FILESURL") = SITE_URL&"/Files/"&SESSION("SYSTEM.ID")&"/"
CheckFolder(SESSION("FILESDIR"))
'--------------------------
If varPage="LIB" Then CheckLibs(Request("param"))
'--------------------------
Select Case varAction
    Case "select"
        If varPage="show" Then
            GUI.PageTitle = "Select from List"
            Dim flds_list : flds_list = Split(Request("fields"),"|")
            Dim fldsRS : Set fldsRS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&Replace(LCase(varTable),"extdb",""))
            If InStr(Request("fields"),varTable&"_id")>0 Then
                GUI.Fields.Item(varTable&"_id") = Array("Doc.#","left")
            End If
            While Not fldsRS.Eof
                If InStr("|"&Request("fields"),varTable&"_Fld"&fldsRS("ExtDBfld_id").Value)>0 Then
                    Select Case fldsRS("ExtDBfld_type")
                        Case 31
                            GUI.Fields.Item("projects"&fldsRS("ExtDBfld_id").Value&"_name") = Array(fldsRS("ExtDBfld_title").Value,"left")
                        Case 32
                            GUI.Fields.Item("users"&fldsRS("ExtDBfld_id").Value&"_name") = Array(fldsRS("ExtDBfld_title").Value,"left")
                        Case 33
                            GUI.Fields.Item("company"&fldsRS("ExtDBfld_id").Value&"_name") = Array(fldsRS("ExtDBfld_title").Value,"left")
                        Case Else
                            GUI.Fields.Item(varTable&"_Fld"&fldsRS("ExtDBfld_id").Value) = Array(fldsRS("ExtDBfld_title").Value,"left")
                    End Select
                End If
                fldsRS.MoveNext
            Wend
            GUI.Template.SetVariable "FILTER",  Request("filter")
            GUI.Template.SetVariable "EXTFILTER",  Request("extfilter")
            GUI.GenerateTable "list.htm", varTable
            GUI.Draw
        Else
            Select Case varTable
                Case "ExtDBpgU"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBpgU_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBpgU_id,users_id,users_firstname,users_lastname,users_title,users_email,users_access,company_name "&_
                        "FROM users "&_
                        "LEFT JOIN company ON users_company_id=company_id  "&_
                        "LEFT JOIN ExtDBpgU ON (ExtDBpgU_users_id=users_id and ExtDBpgU_ExtDBpg_id="&Request("id")&") "&_
                        "WHERE users_act=1 and company_act=1 ORDER BY users_firstname,users_lastname")
                    Response.End
                Case "ExtDBmdlU"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBmdlU_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBmdlU_id,users_id,users_firstname,users_lastname,users_title,users_email,users_access,company_name "&_
                        "FROM users "&_
                        "LEFT JOIN company ON users_company_id=company_id  "&_
                        "LEFT JOIN ExtDBmdlU ON (ExtDBmdlU_users_id=users_id and ExtDBmdlU_ExtDBmdl_id="&Request("id")&") "&_
                        "WHERE users_act=1 and company_act=1 ORDER BY users_firstname,users_lastname")
                    Response.End
                Case "ExtDBpgC"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBpgC_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBpgC_id,company_id,company_name,company_type "&_
                        "FROM company "&_
                        "LEFT JOIN ExtDBpgC ON (ExtDBpgC_company_id=company_id and ExtDBpgC_ExtDBpg_id="&Request("id")&") "&_
                        "WHERE company_act=1 ORDER BY company_name")
                    Response.End
                Case "ExtDBmdlC"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBmdlC_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBmdlC_id,company_id,company_name,company_type "&_
                        "FROM company "&_
                        "LEFT JOIN ExtDBmdlC ON (ExtDBmdlC_company_id=company_id and ExtDBmdlC_ExtDBmdl_id="&Request("id")&") "&_
                        "WHERE company_act=1 ORDER BY company_name")
                    Response.End
                Case "ExtDBpgT"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBpgT_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBpgT_id,jobtype_id,jobtype_name "&_
                        "FROM jobtype "&_
                        "LEFT JOIN ExtDBpgT ON (ExtDBpgT_jobtype_id=jobtype_id and ExtDBpgT_ExtDBpg_id="&Request("id")&") "&_
                        "WHERE jobtype_name>'' ORDER BY jobtype_name")
                    Response.End
                Case "ExtDBmdlT"
                    Response.Write getSQLList("SELECT (case when isnull(ExtDBmdlT_id,0)=0 then 'No' else 'Yes' end) as OnOff, "&_
                        "ExtDBmdlT_id,jobtype_id,jobtype_name "&_
                        "FROM jobtype "&_
                        "LEFT JOIN ExtDBmdlT ON (ExtDBmdlT_jobtype_id=jobtype_id and ExtDBmdlT_ExtDBmdl_id="&Request("id")&") "&_
                        "WHERE jobtype_name>'' ORDER BY jobtype_name")
                    Response.End
            Case Else
                If where > "" Then where = " WHERE " & where
                Response.Write getSQLList("SELECT * FROM "&varTable&" "&where&" ")
            End Select
        End If
        Response.End
    Case "list"
        If varParam="new" Then varParam=0
        If varParam >"" Then
            where = varTable & "_id=" & varParam
        End If
      If Request("search")>"" Then
        Dim fld, where2
        For each fld in Split(Request("fields"),"|")
          If where2>"" Then where2 = where2 & " OR " End If
          where2 = where2 & fld & " LIKE '%"&varSearch&"%'"
        Next
        If where>"" Then where = where & " OR " End If
        where = where & "(" & where2 & ")"
      End If
        If Request("list")="SELECT" AND Request("fields")="ExtDBmdl_title" Then
            If where >"" Then
                where = " WHERE " & where
            End If
            Response.Write getSQLList("SELECT DISTINCT ExtDBmdl_id,ExtDBmdl_title FROM ExtDBmdl "&where&" ORDER BY "&Request("fields")&" ")
            Response.End
        End If
        If Request("list")="SELECT" Then
            If where >"" Then
                where = " WHERE " & where
            End If
            If InStr(Request("fields"),"|")>0 Then
                If InStr(Request("fields"),""&varTable&"_id") Then
                    Response.Write getSQLList("SELECT * FROM "&varTable&"view "&where&" ORDER BY "&Replace(Request("fields"),"|",",")&" ")
                Else
                    Response.Write getSQLList("SELECT * FROM "&varTable&"view "&where&" ORDER BY "&Replace(Request("fields"),"|",",")&" ")
                End If
            Else
                Response.Write getSQLList("SELECT DISTINCT "&Request("fields")&" AS ["&varTable&"_id],"&Request("fields")&" FROM "&varTable&" "&where&" ORDER BY "&Request("fields")&" ")
            End If
            Response.End
        End If
      Select Case varTable
        Case "ExtDBfld"
            Response.Write getSQLList("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&varParam&" ORDER BY ExtDBfld_order")
        Case "ExtDBpg"
            Response.Write getSQLList("SELECT * FROM ExtDBpg LEFT JOIN ExtDBtbl ON ExtDBtbl_id=ExtDBpg_ExtDBtbl_id LEFT JOIN ExtDBmdl ON ExtDBmdl_id=ExtDBpg_ExtDBmdl_id WHERE ExtDBpg_id="&varParam&"")
        Case "ExtDBsrv"
            Response.Write getSQLList("SELECT * FROM ExtDBsrv "&_
                "LEFT JOIN "&Request("tbl")&"surv"&Request("srv")&" ON (ExtDBsrv_id="&Request("tbl")&"surv"&Request("srv")&"_item "&_
                "AND "&Request("tbl")&"surv"&Request("srv")&"_"&Request("tbl")&"_id="&varParam&") "&_
                "WHERE ExtDBsrv_ExtDBfld_id="&Request("srv"))
        Case "ExtDBmdl"
            If where > "" Then where = " WHERE " & where
            Response.Write getSQLList("SELECT * FROM "&varTable&" "&where&" ")
            Response.End
        Case Else
            If varParam>"" Then
                If Request("part")="editor" Then
                    ''"END"\r\n'
                    Sub listEditorFields()
                        Dim rs : Set rs = ExecuteStat("SELECT * FROM ["&varTable&"] WHERE " & where)
                        If Not rs.Eof Then
                            Dim fld
                            Dim fields : Set fields = SESSION("ess107_AppLib").classString()
                            Dim values : Set values = SESSION("ess107_AppLib").classString()
                            For Each fld in rs.fields
                                Select Case fld.Type
                                    Case 203
                                        fields.Append(fld.Name&":String")
                                        values.Append(""""&SESSION("ess107_AppLib").Base64Encode(""&fld.Value)&"""")
                                End Select
                            Next
                            fields.Append("pSIZE,pRECORDS,pPAGE,pPAGES,END")
                            values.Append("""1"",""1"",""1"",""1"",""END""")
                        End If
                        response.write fields.JoinToString(",")
                        response.write vbCrLf
                        response.write values.JoinToString(",")
                    End Sub
                    Call listEditorFields()
                    response.End
                ElseIf InStr(varTable,"cross") Then
                    varTable = Split(Replace(Request("table"),"cross",""),"-")(0)
                    If Not ViewExists(""&varTable&"view") Then Call GenerateView(varTable)
                    where = Split(Replace(Request("table"),"cross",""),"-")(1)&"="&varParam
                    Response.Write getSQLListWithFiles("SELECT * FROM [dbo].["&varTable&"view] WHERE " & where,FilesList(varTable,varParam))
                Else
                    If Not ViewExists(""&varTable&"view") Then Call GenerateView(varTable)
                    If Request("type")="form" Then
                        SESSION("EXTDB_SQLLIST") = ""
                    Else
                        SESSION("EXTDB_SQLLIST") = "SKIP:203"
                    End If
                    Response.Write getSQLListWithFiles("SELECT * FROM [dbo].["&varTable&"view] WHERE " & where,FilesList(varTable,varParam))
                    SESSION("EXTDB_SQLLIST") = ""
                End If
            Else
                Dim pg_order
                Set tmpRS = ExecuteStat("SELECT ExtDBtbl_id,ExtDBtbl_type FROM [ExtDBtbl] WHERE 'ExtDB'+CAST(ExtDBtbl_id AS VARCHAR)='"&varTable&"'")
                ExtDBtbl_id = tmpRS("ExtDBtbl_id").Value
                ExtDBtbl_files = ",'<a href=""javascript:void(0);"" onclick=viewFiles("&tmpRS("ExtDBtbl_id").Value&",'+CAST("&varTable&"_id AS VARCHAR)+')>Files</a>' AS [Files]"
                If SESSION("ExtDBpg")>0 And SESSION("ExtDBpg-tbl")=varTable Then
                    Set tmpRS2 = ExecuteStat("SELECT * FROM ExtDBpg WHERE ExtDBpg_id = "&SESSION("ExtDBpg"))
                    If Not tmpRS2.Eof Then
                        If tmpRS2("ExtDBpg_filter").Value>"" Then
                            Dim pg_filter : pg_filter = tmpRS2("ExtDBpg_filter").Value
                            Dim pg_filters : pg_filters = Split(pg_filter,"||||")
                            Dim pg_filter_val
                            For pg_filter = 0 To UBound(pg_filters)
                                If InStr(pg_filters(pg_filter),"@@")>0 Then
                                    pg_filter_val = Split(pg_filters(pg_filter),"@@")
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"=`","='")
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"`)","')")
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"='userscompany'","="&SESSION("USER.COMPANYID"))
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"='userscompany_name'"," like '"&SESSION("USER.COMPANYNAME")&"'")
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"='usersdivision'","="&SESSION("USER.DIVISIONID"))
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"='usersdivision_name'"," like '"&SESSION("USER.DIVISIONNAME")&"'")
                                    pg_filter_val(2) = Replace(pg_filter_val(2),"='projectsaccess'"," In (SELECT projectsaccess_projects_id FROM projectsaccess WHERE(projectsaccess_users_id="&SESSION("USER.ID")&")")
                                    If where>"" Then 
                                        where = where & " AND "
                                    Else
                                        where = where & " WHERE "
                                    End If
                                    where = where & pg_filter_val(2)
                                End If
                            Next
                        End If
                        If FieldExists(tmpRS2.Fields,"ExtDBpg_order1") Then
                            If tmpRS2("ExtDBpg_order1")>"" Then
                                pg_order = tmpRS2("ExtDBpg_order1").Value&" "&tmpRS2("ExtDBpg_order2").Value
                            End If
                        End If
                    End If
                End If
                If Trim(Request("usesort"))>"" Then
                    If SESSION("ExtDBpg")>0 And SESSION("ExtDBpg-tbl")=varTable Then
                        If Not ViewExists(""&varTable&"grid") Then Call GenerateGridView(varTable,SESSION("ExtDBpg"))
                        Response.Write getSQLList("SELECT *,[CryptID]="&varTable&"_id "&ExtDBtbl_files&" FROM [dbo].["&varTable&"grid] " & where)
                    Else
                        If Not ViewExists(""&varTable&"view") Then Call GenerateView(varTable)
                        Response.Write getSQLList("SELECT *,[CryptID]="&varTable&"_id "&ExtDBtbl_files&" FROM [dbo].["&varTable&"view] " & where)
                    End If
                Else
                    If pg_order>"" Then
                        where = where & " ORDER BY " & pg_order
                    Else
                        If SESSION("ExtDBpg")>0 And SESSION("ExtDBpg-tbl")=varTable Then
                            Set tmpRS = ExecuteStat("SELECT top 1 ExtDBfld_id FROM [ExtDBfld] "&_
                            "LEFT JOIN ExtDBpgfld ON ExtDBpgfld_ExtDBfld_id=ExtDBfld_id and ExtDBpgfld_ExtDBpg_id="&SESSION("ExtDBpg")&" "&_
                            "WHERE ExtDBfld_ExtDBtbl_id="&ExtDBtbl_id&" AND ExtDBfld_type NOT IN (90,80,70,71,72,201,2011,2012) AND ISNULL(ExtDBpgfld_ingrid,'')='' ORDER BY ExtDBfld_order")
                        Else
                            Set tmpRS = ExecuteStat("SELECT top 1 ExtDBfld_id FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&ExtDBtbl_id&" AND ExtDBfld_type NOT IN (90,80,70,71,72) ORDER BY ExtDBfld_order")
                        End If
                        If Not tmpRS.Eof Then
                            where = where & " ORDER BY " & varTable & "_Fld" & tmpRS(0).Value
                        Else
                            where = where & " ORDER BY " & varTable & "_id DESC"
                        End If
                    End If
                    If SESSION("ExtDBpg")>0 And SESSION("ExtDBpg-tbl")=varTable Then
                        If Not ViewExists(""&varTable&"grid") Then Call GenerateGridView(varTable,SESSION("ExtDBpg"))
                        Response.Write getSQLList("SELECT *,[CryptID]="&varTable&"_id "&ExtDBtbl_files&" FROM [dbo].["&varTable&"grid] " & where & "")
                    Else
                        If Not ViewExists(""&varTable&"view") Then Call GenerateView(varTable)
                        Response.Write getSQLList("SELECT *,[CryptID]="&varTable&"_id "&ExtDBtbl_files&" FROM [dbo].["&varTable&"view] " & where & "")
                    End If
                End If
            End If
      End Select
    Case "new"
      Response.Write getFree(varTable)
      Response.End
    Case "fromcsv"
        Select Case varPage
            Case "step1"
                SESSION("DEBUG")=1
                GUI.Init "FromCSV_step1.htm"
                GUI.Draw
                Response.End
            Case "step2"
                SESSION("DEBUG")=1
                GUI.Init "FromCSV_step2.htm"
                Call fromcsv_step2(Request("ExtFile"))
                GUI.Draw
                Response.End
            Case "import"
                Set oFO = New FileUpload
                Set oRequest = New clsConverter
                oRequest.Init(oFO)
                If oFO.FileCount > 0 Then
                    ExtFile = SaveExtFile(oFO,"Tmp")
                    Response.Write "<style>body,td {margin-left:3px;font-size:10px;font-family:Tahoma;background-color:infobackground;}</style><TABLE WIDTH='100%' HEIGHT='100%' CELLPADDING='0' CELLSPACING='0' BORDER='0'><TR><TD><span style='color:red'>Status: File saved.</span></TD></TR></TABLE>"
                    Response.Write "<SCRIPT>parent.bootbox.alert('File saved.');parent.goStep_2(""/"&Replace(Replace(ExtFile,SITE_PATH,""),"\","/")&""");</SCRIPT>"
                Else
                    Response.Write "<SCRIPT>parent.bootbox.alert('Import aborted!');parent.prepareForm();</SCRIPT>"
                End If
                Response.End
        End Select 
        Response.Redirect "/MODULES/DFC/default.asp?action=BrowseShort&param=PersonalFolder&dir="&srvFilestPath(Request("tbl"),varParam)
    Case "page"
      Select Case varPage
        Case "select"
            GUI.Init "select.htm"
            GUI.PageTitle = "Select from List"
            GUI.Template.SetVariable "USER_ID", varParam
            GUI.Template.SetVariable "COMPANY_ID", varParam
        Case "config"
            GUI.Init "config.htm"
            GUI.PageTitle = "Configuration"
            GUI.Template.SetVariable "AddNew", "none"
            GUI.Template.SetVariable "Filters", "none"
            GUI.Template.SetVariable "Alerts", "none"
            GUI.Template.SetVariable "Print", "none"
            GUI.Template.SetVariable "PagesBtns", "none"
            GUI.Template.SetVariable "ExtDBtblList", ExtDBtblList()
            GUI.Template.SetVariable "ExtDBmdlList", ExtDBmdlList()
            GUI.Template.SetVariable "ExtDBmdlOption", ExtDBmdlOption()
            GUI.Template.SetVariable "ExtDBmdlOptionPWA", ExtDBmdlOptionPWA()
            GUI.Template.SetVariable "ExtDBpgList", ExtDBpgList()
            GUI.Template.SetVariable "ExtDBpgListPWA", ExtDBpgListPWA()
            GUI.Template.SetVariable "TABLES_LIST", TABLES_LIST()
            GUI.Template.SetVariable "MODULES_LIST", MODULES_LIST()
        Case "filter"
            GUI.Init "filter.htm"
            Call FiltersList()
            GUI.Draw
            Response.End
        Case "lookup"
            GUI.Init "lookup.htm"
            Call LookupList()
            GUI.Draw
            Response.End
        Case "PgFilter"
            SESSION("DEBUG")=1
            GUI.Template.SetVariable "FIELD_TITLE", Request("field_title")
            GUI.Template.SetVariable "FIELD_NAME", Request("field_name")
            Select Case Request("field_type")
                Case 3,6,131,205
                    GUI.Init "pg_filterN.htm"
                Case 200,201,202,204,2011,2030,2031
                    GUI.Init "pg_filterS.htm"
                Case 135,136
                    GUI.Init "pg_filterD.htm"
                Case 30,31,32,33
                    GUI.Init "pg_filter.htm"
                    Call PgFiltersList()
            End Select
            GUI.Draw
        Case "Files"
            Response.Redirect "/MODULES/DFC/default.asp?action=BrowseShort&param=PersonalFolder&dir="&geFilestPath(varTable,varParam)&"&dir2="&geFilestPath2(varTable,varParam)
        Case "SurvFiles"
            Response.Redirect "/MODULES/DFC/default.asp?action=BrowseShort&param=PersonalFolder&dir="&srvFilestPath(Request("tbl"),varParam)
        Case "TplFileManager"
            SESSION("FM_root") = SITE_PATH&"Files\"&SESSION("SYSTEM.ID")&"\ExtDB\Tpl\"
            SESSION("FM_url")  = SITE_URL
            Call CheckFolder(SESSION("FM_root"))
            Response.Write "<IFRAME SRC='/MODULES/DFC/filemanager.asp' NAME='' WIDTH='100%' HEIGHT='100%' HSPACE='0' VSPACE='0' FRAMESPACING='0' FRAMEBORDER='no' MARGINHEIGHT='0' MARGINWIDTH='0' BORDER='0' SCROLLING='auto'></IFRAME>"
        Case "WebTplFileManager"
            SESSION("FM_root") = SITE_PATH&"Files\"&SESSION("SYSTEM.ID")&"\ExtDB\WebTpl\"
            SESSION("FM_url")  = SITE_URL
            Call CheckFolder(SESSION("FM_root"))
            Response.Write "<IFRAME SRC='/MODULES/DFC/filemanager.asp' NAME='' WIDTH='100%' HEIGHT='100%' HSPACE='0' VSPACE='0' FRAMESPACING='0' FRAMEBORDER='no' MARGINHEIGHT='0' MARGINWIDTH='0' BORDER='0' SCROLLING='auto'></IFRAME>"
        Case "GetReport"
            response.redirect SESSION("ess107_AppLib").Base64Decode(Request("report"))
            Response.End
        Case "ViewPDF"
            SESSION("DEBUG")=1
            GUI.Init "ViewPDF.htm"
            GUI.Template.SetVariable "action_link", Request("report")
            GUI.Draw
            Response.End
        Case "seclist"
            GUI.Init Request("list")&".htm"
            GUI.Template.SetVariable "LIST", Request("list")
            GUI.Template.SetVariable "ID", Request("id")
            GUI.Draw
            Response.End
        Case "crosslist"
            Call CreateCrossList(Request("from"),Request("field"))
        Case "ExtDBpg"
            Set tmpRS = ExecuteStat("SELECT * " &_
                ",(select COUNT(1) from extdbview where extdbview_extdbpg_id=ExtDBpg_id) as [Views] " &_
                ",(select STRING_AGG(CONCAT(ExtDBview_title,'~',ExtDBview_tpl),'^') from extdbview where extdbview_extdbpg_id=ExtDBpg_id) as [ViewsList]" &_
                "FROM [ExtDBpg] LEFT JOIN ExtDBmdl ON ExtDBmdl_id=ExtDBpg_ExtDBmdl_id WHERE ExtDBpg_id="&varParam&"")
            GUI.PageTitle = tmpRS("ExtDBmdl_title")&" :: "&tmpRS("ExtDBpg_title")
            GUI.Template.SetVariable "extPAGE", tmpRS("ExtDBmdl_title")
            Dim actTools : actTools = "|View"
            If tmpRS("ExtDBpg_aEdit")=True Then actTools=actTools&"|Edit"
            If tmpRS("ExtDBpg_aDelete")=True Then actTools=actTools&"|Delete"
            If tmpRS("ExtDBpg_aNew")<>True Then GUI.Template.SetVariable "AddNew", "none"
            SESSION("ExtDBpg_files")=tmpRS("ExtDBpg_files")
            GUI.Tools = actTools
            varPage="ExtDB"&tmpRS("ExtDBpg_ExtDBtbl_id")
            varTable=varPage
            SESSION("ExtDBpg-tbl") = varPage
            SESSION("ExtDBpg") = varParam
            If Not tmpRS.Eof Then 
                GUI.Template.SetVariable "ExtDBtbl_id",tmpRS("ExtDBpg_ExtDBtbl_id")
                GUI.Template.SetVariable "ExtDBpg_id",varParam
                GUI.Template.SetVariable "ExtDBpg_prefilter", tmpRS("ExtDBpg_prefilter")&""
                GUI.Fields.Item(varPage&"_id") = Array("Doc.#","center")
                If tmpRS("Views").Value>0 Then
                    GUI.Template.SetVariable "iReportView", ""
                    GUI.Template.SetVariable "iViewDef", "none"
                    GUI.Template.SetVariable "actList", tmpRS("ViewsList").Value
                Else
                    GUI.Template.SetVariable "iReportView", "none"
                    GUI.Template.SetVariable "iViewDef", ""
                    GUI.Template.SetVariable "actList", ""
                End If
                Set tmpRS2 = ExecuteStat("SELECT *,(select top 1 ExtDBpgfld_ingrid from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&SESSION("ExtDBpg")&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as ingrid FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBpg_ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                While Not tmpRS2.Eof
                    If tmpRS2("ingrid").Value<>"hide" Then
                        Select Case toInt(tmpRS2("ExtDBfld_type").Value)
                            Case 3,6,131,205
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                            Case 200,202,204
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            Case 201
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            Case 2030,2031
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center","","COMBOBOX^"&tmpRS2("ExtDBfld_param").Value)
                            Case 2032
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"related") = Array(tmpRS2("ExtDBfld_related").Value,"center")
                            Case 135,136
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center","","DATE")
                            Case 30
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            Case 31
                                GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                                'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_projectscompany") = Array(tmpRS2("ExtDBfld_title").Value&" Comp.","left")
                            Case 32
                                GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                                'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_userscompany") = Array(tmpRS2("ExtDBfld_title").Value&" - Comp.","left")
                            Case 33
                                GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                                'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_maincompany") = Array(tmpRS2("ExtDBfld_title").Value&" - Div.","left")
                            Case 60
                                ' SKIP for SURVEY
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_surv") = Array(tmpRS2("ExtDBfld_title").Value,"center")
                            Case 70
                                ' SKIP for TITLE
                            Case 71
                                ' SKIP for SQLFIELD
                            Case 72
                                ' SKIP for HTML
                            Case 80
                                ' SKIP for TABS
                            Case 90
                                'CROSSGRID-COLUMN
                                '... Must Be Count(1)
                                GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_count") = Array(tmpRS2("ExtDBfld_title").Value,"center")
                        End Select
                    End If
                    tmpRS2.MoveNext
                Wend
                Set tmpRS = ExecuteStat("SELECT * FROM [ExtDBtbl] WHERE ExtDBtbl_id="&tmpRS("ExtDBpg_ExtDBtbl_id")&"")
                Dim ezPageType : ezPageType = tmpRS("ExtDBtbl_type").Value
                Dim ezPageId : ezPageId = tmpRS("ExtDBtbl_id").Value
                If ezPageType=2 Then
                    Set tmpRS = ExecuteStat("SELECT ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_type=90 AND CAST(ExtDBfld_param AS VARCHAR)='"&ezPageId&"'")
                    ezPageId = tmpRS(0)
                    Set tmpRS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&ezPageId&" ORDER BY ExtDBfld_order")
                    While Not tmpRS.Eof
                        If InStr(fld,"["&Replace(tmpRS("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(tmpRS("ExtDBfld_title"))<50 Then
                            Select Case tmpRS("ExtDBfld_type").Value
                                Case 3,6,30,131,135,136,200,202,204,205,2030,2031,2032
                                    GUI.Fields.Item("ExtDB"&ezPageId&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"left")
                                Case 31,32,33
                                    GUI.Fields.Item(""&tmpRS("ExtDBfld_param").Value&""&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"left")
                            End Select
                        End If
                        tmpRS.MoveNext
                    Wend
                End If
            End If
            'If SESSION("ExtDBpg_files")=True Then GUI.Fields.Item("Files") = Array("Files","center")
            GUI.Template.SetVariable "cROWS", GUI.Fields.Count+1
            GUI.GenerateTable "grid.htm", varPage
        Case Else
            If SESSION("USER.ADMIN")<>True And varPage<>"ExtDBpg" Then
                GUI.Init "table_error.htm"
                GUI.Template.SetVariable "AddNew", "none"
                GUI.Template.SetVariable "Filters", "none"
                GUI.Template.SetVariable "Alerts", "none"
                GUI.Template.SetVariable "Print", "none"
                GUI.Template.SetVariable "PagesBtns", "none"
                GUI.Draw
                Response.End
            End If
            Set tmpRS = ExecuteStat("SELECT * FROM [ExtDBtbl] WHERE 'ExtDB'+CAST(ExtDBtbl_id AS VARCHAR)='"&varPage&"'")
            SESSION("ExtDBpg") = 0
            SESSION("ExtDBpg-tbl") = ""
            If Not tmpRS.Eof Then 
                GUI.Template.SetVariable "ExtDBtbl_id",tmpRS("ExtDBtbl_id")
                GUI.Fields.Item(varPage&"_id") = Array("Doc.#","left")
                GUI.PageTitle = tmpRS("ExtDBtbl_title")
                GUI.Template.SetVariable "iReportView", ""
                Set tmpRS2 = ExecuteStat("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                While Not tmpRS2.Eof
                    Select Case toInt(tmpRS2("ExtDBfld_type").Value)
                        Case 3,6,131,205
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                        Case 200,202,204
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"left")
                        Case 201
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"left","max-width:500px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;","MEMO")
                        Case 2030,2031
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                        Case 2032
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"related") = Array(tmpRS2("ExtDBfld_related").Value,"center")
                        Case 135,136
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center","","DATE")
                        Case 30
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                        Case 31
                            GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_projectscompany") = Array(tmpRS2("ExtDBfld_title").Value&" Comp.","left")
                        Case 32
                            GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_userscompany") = Array(tmpRS2("ExtDBfld_title").Value&" - Comp.","left")
                        Case 33
                            GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
                            'GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_maincompany") = Array(tmpRS2("ExtDBfld_title").Value&" - Div.","left")
                        Case 60
                            ' SKIP for SURVEY
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_surv") = Array(tmpRS2("ExtDBfld_title").Value,"center")
                        Case 70
                            ' SKIP for TITLE
                        Case 71
                            ' SKIP for SQLFIELD
                        Case 72
                            ' SKIP for HTML
                        Case 80
                            ' SKIP for TABS
                        Case 90
                            'CROSSGRID-COLUMN
                            '... Must Be Count(1)
                            GUI.Fields.Item(varPage&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_count") = Array(tmpRS2("ExtDBfld_title").Value,"center")
                    End Select
                    tmpRS2.MoveNext
                Wend
            End If
            'GUI.Fields.Item("Files") = Array("Files","center")
            If SESSION("USER.ADMIN")=True Then
                GUI.Tools = "|View|Edit|Delete|"
            Else
                GUI.Tools = "|View|"
            End If
            GUI.Template.SetVariable "cROWS", GUI.Fields.Count+1
            GUI.GenerateTable "table.htm", varPage
        End Select
        GUI.Draw
    Case "view"
        Select Case varTable
            Case Else
                Set tmpRS = ExecuteStat("SELECT * FROM [ExtDBtbl] WHERE 'ExtDB'+CAST(ExtDBtbl_id AS VARCHAR)='"&varTable&"'")
                If Not tmpRS.Eof Then 
                    GUI.PageTitle = "VIEW: " & tmpRS("ExtDBtbl_title")
                    If SESSION("ExtDBpg")=0 Then
                        Set tmpRS = ExecuteStat("SELECT *,'' as access FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                    Else
                        Set tmpRS = ExecuteStat("SELECT *,(select top 1 ExtDBpgfld_access from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&SESSION("ExtDBpg")&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as access FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                    End If
                    While Not tmpRS.Eof
                        fld_view = tmpRS("access").Value&""
                        If fld_view="" or fld_view="view" or fld_view="edit" Then
                            Select Case tmpRS("ExtDBfld_type").Value
                                Case 30
                                    'LOOKUP  Field
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                                Case 31
                                    GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                                    'GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_projectscompny") = Array(tmpRS("ExtDBfld_title").Value&" - Comp.","html")
                                Case 32
                                    GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                                    'GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_userscompany") = Array(tmpRS("ExtDBfld_title").Value&" - Comp.","html")
                                Case 33
                                    GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                                    'GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_maincompany") = Array(tmpRS("ExtDBfld_title").Value&" - Div.","html")
                                Case 60
                                    GUI.Fields.Item(SurveyGridFields(varTable,tmpRS("ExtDBfld_id")))  = Array(tmpRS("ExtDBfld_title").Value,"cross","ExtDBsrv&srv="&tmpRS("ExtDBfld_id")&"&tbl=ExtDB"&tmpRS("ExtDBfld_ExtDBtbl_id"),"View",varTable&"surv"&tmpRS("ExtDBfld_id").Value)
                                Case 70
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array("</B></td><td></td></tr><!--","-","--><tr><td colspan=2 class=t_hd><center><b>"&tmpRS("ExtDBfld_title").Value&"</b></center><b")
                                Case 71
                                    ' SKIP for SQLFIELD
                                Case 72
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array("</B></td><td></td></tr><!--","-","--><tr><td colspan=2><div class=htmlField>"&tmpRS("ExtDBfld_param").Value&"</div><b")
                                Case 80
                                    ' SKIP for TABS
                                Case 90
                                    'CROSSGRID-VIEW
                                    'Create Full Table
                                    GUI.Fields.Item(CrossGridFields(tmpRS("ExtDBfld_param").Value))  = Array(tmpRS("ExtDBfld_title").Value,"cross","crossExtDB"&tmpRS("ExtDBfld_param").Value&"'+'-'+'ExtDB"&tmpRS("ExtDBfld_param").Value&"_"&varTable&"_id","View","ExtDB"&tmpRS("ExtDBfld_param").Value)
                                Case 2032
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"html")
                                Case 2032
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"html")
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"related") = Array(tmpRS("ExtDBfld_related").Value,"html")
                                Case Else
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"html")
                            End Select
                        End If
                        tmpRS.MoveNext
                    Wend
                End If
                GUI.Fields.Item("Files") = Array("Attachments","html")
                GUI.GenerateForm "view.htm", varTable, varParam
        End Select
        GUI.Draw
    Case "edit"
      If varParam="new" Then
          GUI.Template.SetVariable "ACTION",    "new"
          GUI.PageTitle = "NEW: "
      Else
          GUI.Template.SetVariable "ACTION",    "list"
          GUI.PageTitle = "EDIT: "
      End If
      Select Case varTable
        Case "MdlAccess"
            If Request("clearCol")>"" THEN
                clearList()
            END IF
            varTable = "ExtDBmdl"
            GUI.PageTitle = "Access"
            GUI.Template.SetVariable "TITLE", getTitle(varParam)
            GUI.Template.SetVariable "ACC_U", getMdlAccU(varParam)
            GUI.Template.SetVariable "ACC_C", getMdlAccC(varParam)
            GUI.Template.SetVariable "ACC_T", getMdlAccT(varParam)
            GUI.GenerateEdit "MdlAccess.htm", varTable, varParam
        Case "PgAccess"
            If Request("clearCol")>"" THEN
                clearList()
            END IF
            If Request("pageAccess")>"" THEN
                setPgAccess Request("param"), Request("pageAccess")
            END IF
            varTable = "ExtDBpg"
            GUI.PageTitle = "Page Access"
            GUI.Template.SetVariable "TITLE", getTitle(varParam)
            GUI.Template.SetVariable "ACC_U", getPgAccU(varParam)
            GUI.Template.SetVariable "ACC_C", getPgAccC(varParam)
            GUI.Template.SetVariable "ACC_T", getPgAccT(varParam)
            GUI.Template.SetVariable "ExtDBpg_access", getPgAccess(varParam)
            GUI.GenerateEdit "PgAccess.htm", varTable, varParam
        Case "WebAccess"
            GUI.PageTitle = "WebAccess"
            GUI.Template.SetVariable "WebsList",getWebsList(varParam)
            GUI.GenerateEdit "WebAccess.htm", "ExtDB"&varParam, varParam
        Case "PgWebAccess"
            GUI.PageTitle = "PgWebAccess"
            GUI.Template.SetVariable "link",getPgWebLink(varParam)
            GUI.GenerateEdit "PgWebAccess.htm", "ExtDBpg", varParam
        Case "Import"
            GUI.PageTitle = "Import"
            GUI.Fields.Item("FILE") = Array("Attachment","FILE","")
            GUI.Template.SetVariable "SubFORMS", getDropList("ExtDBfld_param,'SubForm: '+ExtDBfld_title","ExtDBfld","ExtDBfld_type=90 AND ExtDBfld_ExtDBtbl_id="&varParam)
            GUI.GenerateEdit "Import.htm", "ExtDB"&varParam, varParam
        Case "ImportStep_1"
            GUI.Template.SetVariable "ExtFile", Request("ExtFile")
            GUI.Template.SetVariable "targetForm", Request("targetForm")
            GUI.PageTitle = "Import Step 1"
            Call ImportStep_1("ExtDB"&varParam, varParam,Request("ExtFile"))
            If Request("targetForm")<>"main" Then
                GUI.GenerateEdit "ImportStep_1sub.htm", "ExtDB"&varParam, varParam
            Else
                GUI.GenerateEdit "ImportStep_1.htm", "ExtDB"&varParam, varParam
            End If
        Case "ExtDBmdl"
            GUI.PageTitle = GUI.PageTitle & "Module"
            GUI.Fields.Item("ExtDBmdl_title") = Array("Title","EDIT","blank")
            GUI.Fields.Item("ExtDBmdl_type") = Array("Type","COMBOBOX","MAIN|SMART|PWA","blank")
            GUI.Fields.Item("ExtDBmdl_root") = Array("Root Locked","YESNO","blank")
            GUI.Fields.Item("ExtDBmdl_act") = Array("Active","YESNO","")
            GUI.GenerateEdit "edit.htm", "ExtDBmdl", varParam
        Case "ExtDBpg_new","ExtDBpg"
            If varTable = "ExtDBpg_new" Then 
                varParam = CreateExtPage(varParam,Request("param2"))
            End If
            varTable = "ExtDBpg"
            GUI.PageTitle = GUI.PageTitle & " Extist Page"
            GUI.Fields.Item("ExtDBpg_title") = Array("Page Title","EDIT","blank")
            GUI.Fields.Item("ExtDBpg_menuorder") = Array("Page order","EDIT","blank")
            GUI.Fields.Item("ExtDBpg_act") = Array("Active","YESNO","")
            GUI.Fields.Item("ExtDBpg_files") = Array("Attachments","YESNO","")
            GUI.Fields.Item("ExtDBpg_web") = Array("Web Share","YESNO","")
            GUI.Fields.Item("ExtDBpg_pwa") = Array("PWA","YESNO","")
            Set tmpRS = ExecuteStat("SELECT * FROM ExtDBpg WHERE ExtDBpg_id="&varParam)
            GUI.Template.SetVariable "ExtDBtbl", tmpRS("ExtDBpg_ExtDBtbl_id").Value
            GUI.Template.SetVariable "FORM_FIELDS", getFilterList(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "FORM_FIELDS2", getFilterList2(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "ExtDBpg_filter", tmpRS("ExtDBpg_filter").Value
            GUI.Template.SetVariable "ExtDBpg_prefilter", tmpRS("ExtDBpg_prefilter").Value
            GUI.Template.SetVariable "ORDER_LIST", getOrderList(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "FIELDS_LIST", getFieldsAccessList(tmpRS("ExtDBpg_ExtDBtbl_id").Value,varParam)
            GUI.Template.SetVariable "WEBBY_LIST", getWebByList(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "WEBDATE_LIST", getWebDateList(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "WEBSTATUS_LIST", getWebStatusList(tmpRS("ExtDBpg_ExtDBtbl_id").Value)
            GUI.Template.SetVariable "WEBPAGE_LIST", getWebPageList(tmpRS("ExtDBpg_web").Value)
            GUI.Template.SetVariable "MODULES_LIST", getModulesList()
            GUI.GenerateEdit "ExtDBpg_edit.htm", "ExtDBpg", varParam
            tmpRS.Close
        Case "ExtDBtbl"
            If varParam="new" Then
                GUI.Template.SetVariable "ExtDBtbl_title", "Title"
                GUI.Template.SetVariable "CUSTOM_FORMS", ""
                GUI.Template.SetVariable "reports_fields",""
            Else
                Set tmpRS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&varParam)
                GUI.Template.SetVariable "ExtDBtbl_title", tmpRS("ExtDBtbl_title").Value
                GUI.Template.SetVariable "ExtDBtbl_report", tmpRS("ExtDBtbl_report").Value
                GUI.Template.SetVariable "ExtDBtbl_formtype", tmpRS("ExtDBtbl_formtype").Value
                GUI.Template.SetVariable "ExtDBtbl_chk_lup", tmpRS("ExtDBtbl_chk_lup").Value
                GUI.Template.SetVariable "ExtDBtbl_chk_res", tmpRS("ExtDBtbl_chk_res").Value
                tmpRS.Close
                GUI.Template.SetVariable "reports_fields","" 'getReportsFieldList(varParam)
                GUI.Template.SetVariable "CUSTOM_FORMS", getFormsList(varParam)
            End If
            GUI.GenerateEdit "ExtDBtbl.htm", "ExtDBtbl", varParam
        Case "ExtDBtbl2"
            If varParam="new" Then
                GUI.Template.SetVariable "ExtDBtbl_title", "Title"
                GUI.Template.SetVariable "reports_fields",""
            Else
                Set tmpRS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&varParam)
                GUI.Template.SetVariable "ExtDBtbl_title", tmpRS("ExtDBtbl_title").Value
                GUI.Template.SetVariable "ExtDBtbl_report", tmpRS("ExtDBtbl_report").Value
                GUI.Template.SetVariable "ExtDBtbl_formtype", tmpRS("ExtDBtbl_formtype").Value
                GUI.Template.SetVariable "ExtDBtbl_chk_lup", tmpRS("ExtDBtbl_chk_lup").Value
                GUI.Template.SetVariable "ExtDBtbl_chk_res", tmpRS("ExtDBtbl_chk_res").Value
                tmpRS.Close
                GUI.Template.SetVariable "reports_fields","" 'getReportsFieldList(varParam)
            End If
            GUI.GenerateEdit "ExtDBtbl2.htm", "ExtDBtbl", varParam
        Case "EditViews"
            GUI.Template.SetVariable "ViewsList",getViewsList(varParam)
            GUI.GenerateEdit "EditViewsList.htm", "ExtDBpg", varParam
        Case "PgHelpEdit"
            Set tmpRS = ExecuteStat("SELECT * FROM ExtDBpg WHERE ExtDBpg_id="&varParam)
            GUI.Template.SetVariable "ExtDBpg_help", tmpRS("ExtDBpg_help").Value
            GUI.GenerateEdit "PgHelpEdit.htm", "ExtDBpg", varParam
        Case "PgViewEdit"
            Call getViewPrams(varParam)
            Call getTplList(varParam)
            GUI.Template.SetVariable "ExtDBview_ExtDBpg_id",Request("ExtDBview_ExtDBpg_id")
            GUI.GenerateEdit "PgViewEdit.htm", "ExtDBpg", Request("param")
        Case "TblWebEdit"
            Call getWebsPrams(varParam)
            GUI.Template.SetVariable "ExtDBweb_ExtDBtbl_id",Request("ExtDBweb_ExtDBtbl_id")
            GUI.GenerateEdit "TblWebEdit.htm", "ExtDBtbl", Request("param")
        Case Else
            Set tmpRS = ExecuteStat("SELECT * FROM [ExtDBtbl] WHERE 'ExtDB'+CAST(ExtDBtbl_id AS VARCHAR)='"&varTable&"'")
            Dim fld_events,relatedList,tooltipList,filledList
            Dim ezFormType : ezFormType = tmpRS("ExtDBtbl_type").Value
            Dim ezFormId : ezFormId = tmpRS("ExtDBtbl_id").Value
            cross_addon = ""
            survey_addon = ""
            relatedList = ""
            tooltipList = ""
            filledList = ""
            
            If CheckFile( Server.MapPath("addon\"&SESSION("SYSTEM.ID")&"_"&varTable&"_cross_addon.htm") ) Then
                cross_addon = readFile( Server.MapPath("addon\"&SESSION("SYSTEM.ID")&"_"&varTable&"_cross_addon.htm") )
            End If
            
            If Not tmpRS.Eof Then
                If SESSION("ExtDBpg")=0 Then
                    Set tmpRS = ExecuteStat("SELECT *,'' as access FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                Else
                    Set tmpRS = ExecuteStat("SELECT *,(select top 1 ExtDBpgfld_access from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&SESSION("ExtDBpg")&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as access FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
                End If
                GUI.Fields.Item(varTable&"_id") = Array("ID","HIDDEN","")
                Dim required, filter,TABSstr,TABSid
                TABSid = 1
                GUI.Fields.Item(Trim(Request("crossFld"))) = Array(Trim(Request("crossId")),"HIDDEN-STAT")
                While Not tmpRS.Eof
                    required = "" : filter = ""
                    fld_edit = tmpRS("access").Value&""
                    If fld_edit="view" Then
                        Select Case tmpRS("ExtDBfld_type").Value
                            Case 30
                                'LOOKUP  Field
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                            Case 31,32,33
                                'SELECT  Field
                                GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"html")
                            Case 60
                                GUI.Fields.Item(SurveyGridFields(varTable,tmpRS("ExtDBfld_id")))  = Array(tmpRS("ExtDBfld_title").Value,"cross","ExtDBsrv&srv="&tmpRS("ExtDBfld_id")&"&tbl=ExtDB"&tmpRS("ExtDBfld_ExtDBtbl_id"),"View",varTable&"surv"&tmpRS("ExtDBfld_id").Value)
                            Case 70
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array("</B></td><td></td></tr><!--","-","--><tr><td colspan=2 class=t_hd><center><b>"&tmpRS("ExtDBfld_title").Value&"</b></center><b")
                            Case 71
                                ' SKIP for SQLFIELD
                            Case 72
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array("</B></td><td></td></tr><!--","-","--><tr><td colspan=2><div class=htmlField>"&tmpRS("ExtDBfld_param").Value&"</div><b")
                            Case 80
                                ' SKIP for TABS
                                GUI.Fields.Item("fragment"&TABSid&"") = Array("* "&tmpRS("ExtDBfld_title").Value&" * <fragment id='"&TABSid&"'/>","TITLE","")
                                TABSstr = TABSstr & "<li id=tab_rowList"&TABSid&" onclick=Tab('rowList"&TABSid&"')><a  href='javascript:void(0);'><span>"&tmpRS("ExtDBfld_title").Value&"</span></a></li>"
                                TABSid = TABSid + 1
                            Case 90
                                'CROSSGRID-VIEW
                                'Create Full Table
                                GUI.Fields.Item("<div class=CrossTitle>"&tmpRS("ExtDBfld_title").Value&"</div>") = Array(CreateCrossGrid(varTable,tmpRS("ExtDBfld_param").Value,varParam,cross_addon,false,false,false),"CUSTOM")
                            Case 2032
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"html")
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"related") = Array(tmpRS("ExtDBfld_related").Value,"html")
                            Case Else
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"html")
                        End Select
                    ElseIf fld_edit="" or fld_edit="edit" Then
                        If Trim(tmpRS("ExtDBfld_filter").Value)>"" Then filter = "@"&tmpRS("ExtDBfld_filter").Value
                        filter = Replace(filter,"|"," AND ")
                        Select Case toInt(tmpRS("ExtDBfld_type").Value)
                            Case 3
                                required = "number|1|-1999999999|1999999999|bok"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onblur>"&VbCrLf&"extractNumber(this,0,true)"&VbCrLf&"</SCRIPT>"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onkeyup>"&VbCrLf&"extractNumber(this,0,true)"&VbCrLf&"</SCRIPT>"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onkeypress>"&VbCrLf&"blockNonNumbers(this, event, false, true)"&VbCrLf&"</SCRIPT>"
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "number|1|-1999999999|1999999999"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"EDIT",required)
                            Case 131
                                'required = "decimalr|0|9|0|9|bok"
                                required = "decimal|*|*|bok"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onblur>"&VbCrLf&"extractNumber(this,9,true)"&VbCrLf&"</SCRIPT>"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onkeyup>"&VbCrLf&"extractNumber(this,9,true)"&VbCrLf&"</SCRIPT>"
                                fld_events = fld_events & "<SCRIPT for="&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&" event=onkeypress>"&VbCrLf&"blockNonNumbers(this, event, true, true)"&VbCrLf&"</SCRIPT>"
                                'If tmpRS("ExtDBfld_req").Value="Yes" Then required = "decimalr|0|9|0|9"
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "decimal|*|*"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"EDIT",required)
                            Case 6
                                required = "money|$,.|bok"
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "money|$,.|blank"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"EDIT",required)
                            Case 30
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                if InStr(Split(tmpRS("ExtDBfld_param").Value,"^")(1),"|")=0 And InStr(Split(tmpRS("ExtDBfld_param").Value,"^")(1),"_id")=0 Then
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"SELECT",required,Split(tmpRS("ExtDBfld_param").Value,"^")(0),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value,Split(tmpRS("ExtDBfld_param").Value,"^")(0)&"_id|"&Split(tmpRS("ExtDBfld_param").Value,"^")(1),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name")
                                ELSE
                                    If InStr(tmpRS("ExtDBfld_filter").Value,"^")>0 Then
                                        filter = "^EXTDB^"&tmpRS("ExtDBfld_id").Value
                                    Else
                                        filter = ""
                                    End If
                                    '' company^EXTDB^162
                                    
                                    GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"SELECT",required,Split(tmpRS("ExtDBfld_param").Value,"^")(0)&Replace(filter,"'","\'"),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value,Split(tmpRS("ExtDBfld_param").Value,"^")(1),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_name")
                                End If
                            Case 31
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                If InStr(tmpRS("ExtDBfld_filter").Value,"^")>0 Then
                                    filter = "^EXTDB^"&tmpRS("ExtDBfld_id").Value
                                Else
                                    filter = ""
                                End If
                                GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"SELECT",required,tmpRS("ExtDBfld_param").Value&Replace(filter,"'","\'"),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value,"projects_num|projects_name",tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name")
                            Case 32
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                If InStr(tmpRS("ExtDBfld_filter").Value,"^")>0 Then
                                    filter = "^EXTDB^"&tmpRS("ExtDBfld_id").Value
                                Else
                                    filter = ""
                                End If
                                GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"SELECT",required,tmpRS("ExtDBfld_param").Value&Replace(filter,"'","\'"),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value,"users_firstname|users_lastname",tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name")
                            Case 33
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                If InStr(tmpRS("ExtDBfld_filter").Value,"^")>0 Then
                                    filter = "^EXTDB^"&tmpRS("ExtDBfld_id").Value
                                Else
                                    filter = ""
                                End If
                                GUI.Fields.Item(tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"SELECT",required,tmpRS("ExtDBfld_param").Value&Replace(filter,"'","\'"),varTable&"_Fld"&tmpRS("ExtDBfld_id").Value,"company_name",tmpRS("ExtDBfld_param").Value&tmpRS("ExtDBfld_id").Value&"_name")
                            Case 135
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"DATE",required)
                            Case 136
                                If varParam="new" Then
                                    filledList = filledList & "filled.push({field:'"&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"', value:"""& ( DatePart("m",Now())&"/"&DatePart("d",Now())&"/"&DatePart("yyyy",Now()) ) &"""});"&VbCrLf
                                End If
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"READONLY","")
                            Case 200
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                If Trim(tmpRS("ExtDBfld_valid").Value)>"" Then
                                    If tmpRS("ExtDBfld_req").Value="Yes" Then
                                        required = tmpRS("ExtDBfld_valid").Value
                                    Else
                                        required = tmpRS("ExtDBfld_valid").Value & "|bok"
                                    End If
                                End If
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"EDIT",required)
                            Case 201
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"MEMO",required)
                            Case 204,205
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"READONLY","")
                            Case 2011
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value&" History","HTML","")
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"_update") = Array(tmpRS("ExtDBfld_title").Value,"MEMO",required)
                            Case 2012 ' TODO-2012
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                GUI.Fields.Item(tmpRS("ExtDBfld_title").Value) = Array("<div class='editor_field' data-req='"&required&"' data-title='"&tmpRS("ExtDBfld_title").Value&"' data-field='"&( varTable&"_Fld"&tmpRS("ExtDBfld_id").Value )&"'>"&( varTable&"_Fld"&tmpRS("ExtDBfld_id").Value )&"</div>","CUSTOM","")
                            Case 202
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "blank"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"SELECT2",required,varTable)
                            Case 2030,2031
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "selecti|-1"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"COMBOBOX",tmpRS("ExtDBfld_param").Value,required)
                            Case 2032
                                relatedList = relatedList & "related.push({field:'"&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"', list:"""&tmpRS("ExtDBfld_param").Value&"""});"&VbCrLf
                                If tmpRS("ExtDBfld_req").Value="Yes" Then required = "selecti|-1"
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"COMBOBOX",tmpRS("ExtDBfld_param").Value,required)
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"related") = Array(tmpRS("ExtDBfld_related").Value,"COMBOBOX",tmpRS("ExtDBfld_param").Value,required)
                            Case 60
                                ' SKIP for SURVEY
                                GUI.Fields.Item("<div class=SurveyTitle>"&tmpRS("ExtDBfld_title").Value&"</div>") = Array(CreateSurveyGrid(varTable,varParam,tmpRS("ExtDBfld_id").Value,tmpRS("ExtDBfld_param").Value,survey_addon),"CUSTOM")
                            Case 70
                                GUI.Fields.Item(varTable&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array("<div class='form-title'>"&tmpRS("ExtDBfld_title").Value&"</div>","TITLE","")
                                'TODO
                            Case 71
                                ' SKIP for SQLFIELD
                            Case 72
                                GUI.Fields.Item(tmpRS("ExtDBfld_title").Value) = Array("<div class='htmlField'>"&tmpRS("ExtDBfld_param").Value&"</div>","CUSTOM","")
                            Case 80
                                ' Add TABS array to FORM
                                GUI.Fields.Item("fragment"&TABSid&"") = Array("* "&tmpRS("ExtDBfld_title").Value&" * <fragment id='"&TABSid&"'/>","TITLE","")
                                TABSstr = TABSstr & "<li id=tab_rowList"&TABSid&" onclick=Tab('rowList"&TABSid&"')><a  href='javascript:void(0);'><span>"&tmpRS("ExtDBfld_title").Value&"</span></a></li>"
                                TABSid = TABSid + 1
                            Case 90
                                'CROSSGRID-EDIT
                                GUI.Fields.Item("<div class=CrossTitle>"&tmpRS("ExtDBfld_title").Value&"</div>") = Array(CreateCrossGrid(varTable,tmpRS("ExtDBfld_param").Value,varParam,cross_addon,true,true,true),"CUSTOM")
                        End Select
                        If Len(tmpRS("ExtDBfld_tooltip").Value&"")>0 Then
                            tooltipList = tooltipList & "tooltips.push({field:'"&varTable&"_Fld"&tmpRS("ExtDBfld_id").Value&"', text:"""&tmpRS("ExtDBfld_tooltip").Value&"""});"&VbCrLf
                        End If
                    'ElseIf UBound(fld_view)=0 Or InArray(SESSION("USER.TITLE"),fld_view) Then
                    
                    End If
                    tmpRS.MoveNext
                Wend
                If ezFormType=2 And 1=2 Then
                    GUI.Fields.Item(""&NewID) = Array("<div class='form-title'>MAIN FORM</div>","TITLE","")
                    Set tmpRS = ExecuteStat("SELECT ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_type=90 AND CAST(ExtDBfld_param AS VARCHAR)='"&ezFormId&"'")
                    ezFormId = tmpRS(0)
                    'Set tmpRS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&ezFormId&"")
                    Set tmpRS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&ezFormId&" ORDER BY ExtDBfld_order")
                    While Not tmpRS.Eof
                        If InStr(fld,"["&Replace(tmpRS("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(tmpRS("ExtDBfld_title"))<50 Then
                            Select Case tmpRS("ExtDBfld_type").Value
                                Case 3,6,30,131,135,136,200,202,204,205,2030,2031
                                    GUI.Fields.Item("ExtDB"&ezFormId&"_Fld"&tmpRS("ExtDBfld_id").Value) = Array(tmpRS("ExtDBfld_title").Value,"HTML","")
                                Case 31,32,33
                                    GUI.Fields.Item(""&tmpRS("ExtDBfld_param").Value&""&tmpRS("ExtDBfld_id").Value&"_name") = Array(tmpRS("ExtDBfld_title").Value,"HTML","")
                            End Select
                        End If
                        tmpRS.MoveNext
                    Wend
                    GUI.Fields.Item(""&NewID) = Array("<div class='form-title'>. . .</div>","TITLE","")
                End If
            End If
            If Request("crossId")>"" Then
            End If
            GUI.Template.SetVariable "iDelete","inline"
            GUI.Template.SetVariable "TABS",TABSstr
            GUI.Template.SetVariable "EVENTS",fld_events
            GUI.Template.SetVariable "cross_addon",cross_addon
            GUI.Template.SetVariable "survey_addon",survey_addon
            GUI.Template.SetVariable "relatedList",relatedList
            GUI.Template.SetVariable "tooltipList",tooltipList
            GUI.Template.SetVariable "filledList",filledList
            GUI.Fields.Item("Files")  = Array("Attachment","FILE","")
            GUI.GenerateEdit "editM.htm", varTable, varParam
      End Select
      GUI.Draw
  Case "delete"
    Select Case varTable
      Case "ExtDBtbl"
        Set tmpRS = ExecuteStat("SELECT ExtDBfld_param FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&varParam&" AND ExtDBfld_type=90")
        While Not tmpRS.Eof
            Call DBConnect.Execute("DELETE FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tmpRS(0).Value)
            Call DBConnect.Execute("DELETE FROM [ExtDBtbl] WHERE ExtDBtbl_id="&tmpRS(0).Value)
            If TableExists("ExtDB"&tmpRS(0).Value) Then Call DBConnect.Execute("DROP TABLE [ExtDB"&tmpRS(0).Value&"]")
            tmpRS.MoveNext
        Wend
        Call DBConnect.Execute("DELETE FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&varParam)
        Call DBConnect.Execute("DELETE FROM [ExtDBtbl] WHERE ExtDBtbl_id="&varParam)
        If TableExists("ExtDB"&varParam&"") Then Call DBConnect.Execute("DROP TABLE [ExtDB"&varParam&"]")
        Call LoadMenu()
        Call updateReports()
        response.Write "<SCRIPT>parent.bootbox.alert('ExtDB deleted.',function(){top.document.location.reload(true)});</SCRIPT>"
      Case "ExtDBmdl"
        If DeleteRec(varTable,varParam) Then
            Call LoadMenu()
            Call updateReports()
            response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.',function(){top.document.location.reload(true)});</SCRIPT>"
        Else
            response.Write "<SCRIPT>parent.bootbox.alert('Record not deleted.');</SCRIPT>"
        End If
      Case "ExtDBpg"
        If DeleteRec(varTable,varParam) Then
            Call LoadMenu()
            Call updateReports()
            response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.',function(){top.document.location.reload(true)});</SCRIPT>"
        Else
            response.Write "<SCRIPT>parent.bootbox.alert('Record not deleted.');</SCRIPT>"
        End If
      Case "TblWebEdit"
        If DeleteRec("ExtDBweb",varParam) Then
            Response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.',function(){parent.dialogClose()});</SCRIPT>"
        Else
            Response.Write "<SCRIPT>parent.bootbox.alert('Record not deleted.');</SCRIPT>"
        End If
      Case "PgViewEdit"
        If DeleteRec("ExtDBview",varParam) Then
            Response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.',function(){parent.dialogClose()});</SCRIPT>"
        Else
            Response.Write "<SCRIPT>parent.bootbox.alert('Record not deleted.');</SCRIPT>"
        End If
      Case Else
        If DeleteRec(varTable,varParam) Then
            If Request("type")="crossgrid" Then
                response.Write "DONE"
            Else
                response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.',function(){top.document.location.reload(true)});</SCRIPT>"
            End If
        Else
            response.Write "<SCRIPT>parent.bootbox.alert('Record not deleted.');</SCRIPT>"
        End If
    End Select
'*************** CALL EVENT
            Call addEVENT(varAction,varTable,Request,varParam)
'*************** CALL EVENT
  Case "mdelete"
            m_list = Split(varParam,",")
            For Each m_param In m_list
                If IsNumeric(m_param) Then
                    If DeleteRec(varTable,m_param) Then
'*************** CALL EVENT
                        Call addEVENT(varAction,varTable,Request,m_param)
'*************** CALL EVENT
                    End If
                End If
            Next
      Response.Write "<SCRIPT>parent.bootbox.alert('Record deleted.');parent.DataList.Reset();</SCRIPT>"
Case "Import"
    Set oFO = New FileUpload
    Set oRequest = New clsConverter
    oRequest.Init(oFO)
    If oFO.FileCount > 0 Then
        ExtFile = SaveExtFile(oFO,oRequest.Form("table"))
        Response.Write "<style>body,td {margin-left:3px;font-size:10px;font-family:Tahoma;background-color:infobackground;}</style><TABLE WIDTH='100%' HEIGHT='100%' CELLPADDING='0' CELLSPACING='0' BORDER='0'><TR><TD><span style='color:red'>Status: File saved.</span></TD></TR></TABLE>"
        Response.Write "<SCRIPT>parent.bootbox.alert('File saved.');parent.goStep_1("""&Replace(ExtFile,"\","/")&""");</SCRIPT>"
    Else
        Response.Write "<SCRIPT>parent.bootbox.alert('Import aborted!');parent.prepareForm();</SCRIPT>"
    End If
Case "ImportStep_2"
        Response.Write "<style>body,td {margin-left:3px;font-size:10px;font-family:Tahoma;background-color:infobackground;}</style>"
        SESSION("IMPORT.LOG") = ""
        Call ImportStep_2(Request.Form("param"))
        Call GenerateView(Request.Form("table"))
        Response.Write "<SCRIPT>parent.bootbox.alert('Import Done!<br>"&SESSION("IMPORT.LOG")&"',function(){parent.dialogClose()});</SCRIPT>"
Case "ExportConfig"
    Call ExportConfig(varParam)
Case "ImportConfig"
    Call ImportConfig()
Case "ImportModule"
    Call ImportModule()
Case "FullReCheck"
    Sub FullReCheck()
        Dim RS
        Set RS = ExecuteStat("SELECT * FROM ExtDBtbl")
        While Not RS.Eof
            Err.Clear
            On Error Resume Next 
            Call UpdateFields( RS("ExtDBtbl_id").Value )
            Call UpdateSQL( RS("ExtDBtbl_id").Value )
            If Err.Number > 0 Then
                Log " [ExtDB"&RS("ExtDBtbl_id").Value&"] " & Err.Description
            End If
            RS.MoveNext
        Wend
        Err.Clear
        Call updateReports()
        
        Set RS = ExecuteStat("SELECT * FROM ExtDBtbl")
        While Not RS.Eof
            Err.Clear
            On Error Resume Next 
            Call GenerateGridView("ExtDB"&RS("ExtDBpg_ExtDBtbl_id").Value,RS("ExtDBpg_id").Value)
            If Err.Number > 0 Then
                Log " [ExtDBpg"&RS("ExtDBpg_id").Value&"] " & Err.Description
            End If
            RS.MoveNext
        Wend
        Err.Clear
    End Sub
    Call FullReCheck()
    SESSION("LEFT_PANEL") = LoadMenus()
    GUI.Init "config.htm"
    GUI.PageTitle = "Configuration"
    GUI.Template.SetVariable "AddNew", "none"
    GUI.Template.SetVariable "Filters", "none"
    GUI.Template.SetVariable "Alerts", "none"
    GUI.Template.SetVariable "Print", "none"
    GUI.Template.SetVariable "PagesBtns", "none"
    GUI.Template.SetVariable "ExtDBtblList", ExtDBtblList()
    GUI.Template.SetVariable "ExtDBmdlList", ExtDBmdlList()
    GUI.Template.SetVariable "ExtDBmdlOption", ExtDBmdlOption()
    GUI.Template.SetVariable "ExtDBmdlOptionPWA", ExtDBmdlOptionPWA()
    GUI.Template.SetVariable "ExtDBpgList", ExtDBpgList()
    GUI.Template.SetVariable "ExtDBpgListPWA", ExtDBpgListPWA()
    GUI.Template.SetVariable "TABLES_LIST", TABLES_LIST()
    GUI.Template.SetVariable "MODULES_LIST", MODULES_LIST()
    GUI.Template.SetVariable "LEFT_PANEL", SESSION("LEFT_PANEL")
    GUI.Draw
    Response.End
Case "save"
      id = 0
      If isMultipart Then
          Set oFO = New FileUpload
          Set oRequest = New clsConverter
          oRequest.Init(oFO)
      End If
      Dim extIconLink : extIconLink = ""
      Dim oldName : oldName = ""
      Dim newName : newName = ""
      Dim isDataForm : isDataForm = false
      Select Case varTable
        Case "ExtDBtbl"
            If Not Request("param")="new" Then
                oldName = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR(Request("param"))
            End If
            id = FormSave(varTable,Request)
            If id>0 Then
                newName = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR(Request("param"))
                If oldName<>newName Then Call MoveFolder(oldName,newName)
                Call Execute("DROP VIEW IF EXISTS [ExtDB"&id&"grid]")
                Call UpdateFields(id)
                Call UpdateSQL(id)
                Call updateReports()
                Call updateTemplate(id)
                Call LoadMenu()
            End If
        Case "ExtDBtbl2"
            varTable = "ExtDBtbl"
            id = FormSave(varTable,Request)
            If id>0 Then
                Call UpdateFields(id)
                Call UpdateSQL(id)
                Call updateReports()
                Call LoadMenu()
            End If
        Case "ExtDBmdl"
            id = FormSave(varTable,Request)
            Call LoadMenu()
        Case "ExtDBpg"
            id = FormSave(varTable,Request)
            If Request.Form("ExtDBpg_share")="" Then
                Call Execute("UPDATE ExtDBpg SET ExtDBpg_share='"&GetGuidBig()&"' WHERE ExtDBpg_id="&id)
            End If
            Call GenerateGridView("ExtDB"&Request("ExtDBtbl"),id)
            Call UpdateFieldsAccess(id)
            Call LoadMenu()
        Case "ExtDBview"
            id = FormSave(varTable,Request)
        Case "ExtDBweb"
            id = FormSave(varTable,Request)
        Case "PgHelpEdit"
            id = FormSave("ExtDBpg",Request)
        Case "ExtDBmdlU"
            Call Update_ExtDBmdlU(Request,varParam)
        Case "ExtDBmdlC"
            Call Update_ExtDBmdlC(Request,varParam)
        Case "ExtDBmdlT"
            Call Update_ExtDBmdlT(Request,varParam)
        Case "ExtDBpgU"
            Call Update_ExtDBpgU(Request,varParam)
        Case "ExtDBpgC"
            Call Update_ExtDBpgC(Request,varParam)
        Case "ExtDBpgT"
            Call Update_ExtDBpgT(Request,varParam)
        Case Else
            id = FormSave(varTable,oRequest)
            If id > 0 Then
                isDataForm = true
                For Each fld In oRequest.Form
                    If Right(fld,7)="_update" Then
                        Call UpdateField(varTable,id,fld,oRequest)
                    End If
                Next
                If oRequest.Form.Exists("ExtDBsrv_id") Then
                    If oFO.Item("ExtDBsrv_id").Count>0 Then
                        Call SaveSurvey(oFO,oRequest,varTable,id)
                    End If
                End If
                If oFO.FileCount > 0 then
                    Call SaveFiles(oFO,oRequest,varTable,id)
                End If
                
                Call Run_AfterSave(varTable,id)
            End If
      End Select
'*************** CALL EVENT
  If id > 0 Then
        If isMultipart Then Call addEVENT(varAction,varTable,oRequest.Form,id) Else Call addEVENT(varAction,varTable,Request,id) End If
        SESSION("ExtDBfld-CHANGES") = ""
        Response.Write "<style>body,td {margin-left:3px;font-size:10px;font-family:Tahoma;background-color:infobackground;}</style><TABLE WIDTH='100%' HEIGHT='100%' CELLPADDING='0' CELLSPACING='0' BORDER='0'><TR><TD><span style='color:red'>Status: Data saved.</span></TD></TR></TABLE>"
        If isDataForm Then
            Response.Write "<SCRIPT>parent.bootbox.alert('Data saved.',function(){parent.prepareForm("&id&");window.returnValue = true;});</SCRIPT>"
        Else
            Response.Write "<SCRIPT>parent.bootbox.alert('Data saved.',function(){parent.dialogClose()});</SCRIPT>"
        End If
  Else
        If Err.Number>0 Then
            Response.Write "<SCRIPT>parent.bootbox.alert('Data not saved. Error:"&Err.Description&"');parent.prepareForm();</SCRIPT>"
        Else
            Response.Write "<SCRIPT>parent.bootbox.alert('Data saved.');parent.prepareForm();</SCRIPT>"
        End If
  End If
'*************** CALL EVENT
End Select

Function ExtDBmdlList()
    Dim RS, RS2, buf, files
    Set RS = ExecuteStat("SELECT * FROM ExtDBmdl ORDER BY ExtDBmdl_lib,ExtDBmdl_title")
    buf = buf & "<TABLE CELLPADDING='0' CELLSPACING='0' bgcolor='white' border=0 width='100%' class='table table-striped table-bordered'>"
    buf = buf & "<tr><th class=t_hd>Title</th><th class=t_hd>Type</th><th class=t_hd>Active</th><th class=t_hd>Edit</th><th class=t_hd>Access</th><th class=t_hd>Del</th><tr>"
    While Not RS.Eof
        If Trim(RS("ExtDBmdl_lib").Value)>"" OR (RS("ExtDBmdl_root").Value=True) Then
            buf = buf & "<tr class='extlib'>"
        Else    
            buf = buf & "<tr>"
        End If
        buf = buf & "<td class=t_td>"&RS("ExtDBmdl_title")&"</td>"
        buf = buf & "<td class=t_td align=center width=90>"&RS("ExtDBmdl_type")&"</td>"
        If RS("ExtDBmdl_act").Value Then
            buf = buf & "<td class=t_td align=center width=90>Yes</td></td>"
        Else
            buf = buf & "<td class=t_td align=center style='color:darkred;' width=90>No</td></td>"
        End If
        If Trim(RS("ExtDBmdl_lib").Value)>"" Or (RS("ExtDBmdl_root").Value=True AND SESSION("USER.ROOT")=False) Then
            buf = buf & "<td class=t_td align=center width=90>&nbsp</td>"
            buf = buf & "<td class=t_td align=center width=90><button title='Access' onclick='extMdlAccess("&RS("ExtDBmdl_id")&")'><i class='icon-user'></button></td>"
            buf = buf & "<td class=t_td align=center width=90>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=90><button title='Edit' onclick='extMdlEdit("&RS("ExtDBmdl_id")&")'><i class='icon-pencil'></button></td>"
            buf = buf & "<td class=t_td align=center width=90><button title='Access' onclick='extMdlAccess("&RS("ExtDBmdl_id")&")'><i class='icon-user'></button></td>"
            buf = buf & "<td class=t_td align=center width=90><button title='Delete' align=absmiddle onclick='extMdlDel("&RS("ExtDBmdl_id")&")'><i class='icon-remove2'></button></td>"
        End If
        buf = buf & "<tr>"
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBmdlList = buf
End Function

Function ExtDBmdlOption()
    Dim RS, RS2, buf, files
    Set RS = ExecuteStat("SELECT DISTINCT ExtDBmdl_title FROM ExtDBmdl LEFT JOIN ExtDBpg ON ExtDBpg_ExtDBmdl_id=ExtDBmdl_id WHERE ISNULL(ExtDBpg_pwa,0)=0 ORDER BY ExtDBmdl_title")
    buf = ""
    While Not RS.Eof
        buf = buf & "<option value='"&RS("ExtDBmdl_title")&"'>"&RS("ExtDBmdl_title")&"</option>"
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBmdlOption = buf
End Function

Function ExtDBmdlOptionPWA()
    Dim RS, RS2, buf, files
    Set RS = ExecuteStat("SELECT DISTINCT ExtDBmdl_title FROM ExtDBmdl LEFT JOIN ExtDBpg ON ExtDBpg_ExtDBmdl_id=ExtDBmdl_id WHERE ExtDBpg_pwa=1 ORDER BY ExtDBmdl_title")
    buf = ""
    While Not RS.Eof
        buf = buf & "<option value='"&RS("ExtDBmdl_title")&"'>"&RS("ExtDBmdl_title")&"</option>"
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBmdlOptionPWA = buf
End Function

Function ExtDBtblList()
    Dim RS, RS2, buf, files
    
    Set RS = ExecuteStat("SELECT * "&_
        ",(select count(1) from ExtDBweb where ExtDBweb_ExtDBtbl_id=ExtDBtbl_id) as web "&_
        ",(CASE WHEN ExtDBtbl_id IN (SELECT id FROM ExtDBtbl_root()) THEN 1 ELSE 0 END) as root "&_
        "FROM ExtDBtbl WHERE ExtDBtbl_type IS NULL OR ExtDBtbl_type NOT IN (2) ORDER BY ExtDBtbl_lib,ExtDBtbl_title")
    
    buf = buf & "<TABLE CELLPADDING='0' CELLSPACING='0' bgcolor='white' border=0 width='100%' class='table table-striped table-bordered'>"
    buf = buf & "<tr><th class=t_hd>Title</th><th class=t_hd>Records</th><th class=t_hd>Last Import</th><th class=t_hd>Files</th><th class=t_hd>Edit</th><th class=t_hd>Web Form</th><th class=t_hd>Import Data</th><th class=t_hd>Export Data</th><th class=t_hd>CSV Template</th><th class=t_hd>Export Config</th><th class=t_hd>Del</th><tr>"
    While Not RS.Eof
        files = "<div style='border:0px solid gray;height:40px;width:150px;overflow:auto;'>"&getImportLinks(SESSION("FILESDIR")&"ExtDB\ExtDB"&RS("ExtDBtbl_id")&"\")&"</div>"
        If Not TableExists("ExtDB"&RS("ExtDBtbl_id")&"") Then
            DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&RS("ExtDBtbl_id")&"] (ExtDB"&RS("ExtDBtbl_id")&"_id INT IDENTITY PRIMARY KEY)")
        End If
        Set RS2 = ExecuteStat("SELECT COUNT(1) FROM [ExtDB"&RS("ExtDBtbl_id")&"]")
        If Trim(""&RS("ExtDBtbl_lib").Value)>"" Then
            buf = buf & "<tr class='extlib'>"
            buf = buf & "<td class=t_td>"&RS("ExtDBtbl_title")&"</td><td class=t_td align=center><a href='/Modules/EXTDB/?action=page&page=ExtDB"&RS("ExtDBtbl_id")&"'>[ "&RS2(0)&" ]</a></td><td class=t_td align=center>"&RS("ExtDBtbl_date")&"</td><td class=t_td align=center>"&files&"</td>"

            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            'buf = buf & "<td class=t_td align=center width=35><button title='Edit' onclick='extTblEdit("&RS("ExtDBtbl_id")&")'><i class='icon-pencil'></button></td>"

            buf = buf & "<td class=t_td align=center width=35><button title='Web Form' onclick='WebAccess("&RS("ExtDBtbl_id")&")'><i class='icon-eye'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Import' onclick='extImport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-upload'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Full Export' onclick='extExport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-download-alt'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Template' onclick='extTemplate("""&Replace((RS("ExtDBtbl_title").Value)," ","_")&".csv"")'><i class='glyphicon glyphicon-list-alt'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Export Config' style='display:none;' onclick='extExportConfig("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-floppy-save'></button></td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "</tr>"
        ElseIf RS("root").Value=1 AND SESSION("USER.ROOT")=False Then
            buf = buf & "<tr class='extlib'>"
            buf = buf & "<td class=t_td>"&RS("ExtDBtbl_title")&"</td><td class=t_td align=center><a href='/Modules/EXTDB/?action=page&page=ExtDB"&RS("ExtDBtbl_id")&"'>[ "&RS2(0)&" ]</a></td><td class=t_td align=center>"&RS("ExtDBtbl_date")&"</td><td class=t_td align=center>"&files&"</td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Import' onclick='extImport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-upload'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Full Export' onclick='extExport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-download-alt'></button></td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "<td class=t_td align=center width=35>&nbsp</td>"
            buf = buf & "</tr>"
        Else
            If RS("root").Value=1 Then
                buf = buf & "<tr class='extlib'>"
            Else
                buf = buf & "<tr>"
            End If
            buf = buf & "<td class=t_td>"&RS("ExtDBtbl_title")&"</td><td class=t_td align=center><a href='/Modules/EXTDB/?action=page&page=ExtDB"&RS("ExtDBtbl_id")&"'>[ "&RS2(0)&" ]</a></td><td class=t_td align=center>"&RS("ExtDBtbl_date")&"</td><td class=t_td align=center>"&files&"</td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Edit' onclick='extTblEdit("&RS("ExtDBtbl_id")&")'><i class='icon-pencil'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Web Form' onclick='WebAccess("&RS("ExtDBtbl_id")&")'><i class='icon-eye'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Import' onclick='extImport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-upload'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Full Export' onclick='extExport("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-download-alt'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Template' onclick='extTemplate("""&Replace((RS("ExtDBtbl_title").Value)," ","_")&".csv"")'><i class='glyphicon glyphicon-list-alt'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Export Config' onclick='extExportConfig("&RS("ExtDBtbl_id")&")'><i class='glyphicon glyphicon-floppy-save'></button></td>"
            buf = buf & "<td class=t_td align=center width=35><button title='Delete' align=absmiddle onclick='extTblDel("&RS("ExtDBtbl_id")&")'><i class='icon-remove2'></button></td>"
            buf = buf & "</tr>"
        End If
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBtblList = buf
End Function

Function ExtDBpgList()
    Dim RS, RS2, buf, files
    buf = buf & "<TABLE CELLPADDING='0' CELLSPACING='0' bgcolor='white' border=0 width='100%' class='table table-striped table-bordered'>"
    buf = buf & "<tr><th class=t_hd>Module</th><th class=t_hd>Title</th><th class=t_hd>Active</th><th class=t_hd>Edit</th><th class=t_hd>Actions</th><th class=t_hd>Access</th><th class=t_hd>WEB</th><th class=t_hd>PWA</th><td class=t_hd>ORDER</td><td class=t_hd>HELP</td><td class=t_hd>Del</td><tr>"
    Set RS = ExecuteStat("SELECT * FROM ExtDBpg "&_
        "LEFT JOIN ExtDBtbl ON ExtDBtbl_id=ExtDBpg_ExtDBtbl_id "&_
        "LEFT JOIN ExtDBmdl ON ExtDBpg_ExtDBmdl_id=ExtDBmdl_id "&_
        "WHERE ISNULL(ExtDBpg_pwa,0)=0 "&_
        "ORDER BY ExtDBmdl_lib,ExtDBmdl_title,ExtDBpg_menuorder,ExtDBpg_title")
    While Not RS.Eof
        If Trim(""&RS("ExtDBpg_lib").Value)>"" OR (RS("ExtDBmdl_root").Value=True) Then
            buf = buf & "<tr class='extlib'>"
        Else
            buf = buf & "<tr>"
        End If
        buf = buf & "<td class=t_td>"&RS("ExtDBmdl_title")&"<br><font color=silver>["&RS("ExtDBmdl_type")&"]</font></td><td class=t_td>"&RS("ExtDBpg_title")&"<br><font color=silver>["&RS("ExtDBtbl_title")&"]</font></td>"
        If RS("ExtDBpg_act").Value Then
            buf = buf & "<td class=t_td align=center width=90>Yes</td></td>"
        Else
            buf = buf & "<td class=t_td align=center style='color:darkred;' width=90>No</td></td>"
        End If
        If Trim(""&RS("ExtDBpg_lib").Value)>"" OR (RS("ExtDBmdl_root").Value=True AND SESSION("USER.ROOT")=False) Then
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=35><button title='Edit' onclick='extPgEdit("&RS("ExtDBPg_id")&")'><i class='icon-pencil'></button></td>"
        End If
        If Trim(""&RS("ExtDBpg_lib").Value)>"" OR (RS("ExtDBmdl_root").Value=True AND SESSION("USER.ROOT")=False) Then
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=35><button title='Reports' onclick='extPgEditViews("&RS("ExtDBpg_id")&")'><i class='glyphicon glyphicon-th-large'></button></td>"
        End If
        buf = buf & "<td class=t_td align=center width=35><button title='Access' onclick='extPgAccess("&RS("ExtDBpg_id")&")'><i class='icon-user'></button></td>"
        If RS("ExtDBpg_web")=True Then
            buf = buf & "<td class=t_td align=center width=35><button title='Web Access' onclick='PgWebAccess("&RS("ExtDBpg_id")&")'><i class='icon-eye'></button></td>"
        Else
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        End If
        If RS("ExtDBpg_pwa")=True Then
            buf = buf & "<td class=t_td align=center width=35><button title='PWA'><i class='icon-eye'></button></td>"
        Else
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        End If
        buf = buf & "<td class=t_td align=center width=35>"&RS("ExtDBpg_menuorder")&"</td>"
        buf = buf & "<td class=t_td align=center width=35><button title='Edit HELP' align=absmiddle onclick='extPgHelp("&RS("ExtDBpg_id")&")'><i class='icon-search'></button></td>"
        If Trim(""&RS("ExtDBpg_lib").Value)>"" OR (RS("ExtDBmdl_root").Value=True AND SESSION("USER.ROOT")=False) Then
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=35><button title='Delete' align=absmiddle onclick='extPgDel("&RS("ExtDBpg_id")&")'><i class='icon-remove2'></button></td>"
        End If
        buf = buf & "</tr>"
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBpgList = buf
End Function

Function ExtDBpgListPWA()
    Dim RS, RS2, buf, files
    buf = buf & "<TABLE CELLPADDING='0' CELLSPACING='0' bgcolor='white' border=0 width='100%' class='table table-striped table-bordered'>"
    buf = buf & "<tr><th class=t_hd>Module</th><th class=t_hd>Title</th><th class=t_hd>Active</th><th class=t_hd>Edit</th><th class=t_hd>Actions</th><th class=t_hd>Access</th><th class=t_hd>WEB</th><th class=t_hd>PWA</th><td class=t_hd>ORDER</td><td class=t_hd>HELP</td><td class=t_hd>Del</td><tr>"
    Set RS = ExecuteStat("SELECT * FROM ExtDBpg "&_
        "LEFT JOIN ExtDBtbl ON ExtDBtbl_id=ExtDBpg_ExtDBtbl_id "&_
        "LEFT JOIN ExtDBmdl ON ExtDBpg_ExtDBmdl_id=ExtDBmdl_id "&_
        "WHERE ExtDBpg_pwa=1 "&_
        "ORDER BY ExtDBmdl_lib,ExtDBmdl_title,ExtDBpg_menuorder,ExtDBpg_title")
    While Not RS.Eof
        If Trim(""&RS("ExtDBpg_lib").Value)>"" Then
            buf = buf & "<tr class='extlib'>"
        Else
            buf = buf & "<tr>"
        End If
        buf = buf & "<td class=t_td>"&RS("ExtDBmdl_title")&"<br><font color=silver>["&RS("ExtDBmdl_type")&"]</font></td><td class=t_td>"&RS("ExtDBpg_title")&"<br><font color=silver>["&RS("ExtDBtbl_title")&"]</font></td>"
        If RS("ExtDBpg_act").Value Then
            buf = buf & "<td class=t_td align=center width=90>Yes</td></td>"
        Else
            buf = buf & "<td class=t_td align=center style='color:darkred;' width=90>No</td></td>"
        End If
        If Trim(""&RS("ExtDBpg_lib").Value)>"" Then
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=35><button title='Edit' onclick='extPgEdit("&RS("ExtDBPg_id")&")'><i class='icon-pencil'></button></td>"
        End If
        buf = buf & "<td class=t_td align=center width=35><button title='Reports' onclick='extPgEditViews("&RS("ExtDBpg_id")&")'><i class='glyphicon glyphicon-th-large'></button></td>"
        buf = buf & "<td class=t_td align=center width=35><button title='Access' onclick='extPgAccess("&RS("ExtDBpg_id")&")'><i class='icon-user'></button></td>"
        If RS("ExtDBpg_web")=True Then
            buf = buf & "<td class=t_td align=center width=35><button title='Web Access' onclick='PgWebAccess("&RS("ExtDBpg_id")&")'><i class='icon-eye'></button></td>"
        Else
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        End If
        If RS("ExtDBpg_pwa")=True Then
            buf = buf & "<td class=t_td align=center width=35><button title='PWA'><i class='icon-eye'></button></td>"
        Else
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        End If
        buf = buf & "<td class=t_td align=center width=35>"&RS("ExtDBpg_menuorder")&"</td>"
        buf = buf & "<td class=t_td align=center width=35><button title='Edit HELP' align=absmiddle onclick='extPgHelp("&RS("ExtDBpg_id")&")'><i class='icon-search'></button></td>"
        If Trim(""&RS("ExtDBpg_lib").Value)>"" Then
            buf = buf & "<td class=t_td align=center width=35>&nbsp;</td>"
        Else
            buf = buf & "<td class=t_td align=center width=35><button title='Delete' align=absmiddle onclick='extPgDel("&RS("ExtDBpg_id")&")'><i class='icon-remove2'></button></td>"
        End If
        buf = buf & "</tr>"
        RS.MoveNext
    Wend
    buf = buf & "</table>"
    ExtDBpgListPWA = buf
End Function

Sub UpdateFieldsAccess(valId)
    Dim RS,rec
    Call Execute("DELETE FROM ExtDBpgfld WHERE ExtDBpgfld_ExtDBpg_id="&valId)
    For rec=1 To Request.Form("field_id").Count
        Call Execute("INSERT INTO ExtDBpgfld (ExtDBpgfld_ExtDBpg_id,ExtDBpgfld_ExtDBfld_id,ExtDBpgfld_access,ExtDBpgfld_ingrid) "&_
            " VALUES("&valId&","&Request.Form("field_id")(rec)&",'"&Request.Form("field_access")(rec)&"','"&Request.Form("field_ingrid")(rec)&"')")
    Next
End Sub

Sub UpdateFields(valId)
    Dim RS,Tbl,rec,fld_id,fld_title,fld_type,fld_req,fld_uniq,fld_param,fld_order,fld_filter,fld_related,fld_tooltip,fld_valid
    Dim logs : logs = "" : SESSION("ExtDBfld-CHANGES") = ""
    If Not TableExists("ExtDB"&valId&"") Then
        DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"] (ExtDB"&valId&"_id INT IDENTITY PRIMARY KEY)")
    End If
    Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
    If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_webid") Then
        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_webid] INT NULL ")
    End If
    If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_guid") Then
        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_guid] UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL")
        DBConnect.Execute("UPDATE [ExtDB"&valId&"] SET [ExtDB"&valId&"_guid] = NEWID() WHERE ExtDB"&valId&"_guid IS NULL")
    End If
    If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_demo") Then
        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_demo] BIT NULL ")
    End If
    Set RS = ExecuteStat("SELECT TOP 1 ExtDBtbl_id, ExtDBtbl_formtype, ExtDBtbl_type FROM ExtDBtbl WHERE ExtDBtbl_id='"&valId&"'")
    If RS("ExtDBtbl_formtype").Value = "CA" And RS("ExtDBtbl_type").Value = "1" Then
        Dim tblName, idxName

        tblName = "[ExtDB" & valId & "]"

        ' Field source
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_source") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_source] NVARCHAR(50) NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_source"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_source])"
        End If

        ' Field source_main
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_source_main") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_source_main] NVARCHAR(50) NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_source_main"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_source_main])"
        End If

        ' Field source_id
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_source_id") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_source_id] INT NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_source_id"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_source_id])"
        End If

        ' Field source_main_id
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_source_main_id") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_source_main_id] INT NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_source_main_id"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_source_main_id])"
        End If

        ' Field source_type
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_source_type") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_source_type] NVARCHAR(200) NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_source_type"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_source_type])"
        End If

        ' Field project_id
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_projects_id") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_projects_id] INT NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_projects_id"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_projects_id])"
        End If

        ' Field company_id
        If Not FieldExists(Tbl.Fields, "ExtDB" & valId & "_company_id") Then
            DBConnect.Execute "ALTER TABLE " & tblName & " ADD [ExtDB" & valId & "_company_id] INT NULL"
        End If
        idxName = "IX_ExtDB" & valId & "_company_id"
        If Not IndexExists(tblName, idxName) Then
            DBConnect.Execute "CREATE NONCLUSTERED INDEX [" & idxName & "] ON " & tblName & "([ExtDB" & valId & "_company_id])"
        End If
    End If
    For rec=1 To Request.Form("ExtDBfld_id").Count
        fld_id		= Request.Form("ExtDBfld_id")(rec)
        fld_title	= Request.Form("ExtDBfld_title")(rec)
        fld_type	= Request.Form("ExtDBfld_type")(rec)
        fld_req		= Request.Form("ExtDBfld_req")(rec)
        fld_uniq	= Request.Form("ExtDBfld_uniq")(rec)
        fld_param	= Replace(Request.Form("ExtDBfld_param")(rec)&"","'","`")
        fld_filter	= Replace(Request.Form("ExtDBfld_filter")(rec)&"","`","'")
        fld_order	= Request.Form("ExtDBfld_order")(rec)
        fld_related = Request.Form("ExtDBfld_related")(rec)
        fld_tooltip	= Request.Form("ExtDBfld_tooltip")(rec)
        fld_valid	= Request.Form("ExtDBfld_valid")(rec)
        If fld_title="Delete" Then
            If fld_id<>"new" Then
                Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                logs = logs & "<li>Deleted Field: ["&RS("ExtDBfld_title")&"]"
                Select Case RS("ExtDBfld_type")
                    Case 90
                        Tbl = Trim(RS("ExtDBfld_param").Value)
                        Call Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        Call Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&Tbl)
                        Call Execute("DELETE FROM ExtDBtbl WHERE ExtDBtbl_id="&Tbl)
                        'If TableExists("ExtDB"&Tbl) Then
                        '	Call Execute("DROP TABLE [ExtDB"&Tbl&"]")
                        'End If
                    Case 60
                        Call Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        Call Execute("DELETE FROM ExtDBsrv WHERE ExtDBsrv_ExtDBfld_id="&fld_id)
                        'If TableExists("ExtDB"&valId&"surv"&fld_id) Then
                        '	Call Execute("DROP TABLE [ExtDB"&valId&"surv"&fld_id&"]")
                        'End If
                    Case 2032
                        Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                        Set RS = Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        'If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id) Then
                        '	DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"]")
                        'End If
                        'If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id&"related") Then
                        '	DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"related]")
                        'End If
                    Case Else
                        Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                        Set RS = Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        'If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id) Then
                        '	DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"]")
                        'End If
                End Select
                DBConnect.Execute("IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"]') AND name = N'ExtDB"&valId&"_Fld"&fld_id&"')"&vbcrlf&" DROP INDEX [ExtDB"&valId&"_Fld"&fld_id&"] ON [dbo].[ExtDB"&valId&"] WITH ( ONLINE = OFF )")
            End If
        Else
            If fld_id<>"new" Then
                Set RS = Execute("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                If Not RS.Eof Then
                    If RS("ExtDBfld_title")<>fld_title Then 
                        RS("ExtDBfld_title").Value = fld_title
                        logs = logs & "<li>Change Field Title: from ["&RS("ExtDBfld_title")&"] to: ["&fld_title&"]"
                    End If
                    RS("ExtDBfld_req").Value = fld_req
                    RS("ExtDBfld_uniq").Value = fld_uniq
                    RS("ExtDBfld_param").Value = Replace(fld_param&"","'","`")
                    RS("ExtDBfld_filter").Value = fld_filter
                    RS("ExtDBfld_order").Value = fld_order
                    RS("ExtDBfld_related").Value = fld_related
                    RS("ExtDBfld_tooltip").Value = fld_tooltip
                    RS("ExtDBfld_valid").Value = fld_valid
                    RS.Update
                    RS.Close
                    Set RS = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                    Select Case fld_type
                        Case 60
                            'parse survey list
                            Call ParseSurveyList(valId,fld_id,fld_param)
                            If Not TableExists("ExtDB"&valId&"surv"&fld_id) Then
                                DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"surv"&fld_id&"] ("&_
                                    "ExtDB"&valId&"surv"&fld_id&"_id INT IDENTITY PRIMARY KEY"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id INT NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_item INT NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_answer NVARCHAR (50) NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_notes TEXT NULL"&_
                                ")")
                            End If
                        Case 70
                            ' SKIP for TITLE
                        Case 71
                            ' SKIP for SQLFIELD
                        Case 72
                            ' SKIP for HTML
                        Case 80
                            ' SKIP for TABS
                        Case 90
                            ' SKIP for TABS
                        Case 2032
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                            End If
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"related") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"related] "&FieldType(fld_type)&" ")
                            End If
                        Case Else
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                            End If
                    End Select
                    If fld_type=90 Then
                        Set RS = Execute("UPDATE ExtDBtbl SET ExtDBtbl_title='"&fld_title&"' WHERE ExtDBtbl_id="&fld_param)
                    End If
                End If
            Else
                Set RS = Execute("SELECT TOP 1 * FROM ExtDBfld")
                RS.AddNew
                logs = logs & "<li>Added Field: ["&fld_title&"] Type: ["&fld_type&"]"
                RS("ExtDBfld_title").Value = fld_title
                RS("ExtDBfld_type").Value = fld_type
                RS("ExtDBfld_req").Value = fld_req
                RS("ExtDBfld_uniq").Value = fld_uniq
                RS("ExtDBfld_ExtDBtbl_id").Value = valId
                RS("ExtDBfld_param").Value = Replace(fld_param&"","'","`")
                RS("ExtDBfld_filter").Value = fld_filter
                RS("ExtDBfld_order").Value = fld_order
                RS("ExtDBfld_related").Value = fld_related
                RS("ExtDBfld_tooltip").Value = fld_tooltip
                RS("ExtDBfld_valid").Value = fld_valid
                RS.Update
                RS.MoveLast
                fld_id = RS("ExtDBfld_id")
                RS.Close
                Select Case fld_type
                    Case 60
                        Call ParseSurveyList(valId,fld_id,fld_param)
                        If Not TableExists("ExtDB"&valId&"surv"&fld_id) Then
                            DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"surv"&fld_id&"] ("&_
                                "ExtDB"&valId&"surv"&fld_id&"_id INT IDENTITY PRIMARY KEY"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id INT NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_item INT NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_answer NVARCHAR (50) NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_notes TEXT NULL"&_
                            ")")
                        End If
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for SQLFIELD
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        Set RS = ExecuteStat("SELECT ExtDBtbl_title FROM ExtDBtbl WHERE ExtDBtbl_id="&valId)
                        fld_title = fld_title
                        RS.Close
                        If Trim(fld_param)="new" Then
                            Set RS = Execute("SELECT TOP 1 * FROM ExtDBtbl")
                            RS.AddNew
                            RS("ExtDBtbl_title").Value = fld_title
                            RS("ExtDBtbl_type").Value = 2
                            RS.Update
                            RS.MoveLast
                            fld_param = RS("ExtDBtbl_id")
                            RS.Close
                            Set RS = Execute("UPDATE ExtDBfld SET ExtDBfld_param='"&fld_param&"' WHERE ExtDBfld_id="&fld_id)
                            If Not TableExists("ExtDB"&fld_param&"") Then
                                DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&fld_param&"] (ExtDB"&fld_param&"_id INT IDENTITY PRIMARY KEY, ExtDB"&fld_param&"_ExtDB"&valId&"_id INT NULL)")
                            End If
                        Else
                            Set RS = Execute("UPDATE ExtDBtbl SET ExtDBtbl_title='"&fld_title&"' WHERE ExtDBtbl_id="&fld_param)
                        End If
                    Case 2032
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"related] "&FieldType(fld_type)&" ")
                    Case Else
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                End Select
            End If
            Select Case fld_type
                Case 30,31,32,33
                    DBConnect.Execute("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"]') AND name = N'ExtDB"&valId&"_Fld"&fld_id&"')"&vbcrlf&" CREATE NONCLUSTERED INDEX [ExtDB"&valId&"_Fld"&fld_id&"] ON [dbo].[ExtDB"&valId&"] ( [ExtDB"&valId&"_Fld"&fld_id&"] )")
                Case 60
                    DBConnect.Execute("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"surv"&fld_id&"]') AND name = N'ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id')"&vbcrlf&" CREATE NONCLUSTERED INDEX [ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id] ON [dbo].[ExtDB"&valId&"surv"&fld_id&"] ( [ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id] )")
            End Select
        End If
    Next
    SESSION("ExtDBfld-CHANGES") = logs
End Sub

Sub UpdateTable(valId,mainId)
    Dim RS,Tbl,rec,fld_id,fld_title,fld_type,fld_req,fld_uniq,fld_param,fld_order,fld_filter,fld_related,fld_tooltip
    If Not TableExists("ExtDB"&valId&"") Then
        DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"] (ExtDB"&valId&"_id INT IDENTITY PRIMARY KEY)")
    End If
    Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
    If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_webid") Then
        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_webid] INT NULL ")
    End If
    If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_guid") Then
        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_guid] UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL")
        DBConnect.Execute("UPDATE [ExtDB"&valId&"] SET [ExtDB"&valId&"_guid] = NEWID() WHERE ExtDB"&valId&"_guid IS NULL")
    End If
    If mainId>0 Then
        If Not FieldExists(Tbl.Fields,"ExtDB"&valId&"_ExtDB"&mainId&"_id") Then
            DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_ExtDB"&mainId&"_id] INT NULL ")
        End If
    End If
    Dim configRS : Set configRS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valId)
    While Not configRS.Eof
        fld_id		= configRS("ExtDBfld_id")
        fld_title	= configRS("ExtDBfld_title")
        fld_type	= configRS("ExtDBfld_type")
        fld_req		= configRS("ExtDBfld_req")
        fld_uniq	= configRS("ExtDBfld_uniq")
        fld_param	= Replace(configRS("ExtDBfld_param")&"","'","`")
        fld_filter	= Replace(configRS("ExtDBfld_filter")&"","`","'")
        fld_order	= configRS("ExtDBfld_order")
        fld_related = configRS("ExtDBfld_related")
        fld_tooltip	= configRS("ExtDBfld_tooltip")
        If fld_title="Delete" Then
            If fld_id<>"new" Then
                Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                Select Case RS("ExtDBfld_type")
                    Case 90
                        Tbl = Trim(RS("ExtDBfld_param").Value)
                        Call Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&Tbl)
                        Call Execute("DELETE FROM ExtDBtbl WHERE ExtDBtbl_id="&Tbl)
                        If TableExists("ExtDB"&Tbl) Then
                            Call Execute("DROP TABLE [ExtDB"&Tbl&"]")
                        End If
                    Case 60
                        Call Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&fld_id)
                        Call Execute("DELETE FROM ExtDBsrv WHERE ExtDBsrv_ExtDBfld_id="&fld_id)
                        If TableExists("ExtDB"&valId&"surv"&fld_id) Then
                            Call Execute("DROP TABLE [ExtDB"&valId&"surv"&fld_id&"]")
                        End If
                    Case 2032
                        Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                        Set RS = Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id) Then
                            DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"]")
                        End If
                        If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id&"related") Then
                            DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"related]")
                        End If
                    Case Else
                        Set Tbl = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                        Set RS = Execute("DELETE FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                        If FieldExists(Tbl.Fields,"ExtDB"&valId&"_Fld"&fld_id) Then
                            DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] DROP COLUMN [ExtDB"&valId&"_Fld"&fld_id&"]")
                        End If
                End Select
                DBConnect.Execute("IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"]') AND name = N'ExtDB"&valId&"_Fld"&fld_id&"')"&vbcrlf&" DROP INDEX [ExtDB"&valId&"_Fld"&fld_id&"] ON [dbo].[ExtDB"&valId&"] WITH ( ONLINE = OFF )")
            End If
        Else
            If fld_id<>"new" Then
                Set RS = Execute("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&fld_id)
                If Not RS.Eof Then
                    If RS("ExtDBfld_title")<>fld_title Then 
                        RS("ExtDBfld_title").Value = fld_title
                    End If
                    RS("ExtDBfld_req").Value = fld_req
                    RS("ExtDBfld_uniq").Value = fld_uniq
                    RS("ExtDBfld_param").Value = Replace(fld_param&"","'","`")
                    RS("ExtDBfld_filter").Value = fld_filter
                    RS("ExtDBfld_order").Value = fld_order
                    RS("ExtDBfld_related").Value = fld_related
                    RS("ExtDBfld_tooltip").Value = fld_tooltip
                    RS.Update
                    RS.Close
                    Set RS = ExecuteStat("SELECT TOP 1 * FROM [ExtDB"&valId&"]")
                    Select Case fld_type
                        Case 60
                            'parse survey list
                            Call ParseSurveyList(valId,fld_id,fld_param)
                            If Not TableExists("ExtDB"&valId&"surv"&fld_id) Then
                                DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"surv"&fld_id&"] ("&_
                                    "ExtDB"&valId&"surv"&fld_id&"_id INT IDENTITY PRIMARY KEY"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id INT NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_item INT NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_answer NVARCHAR (50) NULL"&_
                                    ",ExtDB"&valId&"surv"&fld_id&"_notes TEXT NULL"&_
                                ")")
                            End If
                        Case 70
                            ' SKIP for TITLE
                        Case 71
                            ' SKIP for SQLFIELD
                        Case 72
                            ' SKIP for HTML
                        Case 80
                            ' SKIP for TABS
                        Case 90
                            ' SKIP for TABS
                        Case 2032
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                            End If
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"related") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"related] "&FieldType(fld_type)&" ")
                            End If
                        Case Else
                            If Not FieldExists(RS.Fields,"ExtDB"&valId&"_Fld"&fld_id&"") Then
                                DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                            End If
                    End Select
                    If fld_type=90 Then
                        Set RS = Execute("UPDATE ExtDBtbl SET ExtDBtbl_title='"&fld_title&"' WHERE ExtDBtbl_id="&fld_param)
                    End If
                End If
            Else
                Set RS = Execute("SELECT TOP 1 * FROM ExtDBfld")
                RS.AddNew
                RS("ExtDBfld_title").Value = fld_title
                RS("ExtDBfld_type").Value = fld_type
                RS("ExtDBfld_req").Value = fld_req
                RS("ExtDBfld_uniq").Value = fld_uniq
                RS("ExtDBfld_ExtDBtbl_id").Value = valId
                RS("ExtDBfld_param").Value = Replace(fld_param&"","'","`")
                RS("ExtDBfld_filter").Value = fld_filter
                RS("ExtDBfld_order").Value = fld_order
                RS("ExtDBfld_related").Value = fld_related
                RS("ExtDBfld_tooltip").Value = fld_tooltip
                RS.Update
                RS.MoveLast
                fld_id = RS("ExtDBfld_id")
                RS.Close
                Select Case fld_type
                    Case 60
                        Call ParseSurveyList(valId,fld_id,fld_param)
                        If Not TableExists("ExtDB"&valId&"surv"&fld_id) Then
                            DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&valId&"surv"&fld_id&"] ("&_
                                "ExtDB"&valId&"surv"&fld_id&"_id INT IDENTITY PRIMARY KEY"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id INT NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_item INT NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_answer NVARCHAR (50) NULL"&_
                                ",ExtDB"&valId&"surv"&fld_id&"_notes TEXT NULL"&_
                            ")")
                        End If
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for SQLFIELD
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        Set RS = ExecuteStat("SELECT ExtDBtbl_title FROM ExtDBtbl WHERE ExtDBtbl_id="&valId)
                        fld_title = fld_title
                        RS.Close
                        If Trim(fld_param)="new" Then
                            Set RS = Execute("SELECT TOP 1 * FROM ExtDBtbl")
                            RS.AddNew
                            RS("ExtDBtbl_title").Value = fld_title
                            RS("ExtDBtbl_type").Value = 2
                            RS.Update
                            RS.MoveLast
                            fld_param = RS("ExtDBtbl_id")
                            RS.Close
                            Set RS = Execute("UPDATE ExtDBfld SET ExtDBfld_param='"&fld_param&"' WHERE ExtDBfld_id="&fld_id)
                            If Not TableExists("ExtDB"&fld_param&"") Then
                                DBConnect.Execute("CREATE TABLE [dbo].[ExtDB"&fld_param&"] (ExtDB"&fld_param&"_id INT IDENTITY PRIMARY KEY, ExtDB"&fld_param&"_ExtDB"&valId&"_id INT NULL)")
                            End If
                        Else
                            Set RS = Execute("UPDATE ExtDBtbl SET ExtDBtbl_title='"&fld_title&"' WHERE ExtDBtbl_id="&fld_param)
                        End If
                    Case 2032
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"related] "&FieldType(fld_type)&" ")
                    Case Else
                        DBConnect.Execute("ALTER TABLE [ExtDB"&valId&"] ADD [ExtDB"&valId&"_Fld"&fld_id&"] "&FieldType(fld_type)&" ")
                End Select
            End If
            Select Case fld_type
                Case 30,31,32,33
                    DBConnect.Execute("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"]') AND name = N'ExtDB"&valId&"_Fld"&fld_id&"')"&vbcrlf&" CREATE NONCLUSTERED INDEX [ExtDB"&valId&"_Fld"&fld_id&"] ON [dbo].[ExtDB"&valId&"] ( [ExtDB"&valId&"_Fld"&fld_id&"] )")
                Case 60
                    DBConnect.Execute("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ExtDB"&valId&"surv"&fld_id&"]') AND name = N'ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id')"&vbcrlf&" CREATE NONCLUSTERED INDEX [ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id] ON [dbo].[ExtDB"&valId&"surv"&fld_id&"] ( [ExtDB"&valId&"surv"&fld_id&"_ExtDB"&valId&"_id] )")
            End Select
        End If
        configRS.MoveNext
    Wend
End Sub

Function FieldType(valType)
    Dim fld_type
    Select Case toInt(valType)
        Case 3,30,31,32,33,205
            fld_type = "INT NULL"
        Case 6
            fld_type = "MONEY NULL"
        Case 131
            fld_type = "FLOAT NULL"
        Case 135,136
            fld_type = "DATETIME NULL"
        Case 200
            fld_type = "NVARCHAR (255) NULL"
        Case 201
            fld_type = "NVARCHAR (MAX) NULL"
        Case 2011
            fld_type = "NVARCHAR (MAX) NULL"
        Case 2012
            fld_type = "NVARCHAR (MAX) NULL"
        Case 202
            fld_type = "NVARCHAR (255) NULL"
        Case 204
            fld_type = "NVARCHAR (255) NULL"
        Case 2030,2031,2032
            fld_type = "NVARCHAR (255) NULL"
        Case 90
            fld_type = "TEXT NULL"
    End Select
    FieldType = fld_type
End Function

Sub updateTemplate(valParam)
    Dim RS,csv_header,csv_line
    Dim file
    CheckFolder(SESSION("FILESDIR")&"ExtDB\")
    Set RS = ExecuteStat("SELECT ExtDBtbl_title FROM ExtDBtbl WHERE ExtDBtbl_id="&valParam)
    file = SESSION("FILESDIR")&"ExtDB\"&Replace(RS("ExtDBtbl_title").Value," ","_")&".csv"
    Set RS = ExecuteStat("SELECT ExtDBfld_title,ExtDBfld_related,ExtDBfld_type FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" ORDER BY ExtDBfld_order")
    While Not RS.Eof
        Select Case toInt(RS("ExtDBfld_type").Value)
            Case 3,205
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & "123456789,"
            Case 6
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & "$1234.00,"
            Case 131
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & "0.001,"
            Case 135,136
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & Date() & ","
            Case 200
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 201
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 2011
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 2012
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 202
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 204
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 2030,2031
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """Sample Text"","
            Case 2032
                csv_header = csv_header & RS("ExtDBfld_title") &"," & RS("ExtDBfld_related") &","
                csv_line = csv_line & """Sample Text""," & """Sample Text"","
            Case 30
                ' SKIP for LOOKUP
            Case 31
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """ProjectID, ProjectName"","
            Case 32
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """FirstName, LastName"","
            Case 33
                csv_header = csv_header & RS("ExtDBfld_title") &","
                csv_line = csv_line & """CompanyName"","
            Case 60
                ' SKIP for SURVEY
            Case 70
                ' SKIP for TABS
            Case 71
                ' SKIP for SQLFIELD
            Case 72
                ' SKIP for HTML
            Case 80
                ' SKIP for TABS
            Case 90
                'SKIP for SUBFORM
        End Select
        RS.MoveNext
    Wend
    Call saveFile(file, csv_header & VbCrLf & csv_line)
End Sub

Sub updateReports()
    Dim RS,RS2,subRS,SQL
    Dim file, str, join , subTable, fld, fldTitle
    CheckFolder(SESSION("FILESDIR")&"ExtDB\")
    file = SESSION("FILESDIR")&"ExtDB\reports.xml"
    str = str & "<root>" & VbCrLf
    Set RS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE (ExtDBtbl_type IS NULL OR ExtDBtbl_type NOT IN (2)) AND ExtDBtbl_report <> 0 ORDER BY ExtDBtbl_title")
    While Not RS.Eof
        join = ""
        fld = ""
        SQL = ""
        str = str & "	<sql module=""EXTDB"" name=""report_"&"ExtDB"&RS("ExtDBtbl_id")&""" title="""&Replace(RS("ExtDBtbl_title"),"&","&amp;")&"""><![CDATA[" & VbCrLf
        SQL = SQL & "		SELECT " & VbCrLf
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&RS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
        SQL = SQL & "			" & "ExtDB"&RS("ExtDBtbl_id")&"_id AS [Doc.#]" & VbCrLf
        While Not RS2.Eof
            If InStr(fld,"["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(RS2("ExtDBfld_title"))<50 Then
                Select Case RS2("ExtDBfld_type").Value
                    Case 201,2011
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"CAST(ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS VARCHAR(1000)) AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 30
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 31
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_projectscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 32
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_userscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 33
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_maincompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 60
                        ' SKIP for SURVEY
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,(SELECT (100*dbo.esscountval(ISNULL(ExtDB"&RS("ExtDBtbl_id")&"surv"&RS2("ExtDBfld_id").Value&"_answer,0),'"&getSurvPassAnswers(RS2("ExtDBfld_param").Value)&"','|')/NULLIF(COUNT(1),0)) "&_
                            "FROM ExtDBsrv LEFT JOIN ExtDB"&RS("ExtDBtbl_id")&"surv"&RS2("ExtDBfld_id").Value&" "&_
                            "ON (ExtDBsrv_id=ExtDB"&RS("ExtDBtbl_id")&"surv"&RS2("ExtDBfld_id").Value&"_item "&_
                            "AND ExtDB"&RS("ExtDBtbl_id")&"surv"&RS2("ExtDBfld_id").Value&"_ExtDB"&RS("ExtDBtbl_id")&"_id=ExtDB"&RS("ExtDBtbl_id")&"_id)) AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        'SQL = SQL & "			,"&Replace(RS2("ExtDBfld_param"), "`", "'")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORM
                    Case 2032
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        fld = fld & "["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"related AS ["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]" & VbCrLf
                    Case Else
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                End Select
            End If
            RS2.MoveNext
        Wend
        SQL = SQL & "		FROM [dbo].["&"ExtDB"&RS("ExtDBtbl_id")&"view]" & VbCrLf
        SQL = SQL & "		"&join & VbCrLf
        str = str & SQL
        Call checkSQL("report_ExtDB"&RS("ExtDBtbl_id"),SQL)
        str = str & "		]]></sql>" & VbCrLf
        RS.MoveNext
    Wend
    Set RS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE (ExtDBtbl_type IS NULL OR ExtDBtbl_type IN (2)) AND ExtDBtbl_report <> 0 ORDER BY ExtDBtbl_title")
    While Not RS.Eof
        join = ""
        fld = ""
        SQL = ""
        Set subRS = ExecuteStat("SELECT ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_type=90 AND CAST(ExtDBfld_param AS VARCHAR)='"&RS("ExtDBtbl_id")&"'")
        subTable = subRS(0)
        Set subRS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&subTable&"")
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&subTable&" ORDER BY ExtDBfld_order")
        str = str & "	<sql module=""EXTDB"" name=""report_"&"ExtDB"&RS("ExtDBtbl_id")&""" title="""&Replace(subRS("ExtDBtbl_title"),"&","&amp;")&" / "&Replace(RS("ExtDBtbl_title"),"&","&amp;")&"""><![CDATA[" & VbCrLf
        SQL = SQL & "		SELECT " & VbCrLf
        SQL = SQL & "			" & "t"&subTable&".ExtDB"&subTable&"_id AS [Doc.#]" & VbCrLf
        SQL = SQL & "			" & ",ExtDB"&RS("ExtDBtbl_id")&"_id AS [Item.#]" & VbCrLf
        While Not RS2.Eof
            If InStr(fld,"["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(RS2("ExtDBfld_title"))<50 Then
                Select Case RS2("ExtDBfld_type").Value
                    Case 201,2011
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"CAST(t"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&" AS VARCHAR(1000)) AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 30
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"t"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 31
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_projectscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 32
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_userscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 33
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,t"&subTable&"."&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_maincompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 60
                        ' SKIP for SURVEY
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for TITLE
                        'SQL = SQL & "			,"&RS2("ExtDBfld_param")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORMS
                    Case 2032
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"t"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        fld = fld & "["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"t"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&"related AS ["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]" & VbCrLf
                    Case Else
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"t"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                End Select
            End If
            RS2.MoveNext
        Wend
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&RS("ExtDBtbl_id")&" ORDER BY ExtDBfld_order")
        While Not RS2.Eof
            If InStr(fld,"["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]")=0 Then
                Select Case RS2("ExtDBfld_type").Value
                    Case 201,2011
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"CAST(ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS VARCHAR(1000)) AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 30
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 31
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_projectscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 32
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_userscompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 33
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_maincompany AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&" Division]" & VbCrLf
                    Case 60
                        ' SKIP for SURVEY
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for TITLE
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORMS
                    Case 2032
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                        fld = fld & "["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"related AS ["&Replace(RS2("ExtDBfld_related"),"&","&amp;")&"]" & VbCrLf
                    Case Else
                        fld = fld & "["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]"
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]" & VbCrLf
                End Select
            End If
            '' REPEAT for Alias
                fldTitle = Replace(RS("ExtDBtbl_title"),"&","&amp;") & " :: " & Replace(RS2("ExtDBfld_title"),"&","&amp;")
                Select Case RS2("ExtDBfld_type").Value
                    Case 201,2011
                        SQL = SQL & "			,"&"CAST(ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS VARCHAR(1000)) AS ["& fldTitle &"]" & VbCrLf
                    Case 30
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"_name AS ["& fldTitle &"]" & VbCrLf
                        Call addReportCrossLookup(RS2,SQL,fldTitle)
                    Case 31
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["& fldTitle &"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_projectscompany AS ["& fldTitle &" Division]" & VbCrLf
                    Case 32
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["& fldTitle &"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_userscompany AS ["& fldTitle &" Division]" & VbCrLf
                    Case 33
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_name AS ["& fldTitle &"]" & VbCrLf
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&""&RS2("ExtDBfld_id")&"_maincompany AS ["& fldTitle &" Division]" & VbCrLf
                    Case 60
                        ' SKIP for SURVEY
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for TITLE
                        SQL = SQL & "			,"&RS2("ExtDBfld_param")&" AS ["& fldTitle &"]" & VbCrLf
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORMS
                    Case 2032
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["& fldTitle &"]" & VbCrLf
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"related AS ["& fldTitle &"]" & VbCrLf
                    Case Else
                        SQL = SQL & "			,"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&" AS ["& fldTitle &"]" & VbCrLf
                End Select
            ''
            RS2.MoveNext
        Wend
        SQL = SQL & "		FROM [dbo].["&"ExtDB"&RS("ExtDBtbl_id")&"view]" & VbCrLf
        SQL = SQL & "		LEFT JOIN ExtDB"&subTable&"view as t"&subTable&" ON t"&subTable&".ExtDB"&subTable&"_id=ExtDB"&RS("ExtDBtbl_id")&"view.ExtDB"&RS("ExtDBtbl_id")&"_ExtDB"&subTable&"_id " & VbCrLf
        str = str & SQL
        Call checkSQL("report_ExtDB"&RS("ExtDBtbl_id"),SQL)
        str = str & "		]]></sql>" & VbCrLf
        RS.MoveNext
    Wend
    str = str & "</root>" & VbCrLf
    Call saveFile(file, str)
End Sub

Function SaveExtFile(valFO,valTable)
    Dim oFile, oFs,fName
    Set oFile = valFO.File(1)
    CheckFolder(SESSION("FILESDIR")&"ExtDB\"&valTable&"\")
    Dim cYear,cMonth,cDay
    cYear = Year(Date())
    cMonth = Month(Date())
        If Len(cMonth)<2 Then cMonth = "0"&cMonth
    cDay = Day(Date())
        If Len(cDay)<2 Then cDay = "0"&cDay
    fName = SESSION("FILESDIR")&"ExtDB\"&valTable&"\"&cYear&cMonth&cDay&"_"&Replace(FormatDateTime(Time, vbShortTime),":","")&".csv"
    oFile.SaveAs fName
    SaveExtFile = fName
    Set oFile = Nothing
End Function

Function getFieldsList(valParam,valName)
    Dim RS, str
    Set RS = ExecuteStat("SELECT ExtDBfld_id,ExtDBfld_title FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam)
    str = str & "<option value='skip' style='background:silver'>*ignore*</option>"
    While Not RS.Eof
        If valName = RS("ExtDBfld_title") Then 
            str = str & "<option value='"&RS("ExtDBfld_id")&"' selected>"&RS("ExtDBfld_title")&"</option>"
        Else
            str = str & "<option value='"&RS("ExtDBfld_id")&"'>"&RS("ExtDBfld_title")&"</option>"
        End If
        RS.MoveNext
    Wend
    getFieldsList = str
End Function

Function getOrderList(valParam)
    Dim RS, str : str = ""
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" order by ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case "30"
                str = str & "<option value='ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name'>"&RS("ExtDBfld_title")&"</option>"
            Case "31","32","33"
                str = str & "<option value='"&RS("ExtDBfld_param").Value&RS("ExtDBfld_id").Value&"_name'>"&RS("ExtDBfld_title")&"</option>"
            Case Else
                str = str & "<option value='ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"'>"&RS("ExtDBfld_title")&"</option>"
        End Select
        RS.MoveNext
    Wend
    getOrderList = str
End Function

Function getWebByList(valParam)
    Dim RS, str : str = ""
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" order by ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case "32"
                str = str & "<option value='"&RS("ExtDBfld_id").Value&"'>"&RS("ExtDBfld_title")&"</option>"
        End Select
        RS.MoveNext
    Wend
    getWebByList = str
End Function

Function getWebDateList(valParam)
    Dim RS, str : str = ""
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" order by ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case "135","136"
                str = str & "<option value='"&RS("ExtDBfld_id").Value&"'>"&RS("ExtDBfld_title")&"</option>"
        End Select
        RS.MoveNext
    Wend
    getWebDateList = str
End Function

Function getWebStatusList(valParam)
    Dim RS, str : str = ""
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" order by ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case "2030"
                str = str & "<option value='"&RS("ExtDBfld_id").Value&"'>"&RS("ExtDBfld_title")&"</option>"
        End Select
        RS.MoveNext
    Wend
    getWebStatusList = str
End Function

Function getWebPageList(web)
    Dim RS, str : str = ""
    Dim sql_w : sql_w = "ExtDBpg_web=1"
    If web <> "True" Then
        sql_w = "ExtDBpg_pwa=1"
    End If
    Set RS = ExecuteStat("SELECT * FROM ExtDBpg LEFT JOIN ExtDBtbl ON ExtDBtbl_id=ExtDBpg_ExtDBtbl_id WHERE "&sql_w&" AND ExtDBtbl_formtype='CA' AND ExtDBtbl_type='1' order by ExtDBpg_title ASC")
    While Not RS.Eof
        str = str & "<option value='"&RS("ExtDBpg_id").Value&"'>"&RS("ExtDBpg_title")&"</option>"
        RS.MoveNext
    Wend
    getWebPageList = str
End Function

Sub fromcsv_step2(valFile)
    Dim fileName,filePath
    If CheckFile(Server.MapPath(valFile)) Then
        valFile = Server.MapPath(valFile)
        valFile = Replace(valFile,"/","\")
        fileName = Replace(valFile,SESSION("FILESDIR")&"ExtDB\Tmp\","")
        filePath = Replace(valFile,fileName,"")
        Dim ExtDBConnect : Set ExtDBConnect = CreateObject("ADODB.Connection")
        Dim RS : Set RS = Server.CreateObject("ADODB.Recordset")
        ExtDBConnect.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" & filePath & ";Extended Properties=""Text;HDR=YES;FMT=Delimited;"";"
        RS.Open "SELECT TOP 1 * FROM ["&fileName&"]", ExtDBConnect, adOpenStatic, adLockOptimistic, adCmdText
        Dim tree : Set tree = SESSION("ess107_AppLibWSC").jsArray()
        Dim fld
        For Each fld In RS.Fields
            Set tree(Null) = SESSION("ess107_AppLibWSC").jsObject()
            tree(Null)("name") = fld.Name
            tree(Null)("type") = fld.Type
        Next
        GUI.Template.SetVariable "TREE", tree.jsString
    Else
        echo "error","<div style='color:red'>Can'n Open file ["&valFile&"]</div>"
        Response.Flush : Response.End
    End If
End Sub

Sub ImportStep_1(valTable,valParam,valFile)
    Dim ExtDBConnect,RS,fileName,filePath,str,fld
    valFile = Replace(valFile,"/","\")
    fileName = Replace(valFile,SESSION("FILESDIR")&"ExtDB\"&valTable&"\","")
    filePath = Replace(valFile,fileName,"")
    Set ExtDBConnect = CreateObject("ADODB.Connection")
    Set RS = Server.CreateObject("ADODB.Recordset")
    ExtDBConnect.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" & FilePath & ";Extended Properties=""Text;HDR=YES;FMT=Delimited;"";"
    
    RS.Open "SELECT * FROM ["&fileName&"]", ExtDBConnect, adOpenStatic, adLockOptimistic, adCmdText
    For Each fld In RS.Fields
        str = str & "<TR>"
        str = str & "<TD class=t_td><INPUT TYPE=hidden NAME='FldName' VALUE="""&fld.Name&"""><b>"&fld.Name&"</b></TD>"
        str = str & "<TD class=t_td><SELECT NAME=ExtDBfld_id style='width:150px;'>"&getFieldsList(valParam,fld.Name)&"</SELECT></TD>"
        If Request("targetForm")<>"main" Then
            str = str & "<TD class=t_td align=center><INPUT TYPE=checkbox NAME='compare' style='width:16px;border:0px;background:;display:none;' VALUE='"&fld.Name&"'></TD>"
        Else
            str = str & "<TD class=t_td align=center><INPUT TYPE=checkbox NAME='compare' style='width:16px;border:0px;background:;' VALUE='"&fld.Name&"'></TD>"
        End If
        str = str & "</TR>"
    Next
    GUI.Template.SetVariable "FIELDS_LIST", str
    If Request("targetForm")<>"main" Then
        str = ""
        For Each fld In RS.Fields
            str = str & "<TR>"
            str = str & "<TD class=t_td><INPUT TYPE=hidden NAME='main_FldName' VALUE="""&fld.Name&"""><b>"&fld.Name&"</b></TD>"
            str = str & "<TD class=t_td><SELECT NAME=main_ExtDBfld_id style='width:150px;'>"&getFieldsList(Request("targetForm"),fld.Name)&"</SELECT></TD>"
            str = str & "</TR>"
        Next
        GUI.Template.SetVariable "MAINFIELDS_LIST", str
    End If
    RS.Close
End Sub

Sub ImportStep_2(valParam)
    echo 1,"start"
    Dim fileName,filePath,valFile
    valFile = Replace(Request.Form("ExtFile"),"/","\")
    Call CheckFolder(SESSION("FILESDIR")&"ExtDB\"&Request.Form("table")&"\")
    fileName = Replace(valFile,SESSION("FILESDIR")&"ExtDB\"&Request.Form("table")&"\","")
    filePath = Replace(valFile,fileName,"")
    echo 2,"prepare file"
    Dim shell : Set shell = Server.CreateObject("Wscript.Shell")
    Dim sPath : sPath = SESSION("FILESDIR")&"ExtDB\"&Request.Form("table")&"\"
    Dim cmd : Set cmd = shell.Exec(Server.MapPath("\Scripts\cmd.exe")&" /C "&Server.MapPath("\Scripts\csv2xml\c2x-cmd.exe") & " -s:"&filePath&"\"&fileName&" -t:"&sPath&"data.xml -sep:, -m:3 -e:UTF-8")
    Dim cmd_out : cmd_out = cmd.stdout.readAll
    Dim cmd_err : cmd_err = cmd.stderr.readAll
    Set shell = Nothing
    If cmd_err>"" Then 
        echo "error",cmd_err
        SESSION("IMPORT.LOG") = cmd_err
        Response.Flush
        Response.End
    End If
    Dim cnt : cnt = 0
    For fld=1 To Request.Form("FldName").Count
        If Request.Form("ExtDBfld_id")(fld) <> "skip" Then
            cnt = cnt + 1
        End If
    Next
    If cnt=0 Then
        echo "error","<div style='color:red'>No any Fields for Import.</div>"
        SESSION("IMPORT.LOG") = "<div style='color:red'>No any Fields for Import.</div>"
        Response.Flush
        Response.End
    End If
    Dim RS, sqlTPL, tbl, compare_flds
    tbl = Request.Form("table")
    Select Case Request.Form("mode")
        Case "append"
            sqlTPL = readFile(Server.MapPath("Import_insert.sql"))
            sqlTPL = Replace(sqlTPL,"{{CLEAR}}","")
            compare_flds = "|"
            For fld=1 To Request.Form("compare").Count
                compare_flds = compare_flds & Request.Form("compare")(fld) & "|"
            Next
        Case "clearappend"
            sqlTPL = readFile(Server.MapPath("Import_insert.sql"))
            sqlTPL = Replace(sqlTPL,"{{CLEAR}}","TRUNCATE TABLE ["&tbl&"]")
        Case "update"
            sqlTPL = readFile(Server.MapPath("Import_update.sql"))
            compare_flds = "|"
            For fld=1 To Request.Form("compare").Count
                compare_flds = compare_flds & Request.Form("compare")(fld) & "|"
            Next
            If Len(compare_flds)<2 Then
                echo 3, "Nothing for comparing" 
                Response.End
            End If
    End Select
    'Fix file
    If CheckFile(sPath&"data.xml") Then
        Dim fileTmp : fileTmp = readFile(sPath&"data.xml")
        fileTmp = Replace(fileTmp,"<item name="" ","<item name=""")
        Call saveFile(sPath&"data.xml",fileTmp)
    End If
    '
    ''sqlTPL = Replace(sqlTPL,"{{FILE}}",sPath&"data.xml")
    sqlTPL = Replace(sqlTPL,"{{IMPORTID}}",InsertImportData(sPath&"data.xml") )

    Dim block1 : Set block1 = SESSION("ess107_AppLib").classString()
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&"")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case 200,202,204,2030,2031,2032
                block1.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS")
            Case 201,2011,2012
                block1.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" VARCHAR(1000) COLLATE SQL_Latin1_General_CP1_CI_AS")
            Case 135,136
                block1.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" datetime")
            Case 3,131,6,205
                block1.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" float")
            Case 30,31,32,33
                block1.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" VARCHAR(255)")
        End Select
        RS.MoveNext
    Wend
    If Request("targetForm") <> "main" Then
        block1.Append("ExtDB"&valParam&"_ExtDB"&Request("targetForm")&"_id float")
    End If
    sqlTPL = Replace(sqlTPL,"{{BLOCK1}}",block1.JoinToString(","))
    Dim block2 : Set block2 = SESSION("ess107_AppLib").classString()
    Dim block3 : Set block3 = SESSION("ess107_AppLib").classString()
    Dim block4 : Set block4 = SESSION("ess107_AppLib").classString()
    Dim block4d : Set block4d = SESSION("ess107_AppLib").classString()
    Dim block5 : Set block5 = SESSION("ess107_AppLib").classString()
    Dim block6 : Set block6 = SESSION("ess107_AppLib").classString()
    Dim block7 : Set block7 = SESSION("ess107_AppLib").classString()
    Dim block8 : Set block8 = SESSION("ess107_AppLib").classString()
    Dim fld
    Dim main_FldName
    block8.Append("1=1")
    If Request("targetForm")<>"main" Then
        For fld=1 To Request.Form("main_FldName").Count
            If Request.Form("main_ExtDBfld_id")(fld) <> "skip" Then
                Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&Request.Form("main_ExtDBfld_id")(fld))
                main_FldName = Replace(Request.Form("main_FldName")(fld),"'","''")
                Select Case RS("ExtDBfld_type")
                    Case 200,202,204,2030,2031,2032
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"")
                    Case 201,2011,2012
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" varchar(1000) 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"")
                    Case 135,136
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" datetime 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"")
                    Case 3,131,6,205
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" float 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"")
                    Case 31
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=projects"&RS("ExtDBfld_id")&"_name")
                    Case 32
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=users"&RS("ExtDBfld_id")&"_name")
                    Case 33
                        block2.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                        block8.Append("_ExtDB"&Request("targetForm")&"_Fld"&RS("ExtDBfld_id")&"=company"&RS("ExtDBfld_id")&"_name")
                End Select
            End If
        Next
        block4.Append("ExtDB"&valParam&"_ExtDB"&Request("targetForm")&"_id")
        block5.Append("ExtDB"&valParam&"_ExtDB"&Request("targetForm")&"_id")
        block4d.Append("(select top 1 ExtDB"&Request("targetForm")&"_id from ExtDB"&Request("targetForm")&"view as cr where "&_
        block8.JoinToString(" and ")&")")
    End if
    For fld=1 To Request.Form("FldName").Count
        If Request.Form("ExtDBfld_id")(fld) <> "skip" Then
            Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" AND ExtDBfld_id="&Request.Form("ExtDBfld_id")(fld))
            main_FldName = Replace(Request.Form("FldName")(fld),"'","''")
            Select Case RS("ExtDBfld_type")
                Case 200,202,204,2030,2031,2032
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    End If
                Case 201,2011,2012
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" varchar(1000) 'item[@name="""&main_FldName&"""]'")
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    End If
                Case 135,136
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" datetime 'item[@name="""&main_FldName&"""]'")
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("NULLIF(_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&",'')")
                    block5.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    End If
                Case 3,131,205
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" float 'item[@name="""&main_FldName&"""]'")
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    End If
                Case 6
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" float 'item[@name="""&main_FldName&"""]'")
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("CAST(_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" as MONEY)")
                    block5.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    End If
                Case 31
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                    block3.Append(Replace(readFile(Server.MapPath("Import_check_projects.sql")),"{{FIELD}}","ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&""))
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("p"&RS("ExtDBfld_id")&".projects_id as ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block6.Append("left join projects as p"&RS("ExtDBfld_id")&" on p"&RS("ExtDBfld_id")&".projects_id = (select top 1 projects_id from projects where projects_num+', '+projects_name=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&")")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=p"&RS("ExtDBfld_id")&".projects_id")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=p"&RS("ExtDBfld_id")&".projects_id")
                    End If
                Case 32
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                    block3.Append(Replace(readFile(Server.MapPath("Import_check_users.sql")),"{{FIELD}}","ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&""))
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("u"&RS("ExtDBfld_id")&".users_id as ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block6.Append("left join users as u"&RS("ExtDBfld_id")&" on u"&RS("ExtDBfld_id")&".users_id = (select top 1 users_id from users where users_firstname+' '+users_lastname=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&")")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=u"&RS("ExtDBfld_id")&".users_id")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=u"&RS("ExtDBfld_id")&".users_id")
                    End If
                Case 33
                    block2.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&" varchar(255) 'item[@name="""&main_FldName&"""]'")
                    block3.Append(Replace(readFile(Server.MapPath("Import_check_company.sql")),"{{FIELD}}","ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&""))
                    block4.Append("ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block4d.Append("_ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block5.Append("c"&RS("ExtDBfld_id")&".company_id as ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"")
                    block6.Append("left join company as c"&RS("ExtDBfld_id")&" on c"&RS("ExtDBfld_id")&".company_id = (select top 1 company_id from company where company_name=t.ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&")")
                    block7.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=c"&RS("ExtDBfld_id")&".company_id")
                    If InStr(compare_flds,"|"&Request.Form("FldName")(fld)&"|") Then
                        block8.Append("ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id")&"=c"&RS("ExtDBfld_id")&".company_id")
                    End If
            End Select
        End If
    Next
    sqlTPL = Replace(sqlTPL,"{{BLOCK2}}",block2.JoinToString(","))
    sqlTPL = Replace(sqlTPL,"{{BLOCK3}}",block3.JoinToString(" "&vbCrLf))
    sqlTPL = Replace(sqlTPL,"{{BLOCK4}}",block4.JoinToString(","))
    sqlTPL = Replace(sqlTPL,"{{BLOCK4d}}",block4d.JoinToString(","))
    sqlTPL = Replace(sqlTPL,"{{BLOCK5}}",block5.JoinToString(","))
    sqlTPL = Replace(sqlTPL,"{{BLOCK6}}",block6.JoinToString(" "&vbCrLf))
    sqlTPL = Replace(sqlTPL,"{{BLOCK7}}",block7.JoinToString(","))
    If block8.Count>1 Then
        sqlTPL = Replace(sqlTPL,"{{BLOCK8}}",block8.JoinToString(" and "))
    Else
        sqlTPL = Replace(sqlTPL,"{{BLOCK8}}",block8.JoinToString(""))
    End If
    If block8.Count>1 Then
        sqlTPL = Replace(sqlTPL,"{{BLOCK9}}","WHERE NOT EXISTS (select * from ExtDB"&valParam&" where "&block8.JoinToString(" and ")&")")
    Else
        sqlTPL = Replace(sqlTPL,"{{BLOCK9}}","")
    End If
    sqlTPL = Replace(sqlTPL,"{{TABLE}}",tbl)
    sqlTPL = Replace(sqlTPL,"{{events_users_id}}",SESSION("USER.ID"))
    sqlTPL = Replace(sqlTPL,"{{events_users_ip}}",Request.ServerVariables("REMOTE_ADDR"))
    echo 3,"run"
    Call saveFile(Server.MapPath("\Files\tbl_"&valParam&".sql"), sqlTPL)
    Set RS = Execute(sqlTPL)
    While Not RS.Eof
        echo RS(0).Value,RS(1).Value
        SESSION("IMPORT.LOG") = "<li>"&RS(0).Value&" - "&RS(1).Value
        Select Case RS(0).Value
            Case "Added Companies"
            Case "Added Contacts"
            Case "Added Projects"
            Case "Added Records"
        End Select
        RS.MoveNext
    Wend
    Set RS = Execute("UPDATE ExtDBtbl SET ExtDBtbl_date=GETDATE() WHERE ExtDBtbl_id="&valParam)
    echo 4,"end"
    'Response.end
End Sub

Sub SaveToEvents(valTable,valRecord,valMode,text)
    Dim RS
    Set RS = Execute("SELECT TOP 1 * FROM [events]")
    RS.AddNew
    RS("events_date").Value  = Date()
    RS("events_time").Value  = Time()
    RS("events_table").Value  = valTable
    RS("events_module").Value  = "EXTDB"
    RS("events_record").Value  = valRecord
    Select Case valMode
        Case "append"
            RS("events_event").Value = "Import [append]"
        Case "update"
            RS("events_event").Value = "Import [update]"
    End Select
    RS("events_text").Value  = text
    RS("events_users_id").Value = SESSION("USER.ID")
    RS("events_users_ip").Value  = Request.ServerVariables( "REMOTE_ADDR" )
    RS.Update
    RS.Close
End Sub

Sub UpdateField(ByVal varTable,ByVal id,ByVal fld,ByRef Request)
    Dim update_fld, RS, str
    update_fld = Replace(fld,Right(fld,7),"")
    Set RS  = Execute("SELECT ["&update_fld&"] FROM ["&varTable&"] WHERE ["&varTable&"_id]="&id)
    If Not RS.Eof Then
        If Request.Form(fld)>"" Then
            If Trim(RS(0).Value)>"" Then
                str = RS(0).Value & "<hr size=0 noshadow>"
            End If
            str = str & "<font size=1>["&Now()&"] ("&SESSION("USER.FNAME")&" "&SESSION("USER.LNAME")&")</font><br>" & EscapeHTML(Request.Form(fld))
            RS(0).Value = str
            RS.Update
            RS.Close
        End If
    End If
End Sub

Sub UpdateSQL( valParam )
    ' alternative logic for creating view
    Dim RStbl, tblTitle, tblName
    Set RStbl = Execute("SELECT ExtDBtbl_title, ExtDBtbl_sql, ExtDBtbl_type, ExtDBtbl_formtype FROM ExtDBtbl WHERE ExtDBtbl_id=" & valParam)
    If Not RStbl.EOF Then
        tblTitle = Trim(LCase(RStbl("ExtDBtbl_title")))
        If Left(tblTitle, 7) = "_table_" Then
            tblName = Mid(tblTitle, 8)
            Call UpdateSQLStatic(RStbl, valParam, tblName)
            Exit Sub
        End If
    End If

    Dim sql,RS,RS2,subRS,add, allias, fields, fld, arr, subTable
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" ORDER BY ExtDBfld_order")
    fields = "ExtDB"&valParam&"_id,ExtDB"&valParam&"_guid,ExtDB"&valParam&"_webid"

    If RStbl("ExtDBtbl_formtype").Value = "CA" And RStbl("ExtDBtbl_type").Value = "1" Then
        fields = fields & ",ExtDB"&valParam&"_source,ExtDB"&valParam&"_source_id,ExtDB"&valParam&"_projects_id,ExtDB"&valParam&"_company_id"
        allias = "ExtDB"&valParam&"_projects"
        sql = sql & " LEFT JOIN [projects]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_projects_id=["&allias&"].projects_id "
        allias = "ExtDB"&valParam&"_company"
        sql = sql & " LEFT JOIN [company]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_company_id=["&allias&"].company_id "
    End If

    Dim checkField30, checkTbl30
    While Not RS.Eof
        Select Case RS("ExtDBfld_type").Value
            Case 30
                allias = ""&Split(RS("ExtDBfld_param").Value,"^")(0)&""
                checkField30 = ""&Split(Split(RS("ExtDBfld_param").Value,"^")(1),"|")(0)&""
                Set checkTbl30 = ExecuteStat("SELECT TOP 1 * FROM ["& allias &"]")
                If FieldExists(checkTbl30.Fields,checkField30) Then
                    allias = ""&Split(RS("ExtDBfld_param").Value,"^")(0)&"_"&RS("ExtDBfld_id").Value&""
                    sql = sql & " LEFT JOIN ["&Split(RS("ExtDBfld_param").Value,"^")(0)&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&Split(RS("ExtDBfld_param").Value,"^")(0)&"_id "
                    fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                    arr = Split(Split(RS("ExtDBfld_param").Value,"^")(1),"|")
                    For fld=0 To Ubound(arr)
                        arr(fld) = "ISNULL(CAST(["&allias&"]."&arr(fld)&" AS NVARCHAR(500)),'')"
                    Next
                    add = add & ","&Join(arr,"+', '+")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                    add = add & ","&Join(arr,"+', '+")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_out]"
                    Call addCrossLookup(RS,sql,add)
                End If
            Case 31
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company] AS ["&allias&"_company] ON ["&allias&"].projects_company_id=["&allias&"_company].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                Select Case SESSION("SYSTEM.ID")
                    Case "1042", "1026"
                        add = add & ",["&allias&"].projects_name AS ["&allias&"_name]"
                        add = add & ",["&allias&"].projects_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                    Case Else
                        add = add & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS ["&allias&"_name]"
                        add = add & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                End Select
                add = add & ",["&allias&"_company].company_name AS ["&allias&"_projectscompany]"
            Case 32
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company]  AS ["&allias&"_company] ON ["&allias&"].users_company_id=["&allias&"_company].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                add = add & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS ["&allias&"_name]"
                add = add & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_out]"
                add = add & ",["&allias&"].users_title AS ["&allias&"_userstitle]"
                add = add & ",["&allias&"_company].company_name AS ["&allias&"_userscompany]"
                add = add & ",["&allias&"_company].company_id AS ["&allias&"_userscompanyid]"
            Case 33
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company] AS ["&allias&"_company2] ON ["&allias&"].company_maincomp=["&allias&"_company2].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                add = add & ",["&allias&"].company_name AS ["&allias&"_name]"
                add = add & ",["&allias&"].company_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                add = add & ",["&allias&"].company_type AS ["&allias&"_companytype]"
                add = add & ",["&allias&"_company2].company_name AS ["&allias&"_maincompany]"
            Case 60
                allias = "ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&""
                'add = add & ",(SELECT (100*dbo.esscountval(ISNULL(ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_answer,0),'"&getSurvPassAnswers(RS("ExtDBfld_param").Value)&"','|')/NULLIF(COUNT(1),0)) FROM ExtDBsrv LEFT JOIN ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&" ON (ExtDBsrv_id=ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_item AND ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id)) AS ["&allias&"_surv]"
                add = add & ",(SELECT (100*dbo.esscountval(ISNULL(ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_answer,0),'"&getSurvPassAnswers(RS("ExtDBfld_param").Value)&"','|')/NULLIF(COUNT(1),0)) FROM ExtDBsrv LEFT JOIN ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&" ON (ExtDBsrv_ExtDBfld_id="&RS("ExtDBfld_id").Value&" AND ExtDBsrv_id=ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_item AND ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id)) AS ["&allias&"_surv]"
            Case 70
                ' SKIP for TITLE
            Case 71
                ' SKIP for TITLE
                add = add & ","&Replace(RS("ExtDBfld_param"), "`", "'")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"]"
            Case 72
                ' SKIP for HTML
            Case 80
                ' SKIP for TABS
            Case 90
                allias = "ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&""
                add = add & ",(SELECT COUNT(1) FROM ExtDB"&RS("ExtDBfld_param").Value&" WHERE ExtDB"&RS("ExtDBfld_param").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id) AS ["&allias&"_count]"
            Case 2032
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"related"
            Case Else
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
        End Select
        RS.MoveNext
    Wend
    Set RS = Execute("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&valParam&"")
    If RS("ExtDBtbl_type") = 2 Then
        Set RS2 = ExecuteStat("SELECT TOP 1 ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_param LIKE '"&valParam&"'")
        fields = fields & ",ExtDB"&valParam&"_ExtDB"&RS2("ExtDBfld_ExtDBtbl_id").Value&"_id"
        
        Set subRS = ExecuteStat("SELECT ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_type=90 AND CAST(ExtDBfld_param AS VARCHAR)='"&valParam&"'")
        subTable = subRS(0)
        sql = sql & " LEFT JOIN ExtDB"&subTable&" ON ExtDB"&subTable&"_id=ExtDB"&valParam&"_ExtDB"&subTable&"_id "
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&subTable&" ORDER BY ExtDBfld_order")
        While Not RS2.Eof
            If InStr(fld,"["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(RS2("ExtDBfld_title"))<50 Then
                Select Case RS2("ExtDBfld_type").Value
                    Case 3,6,30,131,135,136,200,201,202,204,205,2011
                        fields = fields & ",ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&" "
                    Case 31
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value
                        fields = fields & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS ["&allias&"_name]"
                        fields = fields & ",["&allias&"].projects_company_id AS ["&allias&"_companyid]"
                        fields = fields & ",["&allias&"].projects_subcontr AS ["&allias&"_subcontrid]"
                    Case 32
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS ["&allias&"_name]"
                    Case 33
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",["&allias&"].company_name AS ["&allias&"_name]"
                End Select
            End If
            RS2.MoveNext
        Wend
    End If
    'log "SELECT "&fields&" "&add&" FROM [ExtDB"&valParam&"]" & sql &""
    RS("ExtDBtbl_sql") = "SELECT "&fields&" "&add&" FROM [ExtDB"&valParam&"]" & sql &""
    RS.Update
    RS.Close
    Call GenerateView("ExtDB"&valParam&"")
End Sub

Sub UpdateSQLStatic(RStbl, valParam, tblName)
    ExecuteStat("EXEC dbo.AddGuidColumn @table = '" & tblName & "'")

    Dim sql, RS, fields, add, fieldTitle, parts, fieldName, fldType, fldID, allias, arr, i

    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" ORDER BY ExtDBfld_order")
    fields = "["&tblName&"].["&tblName&"_id] AS ExtDB"&valParam&"_id, ["&tblName&"].["&tblName&"_guid] AS ExtDB"&valParam&"_guid"
    add    = ""
    While Not RS.Eof
        fieldTitle = RS("ExtDBfld_title").Value
        fldType    = RS("ExtDBfld_type").Value
        fldID      = RS("ExtDBfld_id").Value

        If InStr(fieldTitle, "||") > 0 Then
            parts = Split(fieldTitle, "||")

            If UBound(parts) >= 1 Then
                fieldName = Trim(parts(1)) 

                Select Case fldType
                    Case 30 
                        allias = Split(RS("ExtDBfld_param").Value,"^")(0) & "_" & RS("ExtDBfld_id").Value

                        sql = sql & _
                            " LEFT JOIN [" & Split(RS("ExtDBfld_param").Value,"^")(0) & "view] AS [" & allias & "] " & _
                            "ON [" & tblName & "].[" & fieldName & "] = [" & allias & "]." & _
                                Split(RS("ExtDBfld_param").Value,"^")(1) & " "

                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & _
                                valParam & "_Fld" & RS("ExtDBfld_id").Value & "]"

                        arr = Split(Split(RS("ExtDBfld_param").Value,"^")(1),"|")
                        For fld = 0 To UBound(arr)
                            arr(fld) = "ISNULL(CAST([" & allias & "].[" & arr(fld) & "] AS NVARCHAR(500)),'')"
                        Next

                        add = add & "," & Join(arr," + ', ' + ") & _
                            " AS [ExtDB" & valParam & "_Fld" & RS("ExtDBfld_id").Value & "_name]" & _
                            "," & Join(arr," + ', ' + ") & _
                            " AS [ExtDB" & valParam & "_Fld" & RS("ExtDBfld_id").Value & "_out]"
                        Call addCrossLookup(RS, sql, add)

                    Case 31
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & _
                                     "] = [" & allias & "]." & RS("ExtDBfld_param").Value & "_id "
                        sql = sql & " LEFT JOIN [company] AS [" & allias & "_company] ON [" & _
                                     allias & "].projects_company_id = [" & allias & "_company].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        If SESSION("SYSTEM.ID") = "1042" Or SESSION("SYSTEM.ID") = "1026" Then
                            add = add & ",[" & allias & "].projects_name AS [" & allias & "_name]" & _
                                  ",[" & allias & "].projects_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]"
                        Else
                            add = add & ",[" & allias & "].projects_num + ', ' + [" & allias & "].projects_name AS [" & _
                                  allias & "_name]" & _
                                  ",[" & allias & "].projects_num + ', ' + [" & allias & "].projects_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]"
                        End If
                        add = add & ",[" & allias & "_company].company_name AS [" & allias & "_projectscompany]"

                    Case 32
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & _
                                     "] = [" & allias & "]." & RS("ExtDBfld_param").Value & "_id "
                        sql = sql & " LEFT JOIN [company] AS [" & allias & "_company] ON [" & _
                                     allias & "].users_company_id = [" & allias & "_company].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",[" & allias & "].users_firstname + ' ' + [" & allias & "].users_lastname AS [" & _
                              allias & "_name]" & _
                              ",[" & allias & "].users_firstname + ' ' + [" & allias & "].users_lastname AS [ExtDB" & valParam & "_Fld" & fldID & "_out]" & _
                              ",[" & allias & "].users_title AS [" & allias & "_userstitle]" & _
                              ",[" & allias & "_company].company_name AS [" & allias & "_userscompany]" &_
                              ",[" & allias & "_company].company_id AS [" & allias & "_userscompanyid]"

                    Case 33
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & _
                                     "] = [" & allias & "]." & RS("ExtDBfld_param").Value & "_id "
                        sql = sql & " LEFT JOIN [company] AS [" & allias & "_company2] ON [" & _
                                     allias & "].company_maincomp = [" & allias & "_company2].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",[" & allias & "].company_name AS [" & allias & "_name]" & _
                              ",[" & allias & "].company_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]" & _
                              ",[" & allias & "].company_type AS [" & allias & "_companytype]" & _
                              ",[" & allias & "_company2].company_name AS [" & allias & "_maincompany]"

                    Case 60
                        allias = "ExtDB" & valParam & "_Fld" & fldID
                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",(SELECT (100 * dbo.esscountval(" & _
                              "ISNULL([" & tblName & "].[" & fieldName & "],0), '" & _
                              getSurvPassAnswers(RS("ExtDBfld_param").Value) & "', '|') / NULLIF(COUNT(1),0))" & _
                              " FROM ExtDBsrv " & _
                              " LEFT JOIN ExtDB" & valParam & "surv" & fldID & _
                              " ON (ExtDBsrv_ExtDBfld_id = " & fldID & _
                              " AND ExtDBsrv_id = ExtDB" & valParam & "surv" & fldID & "_item" & _
                              " AND ExtDB" & valParam & "surv" & fldID & "_ExtDB" & valParam & "_id = [" & tblName & "].[" & tblName & "_id])) AS [" & allias & "_surv]"

                    Case 2032
                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & _
                                 valParam & "_Fld" & fldID & "]," & _
                                 "[" & tblName & "].[" & fieldName & "related] AS [ExtDB" & _
                                 valParam & "_Fld" & fldID & "related]"
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for TITLE
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORM
                    case 2031
                        If fieldName = tblName&"_act" Then
                            fields = fields & ",CASE WHEN [" & tblName & "].[" & fieldName & "] = 'true' THEN 'Yes' ELSE 'No' END AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                        Else
                            fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                        End If 
                    Case Else
                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                End Select

            End If
        End If

        RS.MoveNext
    Wend

    RStbl("ExtDBtbl_sql") = "SELECT "&fields&" "&add&" FROM ["&tblName&"]" & sql &""
    RStbl.Update
    RStbl.Close
    Call GenerateView("ExtDB"&valParam&"")
End Sub

Function CreateGridSQL( valParam, varPage )
    ' alternative logic for creating view
    Dim RStbl, tblTitle, tblName, gridForStatic
    Set RStbl = Execute("SELECT ExtDBtbl_title, ExtDBtbl_sql, ExtDBtbl_formtype, ExtDBtbl_type FROM ExtDBtbl WHERE ExtDBtbl_id=" & valParam)
    If Not RStbl.EOF Then
        tblTitle = Trim(LCase(RStbl("ExtDBtbl_title")))
        If Left(tblTitle, 7) = "_table_" Then
            tblName = Mid(tblTitle, 8)
                gridForStatic = CreateGridSQLStatic(RStbl, valParam, varPage, tblName)
                CreateGridSQL = gridForStatic
                Exit Function
        End If
    End If

    Dim sql,RS,RS2,subRS,add, allias, fields, fld, arr, subTable
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" AND "&_
        "ExtDBfld_id IN (select ExtDBpgfld_ExtDBfld_id from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&varPage&" and ISNULL(ExtDBpgfld_ingrid,'')<>'hide') "&_
        "OR (SELECT TOP 1 ExtDBpg_filter FROM ExtDBpg WHERE ExtDBpg_id = "&varPage&") LIKE '%_Fld'+CAST(ExtDBfld_id as nvarchar)+']%' "&_
        "ORDER BY ExtDBfld_order")
    fields = "ExtDB"&valParam&"_id,ExtDB"&valParam&"_guid,ExtDB"&valParam&"_webid"
    
    If RStbl("ExtDBtbl_formtype").Value = "CA" And RStbl("ExtDBtbl_type").Value = "1" Then
        fields = fields & ",ExtDB"&valParam&"_projects_id,ExtDB"&valParam&"_company_id"
        allias = "ExtDB"&valParam&"_projects"
        sql = sql & " LEFT JOIN [projects]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_projects_id=["&allias&"].projects_id "
        allias = "ExtDB"&valParam&"_company"
        sql = sql & " LEFT JOIN [company]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_company_id=["&allias&"].company_id "
    End If

    While Not RS.Eof
        Select Case RS("ExtDBfld_type").Value
            Case 30
                allias = ""&Split(RS("ExtDBfld_param").Value,"^")(0)&"_"&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&Split(RS("ExtDBfld_param").Value,"^")(0)&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&Split(RS("ExtDBfld_param").Value,"^")(0)&"_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                arr = Split(Split(RS("ExtDBfld_param").Value,"^")(1),"|")
                For fld=0 To Ubound(arr)
                    arr(fld) = "ISNULL(CAST(["&allias&"]."&arr(fld)&" AS NVARCHAR(500)),'')"
                Next
                add = add & ","&Join(arr,"+', '+")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                add = add & ","&Join(arr,"+', '+")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_out]"
            Case 31
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company] AS ["&allias&"_company] ON ["&allias&"].projects_company_id=["&allias&"_company].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                Select Case SESSION("SYSTEM.ID")
                    Case "1042", "1026"
                        add = add & ",["&allias&"].projects_name AS ["&allias&"_name]"
                        add = add & ",["&allias&"].projects_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                    Case Else
                        add = add & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS ["&allias&"_name]"
                        add = add & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                End Select
                add = add & ",["&allias&"_company].company_name AS ["&allias&"_projectscompany]"
            Case 32
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company]  AS ["&allias&"_company] ON ["&allias&"].users_company_id=["&allias&"_company].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                add = add & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS ["&allias&"_name]"
                add = add & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_out]"
                add = add & ",["&allias&"].users_title AS ["&allias&"_userstitle]"
                add = add & ",["&allias&"_company].company_name AS ["&allias&"_userscompany]"
                add = add & ",["&allias&"_company].company_id AS ["&allias&"_userscompanyid]"
            Case 33
                allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
                sql = sql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&valParam&".ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                sql = sql & " LEFT JOIN [company] AS ["&allias&"_company2] ON ["&allias&"].company_maincomp=["&allias&"_company2].company_id "
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                add = add & ",["&allias&"].company_name AS ["&allias&"_name]"
                add = add & ",["&allias&"].company_name AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"_name]"
                add = add & ",["&allias&"].company_type AS ["&allias&"_companytype]"
                add = add & ",["&allias&"_company2].company_name AS ["&allias&"_maincompany]"
            Case 60
                allias = "ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&""
                'add = add & ",(SELECT (100*dbo.esscountval(ISNULL(ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_answer,0),'"&getSurvPassAnswers(RS("ExtDBfld_param").Value)&"','|')/NULLIF(COUNT(1),0)) FROM ExtDBsrv LEFT JOIN ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&" ON (ExtDBsrv_id=ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_item AND ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id)) AS ["&allias&"_surv]"
                add = add & ",(SELECT (100*dbo.esscountval(ISNULL(ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_answer,0),'"&getSurvPassAnswers(RS("ExtDBfld_param").Value)&"','|')/NULLIF(COUNT(1),0)) FROM ExtDBsrv LEFT JOIN ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&" ON (ExtDBsrv_ExtDBfld_id="&RS("ExtDBfld_id").Value&" AND ExtDBsrv_id=ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_item AND ExtDB"&valParam&"surv"&RS("ExtDBfld_id").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id)) AS ["&allias&"_surv]"
            Case 70
                ' SKIP for TITLE
            Case 71
                add = add & ","&Replace(RS("ExtDBfld_param"), "`", "'")&" AS [ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"]"
            Case 72
                ' SKIP for HTML
            Case 80
                ' SKIP for TABS
            Case 90
                allias = "ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&""
                add = add & ",(SELECT COUNT(1) FROM ExtDB"&RS("ExtDBfld_param").Value&" WHERE ExtDB"&RS("ExtDBfld_param").Value&"_ExtDB"&valParam&"_id=ExtDB"&valParam&"_id) AS ["&allias&"_count]"
            Case 201
                fields = fields & ",CAST(ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&" as nvarchar(500)) as ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&" "
            Case 2011,2012
                ' SKIP
            Case 2032
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value&"related"
            Case Else
                fields = fields & ",ExtDB"&valParam&"_Fld"&RS("ExtDBfld_id").Value
        End Select
        RS.MoveNext
    Wend
    
    Set RS = Execute("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&valParam&"")
    If RS("ExtDBtbl_type") = 2 Then
        Set RS2 = ExecuteStat("SELECT TOP 1 ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_param LIKE '"&valParam&"'")
        fields = fields & ",ExtDB"&valParam&"_ExtDB"&RS2("ExtDBfld_ExtDBtbl_id").Value&"_id"
        
        Set subRS = ExecuteStat("SELECT ExtDBfld_ExtDBtbl_id FROM ExtDBfld WHERE ExtDBfld_type=90 AND CAST(ExtDBfld_param AS VARCHAR)='"&valParam&"'")
        subTable = subRS(0)
        sql = sql & " LEFT JOIN ExtDB"&subTable&" ON ExtDB"&subTable&"_id=ExtDB"&valParam&"_ExtDB"&subTable&"_id "
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&subTable&" ORDER BY ExtDBfld_order")
        While Not RS2.Eof
            If InStr(fld,"["&Replace(RS2("ExtDBfld_title"),"&","&amp;")&"]")=0 And Len(RS2("ExtDBfld_title"))<50 Then
                Select Case RS2("ExtDBfld_type").Value
                    Case 3,6,30,131,135,136,200,201,202,204,205,2011
                        fields = fields & ",ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id")&" "
                    Case 31
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value
                        fields = fields & ",["&allias&"].projects_num+', '+["&allias&"].projects_name AS ["&allias&"_name]"
                        fields = fields & ",["&allias&"].projects_company_id AS ["&allias&"_companyid]"
                        fields = fields & ",["&allias&"].projects_subcontr AS ["&allias&"_subcontrid]"
                    Case 32
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",["&allias&"].users_firstname+' '+["&allias&"].users_lastname AS ["&allias&"_name]"
                    Case 33
                        allias = ""&RS2("ExtDBfld_param").Value&""&RS2("ExtDBfld_id").Value&""
                        sql = sql & " LEFT JOIN ["&RS2("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&subTable&".ExtDB"&subTable&"_Fld"&RS2("ExtDBfld_id").Value&"=["&allias&"]."&RS2("ExtDBfld_param").Value&"_id "
                        fields = fields & ",["&allias&"].company_name AS ["&allias&"_name]"
                End Select
            End If
            RS2.MoveNext
        Wend
    End If

    CreateGridSQL = "SELECT "&fields&" "&add&" FROM [ExtDB"&valParam&"]" & sql &""
End Function

Function CreateGridSQLStatic(RStbl, valParam, varPage, tblName)
    Dim sql, RS, fields, add, fieldTitle, parts, fieldName, fldType, fldID
    Dim RS2, allias, fld, arr, i
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&valParam&" AND "&_
        "ExtDBfld_id IN (select ExtDBpgfld_ExtDBfld_id from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&varPage&" and ISNULL(ExtDBpgfld_ingrid,'')<>'hide') "&_
        "OR (SELECT TOP 1 ExtDBpg_filter FROM ExtDBpg WHERE ExtDBpg_id = "&varPage&") LIKE '%_Fld'+CAST(ExtDBfld_id as nvarchar)+']%' "&_
        "ORDER BY ExtDBfld_order")
    fields = "["&tblName&"].["&tblName&"_id] AS ExtDB"&valParam&"_id, ["&tblName&"].["&tblName&"_guid] AS ExtDB"&valParam&"_guid"
    
    add    = ""
    While Not RS.Eof
        fieldTitle = RS("ExtDBfld_title").Value
        fldType    = RS("ExtDBfld_type").Value
        fldID      = RS("ExtDBfld_id").Value

        If InStr(fieldTitle, "||") > 0 Then
            parts = Split(fieldTitle, "||")

            If UBound(parts) >= 1 Then
                fieldName = Trim(parts(1)) 

                Select Case fldType
                    Case 30
                        allias = Split(RS("ExtDBfld_param").Value,"^")(0) & "_" & RS("ExtDBfld_id").Value

                        sql = sql & _
                            " LEFT JOIN [" & Split(RS("ExtDBfld_param").Value,"^")(0) & "view] AS [" & allias & "] " & _
                            "ON [" & tblName & "].[" & fieldName & "] = [" & allias & "]." & _
                                Split(RS("ExtDBfld_param").Value,"^")(1) & " "

                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & _
                                valParam & "_Fld" & RS("ExtDBfld_id").Value & "]"

                        arr = Split(Split(RS("ExtDBfld_param").Value,"^")(1),"|")
                        For fld = 0 To UBound(arr)
                            arr(fld) = "ISNULL(CAST([" & allias & "].[" & arr(fld) & "] AS NVARCHAR(500)),'')"
                        Next

                        add = add & "," & Join(arr," + ', ' + ") & _
                            " AS [ExtDB" & valParam & "_Fld" & RS("ExtDBfld_id").Value & "_name]" & _
                            "," & Join(arr," + ', ' + ") & _
                            " AS [ExtDB" & valParam & "_Fld" & RS("ExtDBfld_id").Value & "_out]"
                        Call addCrossLookup(RS, sql, add)

                    Case 31
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & "] = [" & _
                                     allias & "]." & RS("ExtDBfld_param").Value & "_id " & _
                                     "LEFT JOIN [company] AS [" & allias & "_company] ON [" & _
                                     allias & "].projects_company_id = [" & allias & "_company].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        If SESSION("SYSTEM.ID")="1042" Or SESSION("SYSTEM.ID")="1026" Then
                            add = add & ",[" & allias & "].projects_name AS [" & allias & "_name]" & _
                                  ",[" & allias & "].projects_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]"
                        Else
                            add = add & ",[" & allias & "].projects_num + ', ' + [" & allias & "].projects_name AS [" & allias & "_name]" & _
                                  ",[" & allias & "].projects_num + ', ' + [" & allias & "].projects_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]"
                        End If
                        add = add & ",[" & allias & "_company].company_name AS [" & allias & "_projectscompany]"

                    Case 32
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & "] = [" & _
                                     allias & "]." & RS("ExtDBfld_param").Value & "_id " & _
                                     "LEFT JOIN [company] AS [" & allias & "_company] ON [" & _
                                     allias & "].users_company_id = [" & allias & "_company].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",[" & allias & "].users_firstname + ' ' + [" & allias & "].users_lastname AS [" & allias & "_name]" & _
                              ",[" & allias & "].users_firstname + ' ' + [" & allias & "].users_lastname AS [ExtDB" & valParam & "_Fld" & fldID & "_out]" & _
                              ",[" & allias & "].users_title AS [" & allias & "_userstitle]" & _
                              ",[" & allias & "_company].company_name AS [" & allias & "_userscompany]" &_
                              ",[" & allias & "_company].company_id AS [" & allias & "_userscompanyid]"

                    Case 33
                        allias = RS("ExtDBfld_param").Value & fldID

                        sql = sql & " LEFT JOIN [" & RS("ExtDBfld_param").Value & _
                                     "] AS [" & allias & "] ON [" & tblName & "].[" & fieldName & "] = [" & _
                                     allias & "]." & RS("ExtDBfld_param").Value & "_id " & _
                                     "LEFT JOIN [company] AS [" & allias & "_company2] ON [" & _
                                     allias & "].company_maincomp = [" & allias & "_company2].company_id "

                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",[" & allias & "].company_name AS [" & allias & "_name]" & _
                              ",[" & allias & "].company_name AS [ExtDB" & valParam & "_Fld" & fldID & "_name]" & _
                              ",[" & allias & "].company_type AS [" & allias & "_companytype]" & _
                              ",[" & allias & "_company2].company_name AS [" & allias & "_maincompany]"

                    Case 60
                        allias = "ExtDB" & valParam & "_Fld" & fldID
                        fields = fields & ",[" & tblName & "].[" & fieldName & _
                                 "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"

                        add = add & ",(SELECT (100 * dbo.esscountval(" & _
                              "ISNULL([" & tblName & "].[" & fieldName & "],0), '" & _
                              getSurvPassAnswers(RS("ExtDBfld_param").Value) & "', '|') / NULLIF(COUNT(1),0))" & _
                              " FROM ExtDBsrv " & _
                              " LEFT JOIN ExtDB" & valParam & "surv" & fldID & _
                              " ON (ExtDBsrv_ExtDBfld_id=" & fldID & _
                              " AND ExtDBsrv_id = ExtDB" & valParam & "surv" & fldID & "_item" & _
                              " AND ExtDB" & valParam & "surv" & fldID & "_ExtDB" & valParam & "_id = [" & tblName & "].[" & tblName & "_id])) AS [" & _
                              allias & "_surv]"

                    Case 2032
                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & _
                                 valParam & "_Fld" & fldID & "]," & _
                                 "[" & tblName & "].[" & fieldName & "related] AS [ExtDB" & _
                                 valParam & "_Fld" & fldID & "related]"
                    Case 70
                        ' SKIP for TITLE
                    Case 71
                        ' SKIP for TITLE
                    Case 72
                        ' SKIP for HTML
                    Case 80
                        ' SKIP for TABS
                    Case 90
                        ' SKIP for SUBFORM
                    case 2031
                        If fieldName = tblName&"_act" Then
                            fields = fields & ",CASE WHEN [" & tblName & "].[" & fieldName & "] = 'true' THEN 'Yes' ELSE 'No' END AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                        Else
                            fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                        End If 
                    Case Else
                        fields = fields & ",[" & tblName & "].[" & fieldName & "] AS [ExtDB" & valParam & "_Fld" & fldID & "]"
                End Select

            End If
        End If

        RS.MoveNext
    Wend

    CreateGridSQLStatic = "SELECT "&fields&" "&add&" FROM ["&tblName&"]" & sql &""
End Function

Function FldType(valFld)
    Dim RS
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&valFld&"")
    If RS.RecordCount>0 Then
        FldType = RS("ExtDBfld_type").Value
    Else
        FldType = 0
    End If
End Function

Sub GenerateView(valParam)
    Dim sql,RS
    Set RS = ExecuteStat("SELECT ExtDBtbl_sql FROM ExtDBtbl WHERE ExtDBtbl_id="&Replace(valParam,"ExtDB",""))
    sql = RS("ExtDBtbl_sql")
    RS.Close
    Call checkSQL(valParam&"view",sql)
End Sub 

Sub GenerateGridView(valParam,varPage)
    Dim sql : sql = CreateGridSQL(Replace(valParam,"ExtDB",""),varPage)
    Call checkSQL(valParam&"grid",sql)
End Sub 

Sub SaveFiles(valFO,valRequest,valTable,valParam)
    Dim oRec,oFile, oFs, oDIR, p_num
    For oRec = 1 to valFO.FileCount
        set oFile = valFO.File(oRec)
        If InStr(oFile.Name,"surv")>0 And InStr(oFile.Name,"_files")>0 Then
            oDIR = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR(valTable)&"\"&valParam&"\"
            oDIR = oDIR & "surv"&valFO.Item(oFile.Name&"[srv]").Item(oRec)&"\"&valFO.Item(oFile.Name&"[item]").Item(oRec)&"\"
            'echo oRec,oDIR
            'echo oRec,valFO.Item(oFile.Name&"[srv]").Item(oRec)
            'echo oRec,valFO.Item(oFile.Name&"[item]").Item(oRec)
            'echo oRec,valFO.Item(oFile.Name&"[item]").Item(oRec)
            Call CheckFolder(oDIR)
            oFile.Save oDIR
            Call addFileEVENT("AddedFile",valTable,valRequest,valParam,oFile.FileName)
            set oFile = Nothing
        Else
            oDIR = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR(valTable)&"\"&valParam&"\"
            Call CheckFolder(oDIR)
            oFile.Save oDIR
            Call addFileEVENT("AddedFile",valTable,valRequest,valParam,oFile.FileName)
            set oFile = Nothing
        End If
    Next
End Sub

Function SubDIR(table)
    SubDIR = table
End Function

Function SubDIR_OLD(table)
    Dim RS, str
    If Replace(table,"ExtDB","")<>"new" Then
        Set RS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_id="&Replace(table,"ExtDB",""))
        Select Case RS("ExtDBtbl_type").Value
            Case 2
                str = RS("ExtDBtbl_title")
                Set RS = ExecuteStat("select top 1 extdbtbl_title from extdbfld left join extdbtbl on extdbtbl.extdbtbl_id=extdbfld.extdbfld_extdbtbl_id where extdbfld_param like '"&RS("ExtDBtbl_id")&"'")
                str = RS("ExtDBtbl_title") & "\" & str
            Case Else
                str = RS("ExtDBtbl_title")
        End Select
    End If
    SubDIR_OLD = str
End Function

Function FilesList(valTable,valParam)
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR(valTable)&"\"&valParam&"\"
    URL = SESSION("FILESURL")&"PersonalFolder/EZ Data/"&SubDIR(valTable)&"/"&valParam&"/"
    Call CheckFolder(DIR)
    Set FS = Server.CreateObject("Scripting.FileSystemObject")
    If FS.FolderExists(DIR) Then
        Set files = FS.GetFolder(DIR).Files
        For Each rec In files
            list = list & fileLink(URL,rec.name)
        Next
    End If
    Set FS = Nothing
    list = list & FilesList_OLD(valTable,valParam)
    FilesList = list
End Function

Function FilesList_OLD(valTable,valParam )
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = SESSION("FILESDIR")&"PersonalFolder\EZ Data\"&SubDIR_OLD(valTable)&"\"&valParam&"\"
    URL = SESSION("FILESURL")&"PersonalFolder/EZ Data/"&SubDIR_OLD(valTable)&"/"&valParam&"/"
    Call CheckFolder(DIR)
    Set FS = Server.CreateObject("Scripting.FileSystemObject")
    If FS.FolderExists(DIR) Then
        Set files = FS.GetFolder(DIR).Files
        For Each rec In files
            list = list & fileLink(URL,rec.name)
        Next
    End If
    Set FS = Nothing
    FilesList_OLD = list
End Function

Function srvFilestPath(valTable,valParam )
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = "/EZ Data/"&SubDIR_OLD(valTable)&"/"&valParam&"/"
    DIR = DIR & "surv"&Request("srv")&"/"&Request("item")&"/"
    DIR = Replace(DIR,"\","/")
    DIR = Replace(DIR,"&","%26")
    srvFilestPath = DIR
End Function

Function geFilestPath(valTable,valParam )
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = "/EZ Data/"&SubDIR("ExtDB"&valTable)&"/"&valParam&"/"
    DIR = Replace(DIR,"\","/")
    DIR = Replace(DIR,"&","%26")
    geFilestPath = DIR
End Function

Function geFilestPath2(valTable,valParam )
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = "/EZ Data/"&SubDIR_OLD("ExtDB"&valTable)&"/"&valParam&"/"
    DIR = Replace(DIR,"\","/")
    DIR = Replace(DIR,"&","%26")
    geFilestPath2 = DIR
End Function

Function geTplPath()
    Dim RS, DIR, URL, FS, files, rec, list
    DIR = "/"&Session("ModulesList").Item(Session("MODULE")).Item("Name")&"/Tpl/"
    DIR = Replace(DIR,"\","/")
    DIR = Replace(DIR,"&","%26")
    geTplPath = DIR
End Function

Function CreateSurveyGrid(valTable,valRec,valFldId,valFldParam,survey_addon)
    'valTable = 'ExtDB4'
    'valRec = '1'
    'valFldId = '23'
    'valFldParam = 'CS@Yes~pass|No~fail^Of^Of>>new~item 1^new~item 2^new~item 3
    'echo 1,valFldParam
    Dim buff : buff = ""
    buff = buff & " var arrSurvey"&valFldId&" = """&Split(valFldParam,">>")(0)&"""; " & VbCrLf
    Dim tpl
    tpl = LoadFile("surveygrid.htm")
    tpl = Replace(tpl,"[[TBL]]",valTable)
    tpl = Replace(tpl,"[[ID]]",valRec)
    tpl = Replace(tpl,"[[FLD]]",valFldId)
    CreateSurveyGrid = Replace(tpl,"[[SurveyConfig]]",buff)
End Function

Function CreateCrossGrid(valTable,valGridId,valParam,cross_addon,aEdit,aNew,aDel)
    Dim buff : buff = ""
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=" & valGridId & " ORDER BY ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type").Value
            Case 30
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_title").Value & """,field:""" & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value&"_name" & """});" & VbCrLf
            Case 31,32,33
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_title").Value & """,field:""" & RS("ExtDBfld_param").Value&RS("ExtDBfld_id").Value&"_name" & """});" & VbCrLf
            Case 60
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_title").Value & """,field:""" & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value&"_surv" & """});" & VbCrLf
            Case 70
                'SKIP TITLE
            Case 71
                'SKIP TITLE
            Case 72
                ' SKIP for HTML
            Case 201,2011,2012
                ' SKIP for HTML
            Case 2032
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_title").Value & """,field:""" & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value & """});" & VbCrLf
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_related").Value & """,field:""" & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value&"related" & """});" & VbCrLf
            Case Else
                buff = buff & "arrFields"&valGridId&".push({title:""" & RS("ExtDBfld_title").Value & """,field:""" & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value & """});" & VbCrLf
        End Select
        RS.MoveNext
    Wend
    Dim tpl
    tpl = LoadFile("crossgrid_addon.htm")
    tpl = Replace(tpl,"[[PARENT]]",valParam)
    tpl = Replace(tpl,"[[ID]]",valGridId)
    tpl = Replace(tpl,"[[FLD]]","ExtDB"&valGridId&"_"&valTable&"_id")
    If aEdit<>True Then tpl = Replace(tpl,"[[iEdit]]","none")
    If aNew<>True Then tpl = Replace(tpl,"[[iNew]]","none")
    If aDel<>True Then tpl = Replace(tpl,"[[iDelete]]","none")
    cross_addon = cross_addon & tpl
    
    tpl = LoadFile("crossgrid.htm")
    tpl = Replace(tpl,"[[PARENT]]",valParam)
    tpl = Replace(tpl,"[[ID]]",valGridId)
    tpl = Replace(tpl,"[[FLD]]","ExtDB"&valGridId&"_"&valTable&"_id")
    If aEdit<>True Then tpl = Replace(tpl,"[[iEdit]]","none")
    If aNew<>True Then tpl = Replace(tpl,"[[iNew]]","none")
    If aDel<>True Then tpl = Replace(tpl,"[[iDelete]]","none")
    
    CreateCrossGrid = Replace(tpl,"[[GridConfig]]",buff)
End Function

Sub CreateCrossList( v_from,v_field)
    Set tmpRS2 = ExecuteStat("SELECT TOP 1 ExtDBfld_param FROM ExtDBfld WHERE ExtDBfld_id = "&v_field&"")
    id = tmpRS2("ExtDBfld_param")
    Set tmpRS2 = ExecuteStat("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&id&" ORDER BY ExtDBfld_order")
    While Not tmpRS2.Eof
        Select Case toInt(tmpRS2("ExtDBfld_type").Value)
            Case 3,6,131,205
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
            Case 200,201,202,204
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"left")
            Case 2030,2031
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
            Case 2032
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value&"related") = Array(tmpRS2("ExtDBfld_related").Value,"center")
            Case 135,136
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value) = Array(tmpRS2("ExtDBfld_title").Value,"center")
            Case 30
                GUI.Fields.Item("ExtDB"&id&"_Fld"&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
            Case 31,32,33
                GUI.Fields.Item(tmpRS2("ExtDBfld_param").Value&tmpRS2("ExtDBfld_id").Value&"_name") = Array(tmpRS2("ExtDBfld_title").Value,"left")
        End Select
        tmpRS2.MoveNext
    Wend
    Select Case SESSION("USER.LEVELNAME")
        Case "Admin"
            GUI.Tools = "|View|Edit|Delete|"
        Case "Level 1"
            GUI.Tools = "|View|Edit|Delete|"
        Case "Level 2"
            GUI.Tools = "|View|Edit|"
        Case "Level 3"
            GUI.Tools = "|View|"
            GUI.Template.SetVariable "AddNew", "none"
    End Select	
    GUI.GenerateTable "crosslist.htm", "ExtDB"&id&""
End Sub

Function SurveyGridFields(valTbl, valSrvId )
    Dim buff : buff = ""
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_id=" & valSrvId)
    buff = buff & "ExtDBsrv_id:Id|"
    buff = buff & "ExtDBsrv_title:Title|"
    buff = buff & ""&valTbl&"surv"&valSrvId & "_answer:Answer|"
    SurveyGridFields = buff
End Function

Function CrossGridFields( valGridId )
    Dim buff : buff = ""
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id=" & valGridId & " ORDER BY ExtDBfld_order")
    While Not RS.Eof
        Select Case RS("ExtDBfld_type").Value
            Case 30
                buff = buff & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value & "_name:" & RS("ExtDBfld_title").Value & "|"
            Case 31,32,33
                buff = buff & RS("ExtDBfld_param").Value&RS("ExtDBfld_id").Value&"_name" & ":" & RS("ExtDBfld_title").Value & "|"
            Case 2032
                buff = buff & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value & ":" & RS("ExtDBfld_title").Value & "|"
                buff = buff & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value&"related" & ":" & RS("ExtDBfld_related").Value & "|"
            Case Else
                buff = buff & "ExtDB"&valGridId&"_Fld"&RS("ExtDBfld_id").Value & ":" & RS("ExtDBfld_title").Value & "|"
        End Select
        RS.MoveNext
    Wend
    CrossGridFields = buff
End Function

Function LoadFile(valName)
    Dim FSO, vFile, vBuf
    Set FSO = CreateObject("Scripting.FileSystemObject")
    Set vFile = FSO.OpenTextFile(Server.MapPath("Template")&"\"&valName, 1,False)
    vBuf = vFile.ReadAll
    vFile.Close
    Set FSO = Nothing
    LoadFile = vBuf
End Function

Sub LookupList()
    GUI.Template.UpdateBlock "tLIST"
    Dim RS, RS2, flds
    Dim param_id, param_flds
    If InStr(varParam,"^")>0 Then param_id = Split(varParam&"","^")(0)
    Set RS = ExecuteStat("SELECT * FROM ExtDBtbl WHERE ExtDBtbl_type=1")
    While Not RS.Eof
        GUI.Template.SetVariable "EXT_FORM" , RS("ExtDBtbl_title")
        GUI.Template.SetVariable "EXT_FORM_ID" , RS("ExtDBtbl_id")
        GUI.Template.SetVariable "EXT_FORM_TBL" , "ExtDB"&RS("ExtDBtbl_id")
        If Request("filter")>"" Then
            GUI.Template.SetVariable "EXT_FILTER" , SESSION("ess107_AppLib").Base64Decode(Trim(""&Request("filter")))
        Else
            GUI.Template.SetVariable "EXT_FILTER" , ""
        End If
        If param_id = "ExtDB"&RS("ExtDBtbl_id") Then
            GUI.Template.SetVariable "EXT_FORM_SELECTED" , "checked"
        Else
            GUI.Template.SetVariable "EXT_FORM_SELECTED" , ""
        End If
        flds = ""
        
        If InStr(varParam,"^")>0 Then 
            param_flds = Split(Split(varParam,"^")(1),"|")
        Else
            param_flds = Split("","|")
        End If
        If InArray("ExtDB"&RS("ExtDBtbl_id")&"_id",param_flds)>=0 Then
            flds = flds & "<li class='ui-state-default'><span class=handle>&nbsp;</span><input type=checkbox checked class=checkbox name=lookupFld"&RS("ExtDBtbl_id")&" value='"&"ExtDB"&RS("ExtDBtbl_id")&"_id'> Doc.#</li>"
        Else
            flds = flds & "<li class='ui-state-default'><span class=handle>&nbsp;</span><input type=checkbox class=checkbox name=lookupFld"&RS("ExtDBtbl_id")&" value='"&"ExtDB"&RS("ExtDBtbl_id")&"_id'> Doc.#</li>"
        End If
        
        Set RS2 = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&RS("ExtDBtbl_id")&" AND ExtDBfld_type IN (31,32,33,135,200,201,202,204,2030,2031)")
        While Not RS2.Eof
            If InStr(varParam,"^")>0 Then 
                param_flds = Split(Split(varParam,"^")(1),"|")
            Else
                param_flds = Split("","|")
            End If
            If InArray("ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id"),param_flds)>=0 Then
                flds = flds & "<li class='ui-state-default'><span class=handle>&nbsp;</span><input type=checkbox checked class=checkbox name=lookupFld"&RS("ExtDBtbl_id")&" value='"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"'> " & RS2("ExtDBfld_title")&"</li>"
            Else
                flds = flds & "<li class='ui-state-default'><span class=handle>&nbsp;</span><input type=checkbox class=checkbox name=lookupFld"&RS("ExtDBtbl_id")&" value='"&"ExtDB"&RS("ExtDBtbl_id")&"_Fld"&RS2("ExtDBfld_id")&"'> " & RS2("ExtDBfld_title")&"</li>"
            End If
            RS2.MoveNext
        Wend
        GUI.Template.SetVariable "EXT_FIELDS" , flds
        GUI.Template.ParseBlock "tLIST"
        RS.MoveNext
    Wend
End Sub

Sub FiltersList()
    GUI.Template.UpdateBlock "tLIST"
    Dim file, field, xml, modules
    Dim RS, fld, str
    Select Case Request("table")
        Case "company","users"
            modules = "REFM"
        Case "projects"
            modules = "ProjectManager"
    End Select
    file = Server.MapPath("/Modules/"&modules&"/table_"&Request("table")&"_"&SESSION("SYSTEM.ID")&".xml")
    If Not CheckFile(file) Then
        file = Server.MapPath("/Modules/"&modules&"/table_"&Request("table")&".xml")
        If Not CheckFile(file) Then
            file = ""
        End If
    End If
    Set xml = SESSION("ess107_AppLibWSC").classXML()
    xml.Open(file)
    
    Dim company_list
    Select Case Request("table")
        Case "users"
                str = ""
                If InStr(Request("param"),"users_title") Then
                    str = Split(Request("param"),"users_title^")(1)
                    str = Split(str,"|")(0)
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Contact Job Type"
                GUI.Template.SetVariable "FLD" , "users_title"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT distinct users_title FROM users WHERE users_act=1 ORDER BY users_title")
                While Not RS.Eof
                    If RS("users_title").Value=str Then
                        company_list.Append("<option selected>"&RS("users_title").Value&"</option>")
                    Else
                        company_list.Append("<option >"&RS("users_title").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' FLD='users_title'><option></option>"&company_list.ToString()&"</select>"
                GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),"users_company_id") Then
                    str = Split(Request("param"),"users_company_id^")(1)
                    str = Split(str,"|")(0)
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit"
                GUI.Template.SetVariable "FLD" , "users_company_id"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT company_id,company_name FROM company WHERE company_act=1 ORDER BY company_name")
                While Not RS.Eof
                    If InArray(CStr(RS("company_id").Value),Split(""&str,"~")) > -1 Then
                        company_list.Append("<option value='"&RS("company_id").Value&"' selected>"&RS("company_name").Value&"</option>")
                    Else
                        company_list.Append("<option value='"&RS("company_id").Value&"'>"&RS("company_name").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' multiple='multiple' class='m2' FLD='users_company_id'><option></option>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
        Case "company"
                str = ""
                If InStr(Request("param"),"company_type") Then
                    str = Split(Request("param"),"company_type^")(1)
                    str = Split(str,"|")(0)
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit Type"
                GUI.Template.SetVariable "FLD" , "company_type"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT distinct companytype_name FROM companytype ORDER BY companytype_name")
                While Not RS.Eof
                    If InArray(CStr(RS("companytype_name").Value),Split(""&str,"~")) > -1 Then
                        company_list.Append("<option value='"&RS("companytype_name").Value&"' selected>"&RS("companytype_name").Value&"</option>")
                    Else
                        company_list.Append("<option value='"&RS("companytype_name").Value&"'>"&RS("companytype_name").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' multiple='multiple' class='m2' FLD='company_type'>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),"company_maincomp") Then
                    str = Split(Request("param"),"company_maincomp^")(1)
                    str = Split(str,"|")(0)
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Main Company"
                GUI.Template.SetVariable "FLD" , "company_maincomp"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT company_id,company_name FROM company WHERE company_act=1 ORDER BY company_name")
                While Not RS.Eof
                    If InArray(CStr(RS("company_id").Value),Split(""&str,"~")) > -1 Then
                        company_list.Append("<option value='"&RS("company_id").Value&"' selected>"&RS("company_name").Value&"</option>")
                    Else
                        company_list.Append("<option value='"&RS("company_id").Value&"'>"&RS("company_name").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' multiple='multiple' class='m2' FLD='company_maincomp'>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
        Case "projects"
                str = ""
                If InStr(Request("param"),"projects_company_id") Then
                    str = Split(Request("param"),"projects_company_id^")(1)
                    str = Split(str,"|")(0)
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit"
                GUI.Template.SetVariable "FLD" , "projects_company_id"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT company_id,company_name FROM company WHERE company_act=1 ORDER BY company_name")
                While Not RS.Eof
                    If InArray(CStr(RS("company_id").Value),Split(""&str,"~")) > -1 Then
                        company_list.Append("<option value='"&RS("company_id").Value&"' selected>"&RS("company_name").Value&"</option>")
                    Else
                        company_list.Append("<option value='"&RS("company_id").Value&"'>"&RS("company_name").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' multiple='multiple' class='m2' FLD='projects_company_id'><option></option>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
        Case Else
            Set RS = ExecuteStat("SELECT TOP 1 * FROM "&Request("table"))
            For Each fld in RS.Fields
                field = xml.getNodesArray("/ROOT/TABLE/FIELD[@NAME='"&fld.Name&"']")
                If UBound(field)>0 Then
                    If field(0).getAttribute("Title") > "" AND InStr("|SELECT|SELECT2|COMBOBOX|",field(0).getAttribute("Type")) AND field(0).getAttribute("Table") = "1" Then
                        str = ""
                        If InStr(Request("param"),fld.Name&"=") Then
                            str = Replace(Split(Request("param"),fld.Name&"=")(1),"'","")
                            str = Replace(str,"`","")
                        End If
                        GUI.Template.SetVariable "FIELD_TITLE" , field(0).getAttribute("Title")
                        GUI.Template.SetVariable "FLD" , fld.Name
                        GUI.Template.SetVariable "VALUE", str
                        GUI.Template.SetVariable "FIELD_SELECT", "<INPUT TYPE=""text"" TITLE="""&field(0).getAttribute("Title")&""" NAME=""filter"" FLD="""&fld.Name&""" VALUE="""&str&""" size=50>"
                        GUI.Template.ParseBlock "tLIST"
                    End If
                End If
            Next
    End Select
    Set xml = Nothing
End Sub

Sub PgFiltersList()
    GUI.Template.UpdateBlock "tLIST"
    Dim file, field, xml, modules, table
    Dim RS, fld, str, fldalias
    fldalias = Replace(Split(Request("field_name"),"_")(1),"Fld","")
    Select Case Request("field_type")
        Case 30
            modules = "EXTDB"
            table = Split(Request("field_param"),"^")(0)
        Case 33
            modules = "REFM"
            table = "company"
        Case 32
            modules = "REFM"
            table = "users"
        Case 31
            modules = "ProjectManager"
            table = "projects"
    End Select
    file = Server.MapPath("/Modules/"&modules&"/table_"&table&"_"&SESSION("SYSTEM.ID")&".xml")
    If Not CheckFile(file) Then
        file = Server.MapPath("/Modules/"&modules&"/table_"&table&".xml")
        If Not CheckFile(file) Then
            file = ""
        End If
    End If
    Set xml = SESSION("ess107_AppLibWSC").classXML()
    xml.Open(file)
    
    Dim company_list
    Select Case table
        Case "users"
                str = ""
                If InStr(Request("param"),"users"&fldalias&"_userstitle=") Then
                    str = Replace(Split(Request("param"),"users"&fldalias&"_userstitle=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Contact Job Type"
                GUI.Template.SetVariable "FLD" , "users"&fldalias&"_userstitle"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT distinct users_title FROM users WHERE users_act=1 ORDER BY users_title")
                While Not RS.Eof
                    If RS("users_title").Value=str Then
                        company_list.Append("<option value="""&RS("users_title").Value&"""selected>"&RS("users_title").Value&"</option>")
                    Else
                        company_list.Append("<option value="""&RS("users_title").Value&""">"&RS("users_title").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' FLD='users"&fldalias&"_userstitle' title='Contact Job Type'><option></option>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),Request("field_name")&"=") Then
                    str = Replace(Split(Request("param"),Request("field_name")&"=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "User"
                GUI.Template.SetVariable "FLD" , Request("field_name")
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<select NAME=""filter"" FLD='"&Request("field_name")&"'>"&_
                    "<option></option>"&_
                    "<option value='#USER.ID#'>Active Account</option>"&_
                    "</select>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),"users"&fldalias&"_userscompany=") Then
                    str = Replace(Split(Request("param"),"users"&fldalias&"_userscompany=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "by User's Company"
                GUI.Template.SetVariable "FLD" , "users"&fldalias&"_userscompany"
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<input type='checkbox' name='filter' FLD='users"&fldalias&"_userscompanyid' value='#USER.COMPANY.ID#'>"
            GUI.Template.ParseBlock "tLIST"
        Case "company"
                str = ""
                If InStr(Request("param"),"company"&fldalias&"_companytype=") Then
                    str = Replace(Split(Request("param"),"company"&fldalias&"_companytype=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit Type"
                GUI.Template.SetVariable "FLD" , "company"&fldalias&"_companytype"
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<INPUT TYPE=""text"" TITLE=""Business Unit Type"" NAME=""filter"" FLD='company"&fldalias&"_companytype' VALUE="""&str&""" size=50>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),"company"&fldalias&"_name=") Then
                    str = Replace(Split(Request("param"),"company"&fldalias&"_name=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit Name"
                GUI.Template.SetVariable "FLD" , "company"&fldalias&"_name"
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<INPUT TYPE=""text"" TITLE=""Business Unit Name"" NAME=""filter"" FLD='company"&fldalias&"_name' VALUE="""&str&""" size=50>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),"company"&fldalias&"_maincompany=") Then
                    str = Replace(Split(Request("param"),"company"&fldalias&"_maincompany=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit - Main Company Name"
                GUI.Template.SetVariable "FLD" , "company"&fldalias&"_maincompany"
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<INPUT TYPE=""text"" TITLE=""Business Unit Main Company Name"" NAME=""filter"" FLD='company"&fldalias&"_maincompany' VALUE="""&str&""" size=50>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),Request("field_name")&"=") Then
                    str = Replace(Split(Request("param"),Request("field_name")&"=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit"
                GUI.Template.SetVariable "FLD" , Request("field_name")
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<select NAME=""filter"" FLD='"&Request("field_name")&"'>"&_
                    "<option></option>"&_
                    "<option value='userscompany'>User's Company</option>"&_
                    "<option value='usersdivision'>User's Company / Division</option>"&_
                    "</select>"
            GUI.Template.ParseBlock "tLIST"
            Dim fltFld : fltFld = "company"&Split(LCase(Request("field_name")),"fld")(1)&"_maincompany"
                str = ""
                If InStr(Request("param"),fltFld&"=") Then
                    str = Replace(Split(Request("param"),fltFld&"=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit - Main Company"
                GUI.Template.SetVariable "FLD" , fltFld
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<select NAME=""filter"" FLD='"&fltFld&"'>"&_
                    "<option></option>"&_
                    "<option value='userscompany_name'>User's Company</option>"&_
                    "<option value='usersdivision_name'>User's Company - Division</option>"&_
                    "</select>"
            GUI.Template.ParseBlock "tLIST"
        Case "projects"
                str = ""
                If InStr(Request("param"),"projects"&fldalias&"_projectscompany=") Then
                    str = Replace(Split(Request("param"),"projects"&fldalias&"_projectscompany=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Business Unit"
                GUI.Template.SetVariable "FLD" , "projects"&fldalias&"_projectscompany"
                GUI.Template.SetVariable "VALUE", str
                Set company_list = SESSION("ess107_AppLib").classString()
                Set RS = ExecuteStat("SELECT company_id,company_name FROM company WHERE company_act=1 ORDER BY company_name")
                While Not RS.Eof
                    If CStr(RS("company_id").Value)=str Then
                        company_list.Append("<option value='"&RS("company_id").Value&"' selected>"&RS("company_name").Value&"</option>")
                    Else
                        company_list.Append("<option value='"&RS("company_id").Value&"'>"&RS("company_name").Value&"</option>")
                    End If
                    RS.MoveNext
                Wend
                GUI.Template.SetVariable "FIELD_SELECT", "<select name='filter' FLD='projects"&fldalias&"_projectscompany' title='Business Unit'><option></option>"&company_list.ToString()&"</select>"
            GUI.Template.ParseBlock "tLIST"
                str = ""
                If InStr(Request("param"),Request("field_name")&"=") Then
                    str = Replace(Split(Request("param"),Request("field_name")&"=")(1),"'","")
                    str = Replace(str,"`","")
                End If
                GUI.Template.SetVariable "FIELD_TITLE" , "Project"
                GUI.Template.SetVariable "FLD" , Request("field_name")
                GUI.Template.SetVariable "VALUE", str
                GUI.Template.SetVariable "FIELD_SELECT", "<select NAME=""filter"" FLD='"&Request("field_name")&"'>"&_
                    "<option></option>"&_
                    "<option value='projectsaccess'>Assigned projects</option>"&_
                    "</select>"
            GUI.Template.ParseBlock "tLIST"
        Case Else
            Set RS = ExecuteStat("SELECT TOP 1 * FROM "&table)
            For Each fld in RS.Fields
                field = xml.getNodesArray("/ROOT/TABLE/FIELD[@NAME='"&fld.Name&"']")
                If UBound(field)>0 Then
                    If field(0).getAttribute("Title") > "" AND InStr("|SELECT|SELECT2|COMBOBOX|",field(0).getAttribute("Type")) AND field(0).getAttribute("Table") = "1" Then
                        str = ""
                        If InStr(Request("param"),fld.Name&"=") Then
                            str = Replace(Split(Request("param"),fld.Name&"=")(1),"'","")
                            str = Replace(str,"`","")
                        End If
                        GUI.Template.SetVariable "FIELD_TITLE" , field(0).getAttribute("Title")
                        GUI.Template.SetVariable "FLD" , fld.Name
                        GUI.Template.SetVariable "VALUE", str
                        GUI.Template.SetVariable "FIELD_SELECT", "<INPUT TYPE=""text"" TITLE="""&field(0).getAttribute("Title")&""" NAME=""filter"" FLD="""&fld.Name&""" VALUE="""&str&""" size=50>"
                        GUI.Template.ParseBlock "tLIST"
                    End If
                End If
            Next
    End Select
    Set xml = Nothing
End Sub

Function DeleteRec( valTable, valParam )
    Dim RS,tbl
    Select Case valTable
        Case "ExtDBtbl"
            If IsNumeric(valParam) Then
            Set RS = Execute("DELETE FROM [ExtDBtbl] WHERE ExtDBtbl_id="&valParam)
            Set RS = Execute("DELETE FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&valParam)
            Set RS = Execute("DELETE FROM [ExtDBpg] WHERE ExtDBpg_ExtDBtbl_id="&valParam)
            Set RS = Nothing
            if err.number<>0 then
              DeleteRec = False
            else
              DeleteRec = True
            end if
            Else
              DeleteRec = False
            End If
        Case "ExtDBpg"
            If IsNumeric(valParam) Then
            Set RS = Execute("DELETE FROM ["&valTable&"] WHERE "&valTable&"_id="&valParam)
            Set RS = Nothing
            if err.number<>0 then
              DeleteRec = False
            else
              DeleteRec = True
            end if
            Else
              DeleteRec = False
            End If
        Case "ExtDBweb"
            If IsNumeric(valParam) Then
                Set RS = Execute("DELETE FROM [ExtDBweb] WHERE ExtDBweb_id="&valParam)
                Set RS = Nothing
                if err.number<>0 then
                  DeleteRec = False
                else
                  DeleteRec = True
                end if
            Else
              DeleteRec = False
            End If
        Case "ExtDBview"
            If IsNumeric(valParam) Then
                Set RS = Execute("DELETE FROM [ExtDBview] WHERE ExtDBview_id="&valParam)
                Set RS = Nothing
                if err.number<>0 then
                  DeleteRec = False
                else
                  DeleteRec = True
                end if
            Else
              DeleteRec = False
            End If
        Case "ExtDBmdl"
            If IsNumeric(valParam) Then
                Set RS = Execute("DELETE FROM [ExtDBmdl] WHERE ExtDBmdl_id="&valParam)
                Set RS = Execute("DELETE FROM [ExtDBpg] WHERE ExtDBpg_ExtDBmdl_id="&valParam)
                Set RS = Nothing
                if err.number<>0 then
                  DeleteRec = False
                else
                  DeleteRec = True
                end if
            Else
              DeleteRec = False
            End If
        Case Else
            If IsNumeric(valParam) Then
                tbl = Replace(valTable,"ExtDB","")
                Set RS = ExecuteStat("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&tbl&" AND ExtDBfld_type=90")
                While Not RS.Eof
                    Call Execute("DELETE FROM ExtDB"&RS("ExtDBfld_param").Value&" WHERE ExtDB"&RS("ExtDBfld_param").Value&"_ExtDB"&tbl&"_id="&valParam&"")
                    RS.MoveNext
                Wend
                RS.Close
                Call Execute("DELETE FROM ["&valTable&"] WHERE "&valTable&"_id="&valParam)
                if err.number<>0 then
                  DeleteRec = False
                else
                  DeleteRec = True
                end if
            Else
                  DeleteRec = False
            End If
    End Select
End Function

Function getTitle(valId)
    Dim RS : Set RS = ExecuteStat("SELECT "&varTable&"_title FROM "&varTable&" WHERE "&varTable&"_id="&valId)
    If RS.RecordCount > 0 Then getTitle = RS(0).Value
End Function

Function CreateListFromSting(valStr)
    Dim buff, rec
    For Each rec In Split(valStr,"|")
        buff = buff & "<option value="""&rec&""">"&rec&"</option>"
    Next
    CreateListFromSting= buff
End Function

Sub ImportModule()
    Dim data : data = readFile( Server.MapPath("lib/"&Request("module")&".sql") )
    Dim RS : Set RS = ExecuteStat("select max(ExtDBtbl_id) from ExtDBtbl")
    Dim lastID : lastID = RS(0).Value
    Call Execute(data)
    
    Set RS = ExecuteStat("select ExtDBtbl_id from ExtDBtbl where ExtDBtbl_id > " & lastID)
    While Not RS.Eof
        Call UpdateSQL(RS(0).Value)
        Call updateTemplate(RS(0).Value)
        RS.MoveNext
    Wend
    
    Call updateReports()
    Call LoadMenu()
    Response.Write "<SCRIPT>parent.bootbox.alert('Module Impoted.');window.returnValue = true;</SCRIPT>"
End Sub

Sub ImportConfig()
    Dim p_tbl_id,subs
    Dim xml : xml = Request("ext_xml")
    Dim xml_error : xml_error = ""
    Dim objXML : Set objXML = SESSION("ess107_AppLibWSC").classXML()
    objXML.Load(xml)
    Dim buff,list,sublist,fld,subfld,rec,subrec,RS,RS2,subTbl
    list = objXML.getNodesArray("/ExtDB/ExtDBtbl")	
    If Ubound(list)>0 Then
        Set rec = list( 0 )
        Set RS = Execute("SELECT TOP 1 * FROM ExtDBtbl")
        RS.AddNew
        RS("ExtDBtbl_title").Value = rec.getAttribute("title")
        If rec.getAttribute("module")>"" Then
            Set RS2 = ExecuteStat("SELECT * FROM ExtDBmdl WHERE ExtDBmdl_title='"&rec.getAttribute("module")&"'")
            If RS2.RecordCount<1 Then
                Set RS2 = Execute("SELECT TOP 1 * FROM ExtDBmdl")
                RS2.AddNew
                RS2("ExtDBmdl_title").Value = rec.getAttribute("module")
                RS2("ExtDBmdl_act").Value = 1
                RS2.Update
                RS2.MoveLast
                RS2.Close
            End If
        End If
        RS("ExtDBtbl_type").Value = rec.getAttribute("type")
        RS("ExtDBtbl_report").Value = rec.getAttribute("report")
        RS.Update
        RS.MoveLast
        p_tbl_id = RS("ExtDBtbl_id")
        RS.Close
        list = objXML.getNodesArray("/ExtDB/ExtDBtbl/ExtDBfld")
        For fld=0 To Ubound(list)-1
            Set RS = Execute("SELECT TOP 1 * FROM ExtDBfld")
            RS.AddNew
            Set rec = list( fld )
            RS("ExtDBfld_ExtDBtbl_id").Value = p_tbl_id
            RS("ExtDBfld_type").Value = rec.getAttribute("type")
            If RS("ExtDBfld_type").Value=72 Then
                RS("ExtDBfld_param").Value = SESSION("ess107_AppLib").Base64Decode(rec.getAttribute("param"))
            Else
                RS("ExtDBfld_param").Value = rec.getAttribute("param")
            End If
            RS("ExtDBfld_filter").Value = rec.getAttribute("filter")
            RS("ExtDBfld_title").Value = rec.Text
            RS("ExtDBfld_req").Value = rec.getAttribute("req")
            RS("ExtDBfld_uniq").Value = rec.getAttribute("uniq")
            RS("ExtDBfld_order").Value = rec.getAttribute("order")
            If rec.getAttribute("type") = 90 Then
                subTbl = 0
                sublist = objXML.getNodesArray("/ExtDB/ExtDBtbl/ExtDBtbl"&rec.getAttribute("param"))
                If Ubound(sublist)>0 Then
                    Set subrec = sublist( 0 )
                    Set RS2 = Execute("SELECT TOP 1 * FROM ExtDBtbl")
                    RS2.AddNew
                    RS2("ExtDBtbl_title").Value = subrec.getAttribute("title")
                    RS2("ExtDBtbl_type").Value = subrec.getAttribute("type")
                    RS2("ExtDBtbl_report").Value = subrec.getAttribute("report")
                    RS2.Update
                    RS2.MoveLast
                    subTbl = RS2("ExtDBtbl_id")
                    RS2.Close
                    sublist = objXML.getNodesArray("/ExtDB/ExtDBtbl/ExtDBtbl"&rec.getAttribute("param")&"/ExtDBfld")
                    For subfld=0 To Ubound(sublist)-1
                        Set RS2 = Execute("SELECT TOP 1 * FROM ExtDBfld")
                        RS2.AddNew
                        Set subrec = sublist( subfld )
                        RS2("ExtDBfld_ExtDBtbl_id").Value = subTbl
                        RS2("ExtDBfld_type").Value = subrec.getAttribute("type")
                        RS2("ExtDBfld_param").Value = subrec.getAttribute("param")
                        RS2("ExtDBfld_filter").Value = subrec.getAttribute("filter")
                        RS2("ExtDBfld_title").Value = subrec.Text
                        RS2("ExtDBfld_req").Value = subrec.getAttribute("req")
                        RS2("ExtDBfld_uniq").Value = subrec.getAttribute("uniq")
                        RS2("ExtDBfld_order").Value = subrec.getAttribute("order")
                        RS2.Update
                        RS2.Close
                    Next
                    if subTbl > 0 Then
                        subs = subs & subTbl & "|"
                    End If
                End If
                RS("ExtDBfld_param").Value = subTbl
            End If
            RS.Update
            RS.Close
        Next
        If Ubound(list)<1 Then
            xml_error = xml_error & " No Data in Config "
        End If
    Else
        xml_error = xml_error & " No Data in Config "
    End If
    If Err.number <> 0 Then
        xml_error = xml_error & Err.Description
    End If
    If xml_error>"" or objXML.strXMLError>"" Then
        Response.Write "<SCRIPT>parent.bootbox.alert('Config not Impoted. Error: "&xml_error&" | "&objXML.strXMLError&"');</SCRIPT>"
    Else
        Response.Write "<SCRIPT>parent.bootbox.alert('Config Impoted.');window.returnValue = true;</SCRIPT>"
    End If
    If p_tbl_id > 0 Then 
        Call UpdateTable(p_tbl_id,0)
        Call UpdateFields(p_tbl_id)
        For Each rec in Split(subs,"|")
            subTbl = Trim(rec)
            If subTbl>"" Then
                Call UpdateTable(subTbl,p_tbl_id)
                Call UpdateFields(subTbl)
                Call UpdateSQL(subTbl)
            End If
        Next
        Call UpdateSQL(p_tbl_id)
        Call updateReports()
        Call updateTemplate(p_tbl_id)
        Call LoadMenu()
    End If
End Sub

Sub ExportConfig(valParam)
    Response.ContentType = "text/xml"
    Response.AddHeader "Content-Disposition", "attachment;filename=export.xml"
    Response.Write "<ExtDB>"
    Dim RS,RS2,field, subTbl
    Set RS = ExecuteStat("select * from extdbtbl where extdbtbl_id="&valParam&"")
    If RS.RecordCount>0 Then
        Response.Write "<ExtDBtbl"
        Response.Write " title="""&RS("ExtDBtbl_title").Value&""""
        Response.Write " type="""&RS("ExtDBtbl_type").Value&""""
        Response.Write " report="""&RS("ExtDBtbl_report").Value&""""
        Response.Write ">"&VbCrLf
        Set RS = ExecuteStat("select * from extdbfld where extdbfld_extdbtbl_id="&valParam&" order by extdbfld_order")
        While Not RS.Eof
            Response.Write "<ExtDBfld"
            Response.Write " type="""&RS("ExtDBfld_type").Value&""""
            If RS("ExtDBfld_type").Value=72 Then
                Response.Write " param="""&convertHTMLParam(RS("ExtDBfld_param").Value)&""""
            Else
                Response.Write " param="""&RS("ExtDBfld_param").Value&""""
            End If
            Response.Write " filter="""&RS("ExtDBfld_filter").Value&""""
            Response.Write " req="""&RS("ExtDBfld_req").Value&""""
            Response.Write " uniq="""&RS("ExtDBfld_uniq").Value&""""
            Response.Write " order="""&RS("ExtDBfld_order").Value&""""
            Response.Write ">"&RS("ExtDBfld_title").Value&"</ExtDBfld>"&VbCrLf
            If RS("ExtDBfld_type").Value = 90 Then
                subTbl = RS("ExtDBfld_param").Value
                Set RS2 = ExecuteStat("select * from extdbtbl where extdbtbl_id="&RS("ExtDBfld_param").Value&"")
                If RS2.RecordCount>0 Then
                    Response.Write "<ExtDBtbl"&subTbl
                    Response.Write " title="""&RS2("ExtDBtbl_title").Value&""""
                    Response.Write " type="""&RS2("ExtDBtbl_type").Value&""""
                    Response.Write " report="""&RS2("ExtDBtbl_report").Value&""""
                    Response.Write ">"&VbCrLf
                    Set RS2 = ExecuteStat("select * from extdbfld where extdbfld_extdbtbl_id="&RS2("ExtDBtbl_id").Value&" order by extdbfld_order")
                    While Not RS2.Eof
                        Response.Write "<ExtDBfld"
                        Response.Write " type="""&RS2("ExtDBfld_type").Value&""""
                        Response.Write " param="""&RS2("ExtDBfld_param").Value&""""
                        Response.Write " filter="""&RS2("ExtDBfld_filter").Value&""""
                        Response.Write " req="""&RS2("ExtDBfld_req").Value&""""
                        Response.Write " uniq="""&RS2("ExtDBfld_uniq").Value&""""
                        Response.Write " order="""&RS2("ExtDBfld_order").Value&""""
                        Response.Write ">"&RS2("ExtDBfld_title").Value&"</ExtDBfld>"&VbCrLf
                        RS2.MoveNext
                    Wend
                    Response.Write "</ExtDBtbl"&subTbl&">"&VbCrLf
                End If
            End If
            RS.MoveNext
        Wend
        Response.Write "</ExtDBtbl>"&VbCrLf
    End If
    Response.Write "</ExtDB>"
    RS.Close
End Sub

Function getModulesList()
    Dim text : Set text = SESSION("ess107_AppLib").classString()
    Dim RS : Set RS = ExecuteStat("SELECT ExtDBmdl_id,ExtDBmdl_title,ExtDBmdl_type FROM ExtDBmdl ORDER BY ExtDBmdl_title")
    While Not RS.Eof
        text.Append("<option value='"&RS(0).Value&"'>"&RS(1).Value&" - "&RS(2).Value&"</option>")
        RS.MoveNext
    Wend
    getModulesList = text.ToString()
End Function

Function getFormsList(id)
    Dim text : Set text = SESSION("ess107_AppLib").classString()
    Dim RS : Set RS = ExecuteStat("SELECT ExtDBweb_id,ExtDBweb_title FROM ExtDBweb WHERE ExtDBweb_ExtDBtbl_id="&id&" ORDER BY ExtDBweb_title")
    While Not RS.Eof
        text.Append("<option value='"&RS(0).Value&"'>"&RS(1).Value&"</option>")
        RS.MoveNext
    Wend
    getFormsList = text.ToString()
End Function

Function TABLES_LIST()
    Dim text : Set text = SESSION("ess107_AppLib").classString()
    Dim RS
    Set RS = ExecuteStat("SELECT *,(CASE WHEN ExtDBtbl_type=2 THEN (select top 1 t.extdbtbl_title from extdbfld as f left join extdbtbl as t on t.extdbtbl_id=f.extdbfld_extdbtbl_id where f.extdbfld_param like CAST(ExtDBtbl.ExtDBtbl_id AS VARCHAR))+' / '+ExtDBtbl_title ELSE ExtDBtbl_title END) AS [title] "&_
            "FROM ExtDBtbl "&_
            "ORDER BY "&_
            "	[title] ")
    While Not RS.Eof
        text.Append("<option value='"&RS("ExtDBtbl_id").Value&"'>"&RS("title").Value&"</option>")
        RS.MoveNext
    Wend
    TABLES_LIST = text.ToString()
End Function

Function MODULES_LIST()
    Dim text : Set text = SESSION("ess107_AppLib").classString()
    Dim data : data = Split(readFile( Server.MapPath("lib/modules.txt") )&""&VbCrLf,VbCrLf)
    Dim RS
    Dim mdl
    For mdl=0 To UBound(data)-1
        If Trim(data(mdl))>"" Then
            Set RS = Execute("select COUNT(1) as total from ExtDBmdl where ExtDBmdl_lib='"&Split(data(mdl),"|")(0)&"'")
            If RS("Total").Value>0 Then
                text.Append("<option disabled value='"&Split(data(mdl),"|")(0)&"'>"&Split(data(mdl),"|")(1)&"</option>")
            Else
                text.Append("<option value='"&Split(data(mdl),"|")(0)&"'>"&Split(data(mdl),"|")(1)&"</option>")
            End If
        End If
    Next
    MODULES_LIST = text.ToString()
End Function

Function CreateExtPage(id,title)
    Dim mdl_id
    Dim RS : Set RS = Execute("SELECT * FROM [ExtDBtbl] WHERE ExtDBtbl_id="&id)
    If Not RS.Eof Then
        If RS("ExtDBtbl_type").Value=2 Then
            Set RS = Execute("SELECT * FROM [ExtDBtbl] WHERE ExtDBtbl_id="&id)
            Set RS = Execute("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_param like '"&RS("ExtDBtbl_id")&"'")
            Set RS = Execute("SELECT * FROM [ExtDBtbl] WHERE ExtDBtbl_id="&RS("ExtDBfld_ExtDBtbl_id"))
        Else
            Set RS = Execute("SELECT * FROM [ExtDBtbl] WHERE ExtDBtbl_id="&id)
        End If
        Set RS = Execute("SELECT TOP 1 * FROM [ExtDBpg]")
        RS.AddNew
        RS("ExtDBpg_title").Value = title
        RS("ExtDBpg_ExtDBtbl_id").Value = id
        RS("ExtDBpg_share").Value = GetGuidBig()
        RS("ExtDBpg_act").Value = 1
        RS.Update
        RS.MoveLast
        CreateExtPage = RS("ExtDBpg_id").Value
    End If
End Function

Function getFieldsAccessList(id,page)
    Dim tpl : tpl = ""
    Dim buff : buff = ""
    Dim RS : Set RS = Execute("SELECT *"&_
        ",(select top 1 ExtDBpgfld_access from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&page&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as access "&_
        ",(select top 1 ExtDBpgfld_ingrid from ExtDBpgfld where ExtDBpgfld_ExtDBpg_id="&page&" and ExtDBpgfld_ExtDBfld_id=ExtDBfld_id) as ingrid "&_
        "FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&id&" ORDER BY ExtDBfld_order")
    While Not RS.Eof
        tpl = ""&_
            "<TR>"&_
            "	<TD class='t_hd' WIDTH='150' NOWRAP><B>{{ExtDBfld_title}}</B></TD>"&_
            "	<TD class='t_td'>"&_
            "	<input type=hidden name='field_id' value='{{ExtDBfld_id}}' fld_tbl='"&id&"' fld_title='"&RS("ExtDBfld_title").Value&"' fld_type='"&RS("ExtDBfld_type").Value&"'>"&_
            "	Access:<select data-val='{{access}}' name='field_access' style='width:100px;'>"&_
            "		<option value=''>Default</option>"&_
            "		<option value='view'>View Only</option>"&_
            "		<option value='edit'>Edit Field</option>"&_
            "		<option value='hidden'>Hidden</option>"&_
            "	</select>"&_
            "	<span class='ingrid'>inGrid:<select data-val='{{ingrid}}' name='field_ingrid' style='width:100px;'>"&_
            "		<option value=''>Show</option>"&_
            "		<option value='hide'>Hide</option>"&_
            "	</select></span>"&_
            "	"&_
            "	<TD class='t_td' NOWRAP WIDTH='1'></TD>"&_
            "</TR>"
        Select Case RS("ExtDBfld_type").Value
            Case 70
                tpl = Replace(tpl,"<TR>","<TR style='background:rgb(200,200,230) !important'>")
                tpl = Replace(tpl,"class='ingrid'","class='ingrid hidden'")
                tpl = Replace(tpl,"{{ingrid}}","hide")
            Case 80
                tpl = Replace(tpl,"<TR>","<TR style='background:rgb(220,220,220) !important'>")
                tpl = Replace(tpl,"class='ingrid'","class='ingrid hidden'")
                tpl = Replace(tpl,"{{ingrid}}","hide")
            Case 2011,2012,70,72
                tpl = Replace(tpl,"class='ingrid'","class='ingrid hidden'")
                tpl = Replace(tpl,"{{ingrid}}","hide")
        End Select
        tpl = Replace(tpl,"{{ExtDBfld_id}}",RS("ExtDBfld_id").Value&"")
        tpl = Replace(tpl,"{{ExtDBfld_title}}",RS("ExtDBfld_title").Value&"")
        tpl = Replace(tpl,"{{access}}",RS("access").Value&"")
        tpl = Replace(tpl,"{{ingrid}}",RS("ingrid").Value&"")
        
        buff = buff & tpl
        RS.MoveNext
    Wend
    getFieldsAccessList = buff
End Function

Function getFilterList(id)
    Dim reports,report,title,RS,buff,field,item
    Dim fields,fld,fld_name,fld_type
    Set RS = ExecuteStat("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&id&" ORDER BY ExtDBfld_order")
    buff = ""
    buff = buff & "<div class=column nowrap>"&VbCrLf
    buff = buff & "<label>Page Filter:</label> <select name='field_src' onchange='changeColumn()' style='width:160px;' align=absmiddle><option></option>"&VbCrLf
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case 60,90,2032,80,70
            Case Else
                buff = buff & "<option value=""ExtDB"&RS("ExtDBfld_ExtDBtbl_id").Value&"_Fld"&RS("ExtDBfld_id").Value&""" type='"&RS("ExtDBfld_type").Value&"'>"&RS("ExtDBfld_title").Value&"</option>"&VbCrLf
        End Select
        RS.MoveNext
    Wend
    buff = buff & "</select>"&VbCrLf
    buff = buff & "<button id='column_button' onclick='getFilter()' disabled>Add Filter</button>"&VbCrLf
    buff = buff & "</div>"&VbCrLf
    buff = buff & "<script>document.editForm.field_src.value='';</script>"&VbCrLf
    getFilterList = buff
End Function

Function getFilterList2(id)
    Dim reports,report,title,RS,buff,field,item
    Dim fields,fld,fld_name,fld_type
    Set RS = ExecuteStat("SELECT * FROM [ExtDBfld] WHERE ExtDBfld_ExtDBtbl_id="&id&" ORDER BY ExtDBfld_order")
    buff = ""
    While Not RS.Eof
        Select Case RS("ExtDBfld_type")
            Case 60,90,2032,80,70
            Case Else
                buff = buff & "<option value=""ExtDB"&RS("ExtDBfld_ExtDBtbl_id").Value&"_Fld"&RS("ExtDBfld_id").Value&""" type='"&RS("ExtDBfld_type").Value&"'>"&RS("ExtDBfld_title").Value&"</option>"&VbCrLf
        End Select
        RS.MoveNext
    Wend
    getFilterList2 = buff
End Function

Function getReportsFieldList(id)
    Dim list, fields, field, rec
    Dim RS 
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&id)
    If RS.RecordCount>0 Then
        ReDim fields(RS.RecordCount,2)
        rec = 0
        While Not RS.Eof
            fields(rec,0) = Trim(RS("ExtDBfld_title").Value)
            fields(rec,1) = ""
            RS.MoveNext
            rec = rec + 1
        Wend
    Else
        ReDim fields(0,2)
    End If
    Dim Dir, FS, files, file
    Set FS = Server.CreateObject("Scripting.FileSystemObject")
    Dir = Server.MapPath("\Files\"&SESSION("SYSTEM.ID")&"\Reports")
    If FS.FolderExists(Dir) Then
        Set files = FS.GetFolder(Dir).Files
        For Each file In files
            If InStr(file.Name,".xml") Then
                Call checkFieldsInXML("ExtDB"&id,fields,Server.MapPath("\Files\"&SESSION("SYSTEM.ID")&"\Reports\"&file.Name))
            End If
        Next
    End If
    For field = 0 To UBound(fields)-1
        If fields(field,1) > "" Then
            list = list & fields(field,0) & ":" & fields(field,1) & "^"
        End If
    Next
    getReportsFieldList = list
End Function

Sub checkFieldsInXML(table,arr,fileName)
    Dim objXML : Set objXML = SESSION("ess107_AppLibWSC").classXML() : objXML.Open(fileName)
    Dim title, list, item, item2, rec, param, sources, fields, field
    list = objXML.getNodesArray("/root/report")	
    For item=0 To Ubound(list)-1
        Set rec = list(item)
        title = rec.getAttribute("REPORT_TITLE")
        sources = Split(objXML.getValue(rec,"REPORT_CSOURCES"),",")
        fields = Split(objXML.getValue(rec,"REPORT_COLUMN"),", ")
        For field=0 To UBound(fields)-1
            For item2 = 0 To Ubound(arr)
                If arr(item2,0)=Trim(fields(field)) AND table=Replace(Trim(sources(field)),"report_","") Then
                    If InStr(arr(item2,1),title)<1 Then
                        arr(item2,1) = arr(item2,1) & title & "\n"
                    End If
                End If
            Next
        Next
    Next
End Sub

Function getViewsList(valParam)
    Dim txt : Set txt = SESSION("ess107_AppLib").classString()
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBview WHERE ExtDBview_ExtDBpg_id="&valParam)
    While Not RS.Eof
        txt.Append("{")
        txt.Append("id:"&RS("ExtDBview_id")&",")
        txt.Append("title:'"&RS("ExtDBview_title")&"',")
        txt.Append("link:'"&RS("ExtDBview_tpl")&"',")
        RS.MoveNext
        If Not RS.Eof Then txt.Append("},") Else txt.Append("}")
    Wend
    getViewsList = txt.ToString()
End Function

Function getPgWebLink(valParam)
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBpg WHERE ExtDBpg_id="&valParam)
    If Not RS.Eof Then
        getPgWebLink = SITE_URL&"/Share/?pgform:"&SESSION("SYSTEM.ID")&"."&RS("ExtDBpg_share")
    Else
        getPgWebLink = ""
    End If
End Function

Function getWebsList(valParam)
    Dim txt : Set txt = SESSION("ess107_AppLib").classString()
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBweb WHERE ExtDBweb_ExtDBtbl_id="&valParam)
    While Not RS.Eof
        txt.Append("{")
        txt.Append("id:"&RS("ExtDBweb_id")&",")
        txt.Append("title:'"&RS("ExtDBweb_title")&"',")
        txt.Append("link:'"& SITE_URL&"/Share/?webform:"&SESSION("SYSTEM.ID")&"."&RS("ExtDBweb_share") &"',")
        If Trim(RS("ExtDBweb_tpl").Value)>"" And Trim(RS("ExtDBweb_tpl").Value)<>"." Then
            txt.Append("tpl:"&"true")
        Else
            txt.Append("tpl:"&"false")
        End If
        RS.MoveNext
        If Not RS.Eof Then txt.Append("},") Else txt.Append("}")
    Wend
    getWebsList = txt.ToString()
End Function

Sub getTplList(valParam)
    Dim RS,def,dir
    If valParam = "new" Then valParam = 0
    Set RS = ExecuteStat("SELECT * FROM ExtDBview WHERE ExtDBview_id="&valParam)
    If Not RS.Eof Then
        def = RS("ExtDBview_file").Value
    End If
    dir = SESSION("FILESDIR")&"ExtDB\Tpl\"
    Call CheckFolder(dir)
    dim FSO, file, files, text
    set FSO = CreateObject("Scripting.FileSystemObject")
    Set files = fso.GetFolder(dir).Files
    text = text & "<option value=''>Custom Template</option>"
    For Each file in files
        If InStr(file.name,".htm")>0 Or InStr(file.name,".pdf")>0 Then
            If file.name = def Then
                text = text & "<option value="""&file.name&""" selected>"&file.name&"</option>"
            Else
                text = text & "<option value="""&file.name&""">"&file.name&"</option>"
            End If
        End If
    Next
    set FSO = Nothing
    GUI.Template.SetVariable "TPL_LIST",text
End Sub

Sub getViewPrams(valParam)
    Dim RS,text,url
    Dim text2
    If valParam = "new" Then 
        GUI.Template.SetVariable "ExtDBview_id", valParam
        GUI.Template.SetVariable "ExtDBview_ExtDBpg_id", Request("ExtDBview_ExtDBpg_id")
        GUI.Template.SetVariable "ExtDBview_title", ""
        GUI.Template.SetVariable "ExtDBview_file", ""
        GUI.Template.SetVariable "ExtDBview_tpl", ""
    Else
        url = SESSION("FILESURL")&"PersonalFolder/EZ Data/ExtDBview/"&valParam&"/"
        Set RS = ExecuteStat("SELECT * FROM ExtDBview WHERE ExtDBview_id="&valParam)
        If Not RS.Eof Then
            GUI.Template.SetVariable "ExtDBview_id", RS("ExtDBview_id").Value
            GUI.Template.SetVariable "ExtDBview_ExtDBpg_id", RS("ExtDBview_ExtDBpg_id").Value
            GUI.Template.SetVariable "ExtDBview_title", RS("ExtDBview_title").Value
            GUI.Template.SetVariable "ExtDBview_file", fileLink(url,RS("ExtDBview_file").Value)
            GUI.Template.SetVariable "ExtDBview_tpl", RS("ExtDBview_tpl").Value
        End If
    End If
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id IN (SELECT ExtDBpg_ExtDBtbl_id FROM ExtDBpg WHERE ExtDBpg_id="&Request("ExtDBview_ExtDBpg_id")&")")
    While Not RS.Eof
        If RS("ExtDBfld_type").Value=90 Then
            text2 = text2 & RS("ExtDBfld_title").Value & "###" & getCrossTPL(RS("ExtDBfld_param").Value,RS("ExtDBfld_title").Value) & "|||"
        Else
            text = text & RS("ExtDBfld_title").Value & "|||"
        End If
        RS.MoveNext
    Wend
    GUI.Template.SetVariable "FIELDS_LIST", text
    GUI.Template.SetVariable "SUBFORMS_LIST", text2
End Sub

Sub getWebsPrams(valParam)
    Dim RS,text,fldtype
    If valParam = "new" Then 
        GUI.Template.SetVariable "ExtDBweb_id", valParam
        GUI.Template.SetVariable "ExtDBweb_ExtDBtbl_id", Request("ExtDBweb_ExtDBtbl_id")
        GUI.Template.SetVariable "ExtDBweb_title", ""
        GUI.Template.SetVariable "ExtDBweb_css", "bootstrap"
        GUI.Template.SetVariable "ExtDBweb_tpl", ""
        GUI.Template.SetVariable "ExtDBweb_files", 0
        GUI.Template.SetVariable "ExtDBweb_share", GetGuidBig()
    Else
        Set RS = ExecuteStat("SELECT * FROM ExtDBweb WHERE ExtDBweb_id="&valParam)
        If Not RS.Eof Then
            GUI.Template.SetVariable "ExtDBweb_id", RS("ExtDBweb_id").Value
            GUI.Template.SetVariable "ExtDBweb_ExtDBtbl_id", RS("ExtDBweb_ExtDBtbl_id").Value
            GUI.Template.SetVariable "ExtDBweb_title", RS("ExtDBweb_title").Value
            GUI.Template.SetVariable "ExtDBweb_tpl", RS("ExtDBweb_tpl").Value
            GUI.Template.SetVariable "ExtDBweb_files", RS("ExtDBweb_files").Value
            GUI.Template.SetVariable "ExtDBweb_share", RS("ExtDBweb_share").Value
            GUI.Template.SetVariable "ExtDBweb_css", RS("ExtDBweb_css").Value
        End If
    End If
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&Request("ExtDBweb_ExtDBtbl_id"))
    While Not RS.Eof
        fldtype = ""
        Select Case RS("ExtDBfld_type").Value
            Case 200
                fldtype = "TEXT"
            Case 202
                fldtype = "TEXT"
            Case 204
                fldtype = "READONLY-TEXT"
            Case 205
                fldtype = "READONLY-NUMERIC"
            Case 2030
                fldtype = "COMBOBOX"
            Case 2031
                fldtype = "COMBOBOX"
            Case 2032
                fldtype = "COMBOBOX"
            Case 201
                fldtype = "MEMO"
            Case 2011
                fldtype = "MEMO"
            Case 2012
                fldtype = "MEMO"
            Case 135,136
                fldtype = "DATE"
            Case 3
                fldtype = "TEXT"
            Case 131
                fldtype = "TEXT"
            Case 6
                fldtype = "TEXT"
            Case 31
                fldtype = "DB FIELD (Project)"
            Case 32
                fldtype = "DB FIELD (Contact)"
            Case 33
                fldtype = "DB FIELD (Company)"
        End Select
        If fldtype > "" Then
            If text >"" Then text = text & "^"
            text = text & RS("ExtDBfld_title").Value&"~"&RS("ExtDBfld_id").Value&"~"&RS("ExtDBfld_type").Value&"~"&fldtype&"~"&RS("ExtDBfld_req").Value&"~"&RS("ExtDBfld_uniq").Value
        End If
        RS.MoveNext
    Wend
    GUI.Template.SetVariable "FIELDS_LIST", text
End Sub

Function strip_html(strValue)
    Dim str_output
    str_output = Trim(strValue)
    str_output = Replace(strValue&"", "<", "&lt;")
    str_output = Replace(str_output, ">", "&gt;")
    str_output = Replace(str_output, "'", "`")
    str_output = Replace(str_output, "�", "-")
    str_output = Replace(str_output, "�", "'")
    str_output = Replace(str_output, "�", "-")
    strip_html = Trim(str_output)
End Function

Function getCrossTPL(id,title)
    Dim text,RS
    Dim textHead,textBody
    Set RS = ExecuteStat("SELECT * FROM ExtDBfld WHERE ExtDBfld_ExtDBtbl_id="&id)
    While Not RS.Eof
        textHead = textHead & "<th><b>"&RS("ExtDBfld_title").Value&"</b></th>"
        textBody = textBody & "<td>{{"&RS("ExtDBfld_title").Value&"}}</td>"
        RS.MoveNext
    Wend
    text = "<table width='100%'>"
    text = text & "<caption>"&title&"</caption>"
    text = text & "<thead>"
    text = text & "<tr>"&textHead&"</tr>"
    text = text & "</thead>"
    text = text & "<tbody>"
    text = text & "<!-- BEGIN crossTPL"&id&" -->"
    text = text & "<tr>"
    text = text & "<tr>"&textBody&"</tr>"
    text = text & "</tr>"
    text = text & "<!-- END crossTPL"&id&" -->"
    text = text & "</tbody>"
    text = text & "</table>"
    getCrossTPL = text
End Function

Sub ParseSurveyList(tblId,fldId,param)
    'CS@Yes~pass|No~fail^Of^Of>>new~item 1^new~item 2^new~item 3
    Dim tmp : Set tmp = SESSION("ess107_AppLib").DynamicArray() : tmp.Add(0)
    Dim arr : arr = Split(param,">>")
    Dim list : list = Split(arr(1),"^")
    Dim rec, p_id, p_item, RS
    For rec=0 To Ubound(list)
        p_id = Split(list(rec),"~")(0)
        p_item = Split(list(rec),"~")(1)
        If p_id="new" Then
            Set RS = Execute("SELECT TOP 1 * FROM ExtDBsrv")
            RS.AddNew
            RS("ExtDBsrv_ExtDBfld_id") = fldId
            RS("ExtDBsrv_title") = p_item
            RS.Update
            RS.MoveLast
            p_id = RS("ExtDBsrv_id").Value
            RS.Close
            list(rec) = p_id & "~" & p_item
        Else
            Set RS = Execute("SELECT TOP 1 * FROM ExtDBsrv WHERE ExtDBsrv_id="&p_id)
            If Not RS.Eof Then
                RS("ExtDBsrv_title") = p_item
                RS.Update
                RS.Close
            End If
            list(rec) = p_id & "~" & p_item
        End If
        tmp.Add(p_id)
    Next
    arr(1) = Join(list,"^")
    param = Join(arr,">>")
    Set RS = Execute("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&fldId)
    If Not RS.Eof Then
        RS("ExtDBfld_param").Value = param
        RS.Update
        RS.Close
    End If
    Call Execute("DELETE FROM ExtDBsrv WHERE ExtDBsrv_ExtDBfld_id="&fldId&" AND ExtDBsrv_id NOT IN ("&Join(tmp.DataArray(),",")&")")
End Sub

Sub SaveSurvey(vFU,vRequest,vTable,vId)
    Dim fld,tbl,item,answer,notes,RS
    For fld=1 To vFU.Item("ExtDBsrv_id").Count
        tbl = vFU.Item("ExtDBsrv_table").Item(fld)
        item = vFU.Item("ExtDBsrv_id").Item(fld)
        answer = vFU.Item(tbl&"_answer").Item(fld)
        notes = vFU.Item(tbl&"_notes").Item(fld)
        If item>0 Then
            Set RS = Execute("SELECT * FROM ["&tbl&"] WHERE "&tbl&"_"&vTable&"_id="&vId&" AND "&tbl&"_item="&item&"")
        Else
            Set RS = Execute("SELECT * FROM ["&tbl&"] WHERE "&tbl&"_"&vTable&"_id="&vId&" AND "&tbl&"_item=0")
        End If
        If RS.Eof Then
            RS.AddNew
        End If
        RS(""&tbl&"_"&vTable&"_id").Value = vId
        RS(""&tbl&"_item").Value = item
        RS(""&tbl&"_answer").Value = answer
        RS(""&tbl&"_notes").Value = notes
        RS.Update
        RS.Close
    Next
End Sub

Function getSurvPassAnswers(params)
    'valFldParam = 'CS@Yes~pass|No~fail^Of^Of>>new~item 1^new~item 2^new~item 3
    Dim list : Set list = SESSION("ess107_AppLib").DynamicArray()
    Dim cfg : cfg = Split(params,"^")
    Dim srv : srv = Split(cfg(0),"@")(0)
    Dim item
    Select Case srv
        Case "YN"
            list.Add("Yes")
        Case "OC"
            list.Add("Complete")
        Case "OF"
            list.Add("On")
        Case "CS"
            params = Split(cfg(0),"@")(1)
            cfg = Split(params,"|")
            For item=0 To Ubound(cfg)
                If Split(cfg(item),"~")(1) = "pass" Then
                    list.Add(Split(cfg(item),"~")(0))
                End If
            Next
    End Select
    getSurvPassAnswers = Join(list.DataArray(),"|")
End Function

Function InsertImportData(filepath)
    Dim ldata 
    Dim RS
    ldata=readFile(filepath)
    Dim comm
    Set comm=Server.CreateObject("ADODB.Command")

    comm.ActiveConnection=DBCONNECT
    comm.CommandText="SET NOCOUNT ON; INSERT INTO import (import_xml) VALUES (?);SET NOCOUNT OFF; select SCOPE_IDENTITY() as id;"
    comm.Parameters.Append comm.CreateParameter("@import_xml", 201, 1,len(ldata) , ldata)
    set RS=comm.execute
    InsertImportData=0
    if not rs.eof then
        InsertImportData=rs("id")
    end if
    set rs=Nothing
End Function

Function ParseValuesTPL(table,id)
    Dim RS,fld,str
    If id="new" Then
        str = ""
    Else
        Set RS = Query("SELECT * FROM "&table&" WHERE "&table&"_id="&id)
        For Each fld in RS.Fields
            str = str & "{fld:"""&fld.Name&""",val:"""&fld.Value&"""},"
        Next
    End If
    ParseValuesTPL = str
End Function 

Function ParseCustomTPL(vAct,vId,ezForm,tpl,attach)
    Dim	p_regexp : Set p_regexp = New RegExp
    Dim Matches, match, MatchName,intMatches, params
    p_regexp.IgnoreCase = True
    p_regexp.Global = True
    p_regexp.Pattern = "<input[^[[]*'\[\[(.*?)\]\]' />"
    Set Matches = p_regexp.Execute(tpl)
    For Each Match in Matches
        params = Split(Match.SubMatches(0),"~")
        tpl = Replace(tpl, Match.Value , GetFldTpl(ezForm,params(1),params(2),params(3)))
    Next
    Set p_regexp = Nothing
    If attach=1 Then
        tpl = tpl & "<div class='attachments'>"&FilesList("ExtDB"&ezForm,varParam)&"</div>"
    End If
    ParseCustomTPL = tpl
End Function

Function GetFldTpl(ezForm,valFld,valType,valReq)
    dim html, req, RS
    If valReq = "Yes" Then req = "required"
    Set RS = Query("SELECT * FROM ExtDBfld WHERE ExtDBfld_id="&valFld)
    Select Case valType
        Case 31
            html = "<select name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'><option value=''></option>{{LIST_PROJECTS}}</select>"
        Case 32
            html = "<select name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'><option value=''></option>{{LIST_USERS}}</select>"
        Case 33
            html = "<select name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'><option value=''></option>{{LIST_COMPANIES}}</select>"
        Case 135
            html = "<div class='input-append'><input type='text' title='"&RS("ExtDBfld_title")&"' name='ExtDB"&ezForm&"_Fld"&valFld&"' class='form-control input-small date "&req&"' readonly><span class='add-on'><i class='icon-calendar'></i></span></div>"
        Case 136
            html = "<input type='text' name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control input-small' value='"& ( DatePart("m",Now())&"/"&DatePart("d",Now())&"/"&DatePart("yyyy",Now()) ) &"' readonly>"
        Case 200,3
            html = "<input type='text' name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'>"
        Case 203
            html = "<input type='text' name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control' readonly>"
        Case 201,2011,2012
            html = "<textarea rows='3' name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'></textarea>"
        Case 2030
            html = "<select name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' class='form-control "&req&"'>"&CreateListFromSting(RS("extdbfld_param").Value)&"</select>"
        Case 2031
            html = "<div type='radio-group' class='radio-group'><input type='radio' id='radio1' name='ExtDB"&ezForm&"_Fld"&valFld&"' title='"&RS("ExtDBfld_title")&"' value='Yes' checked='checked' /><label style='display:inline;'>Yes</label><input type='radio' id='radio2' name='ExtDB"&ezForm&"_Fld"&valFld&"' value='No' /><label style='display:inline;'>No</label></div>"
    End Select
    GetFldTpl = html
End Function

Function CreateList(tbl, fld)
    Dim RS, items
    Set RS = Query("SELECT "&tbl&"_id,"&fld&" FROM "&tbl&" WHERE "&tbl&"_act=1 ORDER BY "&fld)
    Set items = SESSION("ess107_AppLib").classString()
    While Not RS.Eof
        'items.Append("<option value='"&RS(0).Value&"'>"&Replace(RS(1).Value&"","""",Chr(148))&"</option>")
        items.Append("<option value='"&RS(0).Value&"'>"&RS(1).Value&"</option>")
        RS.MoveNext
    Wend
    CreateList = items.ToString()
End Function

Function getImportLinks(valFolder)
    Dim DIR, URL, FS
    DIR = SITE_PATH & "Files\"
    URL = SITE_URL & "/Files/"
    Set FS = Server.CreateObject("Scripting.FileSystemObject")
    If FS.FolderExists(valFolder) Then
        Dim oFolder,oFiles,oFile,str
        Set oFolder = FS.GetFolder(valFolder)
        Set oFiles = oFolder.Files
        For Each oFile in oFiles
            If InStr(oFile.Name,".csv")>0 Then str = str & "<li><a href='"&Replace(oFile.Path,DIR,URL)&"'>"&oFile.Name&"</a>"
        Next
        getImportLinks = str
    Else
        getImportLinks = ""
    End If
    Set FS = Nothing
End Function

Sub MoveFolder(v_old,v_new)
    Dim FS : Set FS = Server.CreateObject("Scripting.FileSystemObject")
    If FS.FolderExists(v_old) And Not FS.FolderExists(v_new) Then
        FS.MoveFolder v_old, v_new
    End If
End Sub

Function clearList()
    DIM sql_pref : sql_pref = "pg"
    IF Request("module")="yes" Then
        sql_pref = "mdl"
    END IF

    IF Request("param")="" Then
        Response.write "ERROR"
        Response.End
    END IF

    Select Case Request("clearCol")
        Case "contacts"
            Call Execute("DELETE FROM ExtDB"&sql_pref&"U WHERE ExtDB"&sql_pref&"U_ExtDB"&sql_pref&"_id="&Request("param")&"")
        Case "companies"
            Call Execute("DELETE FROM ExtDB"&sql_pref&"C WHERE ExtDB"&sql_pref&"C_ExtDB"&sql_pref&"_id="&Request("param")&"")
        Case "jobtypes"
            Call Execute("DELETE FROM ExtDB"&sql_pref&"T WHERE ExtDB"&sql_pref&"T_ExtDB"&sql_pref&"_id="&Request("param")&"")
    End Select
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBmdlU(Request,varParam)
    'Call Execute("DELETE FROM ExtDBmdlC WHERE ExtDBmdlC_ExtDBmdl_id="&Request("rec_id")&"")
    'Call Execute("DELETE FROM ExtDBmdlT WHERE ExtDBmdlT_ExtDBmdl_id="&Request("rec_id")&"")
    If Request("users_id")>"" Then Call Execute("DELETE FROM ExtDBmdlU WHERE ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlU_users_id="&Request("users_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBmdlU (ExtDBmdlU_ExtDBmdl_id,ExtDBmdlU_users_id) VALUES ("&Request("rec_id")&","&Request("users_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBmdlU WHERE ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlU_users_id="&Request("users_id")&"")
    If Request("users_ids_del")>"" Then Execute("DELETE FROM ExtDBmdlU WHERE ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlU_users_id IN ("&Request("users_ids_del")&")")
    If Request("users_ids_ins")>"" Then Execute("INSERT INTO ExtDBmdlU (ExtDBmdlU_ExtDBmdl_id,ExtDBmdlU_users_id) SELECT "&Request("rec_id")&",users_id FROM users WHERE users_id IN ("&Request("users_ids_ins")&") AND users_id NOT IN (select ExtDBmdlU_users_id from ExtDBmdlU where ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBpgU(Request,varParam)
    'Call Execute("DELETE FROM ExtDBpgC WHERE ExtDBpgC_ExtDBpg_id="&Request("rec_id")&"")
    'Call Execute("DELETE FROM ExtDBpgT WHERE ExtDBpgT_ExtDBpg_id="&Request("rec_id")&"")
    If Request("users_id")>"" Then Call Execute("DELETE FROM ExtDBpgU WHERE ExtDBpgU_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgU_users_id="&Request("users_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBpgU (ExtDBpgU_ExtDBpg_id,ExtDBpgU_users_id) VALUES ("&Request("rec_id")&","&Request("users_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBpgU WHERE ExtDBpgU_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgU_users_id="&Request("users_id")&"")
    If Request("users_ids_del")>"" Then Execute("DELETE FROM ExtDBpgU WHERE ExtDBpgU_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgU_users_id IN ("&Request("users_ids_del")&")")
    If Request("users_ids_ins")>"" Then Execute("INSERT INTO ExtDBpgU (ExtDBpgU_ExtDBpg_id,ExtDBpgU_users_id) SELECT "&Request("rec_id")&",users_id FROM users WHERE users_id IN ("&Request("users_ids_ins")&") AND users_id NOT IN (select ExtDBpgU_users_id from ExtDBpgU where ExtDBpgU_ExtDBpg_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBmdlC(Request,varParam)
    'Call Execute("DELETE FROM ExtDBmdlU WHERE ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&"")
    If Request("company_id")>"" Then Call Execute("DELETE FROM ExtDBmdlC WHERE ExtDBmdlC_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlC_company_id="&Request("company_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBmdlC (ExtDBmdlC_ExtDBmdl_id,ExtDBmdlC_company_id) VALUES ("&Request("rec_id")&","&Request("company_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBmdlC WHERE ExtDBmdlC_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlC_company_id="&Request("company_id")&"")
    If Request("company_ids_del")>"" Then Execute("DELETE FROM ExtDBmdlC WHERE ExtDBmdlC_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlC_company_id IN ("&Request("company_ids_del")&")")
    If Request("company_ids_ins")>"" Then Execute("INSERT INTO ExtDBmdlC (ExtDBmdlC_ExtDBmdl_id,ExtDBmdlC_company_id) SELECT "&Request("rec_id")&",company_id FROM company WHERE company_id IN ("&Request("company_ids_ins")&") AND company_id NOT IN (select ExtDBmdlC_company_id from ExtDBmdlC where ExtDBmdlC_ExtDBmdl_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBpgC(Request,varParam)
    'Call Execute("DELETE FROM ExtDBpgU WHERE ExtDBpgU_ExtDBpg_id="&Request("rec_id")&"")
    If Request("company_id")>"" Then Call Execute("DELETE FROM ExtDBpgC WHERE ExtDBpgC_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgC_company_id="&Request("company_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBpgC (ExtDBpgC_ExtDBpg_id,ExtDBpgC_company_id) VALUES ("&Request("rec_id")&","&Request("company_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBpgC WHERE ExtDBpgC_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgC_company_id="&Request("company_id")&"")
    If Request("company_ids_del")>"" Then Execute("DELETE FROM ExtDBpgC WHERE ExtDBpgC_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgC_company_id IN ("&Request("company_ids_del")&")")
    If Request("company_ids_ins")>"" Then Execute("INSERT INTO ExtDBpgC (ExtDBpgC_ExtDBpg_id,ExtDBpgC_company_id) SELECT "&Request("rec_id")&",company_id FROM company WHERE company_id IN ("&Request("company_ids_ins")&") AND company_id NOT IN (select ExtDBpgC_company_id from ExtDBpgC where ExtDBpgC_ExtDBpg_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBmdlT(Request,varParam)
    'Call Execute("DELETE FROM ExtDBmdlU WHERE ExtDBmdlU_ExtDBmdl_id="&Request("rec_id")&"")
    If Request("jobtype_id")>"" Then Call Execute("DELETE FROM ExtDBmdlT WHERE ExtDBmdlT_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlT_jobtype_id="&Request("jobtype_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBmdlT (ExtDBmdlT_ExtDBmdl_id,ExtDBmdlT_jobtype_id) VALUES ("&Request("rec_id")&","&Request("jobtype_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBmdlT WHERE ExtDBmdlT_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlT_jobtype_id="&Request("jobtype_id")&"")
    If Request("jobtype_ids_del")>"" Then Execute("DELETE FROM ExtDBmdlT WHERE ExtDBmdlT_ExtDBmdl_id="&Request("rec_id")&" AND ExtDBmdlT_jobtype_id IN ("&Request("jobtype_ids_del")&")")
    If Request("jobtype_ids_ins")>"" Then Execute("INSERT INTO ExtDBmdlT (ExtDBmdlT_ExtDBmdl_id,ExtDBmdlT_jobtype_id) SELECT "&Request("rec_id")&",jobtype_id FROM jobtype WHERE jobtype_id IN ("&Request("jobtype_ids_ins")&") AND jobtype_id NOT IN (select ExtDBmdlT_jobtype_id from ExtDBmdlT where ExtDBmdlT_ExtDBmdl_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function Update_ExtDBpgT(Request,varParam)
    'Call Execute("DELETE FROM ExtDBpgU WHERE ExtDBpgU_ExtDBpg_id="&Request("rec_id")&"")
    If Request("jobtype_id")>"" Then Call Execute("DELETE FROM ExtDBpgT WHERE ExtDBpgT_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgT_jobtype_id="&Request("jobtype_id")&"")
    If Request("onoff")="Yes" Then Call Execute("INSERT INTO ExtDBpgT (ExtDBpgT_ExtDBpg_id,ExtDBpgT_jobtype_id) VALUES ("&Request("rec_id")&","&Request("jobtype_id")&")")
    If Request("onoff")="No" Then Call Execute("DELETE FROM ExtDBpgT WHERE ExtDBpgT_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgT_jobtype_id="&Request("jobtype_id")&"")
    If Request("jobtype_ids_del")>"" Then Execute("DELETE FROM ExtDBpgT WHERE ExtDBpgT_ExtDBpg_id="&Request("rec_id")&" AND ExtDBpgT_jobtype_id IN ("&Request("jobtype_ids_del")&")")
    If Request("jobtype_ids_ins")>"" Then Execute("INSERT INTO ExtDBpgT (ExtDBpgT_ExtDBpg_id,ExtDBpgT_jobtype_id) SELECT "&Request("rec_id")&",jobtype_id FROM jobtype WHERE jobtype_id IN ("&Request("jobtype_ids_ins")&") AND jobtype_id NOT IN (select ExtDBpgT_jobtype_id from ExtDBpgT where ExtDBpgT_ExtDBpg_id="&Request("rec_id")&")")
    Call LoadMenu()
    Response.write "SAVED"
    Response.End
End Function

Function getMdlAccU(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBmdlU LEFT JOIN users ON users_id=ExtDBmdlU_users_id WHERE ExtDBmdlU_ExtDBmdl_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("users_firstname") & " " & RS("users_lastname")
        RS.MoveNext
    Wend
    getMdlAccU = buff
End Function

Function getMdlAccT(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBmdlT LEFT JOIN jobtype ON jobtype_id=ExtDBmdlT_jobtype_id WHERE ExtDBmdlT_ExtDBmdl_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("jobtype_name")
        RS.MoveNext
    Wend
    getMdlAccT = buff
End Function

Function getMdlAccC(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBmdlC LEFT JOIN company ON company_id=ExtDBmdlC_company_id WHERE ExtDBmdlC_ExtDBmdl_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("company_name")
        RS.MoveNext
    Wend
    getMdlAccC = buff
End Function

Function getPgAccU(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBpgU LEFT JOIN users ON users_id=ExtDBpgU_users_id WHERE ExtDBpgU_ExtDBpg_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("users_firstname") & " " & RS("users_lastname")
        RS.MoveNext
    Wend
    getPgAccU = buff
End Function

Function getPgAccT(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBpgT LEFT JOIN jobtype ON jobtype_id=ExtDBpgT_jobtype_id WHERE ExtDBpgT_ExtDBpg_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("jobtype_name")
        RS.MoveNext
    Wend
    getPgAccT = buff
End Function

Function getPgAccC(varParam)
    Dim buff
    Dim RS : Set RS = Query("SELECT * FROM ExtDBpgC LEFT JOIN company ON company_id=ExtDBpgC_company_id WHERE ExtDBpgC_ExtDBpg_id="&varParam)
    While Not RS.Eof
        buff = buff & "<li>" & RS("company_name")
        RS.MoveNext
    Wend
    getPgAccC = buff
End Function

Function getPgAccess(varParam)
    Dim buff, fieldExists
    Dim RS : Set RS = ExecuteStat("SELECT * FROM ExtDBpg WHERE ExtDBpg_id = "&varParam)
    If Not RS.Eof Then
        fieldExists = False
        For Each fld In RS.Fields
            If fld.Name = "ExtDBpg_accessmode" Then
                fieldExists = True
                Exit For
            End If
        Next

        If fieldExists Then
            buff = "" & RS("ExtDBpg_accessmode")
        End If
    End If
    getPgAccess = buff
End Function

Sub setPgAccess(id, val)
    Dim fieldExists
    Dim RS : Set RS = Execute("SELECT * FROM ExtDBpg WHERE ExtDBpg_id="&id)
    If Not RS.Eof Then
        fieldExists = False
        For Each fld In RS.Fields
            If fld.Name = "ExtDBpg_accessmode" Then
                fieldExists = True
                Exit For
            End If
        Next

        If fieldExists Then
            If val="1" Then 
                RS("ExtDBpg_accessmode").Value = 1
            Else 
                RS("ExtDBpg_accessmode").Value = 0
            End If
            RS.Update
        End If
        RS.Close
    End If

    Response.write "SAVED"
    Response.End
End Sub

Function convertHTMLparam(val)
    val = SESSION("ess107_AppLib").Base64Encode(val)
    convertHTMLparam = val
End Function

Sub Run_AfterSave(valTableName,RecId)
    If ProcedureExists(valTableName&"_aftersave") Then 
        Call DBConnect.Execute("EXEC "&valTableName&"_aftersave "&RecId&";")
    End If
End Sub

Sub addCrossLookup(vRS,vSql,vAdd)
    Dim RS, tbl, allias
    tbl = Split(vRS("ExtDBfld_param").Value,"^")(0)
    tbl = Split(tbl,"ExtDB")(1)
    Set RS = Query("SELECT * FROM EXtDBfld WHERE ExtDBfld_ExtDBtbl_id="&tbl&" ")
    While Not RS.Eof
        If InStr(vRS("ExtDBfld_param").Value,"_Fld"&RS("ExtDBfld_id"))>0 Then
            allias = ""&RS("ExtDBfld_param").Value&""&RS("ExtDBfld_id").Value&""
            Select Case RS("ExtDBfld_type")
                Case 31 'projects
                    vSql = vSql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                    vAdd = vAdd & ", ["&allias&"].projects_num+', '+["&allias&"].projects_name as [ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out]"
                Case 32 'users
                    vSql = vSql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                    vAdd = vAdd & ", ["&allias&"].users_firstname+' '+["&allias&"].users_lastname as [ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out]"
                Case 33 'company
                    vSql = vSql & " LEFT JOIN ["&RS("ExtDBfld_param").Value&"]  AS ["&allias&"] ON ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"=["&allias&"]."&RS("ExtDBfld_param").Value&"_id "
                    vAdd = vAdd & ", ["&allias&"].company_name as [ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out]"
                Case Else
                    vAdd = vAdd & ", ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&" as [ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out]"
            End Select
        End If
        RS.MoveNext
    Wend
End Sub

Sub addReportCrossLookup(vRS,vSql,vTitle)
    Dim RS, tbl, title
    tbl = Split(vRS("ExtDBfld_param").Value,"^")(0)
    tbl = Split(tbl,"ExtDB")(1)
    Set RS = Query("SELECT * FROM EXtDBfld WHERE ExtDBfld_ExtDBtbl_id="&tbl&" ")
    While Not RS.Eof
        If InStr(vRS("ExtDBfld_param").Value,"_Fld"&RS("ExtDBfld_id"))>0 Then
            title = vTitle &" :: "& Replace(RS("ExtDBfld_title"),"&","&amp;")
            Select Case RS("ExtDBfld_type")
                Case 31 'projects
                    vSql = vSql & "			,[ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out] as ["&title&"]" & VbCrLf
                Case 32 'users
                    vSql = vSql & "			,[ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out] as ["&title&"]" & VbCrLf
                Case 33 'company
                    vSql = vSql & "			,[ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out] as ["&title&"]" & VbCrLf
                Case Else
                    vSql = vSql & "			,[ExtDB"&RS("ExtDBfld_ExtDBtbl_id")& "_Fld"&RS("ExtDBfld_id")&"_out] as ["&title&"]" & VbCrLf
            End Select
        End If
        RS.MoveNext
    Wend
End Sub

%>