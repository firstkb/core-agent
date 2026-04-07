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
    
    //......... ......... PDFLib
    private PDFLib.PDFLib pdf;

    private string pdfPath;
    private string pdfDir;
    private string table1 = "";
    private string table2 = "";
    private string templatePath;
    public string templateFileName = "";
    
    public string link = "";

    protected void Page_Load(object sender, EventArgs e)
    {
        string _file;
        pdf = new PDFLib.PDFLib();
        pdfPath = "\\Files\\Temp\\" + Request["systemid"] + "\\" + Request["userid"];
        pdfDir = Server.MapPath(pdfPath);
        if(!Directory.Exists(pdfDir)) 
        { 
            Directory.CreateDirectory(pdfDir); 
        } 
        templateFileName = "OSHA300A.pdf";
        templatePath =  Server.MapPath(templateFileName);
        table1 = Request["table1"];
        table2 = Request["table2"];

        _file = Server.MapPath("\\config\\" + Request["systemid"] + "\\dbconnect.cfg");
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
        conStr = conStr.Replace("Provider=SQLNCLI11;","");
        dbCon = new SqlConnection();
        dbCon.ConnectionString = conStr;
        dbCmd = new SqlCommand();
        dbCmd.Connection = dbCon;
        dbDa = new SqlDataAdapter(dbCmd);
        ds = new DataSet();

        dbCmd.CommandText = @"SELECT 
            [Days away from work (days)] as away,
            [Job Transfer or Restriction (days)] as transfer, 
            (CASE WHEN [Injury Severity]='Job Transfer or Restriction' THEN 1 ELSE 0 END) as d31,
            (CASE WHEN [Injury Severity]='Other Recordable' THEN 1 ELSE 0 END) as severity,
            (CASE WHEN [OSHA Class]='Injury' THEN 1 ELSE 0 END) as M1,
            (CASE WHEN [OSHA Class]='Skin Disorder' THEN 1 ELSE 0 END) as M2,
            (CASE WHEN [OSHA Class]='Respiratory Condition' THEN 1 ELSE 0 END) as M3,
            (CASE WHEN [OSHA Class]='Poisoning' THEN 1 ELSE 0 END) as M4,
            (CASE WHEN [OSHA Class]='Hearing Loss' THEN 1 ELSE 0 END) as M5,
            (CASE WHEN [OSHA Class]='All other illnesses' THEN 1 ELSE 0 END) as M6,
            (CASE WHEN [Injury Severity]='Fatality' THEN 1 ELSE 0 END) as [fatal], 
            (CASE WHEN [Unable to Return to Work for At Least One Day?]='Yes' THEN 1 ELSE 0 END) as [return], 
            CONCAT(ISNULL([Type of Injury],''),', ',ISNULL([Part of Body],''),', ',ISNULL([Equipment or Materials involved in Injury],'')) as irinjury_F, 
            [Total hours worked by all employees] as [TotalHrs],
            [Annual average number of employees] as [TotalEmpl]
        FROM "+table1+@" 
        LEFT JOIN "+table2+@" as loc ON "+table1+@".[Location]=loc.[Location] 
        WHERE DatePart(yyyy,[Date of Injury])="+Request["yearSelect"]+@" AND ISNULL(loc.[State],'') NOT LIKE 'CA' ORDER BY [Date of Injury]";

        dbDa.Fill(ds);
        if(ds.Tables[0].Rows.Count==0){
            Response.Write("No data to be dispalyed!");
            Response.End();
        }else{
            record = ds.Tables[0].Rows[0];
        }

        FillReport();
        DateTime today = DateTime.Now;
        link = "<a href = \"" + pdfPath + "\\" + Path.GetFileName(templateFileName) + "?d="+today.ToString()+"\" target='_blank'>" + " Report: " + Path.GetFileName(templateFileName) + "</a>";
    }

    private void FillReport()
    {
        string file = pdfDir + "\\" + templateFileName;
        DateTime today = DateTime.Now;
        Hashtable tmpFields = new Hashtable();
        
        int away		= 0;
        int away_max	= 0;
        int transfer	= 0;
        int RS_transfer  = 0;
        int RS_away      = 0;
        int RS_d31       = 0;
        int RS_severity  = 0;
        int RS_M1        = 0;
        int RS_M2        = 0;
        int RS_M3        = 0;
        int RS_M4        = 0;
        int RS_M5        = 0;
        int RS_M6        = 0;
        int RS_fatal     = 0;
        int RS_return    = 0;
        for(int row=0;row<ds.Tables[0].Rows.Count;row++){
            record = ds.Tables[0].Rows[row];
            
            away = record.Field<int>("away");
            if(record.Field<int>("fatal")>0){
                RS_fatal = RS_fatal + record.Field<int>("fatal");
            }else if(record.Field<int>("return")>0){
                RS_return = RS_return + record.Field<int>("return");
            }else if(record.Field<int>("d31")>0){
                RS_d31 = RS_d31 + record.Field<int>("d31");
            }else if(record.Field<int>("severity")>0){
                RS_severity = RS_severity + record.Field<int>("severity");
                away = 0;
            }
            away_max = 180;
            if(away > 180){
                away_max = 0;
                RS_away = RS_away + 180;
            }else{
                if(away > 0){
                    RS_away = RS_away + record.Field<int>("away");
                    away_max = 180 - away;
                }else{
                    RS_away = RS_away + 0;
                    away_max = 180;
                }
            }
            transfer = 0;
            if(record.Field<int>("transfer")>0){
                transfer = record.Field<int>("transfer");
                if(transfer>away_max){
                    transfer = away_max;
                }
            }
            RS_transfer = RS_transfer + transfer;
            RS_M1        = RS_M1       + record.Field<int>("M1");
            RS_M2        = RS_M2       + record.Field<int>("M2");
            RS_M3        = RS_M3       + record.Field<int>("M3");
            RS_M4        = RS_M4       + record.Field<int>("M4");
            RS_M5        = RS_M5       + record.Field<int>("M5");
            RS_M6        = RS_M6       + record.Field<int>("M6");
        }
        
        tmpFields.Add("fieldG",   RS_fatal);
            tmpFields.Add("G15",   RS_fatal);
        tmpFields.Add("fieldH",   RS_return);
            tmpFields.Add("H15",   RS_return);
        tmpFields.Add("fieldI",   RS_d31);
            tmpFields.Add("I15",   RS_d31);
        tmpFields.Add("fieldJ",   RS_severity);
            tmpFields.Add("J15",   RS_severity);
        tmpFields.Add("fieldK",   RS_away);
            tmpFields.Add("K15",   RS_away);
        tmpFields.Add("fieldL",   RS_transfer);
            tmpFields.Add("L15",   RS_transfer);
        tmpFields.Add("fieldM1",  RS_M1);
            tmpFields.Add("Mcol01ln15",  RS_M1);
        tmpFields.Add("fieldM2",  RS_M2);
            tmpFields.Add("Mcol02ln15",  RS_M2);
        tmpFields.Add("fieldM3",  RS_M3);
            tmpFields.Add("Mcol03ln15",  RS_M3);
        tmpFields.Add("fieldM4",  RS_M4);
            tmpFields.Add("Mcol04ln15",  RS_M4);
        tmpFields.Add("fieldM5",  RS_M5);
            tmpFields.Add("M5",  RS_M5);
        tmpFields.Add("fieldM6",  RS_M6);
            tmpFields.Add("M6",  RS_M6);
        
        
        tmpFields.Add("fieldC1",  ""+Request["CONFIG_COMPANYNAME"]);
            tmpFields.Add("Est Name",  ""+Request["CONFIG_COMPANYNAME"]);
        tmpFields.Add("fieldC2",  ""+Request["CONFIG_COMPANYADDRESS"]);
            tmpFields.Add("Street",  ""+Request["CONFIG_COMPANYADDRESS"]);
        tmpFields.Add("fieldC3",  ""+Request["CONFIG_COMPANYCITY"]);
            tmpFields.Add("City",  ""+Request["CONFIG_COMPANYCITY"]);
        tmpFields.Add("fieldC4",  ""+Request["CONFIG_COMPANYSTATE"]);
            tmpFields.Add("State",  ""+Request["CONFIG_COMPANYSTATE"]);
        tmpFields.Add("fieldC5",  ""+Request["CONFIG_COMPANYZIP"]);
            tmpFields.Add("ZIP",  ""+Request["CONFIG_COMPANYZIP"]);
            
        tmpFields.Add("fieldYEAR",""+Request["yearSelect"].Substring(2,2));
            tmpFields.Add("Year A",""+Request["yearSelect"].Substring(2,2));

        tmpFields.Add("fld-4", ""+record.Field<int>("TotalEmpl"));
            tmpFields.Add("AVGemp", ""+record.Field<int>("TotalEmpl"));
        tmpFields.Add("fld-5", record.Field<int>("TotalHrs"));
            tmpFields.Add("TotHrs", record.Field<int>("TotalHrs"));
        
        pdf.ParseAndFillForm(templatePath, file, tmpFields);

    }
}