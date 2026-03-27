<%@ Page validateRequest="false" Debug="true" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.SqlClient" %>

<script language="C#" runat="server">
  
	public void Page_Load(Object sender, EventArgs E)
	{
        String FormID = Request["fid"].ToString();
        String SysID = Request.Cookies["session"].Values.Get("SYSTEM%2EID");
        
        string _file = Server.MapPath("\\config\\" + SysID + "\\dbconnect.cfg");
        string conStr = File.OpenText(_file).ReadLine();
            conStr = conStr.Replace("Provider=MSOLEDBSQL;","");
            conStr = conStr.Replace("Provider=SQLOLEDB;","");
            conStr = conStr.Replace("Provider=SQLOLEDB.1;","");
            conStr = conStr.Replace("Provider=SQLNCLI;","");
            conStr = conStr.Replace("Provider=SQLNCLI10.1;","");
            conStr = conStr.Replace("Provider=SQLNCLI10;","");
            conStr = conStr.Replace("Provider=SQLNCLI11;","");

        DataSet ds = new DataSet();
        new SqlDataAdapter(
            new SqlCommand(@"SELECT * from report_ExtDB" + FormID, 
                new SqlConnection(conStr))).Fill(ds);
               
        Response.Clear();
        Response.ContentType = "text/csv";
        Response.AddHeader("Content-Disposition", "attachment;filename=ExportForm" + FormID + ".csv");
               
        DataTable dataTable = ds.Tables[0];
        using (StreamWriter sw = new StreamWriter(Response.OutputStream))
        {
            foreach (DataColumn column in dataTable.Columns)
            {
                sw.Write("\"" + column.ColumnName + "\",");
            }
            sw.WriteLine();
            foreach (DataRow row in dataTable.Rows)
            {
                foreach (object item in row.ItemArray)
                {
                    sw.Write("\"" + item + "\",");
                }
                sw.WriteLine();
            }
        }
            
        Response.End();
    }

</script>


 