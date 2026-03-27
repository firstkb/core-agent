using System;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.Globalization;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Collections;
using System.Collections.ObjectModel;
using System.IO;
using System.Web.UI.HtmlControls;
using PDFLib;

public partial class PDFForm : System.Web.UI.Page 
{
	//DB
	private SqlCommand dbCmd;
	private SqlConnection dbCon;
	private SqlDataAdapter dbDa;
	private SqlCommandBuilder cmdBuild;
	private DataSet ds;
	private DataRow record;
	private string conStr;
	private string[] states = new string[52]{"-","AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL","GA","HI","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY"};
	
	//ќбъ€вл€ем экземпл€р PDFLib
	private PDFLib.PDFLib pdf;

	private string pdfPath;
	private string pdfDir;

	private string templatePath;
	private string templateDir;
	public string templateFileName = "";
	
	public string link = "";

	protected void Page_Load(object sender, EventArgs e)
	{
		//создаем экземпл€р PDFLib
		pdf = new PDFLib.PDFLib();
		//указываем где лежат шаблоны пусть это будет дирректори€ Templates
		templatePath = "\\Files\\"+Request["sid"].ToString()+"\\ExtDB\\Tpl";
		//вычисл€ем абсолютный путь к дирректории
		templateDir = Server.MapPath(templatePath);
		// указываем куда складывать отчеты пусть это будет дирректори€ Reports
		pdfPath = "\\Files\\Temp\\" + Request["sid"] + "\\" + Request["uid"];
		// это все тоже что и дл€ templateDir
		pdfDir = Server.MapPath(pdfPath);
		//templateFileName = "";
		templateFileName = Request["tpl"].ToString();            
		templatePath =  templateDir + "\\" + templateFileName;            
		string _file = Server.MapPath("\\config\\" + Request["sid"].ToString() + "\\dbconnect.cfg");
		if (!File.Exists(_file)){
			Response.Write("File: Not ["+_file+"] found!");
			Response.End();
		}
		conStr = File.OpenText(_file).ReadLine();
		conStr = conStr.Replace("Provider=MSOLEDBSQL;","");
		conStr = conStr.Replace("Provider=SQLOLEDB;","");
		conStr = conStr.Replace("Provider=SQLOLEDB.1;","");
		conStr = conStr.Replace("Provider=SQLNCLI;","");
		conStr = conStr.Replace("Provider=SQLNCLI10.1;","");
		conStr = conStr.Replace("Provider=SQLNCLI10;","");
		dbCon = new SqlConnection();
		dbCon.ConnectionString = conStr;
		dbCmd = new SqlCommand();
		dbCmd.Connection = dbCon;
		dbDa = new SqlDataAdapter(dbCmd);
		ds = new DataSet();
		dbCmd.CommandText = "SELECT * FROM report_ExtDB"+Request["tid"].ToString()+" WHERE [Doc.#]="+Request["rid"].ToString();
		dbDa.Fill(ds);
		record = ds.Tables[0].Rows[0];
		FillReport();                                          
		DateTime today = DateTime.Now;
		link = "<a href = \"" + pdfPath + "\\" + Path.GetFileName(templateFileName) + "?d="+today.ToString()+"\">" + " Report: " + Path.GetFileName(templateFileName) + "</a>";
	}

	private string ClearDate(string date){
		if(date.Length>0){
			return Convert.ToDateTime(date).ToString("MM/dd/yyyy");
		}else{
			return "";
		}
	}
	
	private float ToCurrency(string value) {
		if(value.Length>0){
			return float.Parse(value,NumberStyles.Currency);
		}else{
			return 0;
		}
	}
	
	private void FillReport()
	{
		string file = pdfDir + "\\" + templateFileName;
		DateTime today = DateTime.Now;
		Hashtable tmpFields = new Hashtable();
		for (int i = 0; i < ds.Tables[0].Columns.Count; i++)
        {
			tmpFields.Add(ds.Tables[0].Columns[i], record[i]);
        }
		//Response.Write(templatePath);
		//Response.Write("<hr/>");
		//Response.Write(file);
		pdf.ParseAndFillForm(templatePath, file, tmpFields);
	}
}