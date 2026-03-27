<!-- #include virtual='/include/global.asp' -->
<%
    Session("MODULE") = "EXTDB"

    Dim RS,table1,table2
    Set RS = Query("SELECT ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title='OSHA Injuries' and ExtDBtbl_lib='OSHA'")
    table1 = "report_ExtDB"&RS(0).Value
    Set RS = Query("SELECT ExtDBtbl_id FROM ExtDBtbl WHERE ExtDBtbl_title='OSHA Locations' and ExtDBtbl_lib='OSHA'")
    table2 = "report_ExtDB"&RS(0).Value

    CheckFolder(Server.MapPath("\Files\Temp\" & SESSION("SYSTEM.ID") & "\" & SESSION("USER.ID") & "\"))
    Response.Redirect "OSHA300ACAL.aspx?systemid="&SESSION("SYSTEM.ID")&"&company_id="&SESSION("CONFIG_COMPANYID")&"&userid="&SESSION("USER.ID")&_
        "&templateFileName=OSHA300ACAL.pdf"&_
        "&yearSelect="&Request("year")&_
        "&table1="&table1&_
        "&table2="&table2&_
        "&CONFIG_COMPANYNAME="&SESSION("CONFIG_COMPANYNAME")&_
        "&CONFIG_COMPANYADDRESS="&SESSION("CONFIG_COMPANYADDRESS")&_
        "&CONFIG_COMPANYCITY="&SESSION("CONFIG_COMPANYCITY")&_
        "&CONFIG_COMPANYSTATE="&SESSION("CONFIG_COMPANYSTATE")&_
        "&CONFIG_COMPANYZIP="&SESSION("CONFIG_COMPANYZIP")&_
        "&time="&Now()

%>