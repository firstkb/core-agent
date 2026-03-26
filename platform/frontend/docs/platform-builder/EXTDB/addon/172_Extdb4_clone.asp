<!-- #include virtual='/include/global.asp' -->
<%
If Not Session("LOGIN") Then Response.Write "<script>alert('Session Lost')</script>" : Response.End


Sub CloneRecord
    Dim RS, RS2, RecId
    RecId = SESSION("ess107_AppLib").strDecrypt(Request("rec"), global_crpyt_key)
    RecId = Split(RecId,"^")(1)
    
    Dim cmd : Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = DBConnect
    cmd.CommandType = adCmdStoredProc
    cmd.CommandText = "ExtDB4_clone"
    cmd.Parameters.Append cmd.CreateParameter("@id", adInteger, adParamInput, , RecId)
    cmd.Parameters.Append cmd.CreateParameter("@userid", adInteger, adParamInput, , SESSION("USER.ID"))
    cmd.Parameters.Append cmd.CreateParameter("@NewId", adInteger, adParamOutput, , 0)
    Set RS = cmd.Execute
    Dim newID : newID = cmd.Parameters("@NewId").Value
    If newID > 0 Then

        Call newEVENT("ExtDB4",RecId,newID)

        Dim path_from : path_from = Server.MapPath("\Files\172\PersonalFolder\EZ Data\ExtDB4\"&RecId)
        Call CheckFolder(path_from)
        Dim path_to : path_to = Server.MapPath("\Files\172\PersonalFolder\EZ Data\ExtDB4\"&newID)
        Call CheckFolder(path_to)
        
        Call CopyFiles(path_from, path_to)
        
        Set RS = Query("select t1.ExtDB6_id ,(select top 1 t2.extdb6_id from extdb6 as t2 where t2.ExtDB6_ExtDB4_id="&newID&" and t2.ExtDB6_Fld30=t1.ExtDB6_Fld30) "&_
            "from extdb6 as t1 where t1.ExtDB6_ExtDB4_id="&RecId)
        While Not RS.Eof
            path_from = Server.MapPath("\Files\172\PersonalFolder\EZ Data\ExtDB6\"&RS(0).Value)
            Call CheckFolder(path_from)
            path_to = Server.MapPath("\Files\172\PersonalFolder\EZ Data\ExtDB6\"&RS(1).Value)
            Call CheckFolder(path_to)
        
            Call CopyFiles(path_from, path_to)
            
            RS.MoveNext
        Wend

    Else
        log "Error cloning record: #"&RecId&""
        Response.End
    End If
    Response.Write "<SCRIPT>parent.DataList.Reset();</SCRIPT>"
    log "Cloned Record: #"&RecId&" Into: #"&newID&""
End Sub

Call CloneRecord

Sub newEVENT(valTable,RecId,newID)
    Dim RS : Set RS = Execute("SELECT TOP 1 * FROM [events] ")
    RS.AddNew
	RS("events_date").Value  = DateValue(Now())
	RS("events_time").Value  = TimeValue(Now())
	RS("events_module").Value = SESSION("MODULE")
	RS("events_event").Value = "Clone"
	RS("events_table").Value  = ""&valTable
	RS("events_record").Value  = ""&newID
    RS("events_text").Value  = "A clone of #{"&RecId&"}"
	RS("events_users_id").Value = SESSION("USER.ID")
	RS("events_users_ip").Value  = ""&Request.ServerVariables( "REMOTE_ADDR" )
	RS.Update
	RS.Close
	Set RS = Nothing
End Sub

Function CopyFiles(f_from, f_to)
    Dim fso, folderFrom, folderTo, file, destFile
    Set fso = Server.CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(f_from) Then
        fso.CreateFolder(f_from)
    End If
    If Not fso.FolderExists(f_to) Then
        fso.CreateFolder(f_to)
    End If
    Set folderFrom = fso.GetFolder(f_from)
    For Each file In folderFrom.Files
        destFile = f_to & "\" & file.Name
        fso.CopyFile file.Path, destFile, True
    Next
    Set folderFrom = Nothing
    Set fso = Nothing
    Set file = Nothing
End Function
%>
