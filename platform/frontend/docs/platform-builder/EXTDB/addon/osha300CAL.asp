<!-- #include virtual='/include/global.asp' -->
<%
    Session("MODULE") = "EXTDB"

    Dim varAction : varAction = Request("action") : If varAction = "" Then varAction = "page" End If
    Dim RS,table1,table2
    Set RS = Query("SELECT ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title='OSHA Injuries' and ExtDBtbl_lib='OSHA'")
    table1 = "report_ExtDB"&RS(0).Value
    Set RS = Query("SELECT ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title='OSHA Locations' and ExtDBtbl_lib='OSHA'")
    table2 = "report_ExtDB"&RS(0).Value
    
    If varAction="list" Then
        Dim varSql : varSql = "SELECT " & _
            ""&table1&".[Doc.#] as irinjury_id, " & _
            "[Employee] as irinjury_name," & _
            "[Job Title] as irinjury_title, " & _
            "[Date of Injury] as irinjury_incdate, " & _
            "ISNULL(loc.[Location],'-')+', '+ISNULL([Address],'')+', '+ISNULL([City],'')+', '+ISNULL([State],'')+', '+ISNULL([ZIP],'') as project," & _
            "[Days away from work (days)] as away," & _
            "[Job Transfer or Restriction (days)] as transfer, " & _
            "(CASE WHEN [Injury Severity]='Job Transfer or Restriction' THEN 'x' ELSE '' END) as d31," & _
            "(CASE WHEN [Injury Severity]='Other Recordable' THEN 'x' ELSE '' END) as severity," & _
            "(CASE WHEN [OSHA Class]='Injury' THEN 'x' ELSE '' END) as M1," & _
            "(CASE WHEN [OSHA Class]='Skin Disorder' THEN 'x' ELSE '' END) as M2," & _
            "(CASE WHEN [OSHA Class]='Respiratory Condition' THEN 'x' ELSE '' END) as M3," & _
            "(CASE WHEN [OSHA Class]='Poisoning' THEN 'x' ELSE '' END) as M4," & _
            "(CASE WHEN [OSHA Class]='Hearing Loss' THEN 'x' ELSE '' END) as M5," & _
            "(CASE WHEN [OSHA Class]='All other illnesses' THEN 'x' ELSE '' END) as M6," & _
            "(CASE WHEN [Injury Severity]='Fatality' THEN 'x' ELSE '' END) as [fatal], " &_
            "(CASE WHEN [Unable to Return to Work for At Least One Day?]='Yes' THEN 'x' ELSE '' END) as [return], " &_
            "CAST(Month([Date of Injury]) AS varchar) + '/' + CAST(Year([Date of Injury]) AS varchar) AS [date]," & _
            "CONCAT(ISNULL([Type of Injury],''),', ',ISNULL([Part of Body],''),', ',ISNULL([Equipment or Materials involved in Injury],'')) as irinjury_F " & _
            " FROM "&table1&" " & _
            " LEFT JOIN "&table2&" as loc ON "&table1&".[Location]=loc.[Location] " & _
            " WHERE [OSHA Reportable]='Yes' AND DatePart(yyyy,[Date of Injury])="&Request("yearSelect")&" AND ISNULL(loc.[State],'')='CA' " & _
            " ORDER BY [Date of Injury]"
        Response.Write getSQLList(varSql)
    Else
        GUI.Template.SetVariable "TARGET_COMPANYNAME",    SESSION("CONFIG_COMPANYNAME")
        GUI.Template.SetVariable "TARGET_COMPANYCITY", 	  SESSION("CONFIG_COMPANYCITY")
        GUI.Template.SetVariable "TARGET_COMPANYSTATE",   SESSION("CONFIG_COMPANYSTATE")
        GUI.Template.SetVariable "TARGET_YEAR",   Request("year")
        GUI.GenerateForm "..\addon\lib_OSHA300CALReport.htm", "irinjury", ""
        GUI.PageTitle = "OSHA300/CAL Report"
        GUI.Draw
    End If

%>