<!--#include virtual="/include/function.asp"-->
<!--#include virtual="/include/dbconnect.asp"-->
<!--#include virtual="/Modules/EXTDB/lib.asp"-->
<%

SESSION("TMP") = SESSION("LEFT_PANEL")

Call LoadMenu()

SESSION("LEFT_PANEL") = SESSION("TMP")

%>