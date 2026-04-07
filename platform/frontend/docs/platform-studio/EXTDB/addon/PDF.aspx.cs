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
	
	//��������� ��������� PDFLib
	private PDFLib.PDFLib pdf;

	private string pdfPath;
	private string pdfDir;

	private string templatePath;
	private string templateDir;
	public string templateFileName = "";
	
	public string link = "";

	protected void Page_Load(object sender, EventArgs e)
	{
		string _file;
		//������� ��������� PDFLib
		pdf = new PDFLib.PDFLib();
		//��������� ��� ����� ������� ����� ��� ����� ����������� Templates
		templatePath = "Doc";
		//��������� ���������� ���� � �����������
		templateDir = Server.MapPath(templatePath);
		// ��������� ���� ���������� ������ ����� ��� ����� ����������� Reports
		pdfPath = "\\Files\\Temp\\" + Request["systemid"] + "\\" + Request["userid"];
		// ��� ��� ���� ��� � ��� templateDir
		pdfDir = Server.MapPath(pdfPath);
		if(!Directory.Exists(pdfDir)) 
		{ 
			Directory.CreateDirectory(pdfDir); 
		} 
		//templateFileName = "";
		templateFileName = Request["templateFileName"].ToString();            
		templatePath =  templateDir + "\\" + templateFileName;            
		if (Request["systemid"] != null && templateFileName=="Acord_form11.pdf")
		{
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
			dbCmd.CommandText = @"SELECT * 
				FROM irincident
				LEFT JOIN projects ON irincident_projects_id = projects.projects_id 
				WHERE irincident_id="+Convert.ToInt32(Request["record"].ToString());
			dbDa.Fill(ds);
			record = ds.Tables[0].Rows[0];
		}
		if (Request["systemid"] != null && templateFileName!="OSHA300A.pdf" && templateFileName!="OSHA300ACal.pdf" && templateFileName!="Acord_form11.pdf")
		{
			//������ ����������
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
			dbCmd.CommandText = @"SELECT super.users_firstname as super_firstname
				,department.company_name as department_name
				,division.company_name as division_name
				,super.users_lastname as super_lastname
				,foreman.users_firstname as foreman_firstname
				,foreman.users_lastname as foreman_lastname
				,adjuster.users_firstname as adjuster_firstname
				,adjuster.users_lastname as adjuster_lastname
				,[dbo].UserInfo(adjuster.users_id) AS adjuster_info
				,subcontractor.company_name AS subcontractor_name 
				,insurComp.company_name AS insurComp_name 
				,insurComp.company_address+','+insurComp.company_city+','+insurComp.company_zip AS insurComp_address
				,insurComp.company_city AS insurComp_city 
				,(select state_name from state s where s.state_id = insurComp.company_state_id) AS insurComp_state 
				,insurComp.company_zip AS insurComp_zip 
				,insurComp.company_phone AS insurComp_phone 
				,partAdmin.company_name AS partAdmin_name 
				,partAdmin.company_phone AS partAdmin_phone
				,partAdmin.company_address+','+partAdmin.company_city+','+partAdmin.company_zip AS partAdmin_address
				,*,projectsstate.state_name AS projectsstate,init.users_firstname AS init_firstname,init.users_lastname AS init_lastname 
				,dbo.INCRM_totaloffdays4(irinjury_id,GetDate()) AS S_totaloffdays 
				,dbo.INCRM_mddays4(irinjury_id,GetDate()) AS S_mddays 
				,dbo.INCRM_totaloffdays3(irinjury_id,GetDate()) AS S_totaloffdays3 
				,dbo.INCRM_mddays3(irinjury_id,GetDate()) AS S_mddays3
				,(SELECT MAX(irinjuryDays_end) FROM irinjuryDays WHERE irinjuryDays_irinjury_id="+Convert.ToInt32(Request["record"].ToString())+@" AND irinjuryDays_type='LWD') as returnday
				,(select top 1 irinjuryDays_begin FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as lastwork
				,(select top 1 irinjuryDays_end FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as returnwork
				FROM irinjury 
				LEFT JOIN users ON irinjury.irinjury_users_id = users.users_id 
				LEFT JOIN projects ON irinjury.irinjury_projects_id = projects.projects_id 
				LEFT JOIN company ON irinjury.irinjury_company_id = company.company_id 
				LEFT JOIN state AS projectsstate ON projects.projects_state_id = projectsstate.state_id 
				LEFT JOIN users AS init ON init.users_id=irinjury.irinjury_init 
				LEFT JOIN company AS department ON projects.projects_company_id = department.company_id 
				LEFT JOIN company AS division ON division.company_id = department.company_maincomp 
				LEFT JOIN users AS super ON irinjury.irinjury_superId = super.users_id 
				LEFT JOIN users AS foreman ON irinjury.irinjury_foremanId = foreman.users_id 
				LEFT JOIN users AS adjuster ON irinjury.irinjury_adjuster = adjuster.users_id 
				LEFT JOIN company AS insurComp ON insurComp.company_id = irinjury_insurComp 
				LEFT JOIN company AS partAdmin ON partAdmin.company_id = irinjury_partAdmin 
				LEFT JOIN company AS subcontractor ON irinjury.irinjury_sName = subcontractor.company_id 
				WHERE irinjury.irinjury_id="+Convert.ToInt32(Request["record"].ToString());
			dbDa.Fill(ds);
			record = ds.Tables[0].Rows[0];
		}
		if (templateFileName=="OSHA300A.pdf" || templateFileName=="OSHA300ACal.pdf"){
			string addWeher = "";
			string addHrs = "";
			if(Request["projectSelect"].ToString().Length>0){
				addWeher = addWeher + " AND projects_id=" + Request["projectSelect"].ToString()+" ";
			}
			if(Request["systemid"]=="1027"){
				addHrs = @"SELECT SUM(CASE WHEN hoursworked_type='Regular' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) +
				SUM(CASE WHEN hoursworked_type='Overtime' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) + 
				SUM(CASE WHEN hoursworked_type='Double Time' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) AS TotalHrs 
				FROM hoursworked WHERE hoursworked_year="+Request["yearSelect"]+@"
				AND hoursworked_job in (
					select projects_num from projects where projects_company_id IN (" + Request["companySelect"] + @") 
					union all 
					select projects_num from projects where projects_company_id IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") ) 
					union all 
					select projects_num from projects where projects_company_id IN ( select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @" ) ) ) 
				)";
			}else if(Request["systemid"]=="demo"){
				addHrs = @"SELECT SUM(CASE WHEN hoursworked_type='Regular' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) +
				SUM(CASE WHEN hoursworked_type='Overtime' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) + 
				SUM(CASE WHEN hoursworked_type='Double Time' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) AS TotalHrs 
				FROM hoursworked WHERE hoursworked_year="+Request["yearSelect"]+@"
				AND hoursworked_job in (
					select projects_name from projects where projects_company_id IN (" + Request["companySelect"] + @") 
					union all 
					select projects_name from projects where projects_company_id IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") ) 
					union all 
					select projects_name from projects where projects_company_id IN ( select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @" ) ) ) 
				)";
			}else if(Request["systemid"]=="1042"){
				addHrs = @"SELECT SUM(CASE WHEN hoursworked_type='Regular' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) +
				SUM(CASE WHEN hoursworked_type='Overtime' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) + 
				SUM(CASE WHEN hoursworked_type='Double Time' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) AS TotalHrs 
				FROM hoursworked WHERE hoursworked_year="+Request["yearSelect"]+@"
				AND hoursworked_job in (
					select projects_name from projects where projects_company_id IN (" + Request["companySelect"] + @") 
					union all 
					select projects_name from projects where projects_company_id IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") ) 
					union all 
					select projects_name from projects where projects_company_id IN ( select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @" ) ) ) 
				)";
			}else{
				addHrs = @"SELECT SUM(CASE WHEN hoursworked_type='Regular' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) +
				SUM(CASE WHEN hoursworked_type='Overtime' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) + 
				SUM(CASE WHEN hoursworked_type='Double Time' THEN 0+hoursworked_january+hoursworked_february+hoursworked_march+hoursworked_april+hoursworked_may+hoursworked_june+hoursworked_july+hoursworked_august+hoursworked_september+hoursworked_october+hoursworked_november+hoursworked_december*1.0 ELSE 0 END) AS TotalHrs 
				FROM hoursworked WHERE hoursworked_year="+Request["yearSelect"]+@"
				AND hoursworked_job in (
					select company_name from company where company_id IN (" + Request["companySelect"] + @") 
					union all 
					select company_name from company where company_maincomp IN (" + Request["companySelect"] + @") 
					union all 
					select company_name from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") ) 
					union all 
					select company_name from company where company_maincomp IN ( select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @" ) ) ) 
				)";
			}
			if(Request["companySelect"].ToString().Length>0){
				addWeher = addWeher + @" AND (projects_company_id IN (" + Request["companySelect"] + @") OR projects_company_id IN (
						select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") 
						union all 
						select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @") ) 
						union all 
						select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN ( select company_id from company where company_maincomp IN (" + Request["companySelect"] + @" ) ) ) 
					)) ";
			}
			if(Request["clientSelect"].ToString().Length>0){
				addWeher = addWeher + " AND irinjury_clientid IN (" + Request["clientSelect"] + ") ";
				if(Request["systemid"]=="141"){
					addWeher = addWeher + " AND irinjury_141_temp='Temp' ";
				}
			}else{
				if(Request["systemid"]=="141"){
					addWeher = addWeher + " AND irinjury_141_temp='Direct' ";
				}
			}
			if(Request["OSHA_CAL"].ToString() == "True" && templateFileName!="OSHA300ACal.pdf"){
				addWeher = addWeher + " AND ISNULL(projects_state_id,0)<>5 ";
			}
			if(templateFileName=="OSHA300ACal.pdf"){
				addWeher = addWeher + " AND projects_state_id=5 ";
			}
			
			//������ ����������
			_file = Server.MapPath("\\config\\" + Request["systemid"] + "\\dbconnect.cfg");
			if (!File.Exists(_file)){
				Response.Write("File: Not ["+_file+"] found!");
				Response.End();
			}
			conStr = File.OpenText(_file).ReadLine();
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

			if(Request["projectSelect"].ToString().Length>0){
				dbCmd.CommandText = @"SELECT irinjury.*,
					projects_num+', '+projects_name as [PROJECT_NAME],
					projects_address as [PROJECT_ADDRESS],
					projects_city as [PROJECT_CITY],
					right(left(state_name,3),2) as [PROJECT_STATE],
					projects_zip as [PROJECT_ZIP],
					projects_NAICSCode as [projects_NAICSCode],
					projects_inddesc as [projects_inddesc],
					0 as [TotalEmpl],
					(select Sum(Total) from report_hoursworked 
						where Job="+((Request["systemid"]=="1042"||Request["systemid"]=="demo")?"projects_name":"projects_num")+@" 
						and [Type] not in ('Holiday/Vac/Sick') and [Year]='"+Request["yearSelect"]+@"') as [TotalHrs],
					dbo.INCRM_totaloffdays4(irinjury_id,GETDATE()) as away,
					dbo.INCRM_mddays4(irinjury_id,GETDATE()) as transfer, 
					(CASE WHEN irinjury_severity='Job Transfer or Restriction' THEN 1 ELSE 0 END) as d31,
					(CASE WHEN irinjury_severity='Other Recordable' THEN 1 ELSE 0 END) as severity,
					(CASE WHEN irinjury_inctype='Injury' THEN 1 ELSE 0 END) as M1,
					(CASE WHEN irinjury_inctype='Skin Disorder' THEN 1 ELSE 0 END) as M2,
					(CASE WHEN irinjury_inctype='Respiratory Condition' THEN 1 ELSE 0 END) as M3,
					(CASE WHEN irinjury_inctype='Poisoning' THEN 1 ELSE 0 END) as M4,
					(CASE WHEN irinjury_inctype='Hearing Loss' THEN 1 ELSE 0 END) as M5,
					(CASE WHEN irinjury_inctype='All other illnesses' THEN 1 ELSE 0 END) as M6,
					(CASE WHEN irinjury_fatal=1 THEN 1 ELSE 0 END) as [fatal], 
					(CASE WHEN irinjury_return=1 THEN 1 ELSE 0 END) as [return], 
					projects.projects_company_id, CAST(Month([irinjury_incdate]) AS varchar) + '/' + CAST(Year([irinjury_incdate]) AS varchar) AS [date],
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_firstname+' '+irinjury_lastname END) as irinjury_name,
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_injtype+', '+irinjury_bpart+', '+irinjury_bside END) as irinjury_F 
					 FROM projects
					 LEFT JOIN state on state_id=projects_state_id
					 LEFT JOIN irinjury ON (irinjury.irinjury_projects_id = projects.projects_id AND irinjury_recordable='Yes' AND ISNULL(irinjury_mine_msha,'') not in ('Yes') AND DatePart(yyyy,irinjury.irinjury_incdate)="+Request["yearSelect"]+@") 
					 WHERE 1=1 AND ISNULL(irinjury_ClaimDenied,'') not like 'Yes' "+addWeher+@" 
					 ORDER BY irinjury_incdate";
			}else{
				dbCmd.CommandText = @"SELECT irinjury.*,
					projects_num+', '+projects_name as [PROJECT_NAME],
					projects_address as [PROJECT_ADDRESS],
					projects_city as [PROJECT_CITY],
					right(left(state_name,3),2) as [PROJECT_STATE],
					projects_zip as [PROJECT_ZIP],
					0 as [TotalEmpl],
					dbo.INCRM_totaloffdays4(irinjury_id,GETDATE()) as away,
					dbo.INCRM_mddays4(irinjury_id,GETDATE()) as transfer, 
					(CASE WHEN irinjury_severity='Job Transfer or Restriction' THEN 1 ELSE 0 END) as d31,
					(CASE WHEN irinjury_severity='Other Recordable' THEN 1 ELSE 0 END) as severity,
					(CASE WHEN irinjury_inctype='Injury' THEN 1 ELSE 0 END) as M1,
					(CASE WHEN irinjury_inctype='Skin Disorder' THEN 1 ELSE 0 END) as M2,
					(CASE WHEN irinjury_inctype='Respiratory Condition' THEN 1 ELSE 0 END) as M3,
					(CASE WHEN irinjury_inctype='Poisoning' THEN 1 ELSE 0 END) as M4,
					(CASE WHEN irinjury_inctype='Hearing Loss' THEN 1 ELSE 0 END) as M5,
					(CASE WHEN irinjury_inctype='All other illnesses' THEN 1 ELSE 0 END) as M6,
					(CASE WHEN irinjury_fatal=1 THEN 1 ELSE 0 END) as [fatal], 
					(CASE WHEN irinjury_return=1 THEN 1 ELSE 0 END) as [return], 
					projects.projects_company_id, CAST(Month([irinjury_incdate]) AS varchar) + '/' + CAST(Year([irinjury_incdate]) AS varchar) AS [date],
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_firstname+' '+irinjury_lastname END) as irinjury_name,
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_injtype+', '+irinjury_bpart+', '+irinjury_bside END) as irinjury_F, 
					("+addHrs+@") as [TotalHrs]
					 FROM projects
					 LEFT JOIN state on state_id=projects_state_id
					 LEFT JOIN irinjury ON (irinjury.irinjury_projects_id = projects.projects_id AND irinjury_recordable='Yes' AND ISNULL(irinjury_mine_msha,'') not in ('Yes') AND DatePart(yyyy,irinjury.irinjury_incdate)="+Request["yearSelect"]+@") 
					 WHERE 1=1 AND ISNULL(irinjury_ClaimDenied,'') not like 'Yes' "+addWeher+@" 
					 ORDER BY irinjury_incdate";
			}
				 
			dbDa.Fill(ds);
			if(ds.Tables[0].Rows.Count==0){
				Response.Write("No data to be dispalyed!");
				Response.End();
			}else{
				record = ds.Tables[0].Rows[0];
			}
		}
		FillReport();                                          
		DateTime today = DateTime.Now;
		link = "<a href = \"" + pdfPath + "\\" + Path.GetFileName(templateFileName) + "?d="+today.ToString()+"\" target='_blank'>" + " Report: " + Path.GetFileName(templateFileName) + "</a>";
	}

	private string ClearDate(string date){
		if(date.Length>0){
			try{
				return Convert.ToDateTime(date).ToString("MM/dd/yyyy");
			}catch{
				return "";
			}
		}else{
			return "";
		}
	}	
	
	private string ClearDate(string date,string part){
		if(date.Length>0){
			try{
				if(part=="year"){
					return Convert.ToDateTime(date).ToString("yyyy");
				}else if(part=="month"){
					return Convert.ToDateTime(date).ToString("MM");
				}else if(part=="day"){
					return Convert.ToDateTime(date).ToString("dd");
				}else{
					return Convert.ToDateTime(date).ToString("MM/dd/yyyy");
				}
			}catch{
				return "";
			}
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
		switch (templateFileName)
		{
			case "OSHA300A.pdf":
			case "OSHA300ACal.pdf":
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
				
				
				if(Request["companySelect"].ToString().Length>0){
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
				}
				
				if(Request["projectSelect"].ToString().Length>0){
					tmpFields.Add("fieldC1",  ""+record.Field<string>("PROJECT_NAME"));
						tmpFields.Add("Est Name",  ""+record.Field<string>("PROJECT_NAME"));
					tmpFields.Add("fieldC2",  ""+record.Field<string>("PROJECT_ADDRESS"));
						tmpFields.Add("Street",  ""+record.Field<string>("PROJECT_ADDRESS"));
					tmpFields.Add("fieldC3",  ""+record.Field<string>("PROJECT_CITY"));
						tmpFields.Add("City",  ""+record.Field<string>("PROJECT_CITY"));
					tmpFields.Add("fieldC4",  ""+record.Field<string>("PROJECT_STATE"));
						tmpFields.Add("State",  ""+record.Field<string>("PROJECT_STATE"));
					tmpFields.Add("fieldC5",  ""+record.Field<string>("PROJECT_ZIP"));
						tmpFields.Add("ZIP",  ""+record.Field<string>("PROJECT_ZIP"));
				}
					
				tmpFields.Add("fieldYEAR",""+Request["yearSelect"].Substring(2,2));
					tmpFields.Add("Year A",""+Request["yearSelect"].Substring(2,2));

				//tmpFields.Add("fld-4", ""+record.Field<string>("TotalEmpl"));
				//	tmpFields.Add("AVGemp", ""+record.Field<string>("TotalEmpl"));
				if(record["TotalHrs"].ToString().Length>0){
					tmpFields.Add("fld-5", Decimal.Round(record.Field<decimal>("TotalHrs"),2));
						tmpFields.Add("TotHrs", Decimal.Round(record.Field<decimal>("TotalHrs"),2));
				}else{
					tmpFields.Add("fld-5", 0);
						tmpFields.Add("TotHrs", 0);
				}
				
				if(Request["systemid"]=="125"){
					tmpFields.Add("fld-1",  "Highway, Street, and Bridge Construction");
					tmpFields.Add("fld-2",  "1611");
					tmpFields.Add("fld-3",  "237310");
				}
				if(Request["projectSelect"].ToString().Length>0){
					tmpFields.Add("fld-1",  ""+record.Field<string>("projects_inddesc"));
					tmpFields.Add("fld-3",  ""+record.Field<string>("projects_NAICSCode"));
				}
				
				break;
			case "WC_CT.pdf":
				tmpFields.Add("1", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("2", record["irinjury_phone"]);
				tmpFields.Add("5", record["irinjury_cnum"]);
				tmpFields.Add("16", record["irinjury_wcpnum"]);
				tmpFields.Add("12", record["insurComp_address"]);
				tmpFields.Add("22", record["irinjury_phone"]);
				tmpFields.Add("20", record["irinjury_lastname"].ToString()+' '+record["irinjury_firstname"].ToString());
				tmpFields.Add("21", ClearDate(record["irinjury_dob"].ToString()));
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("24", "Yes");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("25", "Yes");}
				tmpFields.Add("25", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("28", record["irinjury_title"]);
					if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("31", "Yes");}
					if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("33", "Yes");}
					if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("34", "Yes");}
					if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("35", "Yes");}
				tmpFields.Add("37", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("14", record["insurComp_name"]);
				tmpFields.Add("15", record["insurComp_phone"]);
				tmpFields.Add("38", record["irinjury_timework"]);
				tmpFields.Add("57", record["irinjury_injtype"]);
				tmpFields.Add("41", record["irinjury_inctime"]);
				tmpFields.Add("58", record["irinjury_bpart"]);
				tmpFields.Add("67", record["irinjury_pname"]);
				tmpFields.Add("68", record["irinjury_hospname"]);
				tmpFields.Add("50", record["irinjury_equipment"]);
				tmpFields.Add("51", record["irinjury_workact"]);
				tmpFields.Add("65", record["irinjury_desc"]);
				tmpFields.Add("66", record["irinjury_causetype"]);
				break;
			case "WC_DE.pdf":
				tmpFields.Add("1 EMPLOYEE FIRST MIDDLE LAST", record["irinjury_lastname"].ToString()+' '+record["irinjury_firstname"].ToString());
				tmpFields.Add("3 ADDRESS  INCLUDE COUNTY AND ZIP CODE", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("GENDER", "MALE");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("GENDER", "FEMALE");}
				tmpFields.Add("5 EMPLOYEE PHONE NUMBER INCLUDING AREA CODE", record["irinjury_phone"]);
				tmpFields.Add("6 DATE OF BIRTH", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("8 WAGE", record["irinjury_gws"]);
				tmpFields.Add("9 WEEKLY HOURS WORKED", record["irinjury_hperw"]);
				tmpFields.Add("10 OCCUPATION REGULAR", record["irinjury_title"]);
				tmpFields.Add("13 EMPLOYER", record["company_name"]);
				tmpFields.Add("14 PERSON MAKING OUT THIS REPORT", record["init_firstname"]+", "+record["init_lastname"]);
				tmpFields.Add("15 ADDRESS  INCLUDE COUNTY AND ZIP CODE", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("16 EMPLOYER PHONE  INCLUDE AREA CODE", record["company_phone"]);
				tmpFields.Add("19 WORKERS COMPENSATION INSURANCE CARRIER", record["insurComp_name"]);
				tmpFields.Add("21 WORKERS COMP INSURANCE CARRIER ADDRESS", record["insurComp_address"]);
				tmpFields.Add("20 WORKERS COMP INS CARRIER PHONE  INCLUDING AREA CODE", record["insurComp_phone"]);
				tmpFields.Add("22 POLICY NUMBER  CARRIER CASE NUMBER", record["irinjury_wcpnum"]);
				tmpFields.Add("25 DATE OF REPORT", record["irinjury_repdate"]);
				tmpFields.Add("26 DATE OF INJURY", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("27 NORMAL STARTING TIME", record["irinjury_timework"]);
				tmpFields.Add("INJURY OR DISEASE 34 DESCRIBE THE INJURYILLNESS AND PART OF BODY AFFECTED", record["irinjury_desc"]);
				tmpFields.Add("35 SPECIFY THE DEPARTMENT WHERE INCIDENT OCCURRED AND THE WORK PROCESS INVOLVED", record["irinjury_area"]);
				tmpFields.Add("OCCURRENCE 36 LIST THE EQUIPMENT MATERIALS AND CHEMICALS EMPLOYEE USED WHEN THE INCIDENT OCCURRED EG ACETYLENE", record["irinjury_equipment"]);
				tmpFields.Add("37 DESCRIBE THE EMPLOYEES ACTIVITY AT THE TIME OF INJURY OR ILLNESS EG LIFTING A PATIENT", record["irinjury_workact"]);
				tmpFields.Add("38 DESCRIBE HOW THE INJURYILLNESS OCCURRED", record["irinjury_events"]);
				tmpFields.Add("39 NAME OF PHYSICIAN IF APPLICABLE", record["irinjury_pname"]);
				tmpFields.Add("40 PHYSICIANS ADDRESS", record["irinjury_paddress"]);
				tmpFields.Add("41 HOSPITAL IF APPLICABLE", record["irinjury_hospname"]);
				tmpFields.Add("42 HOSPITAL ADDRESS", record["irinjury_haddress"]);
				break;
			case "WC_MD.pdf":
				tmpFields.Add("1", record["company_name"]+", "+record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("11", record["company_phone"]);
				tmpFields.Add("12", record["insurComp_name"]+", "+record["insurComp_address"]+","+record["insurComp_phone"]);
				tmpFields.Add("17", record["irinjury_wcpnum"]);
				tmpFields.Add("20", record["irinjury_lastname"]+" "+record["irinjury_firstname"]);
				tmpFields.Add("25", record["irinjury_homeaddress"]);
				tmpFields.Add("35", record["irinjury_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Group2", "1");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Group2", "2");}
				tmpFields.Add("33", record["irinjury_title"]);
				tmpFields.Add("38", record["irinjury_gws"]);
					if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("Group6", "4");}
					if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("Group6", "2");}
					if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("Group6", "4");}
					if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("Group6", "3");}
				tmpFields.Add("43", record["irinjury_dperw"]);
				tmpFields.Add("51", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("52", record["irinjury_inctime"]);
				tmpFields.Add("59", record["irinjury_inctype"]);
				tmpFields.Add("60", record["irinjury_bpart"]);
				tmpFields.Add("65", record["irinjury_area"]);
				tmpFields.Add("66", record["irinjury_equipment"]);
				tmpFields.Add("67", record["irinjury_events"]);
				tmpFields.Add("68", record["irinjury_workact"]);
				tmpFields.Add("77", record["irinjury_pname"]+", "+record["irinjury_paddress"]);
				tmpFields.Add("78", record["irinjury_hospname"]+", "+record["irinjury_haddress"]);
				tmpFields.Add("85", record["irinjury_wname"]);
				tmpFields.Add("90", record["irinjury_lastname"]+" "+record["irinjury_firstname"]);
				tmpFields.Add("48", record["irinjury_timework"]);
				tmpFields.Add("69", record["irinjury_desc"]);
				
				break;
			case "WC_NJ.pdf":
				tmpFields.Add("EMPLOYER NAME  ADDRESS INCL ZIP", record["company_name"]+", "+record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("PHONE", record["company_phone"]);
				tmpFields.Add("CLAIMS ADMINISTRATOR NAME ADDRESS  PHONE NO", record["partAdmin_name"]);
				tmpFields.Add("CARRIER NAME ADDRESS  PHONE", record["insurComp_name"]+", "+record["insurComp_address"]);
				tmpFields.Add("POLICYSELFINSURED NUMBER", record["irinjury_wcpnum"]);
				tmpFields.Add("NAME LAST FIRST MIDDLE", record["irinjury_lastname"]+" "+record["irinjury_firstname"]);
				tmpFields.Add("DATE HIRED", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("ADDRESS INCL ZIP", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
				tmpFields.Add("PHONE_2", record["irinjury_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Check Box2", "1");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Check Box2", "2");}
				tmpFields.Add("OCCUPATIONJOB TITLE", record["irinjury_title"]);
					if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("Check Box6", "4");}
					if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("Check Box6", "2");}
					if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("Check Box6", "4");}
					if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("Check Box6", "3");}
				tmpFields.Add("DAYS WORKEDWEEK", record["irinjury_dperw"]);
				tmpFields.Add("DATE OF INJURYILLNESS", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("Text10", record["irinjury_inctime"]);
				tmpFields.Add("TYPE OF INJURYILLNESS", record["irinjury_inctype"]);
				tmpFields.Add("PART OF BODY AFFECTED", record["irinjury_bpart"]);
				tmpFields.Add("DEPARTMENT OR LOCATION WHERE ACCIDENT OR ILLNESS EXPOSURE OCCURRED", record["irinjury_area"]);
				tmpFields.Add("ALL EQUIPMENT MATERIALS OR CHEMICALS EMPLOYEE WAS USING WHEN ACCIDENT OR ILLNESS EXPOSURE OCCURRED", record["irinjury_equipment"]);
				tmpFields.Add("SPECIFIC ACTIVITY THE EMPLOYEE WAS ENGAGED IN WHEN THE ACCIDENT OR ILLNESS EXPOSURE OCCURRED", record["irinjury_events"]);
				tmpFields.Add("WORK PROCESS THE EMPLOYEE WAS ENGAGED IN WHEN ACCIDENT OR ILLNESS EXPOSURE OCCURRED", record["irinjury_workact"]);
				tmpFields.Add("PHYSICIANHEALTH CARE PROVIDER NAME  ADDRESS", record["irinjury_pname"]+", "+record["irinjury_paddress"]);
				tmpFields.Add("HOSPITAL OR OFF SITE TREATMENT NAME  ADDRESS", record["irinjury_hospname"]+", "+record["irinjury_haddress"]);
				tmpFields.Add("WITNESSES NAME  PHONE", record["irinjury_wname"]);
				tmpFields.Add("Text7", record["irinjury_timework"]);
				tmpFields.Add("Text13", record["irinjury_desc"]);
				break;
			case "WC_RI.pdf":
				tmpFields.Add("Text3", record["company_name"]);
				tmpFields.Add("Text4", record["company_address"]);
				tmpFields.Add("Text7", record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("Text8", record["company_phone"]);
				tmpFields.Add("PER Name", record["company_name"]);
				tmpFields.Add("PER Address 1", record["company_address"]);
				tmpFields.Add("PER CSZ", record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("PER Phone", record["company_phone"]);
				tmpFields.Add("WCP", record["irinjury_wcpnum"]);
				tmpFields.Add("Text11", record["insurComp_name"]);
				tmpFields.Add("Text12", record["insurComp_address"]);
				tmpFields.Add("Text14", record["insurComp_city"]+","+record["insurComp_zip"]);
				tmpFields.Add("Text15", record["insurComp_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Check Box1", "1");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Check Box1", "2");}
				tmpFields.Add("Text18", record["irinjury_lastname"]+" "+record["irinjury_firstname"]);
				tmpFields.Add("Text19", record["irinjury_homeaddress"]);
				tmpFields.Add("Text20", record["irinjury_city"]+", "+record["irinjury_zip"]);
				tmpFields.Add("TF Name", record["irinjury_hospname"]);
				tmpFields.Add("TF Address", record["irinjury_haddress"]);
				tmpFields.Add("TF CSZ", record["irinjury_hcity"]+", "+record["irinjury_hzip"]);
				tmpFields.Add("TF Phone", record["irinjury_hospphone"]);
				tmpFields.Add("Text26", record["irinjury_wname"]);
				tmpFields.Add("Text21", record["irinjury_phone"]);
				tmpFields.Add("Text22", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("EE OCC", record["irinjury_title"]);
				tmpFields.Add("EE DOH", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("Text23", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("TOI", record["irinjury_inctime"]);
				tmpFields.Add("TWB", record["irinjury_timework"]);
				tmpFields.Add("DWI", record["irinjury_workact"]);
				tmpFields.Add("INP", record["irinjury_injtype"]+", "+record["irinjury_bpart"]+", "+record["irinjury_bside"]);
				break;
			case "WC_VA.pdf":
				tmpFields.Add("insur_claimno", record["irinjury_cnum"]);
				tmpFields.Add("Employer Name", record["company_name"]);
				tmpFields.Add("Employer Address Line 1", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("Insured Name", record["insurComp_name"]);
				tmpFields.Add("Insured Address", record["insurComp_address"]);
				tmpFields.Add("Policy Number", record["irinjury_wcpnum"]);
				tmpFields.Add("Date Of Injury", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("Time Employee Began Work", record["irinjury_timework"]);
					if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("Was employy paid in full Yes", "Yes");}
					if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("Was employy paid in full No", "Yes");}
				tmpFields.Add("Date Reported To Employer", record["irinjury_repdate"]);
				tmpFields.Add("Witness Name", record["irinjury_wname"]);
				tmpFields.Add("Employee Date Of Death", record["irinjury_timed"]);
				tmpFields.Add("Employee Last Name", record["irinjury_lastname"]);
				tmpFields.Add("Employee First Name", record["irinjury_firstname"]);
				tmpFields.Add("Employee Phone", record["irinjury_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("undefined", "Yes");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("undefined_2", "Yes");}
				tmpFields.Add("Employee Address Line 1", record["irinjury_homeaddress"]);
				tmpFields.Add("Employee City", record["irinjury_city"]);
				tmpFields.Add("Employee State", record["irinjury_state"]);
				tmpFields.Add("Employee Postal Code", record["irinjury_zip"]);
				tmpFields.Add("Employee Date Of Birth", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("Social Security Number", record["irinjury_ssn"]);
				tmpFields.Add("Occupation Description", record["irinjury_inctime"]);
				tmpFields.Add("Date Of Hire", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("Hours Worked Per Day", record["irinjury_hperd"]);
				tmpFields.Add("Usual Days Worked", record["irinjury_dperw"]);
				if(record["irinjury_gwsp"].ToString()=="Week"){
					tmpFields.Add("Wage", record["irinjury_gws"]);
				}
				tmpFields.Add("Machine Or Product Failure", record["irinjury_equipment"]);
				tmpFields.Add("Accident Description/Cause", record["irinjury_desc"]);
				tmpFields.Add("Part Of Body Injured Code", record["irinjury_bpart"]+", "+record["irinjury_bside"]);
					if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("Hospitalized Overnight Yes", "Yes");}
					if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("Hospitalized Overnight No", "Yes");}
					if(record["irinjury_etreat"].ToString()=="True"){tmpFields.Add("Hospitalized Yes", "Yes");}
					if(record["irinjury_etreat"].ToString()=="False"){tmpFields.Add("Hospitalized No", "Yes");}
				tmpFields.Add("Physician Name", record["irinjury_pname"]);
				tmpFields.Add("Hospital Name", record["irinjury_hospname"]);
				tmpFields.Add("Report Maker", record["init_firstname"]+", "+record["init_lastname"]);
				tmpFields.Add("Report Completion Date", record["irinjury_repdate"]);
				tmpFields.Add("Insurer Name", record["insurComp_name"]);
				tmpFields.Add("Claim Administrator Phone", record["insurComp_phone"]);
				tmpFields.Add("Third Party Administrator Name", record["partAdmin_name"]);
				tmpFields.Add("Claim Administrator Phone 1", record["partAdmin_phone"]);
				tmpFields.Add("Claim Administrator Address Line 1", record["partAdmin_address"]);
			
				break;
			case "WC_CA.pdf":
				if(Request["systemid"]=="146"){
					if(record["irinjury_fatal"].ToString()=="True"){tmpFields.Add("CheckBox1", 1);}
					tmpFields.Add("Ia_Policy_Number", record["irinjury_wcpnum"]);
					tmpFields.Add("2a_Phone_Number", record["company_phone"]);
					tmpFields.Add("27_Phone_411h", record["irinjury_pphone"]);
					tmpFields.Add("1_FIRM_NAME", record["company_name"]);
					tmpFields.Add("2_MAILING_ADDRESS_Number", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
					tmpFields.Add("3_LOCATION_ifdifferent_fr", record["projects_address"]+","+record["projects_city"]+","+record["projects_zip"]);
					tmpFields.Add("3aLocation_Code", record["projects_num"]);
					tmpFields.Add("4_NATURE_OF_BUSINESS_eg_P", "Specialty Contractors");
					tmpFields.Add("5_stae_unemployment", "120-8001-6");
					tmpFields.Add("6", "Private");
					tmpFields.Add("7_DATE_OF_INJURY__ONSET_O", ClearDate(record["irinjury_incdate"].ToString()));
					tmpFields.Add("8_AM2", record["irinjury_inctime"]);
					tmpFields.Add("7_DATE_OF_INJURY__ONSET_1", record["irinjury_timework"]);
					tmpFields.Add("10_IF_EMPLOYEE_DIED_DATE", record["irinjury_timed"]);
					if(record["irinjury_return"].ToString()=="True"){tmpFields.Add("11", "Yes");}
					if(record["irinjury_return"].ToString()=="False"){tmpFields.Add("11", "No");}
					tmpFields.Add("12_DATE_RETURNED_TO_WORK", record["lastwork"]);
					tmpFields.Add("13_DATE_RETURNED_TO_WORK", record["returnwork"]);
					if(record["irinjury_stillwork"].ToString()=="True"){tmpFields.Add("CheckBox2", 1);}
					tmpFields.Add("16_SALARY_BEING_CONTINUED", "Yes");
					tmpFields.Add("17_DATE_OF_EMPLOYERS_KNOW", record["irinjury_notice"]);
					tmpFields.Add("17_DATE_EMPLOYEE_PROVIDED", record["irinjury_claim"]);
					if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("18I_PAID_FULL_DAYS_WAGES_FO", "Yes");}
					if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("18I_PAID_FULL_DAYS_WAGES_FO", "No");}
					if(record["irinjury_salary"].ToString()=="True"){tmpFields.Add("16_SALARY_BEING_CONTINUED", "Yes");}
					if(record["irinjury_salary"].ToString()=="False"){tmpFields.Add("16_SALARY_BEING_CONTINUED", "No");}
					tmpFields.Add("18_DATE_EMPLOYEE_PROVIDED", ClearDate(record["irinjury_claim"].ToString()));
					tmpFields.Add("19_SPECIFIC_INJURYILLNESS", record["irinjury_injtype"]+","+record["irinjury_bpart"]+","+record["irinjury_bside"]);
					tmpFields.Add("20_LOCATION_WHERE_EVENT_O", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
					if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("21_ON_EMPLOYERS_PREMISES", "Yes");}
					if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("21_ON_EMPLOYERS_PREMISES", "No");}
					tmpFields.Add("22_DEPARTMENT_WHERE_EVENT", record["irinjury_area"]);
					if(record["irinjury_otherw"].ToString()=="True"){tmpFields.Add("23", "Yes");}
					if(record["irinjury_otherw"].ToString()=="False"){tmpFields.Add("23", "No");}
					tmpFields.Add("24_EQUIPMENT_MATERIALS_AN", record["irinjury_equipment"]);
					tmpFields.Add("25_SPECIFIC_ACTIVITY_THE", record["irinjury_workact"]+","+record["irinjury_events"]);
					tmpFields.Add("26_HOW_INJURY_ILLNESS", record["irinjury_desc"]);
					tmpFields.Add("27_name _address_of_physician", record["irinjury_paddress"]);
					if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("29", "yes");}
					if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("29", "no");}
					tmpFields.Add("Jills_Phone_No", record["irinjury_hospphone"]);
					tmpFields.Add("29_HOSP_TA_ZED_AS_AN_NAl", record["irinjury_hospname"]+","+record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
					tmpFields.Add("30_EMPLO_CC_NAME", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
					tmpFields.Add("31_SOC_A_SECUPITi_NUMBER", record["irinjury_ssn"]);
					tmpFields.Add("32_DATE_OF_I_PTH_mm_ddio", ClearDate(record["irinjury_dob"].ToString()));
					tmpFields.Add("33_HOME_ADDRESS_IN_be_Sto", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
					tmpFields.Add("33a_PHONE_NUMBER", record["irinjury_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("34", "Male");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("34", "Female");}
					tmpFields.Add("35_OCC_UPAT_ON_Ppqj_a_on", record["irinjury_title"]);
					tmpFields.Add("36_DATE_OF_H_RE_mmiddlyy", ClearDate(record["irinjury_doh"].ToString()));
					tmpFields.Add("37b-under-chat-class-code", "5213");
					tmpFields.Add("E", record["irinjury_hperd"]);
					tmpFields.Add("hours_per_day", record["irinjury_dperw"]);
					tmpFields.Add("days_per_week1", record["irinjury_hperw"]);
					tmpFields.Add("FillText1", record["irinjury_gws"]);
					tmpFields.Add("per", record["irinjury_gwsp"]);
					if(record["irinjury_other"].ToString()=="True"){tmpFields.Add("39", "Yes");}
					if(record["irinjury_other"].ToString()=="False"){tmpFields.Add("39", "No");}
					if(record["irinjury_empstatus"].ToString()=="Full time"){tmpFields.Add("37a", "regular_fulltime");}
					if(record["irinjury_empstatus"].ToString()=="Part-Time"){tmpFields.Add("37a", "parttime");}
					if(record["irinjury_empstatus"].ToString()=="Temporary"){tmpFields.Add("37a", "temporary");}
					if(record["irinjury_empstatus"].ToString()=="Seasonal"){tmpFields.Add("37a", "seasonal");}
				}else{
					if(record["irinjury_fatal"].ToString()=="True"){tmpFields.Add("CheckBox1", 1);}
					tmpFields.Add("Ia_Policy_Number", record["irinjury_wcpnum"]);
					tmpFields.Add("2a_Phone_Number", record["company_phone"]);
					tmpFields.Add("27_Phone_411h", record["irinjury_pphone"]);
					tmpFields.Add("1_FIRM_NAME", record["company_name"]);
					tmpFields.Add("2_MAILING_ADDRESS_Number", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
					tmpFields.Add("7_DATE_OF_INJURY__ONSET_O", ClearDate(record["irinjury_incdate"].ToString()));
					tmpFields.Add("8_AM2", record["irinjury_inctime"]);
					tmpFields.Add("7_DATE_OF_INJURY__ONSET_1", record["irinjury_timework"]);
					tmpFields.Add("10_IF_EMPLOYEE_DIED_DATE", record["irinjury_timed"]);
					if(record["irinjury_return"].ToString()=="True"){tmpFields.Add("11", "Yes");}
					if(record["irinjury_return"].ToString()=="False"){tmpFields.Add("11", "No");}
					tmpFields.Add("12_DATE_RETURNED_TO_WORK", record["lastwork"]);
					tmpFields.Add("13_DATE_RETURNED_TO_WORK", record["returnwork"]);
					if(record["irinjury_stillwork"].ToString()=="True"){tmpFields.Add("CheckBox2", 1);}
					tmpFields.Add("17_DATE_OF_EMPLOYERS_KNOW", record["irinjury_notice"]);
					tmpFields.Add("17_DATE_EMPLOYEE_PROVIDED", record["irinjury_claim"]);
					if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("18I_PAID_FULL_DAYS_WAGES_FO", "Yes");}
					if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("18I_PAID_FULL_DAYS_WAGES_FO", "No");}
					if(record["irinjury_salary"].ToString()=="True"){tmpFields.Add("16_SALARY_BEING_CONTINUED", "Yes");}
					if(record["irinjury_salary"].ToString()=="False"){tmpFields.Add("16_SALARY_BEING_CONTINUED", "No");}
					tmpFields.Add("18_DATE_EMPLOYEE_PROVIDED", ClearDate(record["irinjury_claim"].ToString()));
					tmpFields.Add("19_SPECIFIC_INJURYILLNESS", record["irinjury_injtype"]+","+record["irinjury_bpart"]+","+record["irinjury_bside"]);
					tmpFields.Add("20_LOCATION_WHERE_EVENT_O", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
					if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("21_ON_EMPLOYERS_PREMISES", "Yes");}
					if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("21_ON_EMPLOYERS_PREMISES", "No");}
					tmpFields.Add("22_DEPARTMENT_WHERE_EVENT", record["irinjury_area"]);
					if(record["irinjury_otherw"].ToString()=="True"){tmpFields.Add("23", "Yes");}
					if(record["irinjury_otherw"].ToString()=="False"){tmpFields.Add("23", "No");}
					tmpFields.Add("24_EQUIPMENT_MATERIALS_AN", record["irinjury_equipment"]);
					tmpFields.Add("25_SPECIFIC_ACTIVITY_THE", record["irinjury_workact"]+","+record["irinjury_events"]);
					tmpFields.Add("26_HOW_INJURY_ILLNESS", record["irinjury_desc"]);
					tmpFields.Add("27_name _address_of_physician", record["irinjury_paddress"]);
					if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("29", "yes");}
					if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("29", "no");}
					tmpFields.Add("Jills_Phone_No", record["irinjury_hospphone"]);
					tmpFields.Add("29_HOSP_TA_ZED_AS_AN_NAl", record["irinjury_hospname"]+","+record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
					tmpFields.Add("30_EMPLO_CC_NAME", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
					tmpFields.Add("31_SOC_A_SECUPITi_NUMBER", record["irinjury_ssn"]);
					tmpFields.Add("32_DATE_OF_I_PTH_mm_ddio", ClearDate(record["irinjury_dob"].ToString()));
					tmpFields.Add("33_HOME_ADDRESS_IN_be_Sto", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
					tmpFields.Add("33a_PHONE_NUMBER", record["irinjury_phone"]);
					if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("34", "Male");}
					if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("34", "Female");}
					tmpFields.Add("35_OCC_UPAT_ON_Ppqj_a_on", record["irinjury_title"]);
					tmpFields.Add("36_DATE_OF_H_RE_mmiddlyy", ClearDate(record["irinjury_doh"].ToString()));
					tmpFields.Add("E", record["irinjury_hperd"]);
					tmpFields.Add("hours_per_day", record["irinjury_dperw"]);
					tmpFields.Add("days_per_week1", record["irinjury_hperw"]);
					tmpFields.Add("FillText1", record["irinjury_gws"]);
					tmpFields.Add("per", record["irinjury_gwsp"]);
					if(record["irinjury_other"].ToString()=="True"){tmpFields.Add("39", "Yes");}
					if(record["irinjury_other"].ToString()=="False"){tmpFields.Add("39", "No");}
					if(record["irinjury_empstatus"].ToString()=="Full time"){tmpFields.Add("37a", "regular_fulltime");}
					if(record["irinjury_empstatus"].ToString()=="Part-Time"){tmpFields.Add("37a", "parttime");}
					if(record["irinjury_empstatus"].ToString()=="Temporary"){tmpFields.Add("37a", "temporary");}
					if(record["irinjury_empstatus"].ToString()=="Seasonal"){tmpFields.Add("37a", "seasonal");}
				}
				break ;
			case "WC_FL.pdf":
				tmpFields.Add("NAME_First_Middle_Last[0]", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("Date_of_Accident_MonthDayYear[0]", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("Time[0]", record["irinjury_inctime"]);
				tmpFields.Add("StreetApt[0]", record["irinjury_homeaddress"]);
				tmpFields.Add("City[0]", record["irinjury_city"]);
				tmpFields.Add("State[0]", record["irinjury_state"]);
				tmpFields.Add("Zip[0]", record["irinjury_zip"]);
				tmpFields.Add("TELEPHONE_Area_Code_Number[0]", record["irinjury_phone"]);
				tmpFields.Add("OCCUPATION[0]", record["irinjury_title"]);
				tmpFields.Add("DATE_OF_BIRTH[0]", ClearDate(record["irinjury_dob"].ToString()));
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Check_Box1[0]", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Check_Box6[0]", "Yes");}
				tmpFields.Add("EMPLOYEES_DESCRIPTION_OF_ACCIDENT_Include_Cause_of_Injury[0]", record["irinjury_desc"]+", "+record["irinjury_causetype"]+", "+record["irinjury_causetypedetail"]);
				tmpFields.Add("INJURYILLNESS_THAT_OCCURRED[0]", record["irinjury_workact"]);
				tmpFields.Add("PART_OF_BODY_AFFECTED[0]", record["irinjury_bpart"]+","+record["irinjury_bside"]);
				tmpFields.Add("COMPANY_NAME[0]", record["company_name"]);
				tmpFields.Add("Street[0]", record["company_address"]);
				tmpFields.Add("City_2[0]", record["company_city"]);
				tmpFields.Add("State_2[0]", record["state_name"]);
				tmpFields.Add("Zip_2[0]", record["company_zip"]);
				tmpFields.Add("LOCATION__If_applicable[0]", record["projects_num"]+" "+record["projects_name"]);
				tmpFields.Add("DATE_FIRST_REPORTED_MonthDayYear[0]", ClearDate(record["irinjury_repdate"].ToString()));
				tmpFields.Add("POLICYMEMBER_NUMBER[0]", record["irinjury_wcpnum"]);
				tmpFields.Add("DATE_EMPLOYED[0]", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("Street_3[0]", record["irinjury_placeaddress"]);
				tmpFields.Add("City_4[0]", record["irinjury_placecity"]);
				tmpFields.Add("State_4[0]", record["irinjury_placestate"]);
				tmpFields.Add("Zip_4[0]", record["irinjury_placezip"]);
				tmpFields.Add("COUNTY_OF_ACCIDENT[0]", record["irinjury_area"]);
				tmpFields.Add("DATE_OF_DEATH_If_applicable[0]", record["irinjury_timed"]);
				tmpFields.Add("undefined_14[0]", record["irinjury_gws"]);
				if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("HR[0]", "On");}
				if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("WK[0]", "On");}
				if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("MO[0]", "On");}
				tmpFields.Add("undefined_15[0]", record["irinjury_hperd"]);
				tmpFields.Add("Number_of_hours_per_week_1[0]", record["irinjury_hperw"]);
				tmpFields.Add("Number_of_hours_per_week_2[0]", record["irinjury_dperw"]);
				tmpFields.Add("Hosp[0]", record["irinjury_hospname"]+","+record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);

				break ;
			case "WC_AZ.pdf":
				if(record["irinjury_recordable"].ToString()=="Yes"){
					tmpFields.Add("TextField3", "Yes");
				}else{
					tmpFields.Add("TextField4", "Yes");
				}
				tmpFields.Add("TextField5[0]", record["irinjury_lastname"]);
				tmpFields.Add("TextField7", record["irinjury_middle"]);
				tmpFields.Add("TextField6", record["irinjury_firstname"]);
				tmpFields.Add("TextField8", record["irinjury_ssn"]);
				tmpFields.Add("TextField10", record["irinjury_homeaddress"]);
				tmpFields.Add("TextField11", record["irinjury_city"]);
				tmpFields.Add("TextField13", record["irinjury_zip"]);
				tmpFields.Add("TextField12", record["irinjury_state"]);
				tmpFields.Add("TextField14", record["irinjury_phone"]);
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("T123[0]", 1);}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("T123[1]", 1);}
				tmpFields.Add("TextField5[1]", record["company_name"]);
				tmpFields.Add("TextField5[2]", record["irinjury_wcpnum"]);
				tmpFields.Add("TextField5[4]", record["company_address"]);
				tmpFields.Add("TextField5[5]", record["company_city"]);
				tmpFields.Add("TextField5[6]", record["state_name"]);
				tmpFields.Add("TextField5[7]", record["company_zip"]);
				tmpFields.Add("TextField5[8]", record["company_phone"]);
				tmpFields.Add("DateTimeField1", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("DateTimeField2[0]", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("TextField15[0]", record["irinjury_inctime"]);
				tmpFields.Add("TextField15[1]", record["irinjury_timework"]);
				tmpFields.Add("DateTimeField3[0]", ClearDate(record["irinjury_notice"].ToString()));
				tmpFields.Add("DateTimeField4", record["lastwork"]);
				tmpFields.Add("DateTimeField2[1]", record["returnwork"]);
				tmpFields.Add("TextField5[9]", record["irinjury_title"]);
				tmpFields.Add("TextField5[10]", record["irinjury_wcclass"]);
				if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("T123[11]", 1);}
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("T123[10]", 1);}
				tmpFields.Add("TextField5[12]", record["irinjury_placeaddress"]);
				tmpFields.Add("TextField5[13]", record["irinjury_placecity"]);
				tmpFields.Add("TextField5[15]", record["irinjury_placestate"]);
				tmpFields.Add("TextField5[16]", record["irinjury_placezip"]);
				tmpFields.Add("TextField5[17]", record["irinjury_injtype"]+","+record["irinjury_bpart"]+","+record["irinjury_bside"]);
				tmpFields.Add("TextField15[2]", record["irinjury_bpart"]);
				if(record["irinjury_fatal"].ToString()=="True"){tmpFields.Add("T123[12]", 1);}
				if(record["irinjury_fatal"].ToString()=="False"){tmpFields.Add("T123[13]", 1);}
				if(record["irinjury_etreat"].ToString()=="True"){tmpFields.Add("T123[14]", 1);}
				if(record["irinjury_etreat"].ToString()=="False"){tmpFields.Add("T123[15]", 1);}
				tmpFields.Add("DateTimeField3[1]", record["irinjury_timed"]);
				tmpFields.Add("TextField15[3]", record["irinjury_pname"]);
				tmpFields.Add("TextField15[4]", record["irinjury_paddress"]);
				if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("T123[16]", 1);}
				if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("T123[17]", 1);}
				tmpFields.Add("TextField15[5]", record["irinjury_hospname"]);
				tmpFields.Add("TextField15[6]", record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				tmpFields.Add("TextField15[8]", record["irinjury_desc"]);
				tmpFields.Add("TextField15[10]", record["irinjury_workact"]+","+record["irinjury_events"]);
				tmpFields.Add("TextField15[13]", record["irinjury_hperd"]);
				tmpFields.Add("TextField15[16]", record["irinjury_dperw"]);
				tmpFields.Add("TextField15[20]", record["irinjury_gws"]);
				if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("T123[26]", 1);}
				if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("T123[27]", 1);}
				if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("T123[28]", 1);}
				if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("T123[29]", 1);}
				
				break ;
			case "WC_NV.pdf":
				tmpFields.Add("EmployersName", record["company_name"]);
				tmpFields.Add("INSURER", record["insurComp_name"]);
				tmpFields.Add("ThirdPartyAdmin", record["partAdmin_name"]);
				tmpFields.Add("OfficeMailAddress", record["company_address"]);
				tmpFields.Add("City", record["company_city"]);
				tmpFields.Add("State", record["state_name"]);
				tmpFields.Add("Zip", record["company_zip"]);
				tmpFields.Add("Telephone", record["company_phone"]);
				tmpFields.Add("FirstName", record["irinjury_firstname"]);
				tmpFields.Add("LastName", record["irinjury_lastname"]);
				tmpFields.Add("MI", record["irinjury_middle"]);
				tmpFields.Add("SocialSecurity", record["irinjury_ssn"]);
				tmpFields.Add("BirtgDate", ClearDate(record["irinjury_dob"].ToString()));
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Male", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Female", "Yes");}
				if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("Yes", "Yes");}
				if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("No", "Yes");}
				tmpFields.Add("HomeAddress", record["irinjury_homeaddress"]);
				tmpFields.Add("City1", record["irinjury_city"]);
				tmpFields.Add("State1", record["irinjury_state"]);
				tmpFields.Add("ZIP1", record["irinjury_zip"]);
				//if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("Yes4", "Yes");}
				//if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("No4", "Yes");}
				tmpFields.Add("EmployeOccupation", record["irinjury_title"]);
				tmpFields.Add("DepartmentInWhichRegularlyEmpl", record["irinjury_area"]);
				tmpFields.Add("TeleOfEmployee", record["irinjury_phone"]);
				tmpFields.Add("DateOgInjury", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("TimeOfInjury", record["irinjury_inctime"]);
				tmpFields.Add("DateEmployer", ClearDate(record["irinjury_notice"].ToString()));
				tmpFields.Add("AddressOrLocation", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
				if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("Yes3", "Yes");}
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("No3", "Yes");}
				if(record["irinjury_otherw"].ToString()=="True"){tmpFields.Add("Yes4a", "Yes");}
				if(record["irinjury_otherw"].ToString()=="False"){tmpFields.Add("No4a", "Yes");}
				tmpFields.Add("WhatWhasthisEmplDoing", record["irinjury_workact"]);
				tmpFields.Add("HowDidthis", record["irinjury_desc"]);
				tmpFields.Add("SpecifyMachineTool", record["irinjury_equipment"]);
				tmpFields.Add("Witness", record["irinjury_wname"]);
				tmpFields.Add("PartOfBodyInjuredOrAffected", record["irinjury_bpart"]);
				tmpFields.Add("IfFatalGiveDate", record["irinjury_timed"]);
				tmpFields.Add("NatureOfInjuryOrOccup", record["irinjury_injtype"]);
				tmpFields.Add("TreatingPhysician", record["irinjury_pname"]);
				if(record["irinjury_etreat"].ToString()=="True"){tmpFields.Add("Yes7", "Yes");}
				if(record["irinjury_etreat"].ToString()=="False"){tmpFields.Add("No7", "Yes");}
				if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("Yes8", "Yes");}
				if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("No8", "Yes");}
				tmpFields.Add("HowManyDays", record["irinjury_dperw"]);
				tmpFields.Add("DateEmplWasHired", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("LastDayOfWork", ClearDate(record["lastwork"].ToString()));
				tmpFields.Add("NumberofWorkDaysLost", record["S_totaloffdays"]);
				if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("Other", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("Weekly", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("BI_WKLY", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("Monthly", "Yes");}

				break ;
			case "WC_UT.pdf":
				tmpFields.Add("EMPLOYER", record["company_name"]+","+record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("EMPLOYERS PHONE", record["company_phone"]);
				tmpFields.Add("EMPLOYEE NAME", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("Birth", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("Social Security", record["irinjury_ssn"]);
				tmpFields.Add("Hired Date", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("EMPLOYEE ADDRESS", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
				tmpFields.Add("EMPLOYEE PHONE", record["irinjury_phone"]);
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Check Box MALE", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Check Box FEMALE", "Yes");}
				tmpFields.Add("OCCUPATION", record["irinjury_title"]);
				tmpFields.Add("EMPLOYMENT STATUS", record["irinjury_empstatus"]);
				tmpFields.Add("NCCI CLASS", record["irinjury_wcclass"]);
				tmpFields.Add("WAGE RATE", record["irinjury_gws"]);
				if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("Check Box OTHER", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("Check Box WEEK", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("Check Box OTHER", "Yes");}
				if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("Check Box MONTH", "Yes");}
				tmpFields.Add("DAYS WORKED", record["irinjury_dperw"]);
				if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("FULL PAY YES", "Yes");}
				if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("FULL PAY NO", "Yes");}
				if(record["irinjury_salary"].ToString()=="Yes"){tmpFields.Add("SALARY YES", "Yes");}
				if(record["irinjury_salary"].ToString()=="No"){tmpFields.Add("SALARY NO", "Yes");}
				tmpFields.Add("BEGAN WORK AM", record["irinjury_timework"]);
				tmpFields.Add("DATE INJURY/ILLNESS", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("NOTIFICATION DATE", ClearDate(record["irinjury_notice"].ToString()));
				tmpFields.Add("TIME OCCURRED", record["irinjury_inctime"]);
				tmpFields.Add("LAST DATE", record["lastwork"]);
				tmpFields.Add("TYPE", record["irinjury_injtype"]);
				tmpFields.Add("PART AFFECTED", record["irinjury_bpart"]+","+record["irinjury_bside"]);
				if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("AT WORK YES", "Yes");}
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("AT WORK NO", "Yes");}
				tmpFields.Add("LOCATION", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
				tmpFields.Add("EQUIPMENT INVOLVED", record["irinjury_equipment"]);
				tmpFields.Add("ACTIVITY", record["irinjury_workact"]+","+record["irinjury_events"]);
				tmpFields.Add("SEQUENCE OF EVENTS", record["irinjury_desc"]);
				tmpFields.Add("DATE RETURNED", record["returnwork"]);
				if(record["irinjury_fatal"].ToString()=="True"){tmpFields.Add("DATE OF DEATH", ClearDate(record["irinjury_incdate"].ToString()));}
				tmpFields.Add("PROVIDER", record["irinjury_pname"]+","+record["irinjury_pphone"]+","+record["irinjury_paddress"]);
				tmpFields.Add("HOSPITAL", record["irinjury_hospname"]+","+ record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				tmpFields.Add("WITNESSES", record["irinjury_wname"]);
				
				break ;
			case "WC_OR.pdf":
				tmpFields.Add("DateOf", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("DateYou", record["lastwork"]);
				
				tmpFields.Add("TimeBegan", record["irinjury_timework"]);
				tmpFields.Add("TimeLeft", "");
				tmpFields.Add("TimeInc", record["irinjury_inctime"]);
				
				if(record["irinjury_otherw"].ToString()=="True"){tmpFields.Add("OneEmpl", ClearDate(record["irinjury_incdate"].ToString()));}
				tmpFields.Add("Injury", record["irinjury_bpart"]+","+record["irinjury_bside"]);
				tmpFields.Add("Desctiption", record["irinjury_desc"]);

				tmpFields.Add("LegalName", record["irinjury_firstname"]+","+record["irinjury_lastname"]);
				tmpFields.Add("BirdDate", ClearDate(record["irinjury_dob"].ToString()));
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Male", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Female", "Yes");}
				tmpFields.Add("YourMailAddr", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
				tmpFields.Add("HomePhone", record["irinjury_phone"]);
				tmpFields.Add("SSNoptional", record["irinjury_ssn"]);
				tmpFields.Add("Occupation", record["irinjury_title"]);
				tmpFields.Add("NamesOfWitn", record["irinjury_wname"]);
				tmpFields.Add("NameOfPhys", record["irinjury_pname"]);
				tmpFields.Add("IfMedicalTreat", record["irinjury_hospname"]+","+ record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				if(record["irinjury_hosp"].ToString()=="True"){tmpFields.Add("Yes1", "Yes");}
				if(record["irinjury_hosp"].ToString()=="False"){tmpFields.Add("No1", "Yes");}
				if(record["irinjury_etreat"].ToString()=="True"){tmpFields.Add("Yes2", "Yes");}
				if(record["irinjury_etreat"].ToString()=="False"){tmpFields.Add("No2", "Yes");}
				tmpFields.Add("EmployerLegal", record["company_name"]);
				tmpFields.Add("Phone", record["company_phone"]);
				tmpFields.Add("AddressOfPrincip", record["company_address"]+","+record["company_city"]);
				tmpFields.Add("ZIP", record["company_zip"]);
				tmpFields.Add("AddressWhereEventOccured", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
				if(record["irinjury_otherw"].ToString()=="True"){tmpFields.Add("Yes4", "Yes");}
				if(record["irinjury_otherw"].ToString()=="False"){tmpFields.Add("No4", "Yes");}
				tmpFields.Add("DateWorker", record["returnwork"]);
				tmpFields.Add("WorkersWeekly", record["irinjury_gws"]);
				tmpFields.Add("DateWorkerHired", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("DateEmployer", ClearDate(record["irinjury_notice"].ToString()));
				tmpFields.Add("DateDeath", record["irinjury_timed"]);

				break ;
			case "WC_NM.pdf":
				tmpFields.Add("EmployerNameAddr", record["company_name"]);
				tmpFields.Add("PhoneNumb", record["company_phone"]);
				tmpFields.Add("EmplLocationAddr", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("LastNameFirstMidle", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("DateBird", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("DateHired", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("AddrInclZip", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("Male", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("Female", "Yes");}
				if(record["irinjury_sex"].ToString()==""){tmpFields.Add("Unknow", "Yes");}
				tmpFields.Add("PhoneNumber", record["irinjury_phone"]);
				tmpFields.Add("SocialSecNumb", record["irinjury_ssn"]);
				tmpFields.Add("EmployStatus", record["irinjury_empstatus"]);
				tmpFields.Add("NCCIClassCode", record["irinjury_wcclass"]);
				tmpFields.Add("DatePer", record["irinjury_gws"]);
				tmpFields.Add("Occupation", record["irinjury_title"]);
				if(record["irinjury_gwsp"].ToString()=="Hour"){tmpFields.Add("Other", 1);}
				if(record["irinjury_gwsp"].ToString()=="Week"){tmpFields.Add("Week", 1);}
				if(record["irinjury_gwsp"].ToString()=="Biweekly"){tmpFields.Add("Other", 1);}
				if(record["irinjury_gwsp"].ToString()=="Month"){tmpFields.Add("Month", 1);}
				tmpFields.Add("DaysWorked", record["irinjury_dperw"]);
				if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("Yes", "Yes");}
				if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("No", "No");}
				if(record["irinjury_salary"].ToString()=="Yes"){tmpFields.Add("Yes1", "Yes");}
				if(record["irinjury_salary"].ToString()=="No"){tmpFields.Add("No1", "No");}
				tmpFields.Add("TimeBegan", record["irinjury_timework"]);
				tmpFields.Add("DateOfInj", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("TimeOfOccur", record["irinjury_inctime"]);
				tmpFields.Add("LastWorkDate", ClearDate(record["lastwork"].ToString()));
				tmpFields.Add("TypeOfInjury", record["irinjury_injtype"]);
				tmpFields.Add("PartOfBody", record["irinjury_bpart"]+","+record["irinjury_bside"]);
				if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("Yes3", "Yes");}
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("No3", "Yes");}
				tmpFields.Add("DepOrLoc", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
				tmpFields.Add("AllEquipment", record["irinjury_equipment"]);
				tmpFields.Add("SpecActiv", record["irinjury_workact"]+","+record["irinjury_events"]);
				tmpFields.Add("HowInjuryOrILLNESS", record["irinjury_desc"]);
				tmpFields.Add("DateRetWork", record["returnwork"]);
				if(record["irinjury_fatal"].ToString()=="True"){tmpFields.Add("IfFatalGive", record["irinjury_timed"]);}
				tmpFields.Add("Physician", record["irinjury_pname"]+","+record["irinjury_pphone"]+","+record["irinjury_paddress"]);
				tmpFields.Add("HospitalNameAddr", record["irinjury_hospname"]+","+ record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				tmpFields.Add("WitnessesName&Phone", record["irinjury_wname"]);
				tmpFields.Add("DateEmployerNotifi", ClearDate(record["irinjury_notice"].ToString()));
				break ;
			case "WC_HI.pdf":
				tmpFields.Add("Last Name", record["irinjury_lastname"]);
				tmpFields.Add("First Name", record["irinjury_firstname"]);
				tmpFields.Add("S.S. number", record["irinjury_ssn"]);
				tmpFields.Add("Birth Date", ClearDate(record["irinjury_dob"].ToString()));
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("sex", "Yes");}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("sex", "No");}
				tmpFields.Add("Employee Address", record["irinjury_homeaddress"]);
				tmpFields.Add("City", record["irinjury_city"]);
				tmpFields.Add("State1", record["irinjury_state"]);
				tmpFields.Add("Employee's zip code", record["irinjury_zip"]);
				tmpFields.Add("Employee Phone", record["irinjury_phone"]);
				tmpFields.Add("Occupation", record["irinjury_title"]);
				tmpFields.Add("Years Employed", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("Department", record["irinjury_area"]);
				tmpFields.Add("Payroll Code", record["irinjury_wcclass"]);
				tmpFields.Add("Employer", record["company_name"]);
				tmpFields.Add("Employer Address", record["company_address"]);
				tmpFields.Add("Employer City", record["company_city"]);
				tmpFields.Add("Employer's zip code", record["company_zip"]);
				tmpFields.Add("Employer's Phone", record["company_phone"]);
				tmpFields.Add("Reported Date", record["irinjury_date"]);
				tmpFields.Add("Date of Injury", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("am_time", record["irinjury_inctime"]);
				tmpFields.Add("Place of Injury", record["irinjury_placeaddress"]);
				tmpFields.Add("Another City", record["irinjury_placecity"]);
				if(record["irinjury_occured"].ToString()=="True"){tmpFields.Add("Employer's Premises[0]", "Yes");}
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("Employer's Premises[1]", "No");}
				tmpFields.Add("How Accident Occured", record["irinjury_desc"]);
				tmpFields.Add("Employee Injured", record["irinjury_workact"]+","+record["irinjury_events"]);
				tmpFields.Add("Object of Injury", record["irinjury_equipment"]);
				tmpFields.Add("Description of Injury", record["irinjury_bpart"]);
				if(record["irinjury_paid"].ToString()=="True"){tmpFields.Add("Employee Paid[0]", 1);}
				if(record["irinjury_paid"].ToString()=="False"){tmpFields.Add("Employee Paid[1]", 1);}
				tmpFields.Add("Hourly Wage", record["irinjury_gws"]);
				tmpFields.Add("Hours Worked", record["irinjury_hperw"]);
				tmpFields.Add("Physician", record["irinjury_pname"]);
				tmpFields.Add("Physician Address", record["irinjury_paddress"]);
				tmpFields.Add("Hospital", record["irinjury_hospname"]);
				tmpFields.Add("Hospital Address", record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				tmpFields.Add("Date Died", record["irinjury_timed"]);
				if(record["irinjury_etreat"].ToString()=="True"){tmpFields.Add("Emergency Room", "Yes");}
				if(record["irinjury_etreat"].ToString()=="False"){tmpFields.Add("Emergency Room", "No");}
				tmpFields.Add("Insurance Carrier", record["insurComp_name"]);
				
				break ;
			case "AccidentReport.pdf":
				dbDa = new SqlDataAdapter(dbCmd);
				ds = new DataSet();
				dbCmd.CommandText = @"SELECT *, 
					super.users_firstname as super_firstname,
					super.users_lastname as super_lastname,
					foreman.users_firstname as foreman_firstname,
					foreman.users_lastname as foreman_lastname,
					dbo.INCRM_mddays(irinjury_id,'"+today.ToString()+@"') as transfer, 
					dbo.INCRM_totaloffdays(irinjury_id,'"+today.ToString()+@"') as away, 
					(CASE WHEN IsDate((select top 1 irinjuryDays_end FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='MD' order by irinjuryDays_begin))=1 THEN 1 ELSE 0 END) as d31, 
					(CASE WHEN irinjury_inctype='Injury' THEN 1 ELSE 0 END) as M1, 
					(CASE WHEN irinjury_inctype='Skin Disorder' THEN 1 ELSE 0 END) as M2, 
					(CASE WHEN irinjury_inctype='Respiratory Condition' THEN 1 ELSE 0 END) as M3, 
					(CASE WHEN irinjury_inctype='Poisoning' THEN 1 ELSE 0 END) as M4, 
					(CASE WHEN irinjury_inctype='Hearing Loss' THEN 1 ELSE 0 END) as M5, 
					(CASE WHEN irinjury_inctype='All other illnesses' THEN 1 ELSE 0 END) as M6, 
					(CASE WHEN irinjury_fatal=1 THEN 1 ELSE 0 END) as [fatal], 
					(CASE WHEN irinjury_return=1 THEN 1 ELSE 0 END) as [return], 
					projects.projects_company_id, CAST(Month([irinjury_incdate]) AS varchar) + '/' + CAST(Year([irinjury_incdate]) AS varchar) AS [date], 
					(select top 1 irinjuryDays_begin FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as lastwork,
					(select top 1 irinjuryDays_end FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as returnwork,
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_firstname+' '+irinjury_lastname END) as irinjury_name, 
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_injtype+', '+irinjury_bpart+', '+irinjury_bside END) as irinjury_F 
					 FROM irinjury 
					LEFT JOIN users AS super ON irinjury.irinjury_superId = super.users_id 
					LEFT JOIN users AS foreman ON irinjury.irinjury_foremanId = foreman.users_id 
					LEFT JOIN projects ON irinjury.irinjury_projects_id = projects.projects_id WHERE irinjury.irinjury_id="+Convert.ToInt32(Request["record"].ToString());
				dbDa.Fill(ds);
				record = ds.Tables[0].Rows[0];
				
				tmpFields.Add("CheckBox2[9]", 1);
				tmpFields.Add("TextField2", record["projects_name"]);
				tmpFields.Add("TextField1[0]", record["projects_num"]);
				tmpFields.Add("Foreman", record["foreman_firstname"]+" "+record["foreman_lastname"]);
				tmpFields.Add("TextField1[1]", record["projects_phone"]);
				tmpFields.Add("TextField5", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("TextField3", record["irinjury_title"]);
				tmpFields.Add("TextField6", record["irinjury_homeaddress"]+","+record["irinjury_city"]+","+record["irinjury_zip"]);
				tmpFields.Add("TextField7", record["irinjury_phone"]);
				tmpFields.Add("TextField8", record["irinjury_ssn"]);
				if(record["irinjury_sex"].ToString()=="Male"){tmpFields.Add("CheckBox2[14]", 1);}
				if(record["irinjury_sex"].ToString()=="Female"){tmpFields.Add("CheckBox2[7]", 1);}
				tmpFields.Add("TextField10", ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("TextField9", ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("TextField14", ClearDate(record["irinjury_notice"].ToString()));
				tmpFields.Add("TextField15", ClearDate(record["irinjury_claim"].ToString()));
				tmpFields.Add("NumericField3[0]", record["irinjury_dperw"]);
				tmpFields.Add("NumericField3[1]", record["irinjury_hperw"]);
				tmpFields.Add("NumericField3[2]", record["irinjury_hperd"]);
				if(record["irinjury_otherw"].ToString()=="Female"){tmpFields.Add("CheckBox2[8]", 1);}
				else{tmpFields.Add("CheckBox2[13]", 1);}
				tmpFields.Add("TextField11", record["irinjury_wname"]);
				tmpFields.Add("TextField12", ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("TextField13", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
				tmpFields.Add("TextField23", record["irinjury_inctime"].ToString());
				if(record["irinjury_occured"].ToString()=="False"){tmpFields.Add("CheckBox2[11]", 1);}
				else{tmpFields.Add("CheckBox2[12]", 1);}
				tmpFields.Add("TextField16", record["irinjury_area"]);
				tmpFields.Add("TextField17", record["irinjury_injtype"]+", "+record["irinjury_bpart"]+", "+record["irinjury_bside"]);
				tmpFields.Add("TextField18", record["irinjury_workact"]+","+record["irinjury_events"]);
				tmpFields.Add("TextField19", record["irinjury_desc"]);
				tmpFields.Add("TextField20", record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hzip"]);
				tmpFields.Add("TextField22", record["irinjury_hospphone"]);
				tmpFields.Add("Foreman2", record["foreman_firstname"]+" "+record["foreman_lastname"]);
				tmpFields.Add("Super", record["super_firstname"]+" "+record["super_lastname"]);
				
				break ;
			case "OSHA301.pdf":
				dbDa = new SqlDataAdapter(dbCmd);
				ds = new DataSet();
				dbCmd.CommandText = @"SELECT * FROM irinjury 
					LEFT JOIN projects ON irinjury.irinjury_projects_id = projects.projects_id 
					WHERE irinjury.irinjury_id="+Convert.ToInt32(Request["record"].ToString());
				dbDa.Fill(ds);
				record = ds.Tables[0].Rows[0];
				
				tmpFields.Add("fld_1", record["irinjury_firstname"]+" "+record["irinjury_lastname"] );
				tmpFields.Add("fld_2_1", record["irinjury_homeaddress"] );
				tmpFields.Add("fld_2_2", record["irinjury_city"] );
				tmpFields.Add("fld_2_3", record["irinjury_state"] );
				tmpFields.Add("fld_2_4", record["irinjury_zip"] );
				tmpFields.Add("fld_3", ClearDate(record["irinjury_dob"].ToString()) );
				tmpFields.Add("fld_4", ClearDate(record["irinjury_doh"].ToString()) );
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("fld_5_1","Yes"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("fld_5_2","Yes"); }
				if(record["irinjury_etreat"].ToString() == "True") { tmpFields.Add("fld_8_1","Yes"); }
                if(record["irinjury_etreat"].ToString() == "False") { tmpFields.Add("fld_8_2","Yes"); }
                if(record["irinjury_hosp"].ToString() == "True") { tmpFields.Add("fld_9_1","Yes"); }
                if(record["irinjury_hosp"].ToString() == "False") { tmpFields.Add("fld_9_2","Yes"); }
				
				tmpFields.Add("fld_6", record["irinjury_301_fhname"] );
				tmpFields.Add("fld_7_1", record["irinjury_301_fname"] );
				tmpFields.Add("fld_7_2", record["irinjury_301_faddr"] );
				tmpFields.Add("fld_7_3", record["irinjury_301_fcity"] );
				tmpFields.Add("fld_7_4", record["irinjury_301_fstate"] );
				tmpFields.Add("fld_7_5", record["irinjury_301_fzip"] );
			
				tmpFields.Add("fld_10", record["irinjury_id"] );
				tmpFields.Add("fld_11", ClearDate(record["irinjury_incdate"].ToString()) );
				tmpFields.Add("fld_12", record["irinjury_timework"] );
				tmpFields.Add("fld_13_1", record["irinjury_inctime"] );
				//tmpFields.Add("fld_13_2", record["irinjury_inctime"] );
				tmpFields.Add("fld_14", record["irinjury_equipment"] +". "+ record["irinjury_workact"] );
				tmpFields.Add("fld_15", record["irinjury_desc"] );
				tmpFields.Add("fld_16", record["irinjury_injtype"]+", "+record["irinjury_bside"]+", "+record["irinjury_bpart"] );
				tmpFields.Add("fld_17", record["irinjury_events"] );
				tmpFields.Add("fld_18", record["irinjury_timed"] );
				break ;
			case "FormLS202.pdf":
				dbDa = new SqlDataAdapter(dbCmd);
				ds = new DataSet();
				dbCmd.CommandText = @"SELECT *, 
					super.users_firstname as super_firstname,
					super.users_lastname as super_lastname,
					foreman.users_firstname as foreman_firstname,
					foreman.users_lastname as foreman_lastname,
					dbo.INCRM_mddays(irinjury_id,'"+today.ToString()+@"') as transfer, 
					dbo.INCRM_totaloffdays(irinjury_id,'"+today.ToString()+@"') as away, 
					(CASE WHEN IsDate((select top 1 irinjuryDays_end FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='MD' order by irinjuryDays_begin))=1 THEN 1 ELSE 0 END) as d31, 
					(CASE WHEN irinjury_inctype='Injury' THEN 1 ELSE 0 END) as M1, 
					(CASE WHEN irinjury_inctype='Skin Disorder' THEN 1 ELSE 0 END) as M2, 
					(CASE WHEN irinjury_inctype='Respiratory Condition' THEN 1 ELSE 0 END) as M3, 
					(CASE WHEN irinjury_inctype='Poisoning' THEN 1 ELSE 0 END) as M4, 
					(CASE WHEN irinjury_inctype='Hearing Loss' THEN 1 ELSE 0 END) as M5, 
					(CASE WHEN irinjury_inctype='All other illnesses' THEN 1 ELSE 0 END) as M6, 
					(CASE WHEN irinjury_fatal=1 THEN 1 ELSE 0 END) as [fatal], 
					(CASE WHEN irinjury_return=1 THEN 1 ELSE 0 END) as [return], 
					(select top 1 irinjuryDays_begin FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as lastwork,
					(select top 1 irinjuryDays_end FROM irinjuryDays where irinjuryDays_irinjury_id=irinjury_id and irinjuryDays_type='LWD' order by irinjuryDays_begin) as returnwork,
					projects.projects_company_id, CAST(Month([irinjury_incdate]) AS varchar) + '/' + CAST(Year([irinjury_incdate]) AS varchar) AS [date], 
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_firstname+' '+irinjury_lastname END) as irinjury_name, 
					(CASE WHEN irinjury_conf=1 THEN projects_num+(CAST(MONTH(projects_datebegin) AS varchar)+CAST(DAY(projects_datebegin) AS varchar)+CAST(YEAR(projects_datebegin) AS varchar)) ELSE irinjury_injtype+', '+irinjury_bpart+', '+irinjury_bside END) as irinjury_F 
					 FROM irinjury 
					LEFT JOIN users AS super ON irinjury.irinjury_superId = super.users_id 
					LEFT JOIN users AS foreman ON irinjury.irinjury_foremanId = foreman.users_id 
					LEFT JOIN projects ON irinjury.irinjury_projects_id = projects.projects_id WHERE irinjury.irinjury_id="+Convert.ToInt32(Request["record"].ToString());
				dbDa.Fill(ds);
				record = ds.Tables[0].Rows[0];
				
				tmpFields.Add("Field1", record["irinjury_wcpnum"] );
				tmpFields.Add("Field2", record["irinjury_emplId"] );
				tmpFields.Add("Field3a", ClearDate(record["irinjury_incdate"].ToString()) );
				tmpFields.Add("Field3b", record["irinjury_inctime"] );
				tmpFields.Add("Field4a", record["irinjury_firstname"] );
				tmpFields.Add("Field4b", record["irinjury_middle"] );
				tmpFields.Add("Field4c", record["irinjury_lastname"] );
				tmpFields.Add("Field4d", record["irinjury_phone"] );
				tmpFields.Add("Field5a", record["irinjury_homeaddress"] );
				tmpFields.Add("Field5b", record["irinjury_city"] );
				tmpFields.Add("Field5c", record["irinjury_state"] );
				tmpFields.Add("Field5d", record["irinjury_zip"] );
				tmpFields.Add("Field5e", record["irinjury_phone"] );
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Field8",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Field8",2); }
				tmpFields.Add("Field9", ClearDate(record["irinjury_dob"].ToString()) );
				tmpFields.Add("Field10", record["irinjury_ssn"] );
                if(record["fatal"].ToString() == "0") { tmpFields.Add("Field11",1); }
                if(record["fatal"].ToString() == "1") { tmpFields.Add("Field11",2); }
				tmpFields.Add("Field13a", ClearDate(record["lastwork"].ToString()) );
				tmpFields.Add("Field15a", record["irinjury_demplreturn"].ToString() );
				tmpFields.Add("Field15b", record["irinjury_templreturn"].ToString() );
				if(record["irinjury_occured"].ToString() == "1") { tmpFields.Add("Field17",1); }
                if(record["irinjury_occured"].ToString() == "0") { tmpFields.Add("Field17",2); }
                tmpFields.Add("Field19",record["irinjury_title"]);
                tmpFields.Add("Field24",record["irinjury_area"]);
                tmpFields.Add("Field26",record["irinjury_desc"]);
                tmpFields.Add("Field27",record["irinjury_bpart"]+", "+record["irinjury_bside"]);
                tmpFields.Add("Field32a",record["irinjury_pname"]);
                tmpFields.Add("Field32b",record["irinjury_paddress"]);
                tmpFields.Add("Field33a",record["irinjury_hospname"]);
                tmpFields.Add("Field33b",record["irinjury_haddress"]);

				if(record["irinjury_reportedact"].ToString() == "Longshore and Harbor Workers` Compensation Act") { tmpFields.Add("Field6a",1); }
				if(record["irinjury_reportedact"].ToString() == "Nonappropriated Fund Instrumentalities Act") { tmpFields.Add("Field6a",2); }
				if(record["irinjury_reportedact"].ToString() == "Outer Continental Shelf Lands Act") { tmpFields.Add("Field6a",3); }
				if(record["irinjury_reportedact"].ToString() == "Defense Base Act") { tmpFields.Add("Field6a",4); }
                tmpFields.Add("Field6b",record["irinjury_contrag"]);
                tmpFields.Add("Field6c",record["irinjury_contrnum"]);
				if(record["irinjury_whereoccur2"].ToString() == "Aboard vessel or over navigable waters") { tmpFields.Add("Field7",1); }
				if(record["irinjury_whereoccur2"].ToString() == "Pier/Wharf") { tmpFields.Add("Field7",2); }
				if(record["irinjury_whereoccur2"].ToString() == "Dry dock") { tmpFields.Add("Field7",3); }
				if(record["irinjury_whereoccur2"].ToString() == "Marine terminal") { tmpFields.Add("Field7",4); }
				if(record["irinjury_whereoccur2"].ToString() == "Building way") { tmpFields.Add("Field7",5); }
				if(record["irinjury_whereoccur2"].ToString() == "Marine railway") { tmpFields.Add("Field7",6); }
				if(record["irinjury_whereoccur2"].ToString() == "Other adjoining area") { tmpFields.Add("Field7",7); }
				if(record["irinjury_didpremises"].ToString() == "Yes") { tmpFields.Add("Field17",1); }
				if(record["irinjury_didpremises"].ToString() == "No") { tmpFields.Add("Field17",2); }
				if(record["irinjury_didinjloss"].ToString() == "Yes") { tmpFields.Add("Field12",1); }
				if(record["irinjury_didinjloss"].ToString() == "No") { tmpFields.Add("Field12",2); }
				if(record["irinjury_didstopwork"].ToString() == "Yes") { tmpFields.Add("Field14",1); }
				if(record["irinjury_didstopwork"].ToString() == "No") { tmpFields.Add("Field14",2); }
				if(record["irinjury_usualwork"].ToString() == "Yes") { tmpFields.Add("Field16",1); }
				if(record["irinjury_usualwork"].ToString() == "No") { tmpFields.Add("Field16",2); }
                tmpFields.Add("Field18",record["irinjury_deptinwhch"]);
                tmpFields.Add("Field20a",record["irinjury_paystopdate"]);
                tmpFields.Add("Field20b",record["irinjury_paystoptime"]);
				if(record["irinjury_usualworkweek_su"].ToString() == "Yes") { tmpFields.Add("Field21_1",1); }
				if(record["irinjury_usualworkweek_mo"].ToString() == "Yes") { tmpFields.Add("Field21_2",1); }
				if(record["irinjury_usualworkweek_tu"].ToString() == "Yes") { tmpFields.Add("Field21_3",1); }
				if(record["irinjury_usualworkweek_we"].ToString() == "Yes") { tmpFields.Add("Field21_4",1); }
				if(record["irinjury_usualworkweek_th"].ToString() == "Yes") { tmpFields.Add("Field21_5",1); }
				if(record["irinjury_usualworkweek_fr"].ToString() == "Yes") { tmpFields.Add("Field21_6",1); }
				if(record["irinjury_usualworkweek_sa"].ToString() == "Yes") { tmpFields.Add("Field21_7",1); }
                tmpFields.Add("Field22a",record["irinjury_firstknowdate"]);
                tmpFields.Add("Field22b",record["irinjury_firstknowtime"]);
				if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("Field23a",record["irinjury_gws"].ToString()); }
				if(record["irinjury_gwsp"].ToString() == "Daily") { tmpFields.Add("Field23b",record["irinjury_gws"].ToString()); }
				if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("Field23c",record["irinjury_gws"].ToString()); }
				if(record["irinjury_gwsp"].ToString() == "Yearly") { tmpFields.Add("Field23d",record["irinjury_gws"].ToString()); }
                tmpFields.Add("Field25",record["irinjury_gained"]);
				if(record["irinjury_hasbinauth"].ToString() == "Yes") { tmpFields.Add("Field28a",1); }
				if(record["irinjury_hasbinauth"].ToString() == "No") { tmpFields.Add("Field28a",2); }
				if(record["irinjury_ls1"].ToString() == "Yes") { tmpFields.Add("Field28b",1); }
				if(record["irinjury_ls1"].ToString() == "No") { tmpFields.Add("Field28b",2); }
                tmpFields.Add("Field29",record["irinjury_dateauth"]);
				if(record["irinjury_firsttreating"].ToString() == "Yes") { tmpFields.Add("Field30",1); }
				if(record["irinjury_firsttreating"].ToString() == "No") { tmpFields.Add("Field30",2); }
				if(record["irinjury_hasbeennot"].ToString() == "Yes") { tmpFields.Add("Field31",1); }
				if(record["irinjury_hasbeennot"].ToString() == "No") { tmpFields.Add("Field31",2); }
                tmpFields.Add("Field34a",record["irinjury_inshcarrname"]);
                tmpFields.Add("Field34b",record["irinjury_inshcarraddr"]);
                tmpFields.Add("Field35a",record["irinjury_emplrname"]);
                tmpFields.Add("Field35b",record["irinjury_emplraddr"]);
                tmpFields.Add("Field36",record["irinjury_emplrbus"]);
                tmpFields.Add("Field37",record["irinjury_emplrbusph"]);
				break ;
            case "WC_WY.pdf":
                // Employeer Information
                tmpFields.Add("emrBusinessName",record["company_name"]);
                tmpFields.Add("emrWorkCompNum",record["irinjury_wcpnum"]); 
                tmpFields.Add("emrAddress",record["company_address"]);
                //?tmpFields.Add("emrWorkCompAccNum",record["company_"]);
                tmpFields.Add("emrCity",record["company_city"]);
                tmpFields.Add("emrState",record["state_name"]);
                tmpFields.Add("emrZip",record["company_zip"]);
                tmpFields.Add("emrPhoneNum",record["company_phone"]);

                // Employee Information
                tmpFields.Add("empLastName",record["irinjury_lastname"]);
                tmpFields.Add("empFirstName",record["irinjury_firstname"]);
                tmpFields.Add("empMI",record["irinjury_middle"]);
                tmpFields.Add("EmpMailAddress",record["irinjury_homeaddress"]);
                tmpFields.Add("empCity",record["irinjury_city"]);
                tmpFields.Add("empState",record["irinjury_state"]);
                tmpFields.Add("empZip",record["irinjury_zip"]);
                tmpFields.Add("empPhoneNum",record["irinjury_phone"]);
                //?tmpFields.Add("empPhysicalAddress",record["irinjury_"]);
                //?tmpFields.Add("empCity1",record["irinjury_"]);
                //?tmpFields.Add("empState1",record["irinjury_"]);
                //?tmpFields.Add("empZip1",record["irinjury_"]);
                tmpFields.Add("empDateHired",ClearDate(record["irinjury_doh"].ToString()));
                //?tmpFields.Add("empStateHired",record["irinjury_"]); 
                //?empUSSitizen (yes/no)  
                //?tmpFields.Add("empInsNum",record["irinjury_"]);
                tmpFields.Add("empSSN",record["irinjury_ssn"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSex[0]",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSex[1]",1); }
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                //?empMarialStatus (0-3) 
                //?tmpFields.Add("empNumOfDependents",record["irinjury_"]);
                //?tmpFields.Add("empDriverLicNum",record["irinjury_"]);
                //?tmpFields.Add("empState2",record["irinjury_"]);
                //?empEducation (0-2) 

                // Wage information
                tmpFields.Add("wagWageRate",record["irinjury_gws"]);
                //wagPER (0/1/2/3) 
                if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("wagPER_H","1"); }
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("wagPERW","1"); }
                if(record["irinjury_gwsp"].ToString() == "Biweekly") { tmpFields.Add("wagPERW","1"); }
                if(record["irinjury_gwsp"].ToString() == "Month") { tmpFields.Add("wagPERM","1"); }
                tmpFields.Add("wagHoursWorkedPerDay",record["irinjury_hperd"]);
                tmpFields.Add("wagDaysWorkedPerWeek",record["irinjury_dperw"]);
                tmpFields.Add("wagOTHoursPerWeek",record["irinjury_hperw"]);
                //Paid in full... (Yes/No) 
                if(record["irinjury_paid"].ToString() == "True") { tmpFields.Add("wagPaidInFull","Yes"); }
                if(record["irinjury_paid"].ToString() == "False") { tmpFields.Add("wagPaidInFull","No"); }
                //?Do you have... (Yes/No) 

                // Injury information
                tmpFields.Add("injDateOfInjury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("injTimeOfInjury",record["irinjury_inctime"]);
                //injAMPM1 (0/1)
                tmpFields.Add("injDateOfDeath",record["irinjury_timed"]);
                tmpFields.Add("injShiftBegan",record["irinjury_timework"]);
                //injAMPM2 (0/1)
                //?tmpFields.Add("injShiftEnded",record["irinjury_"]);
                //injAMPM3 (0/1)

                tmpFields.Add("injDateEmrNotified",record["irinjury_notice"]);
                //?tmpFields.Add("injPersonContacted",record["irinjury_"]);
                //?tmpFields.Add("injContactPhoneNum",record["irinjury_"]);
                tmpFields.Add("injEmpJobTitle",record["irinjury_title"]);
                //?injEmpStatus(0/1/2/3)
                //?injTypeOfEmp(0/1/2/3)
                //?injTimeLostFromWork(Yes/No)
                //?tmpFields.Add("injEmpJobTitle",record["irinjury_"]);
                tmpFields.Add("injDateReturnToWork",ClearDate(record["returnwork"].ToString()));

                // Accident Injury information
                // Decribe the accident... 
                tmpFields.Add("accAccidentDescribe",record["irinjury_desc"]);
                tmpFields.Add("accBodySide",record["irinjury_bside"]);
                tmpFields.Add("accBodyPart",record["irinjury_bpart"]);

                //?accMachineOrVehicle(Yes/No)
                //accOccurOnPremises(Yes/No)
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("accOccurOnPremises","Yes"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("accOccurOnPremises","No"); }
                tmpFields.Add("accAccidentAddress",record["irinjury_placeaddress"]);
                tmpFields.Add("accCity",record["irinjury_placecity"]);
                tmpFields.Add("accState",record["irinjury_placestate"]);
                tmpFields.Add("accCounty",record["irinjury_area"]);
                tmpFields.Add("accWitnessName",record["irinjury_wname"]);
                //?tmpFields.Add("accWitnessPhoneNum",record["irinjury_"]);
                //?accHasPeviously(Yes/No)
                //?tmpFields.Add("accExplain", record["irinjury_"]);
                //?accWasThePrior(Yes/No)
                //?tmpFields.Add("accInWhatState", record["irinjury_"]);
                //?tmpFields.Add("accDateOfPrior", record["irinjury_"]);

                tmpFields.Add("accTreatingProvider",record["irinjury_hospname"]);
                tmpFields.Add("accAddress",record["irinjury_haddress"]);
                tmpFields.Add("accPhysicanPhoneNum",record["irinjury_hospphone"]);
                tmpFields.Add("accCity1",record["irinjury_hcity"]);
                //tmpFields.Add("accState1",record["irinjury_hsate"]);
                tmpFields.Add("accZip1",record["irinjury_hzip"]);
                //?tmpFields.Add("accDateOfExam", record["irinjury_"]);
                break;

            case "WC_WI.pdf":
                // Employee Information
                tmpFields.Add("empFirstName",record["irinjury_firstname"]);
                tmpFields.Add("empMI",record["irinjury_middle"]);
                tmpFields.Add("empLastName",record["irinjury_lastname"]);
                tmpFields.Add("empSSN",record["irinjury_ssn"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSexM",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSexF",1); }
                tmpFields.Add("empPhoneNum",record["irinjury_phone"]);
                tmpFields.Add("empStreetAddress",record["irinjury_homeaddress"]);
                tmpFields.Add("empCity",record["irinjury_city"]);
                tmpFields.Add("empState",record["state_name"]);
                tmpFields.Add("empZip",record["irinjury_zip"]);
                tmpFields.Add("empOccupation",record["irinjury_title"]);
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("empDateOfHire",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("empCounty",record["irinjury_area"]);
                tmpFields.Add("empState1",record["irinjury_placestate"]);
                tmpFields.Add("StartTime",record["irinjury_timework"]);

                // Employeer Information
                tmpFields.Add("emrBusinessName",record["company_name"]);
                //?tmpFields.Add("emrWIACCNo", record[""]);
                //?emrSelfIns (yes/no) 
                //?tmpFields.Add("emrNatureOfBusiness", record[""]);
                tmpFields.Add("emrMailingAddress",record["company_address"]);
                tmpFields.Add("emrCity",record["company_city"]);
                tmpFields.Add("emrState",record["state_name"]);
                tmpFields.Add("emrZip",record["company_zip"]);
                //?tmpFields.Add("emrInsFEIN", record[""]);
                tmpFields.Add("emrNameOfWCIns", record["insurComp_name"]);
                tmpFields.Add("emrNameAddressTPA", record["partAdmin_name"]);
                //?tmpFields.Add("emrInsFEIN", record[""]);
                //?tmpFields.Add("emrTPAFEIN", record[""]);

                // Wage information
                tmpFields.Add("wagWage",record["irinjury_gws"]);
                //wagPER (0/1/2/3) 
                if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("wagPER[0]",1); }
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("wagPER[1]",1); }
                if(record["irinjury_gwsp"].ToString() == "Month") { tmpFields.Add("wagPER[2]",1); }
                //? if (record["irinjury_gwsp"].ToString() == "Biweekly") { tmpFields.Add("wagPER[3]", 1); }

                //?wagInAddToWages (0/1/2) 
                //?tmpFields.Add("wagNoOfMeals", record["irinjury_"]);
                //?tmpFields.Add("wagNoOfDays", record["irinjury_"]);
                //?tmpFields.Add("wagAvgWeeklyAmt", record["irinjury_"]);

                //?wagIsPaidOvertime (Yes/No) 
                //?tmpFields.Add("wagOvertimeHours", record["irinjury_"]);

                //?tmpFields.Add("wagNoOfWeeks", record["irinjury_"]);
                //?tmpFields.Add("wagGrossAmount", record["irinjury_"]);
                //?tmpFields.Add("wagNoOfHrs", record["irinjury_"]);

                //?wagStartTime (0/1) 
                tmpFields.Add("wagHoursPerDay",record["irinjury_hperd"]);
                tmpFields.Add("wagHoursPerWeek",record["irinjury_hperw"]);
                tmpFields.Add("wagDaysPerWeek",record["irinjury_dperw"]);

                //?tmpFields.Add("wagHoursPerDay1", record["irinjury_"]);
                //?tmpFields.Add("wagHoursPerWeek1", record["irinjury_"]);
                //?tmpFields.Add("wagDaysPerWeek1", record["irinjury_"]);

                //wagSameWork (Yes/No) 
                if(record["irinjury_otherw"].ToString() == "True") { tmpFields.Add("wagSameWork","Yes"); }
                if(record["irinjury_otherw"].ToString() == "False") { tmpFields.Add("wagSameWork","No"); }
                //tmpFields.Add("wagHowManyPartTime",record["irinjury_inctime"]);

                // Injury information
                tmpFields.Add("injDateOfInjury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("injTimeOfInjury",record["irinjury_inctime"]);
                //injAMPM (0/1)
                tmpFields.Add("injLastDayWorked",ClearDate(record["lastwork"].ToString()));
                tmpFields.Add("injDateEmrNotified",ClearDate(record["irinjury_notice"].ToString()));
                tmpFields.Add("injDateReturnedToWork",ClearDate(record["returnwork"].ToString()));
                //?tmpFields.Add("injEstimatedDateOfReturn", record["irinjury_"]);

                //injDeath (Yes/No)
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("injDeath","Yes"); }
                if(record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("injDeath","No"); }
                tmpFields.Add("injDateOfDeath",record["irinjury_timed"]);

                //?injTimeLost (Yes/No)
                //?injOccurBecause (0/1/2/3)

                //injEmergencyRoom (Yes/No)
                if(record["irinjury_etreat"].ToString() == "True") { tmpFields.Add("injEmergencyRoom","Yes"); }
                if(record["irinjury_etreat"].ToString() == "False") { tmpFields.Add("injEmergencyRoom","No"); }
                //injHospitalized (Yes/No)
                if(record["irinjury_hosp"].ToString() == "True") { tmpFields.Add("injHospitalized","Yes"); }
                if(record["irinjury_hosp"].ToString() == "False") { tmpFields.Add("injHospitalized","No"); }
                tmpFields.Add("injNameAddressHospital",record["irinjury_hospname"] + "," + record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                //?tmpFields.Add("injCaseNumberOSHA", record["irinjury_"]);

                tmpFields.Add("injInjDescription",record["irinjury_desc"]);
                tmpFields.Add("injWhatHappened",record["irinjury_workact"] + "," + record["irinjury_events"]);
                tmpFields.Add("injWhatWasInj",record["irinjury_injtype"]);

                //tmpFields.Add("_ReportPreparedBy", record["irinjury_"]);
                //tmpFields.Add("_WorkPhoneNum", record["irinjury_"]);
                //tmpFields.Add("_Position", record["irinjury_"]);
                //tmpFields.Add("_DateSigned", record["irinjury_"]);
                break;

            case "WC_MA.pdf":
                // Employee Information
                tmpFields.Add("empLastName",record["irinjury_lastname"]);
                tmpFields.Add("empFirstName",record["irinjury_firstname"]);
                tmpFields.Add("empMI",record["irinjury_middle"]);
                tmpFields.Add("empPhoneNum",record["irinjury_phone"]);
                tmpFields.Add("empSSNNum",record["irinjury_ssn"]);
                //Sex (male/female, 0/1) 
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSex","0"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSex","1"); }

                tmpFields.Add("empAddress",record["irinjury_homeaddress"]);
                tmpFields.Add("empCity",record["irinjury_city"]);
                tmpFields.Add("empState",record["irinjury_state"]);
                tmpFields.Add("empZip",record["irinjury_zip"]);
                //?Marial status (0/1/2/3) 
                //?tmpFields.Add("empNumOfDependents", record["irinjury_"]);

                tmpFields.Add("empDateHired",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                //?tmpFields.Add("empAVGWeeklyWage", record["irinjury_"]);
                //?empWageEstAct (0/1) 

                // Employeer Information
                tmpFields.Add("emrBusinessName",record["company_name"]);
                //?tmpFields.Add("emrFederalTaxID", record[""]);
                tmpFields.Add("emrAddress",record["company_address"]);
                tmpFields.Add("emrCity",record["company_city"]);
                tmpFields.Add("emrState",record["state_name"]);
                tmpFields.Add("emrZip",record["company_zip"]);
                tmpFields.Add("emrPhoneNum",record["company_phone"]);
                //?tmpFields.Add("emrIndustryCode", record[""]);
                //?tmpFields.Add("emrWCInsuranceCarrier", record[""]);
                tmpFields.Add("emrWCPolicyNum",record["irinjury_wcpnum"]);
                //?emrSelfIns (Yes/No) 
                //?tmpFields.Add("emrSelfInsNum", record[""]);
                //?emrBusinessType(0/1/2/3/4) 
                //?tmpFields.Add("emrBusinessTypeOther", record[""]);

                // Injury information
                tmpFields.Add("injDateOfInjury",ClearDate(record["irinjury_incdate"].ToString()));
                //injPremises (Yes/No)
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("injPremises","Yes"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("injPremises","No"); }

                tmpFields.Add("injLocationOfInjury",record["irinjury_placeaddress"] + "," + record["irinjury_placecity"] + "," + record["irinjury_placezip"]);

                //tmpFields.Add("injFirstDay", record["irinjury_"]);
                //tmpFields.Add("injFifthDay", record["irinjury_"]);

                tmpFields.Add("injDateOfDeath",record["irinjury_timed"]);
                tmpFields.Add("injSourceOfInjury",record["irinjury_equipment"]);
                tmpFields.Add("injDescribeOccured",record["irinjury_workact"] + "," + record["irinjury_bpart"] + "," + record["irinjury_bside"]);

                //tmpFields.Add("injPersonToWhom", record["irinjury_"]);
                tmpFields.Add("injDateReported", ClearDate(record["irinjury_repdate"].ToString()));
                //tmpFields.Add("injDateReportedAsWorkRel", record["irinjury_"]);
                //tmpFields.Add("injCodeA", record["irinjury_"]);
                //tmpFields.Add("injBodyCodeA", record["irinjury_"]);
                //tmpFields.Add("injCodeB", record["irinjury_"]);
                //tmpFields.Add("injBodyCodeB", record["irinjury_"]);
                //tmpFields.Add("injCodeC", record["irinjury_"]);
                //tmpFields.Add("injBodyCodeC", record["irinjury_"]);
                tmpFields.Add("injWitness",record["irinjury_wname"]);
                if(record["irinjury_return"].ToString() == "True") { tmpFields.Add("injReturnedToWork","Yes"); }
                if(record["irinjury_return"].ToString() == "False") { tmpFields.Add("injReturnedToWork","No"); }
                tmpFields.Add("injDateReturnedToWork",ClearDate(record["returnwork"].ToString()));
                tmpFields.Add("injOccupation",record["irinjury_title"]);
                //?injReturnedToOccupation (Yes/No)
                //?tmpFields.Add("_Name", record["irinjury_"]);
                //?tmpFields.Add("_Title", record["irinjury_"]);
                //?tmpFields.Add("_Signature", record["irinjury_"]);
                //?tmpFields.Add("_DatePrepared", record["irinjury_"]);
				
                break;
            case "WC_ID.pdf":
                // Employeer Information
                tmpFields.Add("emrBusinessName",record["company_name"]);
                tmpFields.Add("emrAddress",record["company_address"]);
                tmpFields.Add("emrCity",record["company_city"]);
                tmpFields.Add("emrState",record["state_name"]);
                tmpFields.Add("emrZip",record["company_zip"]);
                tmpFields.Add("emrPhone",record["company_phone"]);
                tmpFields.Add("emrFax",record["company_fax"]);
                //?tmpFields.Add("emrLocationAddress", record[""]);
                //?tmpFields.Add("emrAddress1", record[""]);
                //?tmpFields.Add("emrCity1", record[""]);
                //?tmpFields.Add("emrState1", record[""]);
                //?tmpFields.Add("emrZip1", record[""]);
                tmpFields.Add("emrPolicyNumber",record["company_comppol"]);
                //?emrStatus (0-5) 
                //?emrOfficerPartner (Yes/No) 
                //?emrHouseHoldMember (Yes/No) 
                //?tmpFields.Add("emrOrgCode", record[""]);

                // Employee Information
                tmpFields.Add("empLastName",record["irinjury_lastname"]);
                tmpFields.Add("empFirstName",record["irinjury_firstname"]);
                tmpFields.Add("empAddress",record["irinjury_homeaddress"]);
                tmpFields.Add("empCity",record["irinjury_city"]);
                tmpFields.Add("empState",record["irinjury_state"]);
                tmpFields.Add("empZip",record["irinjury_zip"]);
                tmpFields.Add("empPhoneNum",record["irinjury_phone"]);
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("empClassCodeReported", record["irinjury_wcclass"]);

                //tmpFields.Add("empStateHired", record["irinjury_"]);
                tmpFields.Add("empOccupation",record["irinjury_title"]);
                tmpFields.Add("empStatus",record["irinjury_empstatus"]);
                //Sex (male/female, 0/1) 
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSex","Male"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSex","Female"); }
                tmpFields.Add("empSSN",record["irinjury_ssn"]);
                tmpFields.Add("empDateHired",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("empDateInjury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("empRegularDepartment",record["irinjury_area"]);
                //?Marial status (0/1/2/3/4) 

                // Wage information
                tmpFields.Add("wagWageRate",record["irinjury_gws"]);
                //wagPER (0/1/2/3/4) 
                if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("perH",1); }
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("perW",1); }
                if(record["irinjury_gwsp"].ToString() == "Biweekly") { tmpFields.Add("perO", 1); }
                if(record["irinjury_gwsp"].ToString() == "Month") { tmpFields.Add("perM",1); }

                tmpFields.Add("wagHoursPerWeek",record["irinjury_hperw"]);
                tmpFields.Add("wagDaysPerWeek",record["irinjury_dperw"]);
                //wagFullPay (Yes/No) 
                if(record["irinjury_paid"].ToString() == "True") { tmpFields.Add("wagFullPay[0]",1); }
                if(record["irinjury_paid"].ToString() == "False") { tmpFields.Add("wagFullPay[1]",1); }
                //wagSalaryContinue (Yes/No) 
                if(record["irinjury_salary"].ToString() == "Yes") { tmpFields.Add("wagSalaryContinue","Yes"); }
                if(record["irinjury_salary"].ToString() == "No") { tmpFields.Add("wagSalaryContinue","No"); }
                //?tmpFields.Add("wagEstimatedValue1", record["irinjury_"]);
                //?tmpFields.Add("wagEstimatedValue2", record["irinjury_"]);

                // Accident Info
                tmpFields.Add("accPlaceOfAccident",record["irinjury_placeaddress"]);
                tmpFields.Add("accCity",record["irinjury_placecity"]);
                tmpFields.Add("accState",record["irinjury_placestate"]);
                tmpFields.Add("accCounty",record["irinjury_area"]);
                //injPremises (Yes/No)
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("accPremises","Yes"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("accPremises","No"); }
                tmpFields.Add("accTimeOccured",record["irinjury_inctime"]);
                //accAMPM1 (0/1)
                tmpFields.Add("accTimeBeganWork",record["irinjury_timework"]);
                //accAMPM2 (0/1)
                tmpFields.Add("accDateLastWorked",ClearDate(record["lastwork"].ToString()));
                tmpFields.Add("accDateNotified",ClearDate(record["irinjury_notice"].ToString()));
                //?tmpFields.Add("accDateDisabilityBegan", record["irinjury_"]);
                tmpFields.Add("accDateReturnedToWork",ClearDate(record["returnwork"].ToString()));
                tmpFields.Add("accDateOfDeath",record["irinjury_timed"]);
                tmpFields.Add("accInjuryType",record["irinjury_injtype"]);
                tmpFields.Add("accPartOfBody",record["irinjury_bpart"]);
                //?accBodyPartBefore (Yes/No)
                //?tmpFields.Add("accInjuryReportedTo", record["irinjury_"]);
                tmpFields.Add("accEquipMaterUsing",record["irinjury_equipment"]);
                tmpFields.Add("accHowInjOccured",record["irinjury_workact"] + "," + record["irinjury_events"]);
                //?accMachineProduct (Yes/No)
                //?accWasSafety (Yes/No)
                //?accWasUsed (Yes/No)
                //?tmpFields.Add("accOtherThanInjWorker", record["irinjury_"]);
                //accWereOther (Yes/No)
                if(record["irinjury_otherw"].ToString() == "True") { tmpFields.Add("accWereOther","Yes"); }
                if(record["irinjury_otherw"].ToString() == "False") { tmpFields.Add("accWereOther","No"); }
                //?tmpFields.Add("accListOther", record["irinjury_"]);

                // Medical
				tmpFields.Add("medHospital", record["irinjury_pname"]+","+record["irinjury_pphone"]+","+record["irinjury_paddress"]+" / " + record["irinjury_pname2"]+","+record["irinjury_pphone2"]+","+record["irinjury_paddress2"]+" / " + record["irinjury_hospname"] + "," + record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                //medTreatment (0-5)
                //Witness (Yes/No)
                tmpFields.Add("WitnessNamePhone",record["irinjury_wname"]);
                //tmpFields.Add("_PrepNameTitle", record["irinjury_"]);
                //tmpFields.Add("_PrepPhoneNum", record["irinjury_"]);
                //tmpFields.Add("_PrepDate", record["irinjury_"]);
                break;
            case "WC_PA.pdf":
                tmpFields.Add("Social Security Number",record["irinjury_ssn"]);
                tmpFields.Add("Date Of Injury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("Employee First Name",record["irinjury_firstname"]);
                tmpFields.Add("Employee Last Name",record["irinjury_lastname"]);
                tmpFields.Add("Employee Address Line 1",record["irinjury_homeaddress"]);
                tmpFields.Add("Employee City",record["irinjury_city"]);
                tmpFields.Add("Employee State",record["irinjury_state"]);
                tmpFields.Add("Employee Postal Code",record["irinjury_zip"]);
                tmpFields.Add("Employee County","USA");
                tmpFields.Add("Employee Phone Number",record["irinjury_phone"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Male","Yes"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Female","Yes"); }
                tmpFields.Add("Employee Date Of Birth",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("Occupation Description",record["irinjury_title"]);
                tmpFields.Add("Employment Status",record["irinjury_empstatus"]);
                tmpFields.Add("Employer Name",record["company_name"]);
                tmpFields.Add("Employer Address Line 1",record["company_address"]);
                tmpFields.Add("Employer City",record["company_city"]);
                tmpFields.Add("Employer State",record["state_name"]);
                tmpFields.Add("Employer Postal Code",record["company_zip"]);
                tmpFields.Add("Employer Phone",record["company_phone"]);
                tmpFields.Add("Employer County","USA");
                tmpFields.Add("Time Employee Began Work",record["irinjury_timework"]);
                tmpFields.Add("Time Of Injury",record["irinjury_inctime"]);
                tmpFields.Add("Date Reported To Employer",record["irinjury_repdate"]);
                tmpFields.Add("Date Of Hire",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("Type of Injury",record["irinjury_injtype"]);
                tmpFields.Add("Part Of Body Injured Code",record["irinjury_bpart"]);
                tmpFields.Add("Part Of Body Injured",record["irinjury_bpart"]);
                tmpFields.Add("Nature Of Injury Code",record["irinjury_inctype"]);
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("Injury On Employer's Premises Yes","Yes"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("Injury On Employer's Premises No","Yes"); }
                tmpFields.Add("Substance Or Object",record["irinjury_equipment"]);
                tmpFields.Add("Accident Description",record["irinjury_desc"]);
                tmpFields.Add("Employee Date Of Death",record["irinjury_timed"]);
                tmpFields.Add("Physician Name",record["irinjury_pname"]);
                tmpFields.Add("Physician Address",record["irinjury_paddress"]);
                tmpFields.Add("Hospital Name",record["irinjury_hospname"]);
                tmpFields.Add("Hospital Address",record["irinjury_haddress"]);
                tmpFields.Add("Hospital City",record["irinjury_hcity"]);
                tmpFields.Add("Hospital State",record["irinjury_hsate"]);
                tmpFields.Add("Hospital Postal Code",record["irinjury_hzip"]);
                tmpFields.Add("Policy Number",record["irinjury_wcpnum"]);
                tmpFields.Add("Witness Name",record["irinjury_wname"]);
                tmpFields.Add("Third Party Administrator Name",record["insurComp_name"]);
                tmpFields.Add("Claim Administrator Address Line 1",record["insurComp_address"]);
                tmpFields.Add("Claim Administrator City",record["insurComp_city"]);
                tmpFields.Add("Claim Administrator State",record["insurComp_state"]);
                tmpFields.Add("Claim Administrator Postal Code",record["insurComp_zip"]);
                break;
            case "WC_NC.pdf":
                tmpFields.Add("lastname",record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
                tmpFields.Add("empphone",record["irinjury_phone"]);
                tmpFields.Add("addr1",record["irinjury_homeaddress"]);
                tmpFields.Add("city",record["irinjury_city"]);
                tmpFields.Add("state",record["irinjury_state"]);
                tmpFields.Add("zip",record["irinjury_zip"]);
                tmpFields.Add("idnum",record["irinjury_ssn"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("sex","M"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("sex","F"); }
                tmpFields.Add("birthdate",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("empname",record["company_name"]);
                tmpFields.Add("empaddr1",record["company_address"]);
                tmpFields.Add("empcity",record["company_city"]);
                tmpFields.Add("empstate",record["state_name"]);
                tmpFields.Add("empzip",record["company_zip"]);
                tmpFields.Add("carrname",record["insurComp_name"]);
                tmpFields.Add("carraddr1",record["insurComp_address"]);
                tmpFields.Add("carrcity",record["insurComp_city"]);
                tmpFields.Add("carrstate",record["insurComp_state"]);
                tmpFields.Add("carrzip",record["insurComp_zip"]);
                tmpFields.Add("carrphone",record["insurComp_phone"]);
                tmpFields.Add("injlocation",record["projects_num"]+", "+record["projects_name"]);
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("isemppremises","Yes"); }
                tmpFields.Add("date_of_injury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("supervisor",record["super_firstname"]+" "+record["super_lastname"]);
                tmpFields.Add("notifydate",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("wageperhr",record["irinjury_gws"]);
                tmpFields.Add("daysperweek",record["irinjury_hperd"]);
                tmpFields.Add("injoccur",record["irinjury_events"]);
                tmpFields.Add("injdesc",record["irinjury_bpart"]+" "+record["irinjury_bside"]);
                tmpFields.Add("rtnoccup",record["irinjury_title"]);
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("plaintdied","Yes"); }
                tmpFields.Add("plaintdieddate",record["irinjury_timed"]);
                tmpFields.Add("signemp",record["company_name"]);
                tmpFields.Add("oshacasenum",record["irinjury_id"]);
                tmpFields.Add("hiredate",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("oschastarttime",record["irinjury_timework"]);
                tmpFields.Add("treatfacility",record["irinjury_hospname"]);
                tmpFields.Add("treataddr1",record["irinjury_haddress"]+" "+record["irinjury_hcity"]+" "+record["irinjury_hsate"]+" "+record["irinjury_hzip"]);
                break;
            case "WC_CO.pdf":
                tmpFields.Add("Employee First Name",record["irinjury_firstname"]);
                tmpFields.Add("Employee Last Name",record["irinjury_lastname"]);
                tmpFields.Add("Employee Middle Initial",record["irinjury_middle"]);
                tmpFields.Add("Social Security Number",record["irinjury_ssn"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Male","Yes"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Female","Yes"); }
                tmpFields.Add("Employee Phone",record["irinjury_phone"]);
                tmpFields.Add("Employee Address Line 1",record["irinjury_homeaddress"]);
                tmpFields.Add("Employee City",record["irinjury_city"]);
                tmpFields.Add("Employee State",record["irinjury_state"]);
                tmpFields.Add("Employee Postal Code",record["irinjury_zip"]);
                tmpFields.Add("Osha Case Number",record["irinjury_id"]);
                tmpFields.Add("Employee Date Of Birth",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("Date Of Hire",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("Occupation Description",record["irinjury_title"]);
                if(record["irinjury_empstatus"].ToString() == "Full time") { tmpFields.Add("Full Time Yes","Yes"); }
                if(record["irinjury_empstatus"].ToString() == "Part-Time") { tmpFields.Add("Part Time Yes","Yes"); }
                if(record["irinjury_empstatus"].ToString() == "Temporary") { tmpFields.Add("Employment Type Other Yes","Yes"); }
                if(record["irinjury_empstatus"].ToString() == "Seasonal") { tmpFields.Add("Employment Type Other Yes","Yes"); }
                if(record["irinjury_empstatus"].ToString() == "") { tmpFields.Add("Employment Type Unknown Yes","Yes"); }
                tmpFields.Add("Employer Name",record["company_name"]);
                tmpFields.Add("Employer Phone",record["company_phone"]);
                tmpFields.Add("Employer Address Line 1",record["company_address"]);
                tmpFields.Add("Employer City",record["company_city"]);
                tmpFields.Add("Employer State",record["state_name"]);
                tmpFields.Add("Employer Postal Code",record["company_zip"]);
                tmpFields.Add("Wage",record["irinjury_gws"]);
                tmpFields.Add("Date Of Injury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("Time Employee Began Work",record["irinjury_timework"]);
                tmpFields.Add("Time Of Injury",record["irinjury_inctime"]);
                tmpFields.Add("Date Last Day Worked",record["lastwork"]);
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("Dead","Yes"); }
                if(record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("Alive","Yes"); }
                tmpFields.Add("Employee Date Of Death",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("Part Of Body Injured Code",record["irinjury_bpart"]);
                tmpFields.Add("Nature Of Injury Code",record["irinjury_injtype"]);
                tmpFields.Add("Pre Accident Activity",record["irinjury_workact"]);
                tmpFields.Add("Accident Description",record["irinjury_events"]);
                tmpFields.Add("Substance Or Object",record["irinjury_equipment"]);
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("Employers Premises Indicator Yes","Yes"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("Employers Premises Indicator No","Yes"); }
                if(record["irinjury_hosp"].ToString() == "True") { tmpFields.Add("Hospitalized Overnight Yes","Yes"); }
                if(record["irinjury_hosp"].ToString() == "False") { tmpFields.Add("Hospitalized Overnight No","Yes"); }
                tmpFields.Add("Witness Name",record["irinjury_wname"]);
                tmpFields.Add("Physician Name",record["irinjury_pname"] + "," + record["irinjury_paddress"]);
                tmpFields.Add("Hospital Name",record["irinjury_hospname"] + "," + record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                tmpFields.Add("Insurer Name",record["insurComp_name"]);
                tmpFields.Add("Insurer Address",record["insurComp_address"]);
                tmpFields.Add("Third Party Administrator Name",record["partAdmin_name"]);
                tmpFields.Add("Claim Administrator Address Line 1",record["partAdmin_address"]);
                tmpFields.Add("Adjuster Name",record["adjuster_firstname"]+","+record["adjuster_lastname"]);
                break;
            case "WC_OR2.pdf":
                tmpFields.Add("empDateOfInjury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("empDateLetWork",record["lastwork"]);
                tmpFields.Add("empTimeBeganWork",record["irinjury_timework"]);
                tmpFields.Add("empTimeOfInjury",record["irinjury_inctime"]);
                //?tmpFields.Add("empTimeLetWork", record["irinjury_"]);
                tmpFields.Add("empInjury",record["irinjury_injtype"]);
                tmpFields.Add("empPartOfBody",record["irinjury_bpart"]);
                tmpFields.Add("empSide",record["irinjury_bside"]);
                tmpFields.Add("empWhatCausedIt",record["irinjury_desc"]);

                tmpFields.Add("empLastName",record["irinjury_firstname"] + "," + record["irinjury_lastname"]);
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSex[0]",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSex[1]",1); }
                tmpFields.Add("empMailAddress",record["irinjury_homeaddress"] + "," + record["irinjury_city"] + "," + record["irinjury_zip"]);
                tmpFields.Add("empHomePhone",record["irinjury_phone"]);
                tmpFields.Add("empSSN",record["irinjury_ssn"]);
                tmpFields.Add("empOccupation",record["irinjury_title"]);
                tmpFields.Add("empNameOfWitnesses",record["irinjury_wname"]);

                tmpFields.Add("empNamePhysican",record["irinjury_pname"]);
                tmpFields.Add("empMedicalTreat",record["irinjury_hospname"] + "," + record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                if(record["irinjury_hosp"].ToString() == "True") { tmpFields.Add("empHospitalized[0]",1); }
                if(record["irinjury_hosp"].ToString() == "False") { tmpFields.Add("empHospitalized[1]",1); }
                if(record["irinjury_etreat"].ToString() == "Yes") { tmpFields.Add("empEmergencyRoom[0]",1); }
                if(record["irinjury_etreat"].ToString() == "No") { tmpFields.Add("empEmergencyRoom[1]",1); }

                tmpFields.Add("emrBusinessName",record["company_name"]);
                tmpFields.Add("emrPhoneNum",record["company_phone"]);
                tmpFields.Add("emrAddressOfPrincPlace",record["company_address"] + "," + record["company_city"]);
                tmpFields.Add("emrZIP",record["company_zip"]);
                tmpFields.Add("emrAddressEvent",record["irinjury_placeaddress"] + "," + record["irinjury_placecity"] + "," + record["irinjury_placezip"]);
                if(record["irinjury_otherw"].ToString() == "True") { tmpFields.Add("emrWhereOther[0]",1); }
                if(record["irinjury_otherw"].ToString() == "False") { tmpFields.Add("emrWhereOther[1]",1); }
                tmpFields.Add("emrDateReturnedToWork",record["returnwork"]);
                tmpFields.Add("emrWeeklyWage",record["irinjury_gws"]);
                tmpFields.Add("DateHired",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("DateDeath",record["irinjury_timed"]);
                break;
// VG new 10-02-2009
            case "WC_HA.pdf":
                tmpFields.Add("Text1", record["irinjury_lastname"]);
                tmpFields.Add("Text2", record["irinjury_firstname"]);
                tmpFields.Add("Text3", record["irinjury_middle"]);
                tmpFields.Add("Text4", record["irinjury_ssn"]);
                tmpFields.Add("Text5", ClearDate(record["irinjury_dob"].ToString()));
                if (record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Ch1[0]", 1); }
                if (record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Ch1[1]", 1); }
                tmpFields.Add("Text7", record["irinjury_homeaddress"]);
                tmpFields.Add("Text9", record["irinjury_city"]);
                tmpFields.Add("Text11", record["irinjury_zip"]);
                tmpFields.Add("Text12", record["irinjury_phone"]);
                tmpFields.Add("Text13", record["irinjury_title"]);
                tmpFields.Add("Text14", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("Text15", record["irinjury_area"]);
                tmpFields.Add("Text16", record["irinjury_wcclass"]);
                tmpFields.Add("Text18", record["company_name"]);
                tmpFields.Add("Text20", record["company_address"]);
                tmpFields.Add("Text21", record["company_city"]);
                tmpFields.Add("Text23", record["company_zip"]);
                tmpFields.Add("Text24", record["company_phone"]);
                tmpFields.Add("Text26", record["irinjury_date"]);
                tmpFields.Add("Text27", ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("Text29", record["irinjury_inctime"]);
                tmpFields.Add("Text31", record["irinjury_placeaddress"]);
                tmpFields.Add("Text32", record["irinjury_placecity"]);
                if (record["irinjury_occured"].ToString() == "True") { tmpFields.Add("Ch7[0]", 1); }
                if (record["irinjury_occured"].ToString() == "False") { tmpFields.Add("Ch7[1]", 1); }
                tmpFields.Add("Text36", record["irinjury_desc"]);
                tmpFields.Add("Text37", record["irinjury_workact"] + "," + record["irinjury_events"]);
                tmpFields.Add("Text38", record["irinjury_equipment"]);
                if (record["irinjury_paid"].ToString() == "True") { tmpFields.Add("Ch11[0]", 1); }
                if (record["irinjury_paid"].ToString() == "False") { tmpFields.Add("Ch11[1]", 1); }
                tmpFields.Add("Text44", record["irinjury_gws"]);
                tmpFields.Add("Text45", record["irinjury_hperw"]);
                tmpFields.Add("Text46", record["irinjury_pname"]);
                tmpFields.Add("Text47", record["irinjury_paddress"]);
                tmpFields.Add("Text48", record["irinjury_hospname"]);
                tmpFields.Add("Text49", record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                break;
            case "WC_MT.pdf":
                tmpFields.Add("worLastName", record["irinjury_lastname"]);
                tmpFields.Add("worFirstName", record["irinjury_firstname"]);
                tmpFields.Add("worMI", record["irinjury_middle"]);
                tmpFields.Add("worSSN", record["irinjury_ssn"]);
                tmpFields.Add("worDateOfBirth", ClearDate(record["irinjury_dob"].ToString()));
				if (record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("worChkGender", 0); }
                if (record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("worChkGender", 1); }
                if (record["irinjury_sex"].ToString() == "Unknown") { tmpFields.Add("worChkGender", 2); }
                tmpFields.Add("worHomeAddress", record["irinjury_homeaddress"]);
                tmpFields.Add("worCity", record["irinjury_city"]);
                tmpFields.Add("worState", record["irinjury_state"]);
                tmpFields.Add("worPostalCode", record["irinjury_zip"]);
                tmpFields.Add("worPhoneNumber", record["irinjury_phone"]);
                // Wages
                tmpFields.Add("wagDateHired", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("wagWage", record["irinjury_gws"]);
                tmpFields.Add("wagNumberOfDaysPerWeek", record["irinjury_dperw"]);
                tmpFields.Add("wagTimeEmpBeganWork", record["irinjury_timework"]);
                tmpFields.Add("wagDateLastWorked", ClearDate(record["lastwork"].ToString()));
                tmpFields.Add("wagDateOfReturnedTotWork", ClearDate(record["returnwork"].ToString()));
				if(record["irinjury_empstatus"].ToString()=="Full time"){tmpFields.Add("wagChkStatus", 0);}
				if(record["irinjury_empstatus"].ToString()=="Part-Time"){tmpFields.Add("wagChkStatus", 1);}
				if(record["irinjury_empstatus"].ToString()=="Temporary"){tmpFields.Add("wagChkStatus", 5);}
				if(record["irinjury_empstatus"].ToString()=="Seasonal"){tmpFields.Add("wagChkStatus", 2);}
                if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("wagChkPeriod",0); }
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("wagChkPeriod",2); }
                if(record["irinjury_gwsp"].ToString() == "Biweekly") { tmpFields.Add("wagChkPeriod", 2); }
                if(record["irinjury_gwsp"].ToString() == "Month") { tmpFields.Add("wagChkPeriod",3); }

                if(record["irinjury_paid"].ToString() == "True") { tmpFields.Add("wagChkFullWages", "Yes"); }
                if(record["irinjury_paid"].ToString() == "False") { tmpFields.Add("wagChkFullWages","No"); }
                if(record["irinjury_salary"].ToString() == "Yes") { tmpFields.Add("wagChkSalary", "Yes"); }
                if(record["irinjury_salary"].ToString() == "No") { tmpFields.Add("wagChkSalary","No"); }
                // Accident description
                tmpFields.Add("accDescriptionOfAccident", record["irinjury_workact"] + "," + record["irinjury_events"]);
                //tmpFields.Add("Text38", record["irinjury_equipment"]);
                //tmpFields.Add("Text15", record["irinjury_area"]);
                //tmpFields.Add("Text15", record["irinjury_wcclass"]);
                tmpFields.Add("accJobTitle", record["irinjury_title"]);
                tmpFields.Add("accCaseOfInjury", record["irinjury_causetype"]);
                tmpFields.Add("accPartOfBody", record["irinjury_bpart"]); 
                tmpFields.Add("accNatureOfInjury", record["irinjury_injtype"]);
                tmpFields.Add("accDateOfInjury", ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("accTimeOfInjury", record["irinjury_inctime"]);
                tmpFields.Add("accDateOfDearth", record["irinjury_timed"]);
                tmpFields.Add("accNameOfWitnesses1", record["irinjury_wname"]);
                if (record["irinjury_occured"].ToString() == "True") { tmpFields.Add("accChkPremises", "Yes"); }
                if (record["irinjury_occured"].ToString() == "False") { tmpFields.Add("accChkPremises", "No"); }
                tmpFields.Add("accAddressCity", record["irinjury_placecity"]);
                tmpFields.Add("accAddressState", record["irinjury_placestate"]);
				tmpFields.Add("accAddressPostalCode", record["irinjury_placezip"]);
                tmpFields.Add("accDateEmployersNotified", ClearDate(record["irinjury_notice"].ToString()));
                // Medical
                tmpFields.Add("accAttendingPhysName", record["irinjury_pname"]);
                tmpFields.Add("accAttendingAddress", record["irinjury_paddress"]);
                tmpFields.Add("accAttendingPhoneNumber", record["irinjury_pphone"]);
                tmpFields.Add("accHospitalName", record["irinjury_hospname"]);
                tmpFields.Add("accHospitalAddress", record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                tmpFields.Add("accHospitalState", record["irinjury_hsate"]);
                tmpFields.Add("accHospitalPostalCode", record["irinjury_hzip"]);
                tmpFields.Add("accHospitalPhoneNumber", record["irinjury_hospphone"]);
                // Employer
                tmpFields.Add("empEmployerName", record["company_name"]);
                tmpFields.Add("empMailingAddress", record["company_address"]);
                tmpFields.Add("empCity", record["company_city"]);
                tmpFields.Add("empPostalCode", record["company_zip"]);
                tmpFields.Add("empPhoneNumber", record["company_phone"]);
                tmpFields.Add("insInsurerName", record["insurComp_name"]);
				
                break;
            case "WC_TX.pdf":
                tmpFields.Add("Text3", record["irinjury_lastname"] + "," + record["irinjury_firstname"] + "," + record["irinjury_middle"]);
                if (record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Ch2", "Yes"); }
                if (record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Ch1", "0"); }
                tmpFields.Add("Text4", record["irinjury_ssn"]);
                tmpFields.Add("Text5", record["irinjury_phone"]);
                tmpFields.Add("Text6", ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("Text8", record["irinjury_homeaddress"]);
                tmpFields.Add("Text9", record["irinjury_city"]);
                tmpFields.Add("Text10", record["irinjury_state"]);
                tmpFields.Add("Text11", record["irinjury_zip"]);
                tmpFields.Add("Text15", record["irinjury_hospname"]);
                tmpFields.Add("Text16", record["irinjury_haddress"]);
                tmpFields.Add("Text17", record["irinjury_hcity"]);
                //tmpFields.Add("Text18", record["irinjury_hsate"]);
                tmpFields.Add("Text19", record["irinjury_hzip"]); 
                tmpFields.Add("Text20", ClearDate(record["irinjury_incdate"].ToString())); 
                tmpFields.Add("Text21", record["irinjury_inctime"]);
                tmpFields.Add("Text22", record["lastwork"]);
                tmpFields.Add("Text23", record["irinjury_injtype"]);
                tmpFields.Add("Text24", record["irinjury_bpart"]); 
                tmpFields.Add("Text25", record["irinjury_workact"] + "," + record["irinjury_events"]);
                tmpFields.Add("Text26", record["irinjury_area"]);
                tmpFields.Add("Text27", record["irinjury_placeaddress"]);
                tmpFields.Add("Text30", record["irinjury_placecity"]);
                //tmpFields.Add("Text31", record["irinjury_placestate"]);
                tmpFields.Add("Text32", record["irinjury_placezip"]);   
                tmpFields.Add("Text33", record["irinjury_causetype"]);
                tmpFields.Add("Text34", record["irinjury_wname"]);
                tmpFields.Add("Tex35", ClearDate(record["returnwork"].ToString()));          
                if (record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("Ch20", "Yes"); }
                if (record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("Ch21", "Yes"); }
                tmpFields.Add("Text37", ClearDate(record["irinjury_repdate"].ToString()));
                tmpFields.Add("Text38", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("Text43", record["irinjury_wcclass"]);
                tmpFields.Add("Text44", record["irinjury_title"]);   
                tmpFields.Add("Text46", record["irinjury_gws"]);  
                tmpFields.Add("Text47", record["irinjury_hperw"]);
                tmpFields.Add("Text48", record["irinjury_dperw"]);     
                tmpFields.Add("Text53", record["company_name"]);
                tmpFields.Add("Text54", record["company_address"]);
                tmpFields.Add("Text55", record["company_phone"]);               
                tmpFields.Add("Text57", record["company_city"]);                
                tmpFields.Add("Text59", record["company_zip"]);
                tmpFields.Add("Text67", record["insurComp_name"]);
                break;
            case "WC_WA.pdf":
                // Employee Information
                tmpFields.Add("empFirstName",record["irinjury_firstname"]);
                tmpFields.Add("empMI",record["irinjury_middle"]);
                tmpFields.Add("empLastName",record["irinjury_lastname"]);
                tmpFields.Add("empSSN",record["irinjury_ssn"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("empSexM",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("empSexF",1); }
                tmpFields.Add("empPhoneNum",record["irinjury_phone"]);
                tmpFields.Add("empStreetAddress",record["irinjury_homeaddress"]);
                tmpFields.Add("empCity",record["irinjury_city"]);
                tmpFields.Add("empState",record["state_name"]);
                tmpFields.Add("empZip",record["irinjury_zip"]);
                tmpFields.Add("empOccupation",record["irinjury_title"]);
                tmpFields.Add("empDateOfBirth",ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("empDateOfHire",ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("empCounty",record["irinjury_area"]);
                tmpFields.Add("empState1",record["irinjury_placestate"]);
                tmpFields.Add("StartTime",record["irinjury_timework"]);

                // Employeer Information
                tmpFields.Add("emrBusinessName",record["company_name"]);
                //?tmpFields.Add("emrWIACCNo", record[""]);
                //?emrSelfIns (yes/no) 
                //?tmpFields.Add("emrNatureOfBusiness", record[""]);
                tmpFields.Add("emrMailingAddress",record["company_address"]);
                tmpFields.Add("emrCity",record["company_city"]);
                tmpFields.Add("emrState",record["state_name"]);
                tmpFields.Add("emrZip",record["company_zip"]);
                //?tmpFields.Add("emrInsFEIN", record[""]);
                tmpFields.Add("emrNameOfWCIns", record["insurComp_name"]);
                //?tmpFields.Add("emrInsFEIN", record[""]);
                tmpFields.Add("emrNameAddressTPA", record["partAdmin_name"]);
                //?tmpFields.Add("emrTPAFEIN", record[""]);

                // Wage information
                tmpFields.Add("wagWage",record["irinjury_gws"]);
                //wagPER (0/1/2/3) 
                if(record["irinjury_gwsp"].ToString() == "Hour") { tmpFields.Add("wagPER_H",1); }
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("wagPER_W",1); }
                if(record["irinjury_gwsp"].ToString() == "Month") { tmpFields.Add("wagPER_M",1); }
                //? if (record["irinjury_gwsp"].ToString() == "Biweekly") { tmpFields.Add("wagPER[3]", 1); }

                //?wagInAddToWages (0/1/2) 
                //?tmpFields.Add("wagNoOfMeals", record["irinjury_"]);
                //?tmpFields.Add("wagNoOfDays", record["irinjury_"]);
                //?tmpFields.Add("wagAvgWeeklyAmt", record["irinjury_"]);

                //?wagIsPaidOvertime (Yes/No) 
                //?tmpFields.Add("wagOvertimeHours", record["irinjury_"]);

                //?tmpFields.Add("wagNoOfWeeks", record["irinjury_"]);
                //?tmpFields.Add("wagGrossAmount", record["irinjury_"]);
                //?tmpFields.Add("wagNoOfHrs", record["irinjury_"]);

                //?wagStartTime (0/1) 
                tmpFields.Add("wagHoursPerDay",record["irinjury_hperd"]);
                tmpFields.Add("wagHoursPerWeek",record["irinjury_hperw"]);
                tmpFields.Add("wagDaysPerWeek",record["irinjury_dperw"]);

                //?tmpFields.Add("wagHoursPerDay1", record["irinjury_"]);
                //?tmpFields.Add("wagHoursPerWeek1", record["irinjury_"]);
                //?tmpFields.Add("wagDaysPerWeek1", record["irinjury_"]);

                //wagSameWork (Yes/No) 
                //?tmpFields.Add("wagHowManyPartTime", record["irinjury_"]);
                //?tmpFields.Add("wagHowManyFullTime", record["irinjury_"]);

                // Injury information
                tmpFields.Add("injDateOfInjury",ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("injTimeOfInjury",record["irinjury_inctime"]);
                //injAMPM (0/1)
                tmpFields.Add("injLastDayWorked",ClearDate(record["lastwork"].ToString()));
                tmpFields.Add("injDateEmrNotified",ClearDate(record["irinjury_notice"].ToString()));
                tmpFields.Add("injDateReturnedToWork",ClearDate(record["returnwork"].ToString()));
                //?tmpFields.Add("injEstimatedDateOfReturn", record["irinjury_"]);

                //injDeath (Yes/No)
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("injDeathY",1); }
                if(record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("injDeathN",1); }
                tmpFields.Add("injDateOfDeath",record["irinjury_timed"]);

                //?injTimeLost (Yes/No)
                //?injOccurBecause (0/1/2/3)

                //injEmergencyRoom (Yes/No)
                if(record["irinjury_etreat"].ToString() == "Yes") { tmpFields.Add("injEmergencyRoomY",1); }
                if(record["irinjury_etreat"].ToString() == "No") { tmpFields.Add("injEmergencyRoomN",1); }
                //injHospitalized (Yes/No)
                if(record["irinjury_hosp"].ToString() == "Yes") { tmpFields.Add("injHospitalized[0]",1); }
                if(record["irinjury_hosp"].ToString() == "No") { tmpFields.Add("injHospitalized[1]",1); }
                tmpFields.Add("injNameAddressHospital",record["irinjury_hospname"] + "," + record["irinjury_haddress"] + "," + record["irinjury_hcity"] + "," + record["irinjury_hzip"]);
                //?tmpFields.Add("injCaseNumberOSHA", record["irinjury_"]);

                tmpFields.Add("injInjDescription",record["irinjury_desc"]);
                tmpFields.Add("injWhatHappened",record["irinjury_workact"] + "," + record["irinjury_events"]);
                tmpFields.Add("injWhatWasInj",record["irinjury_injtype"]);

                //tmpFields.Add("_ReportPreparedBy", record["irinjury_"]);
                //tmpFields.Add("_WorkPhoneNum", record["irinjury_"]);
                //tmpFields.Add("_Position", record["irinjury_"]);
                //tmpFields.Add("_DateSigned", record["irinjury_"]);
				break;
            case "WC_IL.pdf":
                tmpFields.Add("Date_of_report[0]", ClearDate(record["irinjury_repdate"].ToString()));
                tmpFields.Add("Employer_name[0]", record["company_name"]);
                tmpFields.Add("Employers_mailing_address[0]", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
                tmpFields.Add("PolicyContract[0]", record["irinjury_wcpnum"]);
                tmpFields.Add("Birthdate[0]", ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("Employee_full_name[0]", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
                tmpFields.Add("Employees_mailing_address[0]", record["irinjury_homeaddress"]+", "+record["irinjury_city"]+", "+record["state_name"]+", "+record["irinjury_zip"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Male[0]","v"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Female[0]","v"); }
                tmpFields.Add("Employees_average_weekly_wage[0]", record["irinjury_gws"]);
                tmpFields.Add("Job_title_or_occupation[0]", record["irinjury_title"]);
                tmpFields.Add("Date_hired[0]", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("Date_and_time_of_accident[0]",  ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("If_the_employee_died_as_a_result_of_the_accident_give_the_date_of_death[0]", record["irinjury_timed"]);
                tmpFields.Add("Address_of_accident[0]", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
                tmpFields.Add("What_was_the_employee_doing_when_the_acc_occurred[0]", record["irinjury_workact"]);
                tmpFields.Add("How_did_the_accident_occur[0]", record["irinjury_desc"]);
                tmpFields.Add("What_was_injury_or_illness_part_of_body[0]", record["irinjury_inctype"]+", "+record["irinjury_bpart"]+", "+record["irinjury_bside"]);
                tmpFields.Add("What_object_or_substance_harmed_the_employee[0]", record["irinjury_equipment"]);
                tmpFields.Add("Name_and_address_of_physician[0]", record["irinjury_pname"]+","+record["irinjury_paddress"]);
				
				break;
			case "WC_SC.pdf":
				tmpFields.Add("EMPLOYER_NAME__ADDRESS_INCL_ZIP[0]", record["company_name"]+","+record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
				tmpFields.Add("NAME_LAST_FIRST_MIDDLE[0]", record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("ADDRESS_INCL_ZIP[0]", record["irinjury_homeaddress"]+", "+record["irinjury_city"]+", "+record["state_name"]+", "+record["irinjury_zip"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("Male[0]",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("Female[0]",1); }
                tmpFields.Add("DATE_OF_BIRTH[0]", ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("DATE_HIRED[0]", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("OCCUPATIONJOB_TITLE[0]", record["irinjury_title"]);
                tmpFields.Add("rate[0]", record["irinjury_hperd"]);
                if(record["irinjury_gwsp"].ToString() == "Week") { tmpFields.Add("WEEK","On"); }
                tmpFields.Add("DAYS_WORKEDWEEK[0]", record["irinjury_dperw"]);
                tmpFields.Add("time[0]", record["irinjury_timework"]);
                tmpFields.Add("DOI[0]", ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("time2[0]", record["irinjury_inctime"]);
                tmpFields.Add("TYPE_OF_INJURYILLNESS[0]", record["irinjury_injtype"]);
                tmpFields.Add("PART_OF_BODY_AFFECTED[0]", record["irinjury_bpart"]+","+record["irinjury_bside"]);
                tmpFields.Add("DEPARTMENT_OR_LOCATION_WHERE_ACCIDENT_OR_ILLNESS_EXPOSURE_OCCURRED[0]", record["projects_name"]);
                tmpFields.Add("SPECIFIC_ACTIVITY_THE_EMPLOYEE_WAS_ENGAGED_IN_WHEN_THE_ACCIDENT_OR_ILLNESS_EXPOSURE_OCCURRED[0]", record["irinjury_workact"]);
                tmpFields.Add("DOD[0]", record["irinjury_timed"]);
                tmpFields.Add("PHYSICIANHEALTH_CARE_PROVIDER_NAME__ADDRESS[0]", record["irinjury_pname"]+","+record["irinjury_paddress"]+","+record["irinjury_301_fname"]+","+record["irinjury_301_faddr"]+","+record["irinjury_301_fcity"]+","+record["irinjury_301_fstate"]+","+record["irinjury_301_fzip"]);
                tmpFields.Add("HOSPITAL_OR_OFF_SITE_TREATMENT_NAME__ADDRESS[0]", record["irinjury_hospname"]+","+record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hsate"]+","+record["irinjury_hzip"]);
                tmpFields.Add("WITNESSES_NAME__PHONE[0]", record["irinjury_whitn"]);
                tmpFields.Add("DATE_ADMINISTRATOR_NOTIFIED[0]", ClearDate(record["irinjury_notice"].ToString()));
			
				break ;
            case "WC_VT.pdf":
                tmpFields.Add("_1_Legal_Name[0]", record["company_name"]);
                tmpFields.Add("_3_Mail_Address__No_and_Street_City_State_Zip[0]", record["company_address"]+","+record["company_city"]+","+record["company_zip"]);
                tmpFields.Add("_5_Telephone_Number_Extension_and_Contact_Person[0]", record["company_phone"]);
                tmpFields.Add("Employee_First_Name[0]", record["irinjury_firstname"]);
                tmpFields.Add("Last_Name[0]", record["irinjury_lastname"]);
                tmpFields.Add("_11_Date_of_Birth[0]", ClearDate(record["irinjury_dob"].ToString()));
                tmpFields.Add("_12_Home_Address__No_and_Street[0]", record["irinjury_homeaddress"]);
                tmpFields.Add("City[0]", record["irinjury_city"]);
                tmpFields.Add("_13_Home_Phone_No[0]", record["irinjury_phone"]);
                tmpFields.Add("State[0]", record["state_name"]);
                tmpFields.Add("Zip[0]", record["irinjury_zip"]);
                tmpFields.Add("_16_Job_Title[0]", record["irinjury_title"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("M[0]","v"); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("F[0]","v"); }
                tmpFields.Add("_18_Wages__Per[0]", record["irinjury_gws"]);
                tmpFields.Add("per[0]", record["irinjury_gwsp"]);
                tmpFields.Add("Hours_Per_Day[0]", record["irinjury_hperd"]);
                tmpFields.Add("Days_Per_Week[0]", record["irinjury_dperw"]);
                tmpFields.Add("_21_Date_of_Hire[0]", ClearDate(record["irinjury_doh"].ToString()));
                tmpFields.Add("_22_Date_of_Accident[0]", ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("Accident_Time_AM[0]", record["irinjury_inctime"]);
                //tmpFields.Add("Accident_Time_Pm[0]", ClearDate(record["irinjury_incdate"].ToString()));
                tmpFields.Add("_23_Location_of_Accident__Town_or_City_State[0]", record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placezip"]);
                tmpFields.Add("_24_Machine_tool_object_motor_vehicle_or_substance_directly_causing_injury[0]", record["irinjury_equipment"]);
                if(record["irinjury_occured"].ToString() == "True") { tmpFields.Add("_25_On_employers_premises[0]","v"); }
                if(record["irinjury_occured"].ToString() == "False") { tmpFields.Add("Yes_3[0]","v"); }
                tmpFields.Add("_26_Describe_what_employee_was_doing[0]", record["irinjury_events"]);
                tmpFields.Add("_27_How_did_accident_occur_Describe_events_leading_up_to_the_accident[0]", record["irinjury_desc"]);
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("_32_Did_injury_result_in_death[0]","v"); }
                if(record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("Yes_6[0]","v"); }
                tmpFields.Add("If_yes_date_of_death[0]", record["irinjury_timed"]);
                tmpFields.Add("_33_Name_and_address_of_Physician[0]", record["irinjury_pname"]+","+record["irinjury_paddress"]);
                tmpFields.Add("_34_Name_and_address_of_Hospital[0]", record["irinjury_hospname"]+","+record["irinjury_haddress"]+","+record["irinjury_hcity"]+","+record["irinjury_hsate"]+","+record["irinjury_hzip"]);
                tmpFields.Add("Text4[0]", record["insurComp_name"]);
                tmpFields.Add("Text5[0]", record["irinjury_wcpnum"]);
				
                break;
            case "WC_NY.pdf":
                tmpFields.Add("form1[0].P1[0].TextField2[0]",ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("form1[0].P1[0].TextField2[1]",ClearDate(record["irinjury_repdate"].ToString()));
				tmpFields.Add("form1[0].P1[0].employer[0]",record["company_name"]);
				tmpFields.Add("form1[0].P1[0].empAddress[0]",record["company_address"]+", "+record["company_city"]+", "+record["state_name"]+", "+record["company_zip"]);
				tmpFields.Add("form1[0].P1[0].name[0]",record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("form1[0].P1[0].TextField2[6]",ClearDate(record["irinjury_dob"].ToString()));
				tmpFields.Add("form1[0].P1[0].mailingAddress[0]",record["irinjury_homeaddress"]+", "+record["irinjury_city"]+", "+record["state_name"]+", "+record["irinjury_zip"]);
                if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("form1[0].P1[0].CheckBoxMale[0]",1); }
                if(record["irinjury_sex"].ToString() == "Female") { tmpFields.Add("form1[0].P1[0].CheckBoxFemale[0]",1); }
				tmpFields.Add("form1[0].P1[0].onsetDate[0]",record["irinjury_timework"]);
				tmpFields.Add("form1[0].P1[0].onsetDate[1]",record["irinjury_inctime"]);
				tmpFields.Add("form1[0].P1[0].TextField2[11]",record["super_firstname"]+" "+record["super_lastname"]);
				tmpFields.Add("form1[0].P1[0].TextField1[0]",record["irinjury_workact"]);
				tmpFields.Add("form1[0].P1[0].agentPhone[0]",record["irinjury_wcpnum"]);
				tmpFields.Add("form1[0].P1[0].TextField2[7]",record["irinjury_phone"]);
				tmpFields.Add("form1[0].P1[0].TextField1[2]",record["irinjury_placeaddress"]+","+record["irinjury_placecity"]+","+record["irinjury_placestate"]+","+record["irinjury_placezip"]);
                if(record["irinjury_wname"].ToString() == "Yes") { tmpFields.Add("form1[0].P2[0].witnessYes[0]",1); }
                if(record["irinjury_wname"].ToString() == "No") { tmpFields.Add("form1[0].P2[0].witnessNo[0]",1); }
				tmpFields.Add("form1[0].P1[0].TextField1[3]",record["irinjury_whitn"]);
				
				tmpFields.Add("form1[0].P2[0].employeeName[0]",record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("form1[0].P2[0].TextField2[0]",ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("form1[0].P2[0].TextField1[3]",record["irinjury_desc"]);
				tmpFields.Add("form1[0].P2[0].TextField1[2]",record["irinjury_inctype"]+", "+record["irinjury_bpart"]+", "+record["irinjury_bside"]);
                if(record["irinjury_fatal"].ToString() == "True") { tmpFields.Add("form1[0].P2[0].deathYes[0]",1); }
                if(record["irinjury_fatal"].ToString() == "False") { tmpFields.Add("form1[0].P2[0].deathNo[0]",1); }

				tmpFields.Add("form1[0].P3[0].employeeName[0]",record["irinjury_firstname"]+" "+record["irinjury_lastname"]);
				tmpFields.Add("form1[0].P3[0].TextField2[0]",ClearDate(record["irinjury_incdate"].ToString()));
				tmpFields.Add("form1[0].P3[0].TextField2[1]",ClearDate(record["irinjury_doh"].ToString()));
				tmpFields.Add("form1[0].P3[0].jobTitle[0]",record["irinjury_title"]);
				tmpFields.Add("form1[0].P3[0].TextField1[7]",record["irinjury_workact"]);
				tmpFields.Add("form1[0].P3[0].grossPay[0]",record["irinjury_gws"]);
				if(record["irinjury_empstatus"].ToString()=="Full time"){tmpFields.Add("form1[0].P3[0].CheckBoxFullTime[0]", 1);}
				if(record["irinjury_empstatus"].ToString()=="Part-Time"){tmpFields.Add("form1[0].P3[0].CheckBoxPartTime[0]", 1);}
				if(record["irinjury_empstatus"].ToString()=="Temporary"){tmpFields.Add("form1[0].P3[0].CheckBoxOther[0]", 1);}
				if(record["irinjury_empstatus"].ToString()=="Seasonal"){tmpFields.Add("form1[0].P3[0].CheckBoxSeasonal[0]", 1);}
				if(record["irinjury_empstatus"].ToString()=="Full time"){tmpFields.Add("form1[0].P3[0].fullDayYes[0]", 1);}
				if(record["irinjury_empstatus"].ToString()!="Full time"){tmpFields.Add("form1[0].P3[0].fullDayNo[0]", 1);}
				
                break;
			case "ESIS_Auto.pdf":
				dbDa = new SqlDataAdapter(dbCmd);
				ds = new DataSet();
				dbCmd.CommandText = @"SELECT * 
				    FROM irincident
					LEFT JOIN projects ON irincident_projects_id = projects.projects_id 
					WHERE irincident_id="+Convert.ToInt32(Request["record"].ToString());
				dbDa.Fill(ds);
				record = ds.Tables[0].Rows[0];
				
                tmpFields.Add("f0",ClearDate(record["irincident_incdate"].ToString()));
				tmpFields.Add("f1", record["irincident_inctime"] );
				tmpFields.Add("f4", record["irincident_insclaim"] );
				tmpFields.Add("f6", record["irincident_arep"] );
				tmpFields.Add("f7", record["projects_num"]+", "+record["projects_name"] );
			   //if(record["irinjury_sex"].ToString() == "Male") { tmpFields.Add("f5","Yes"); }

				break ;
			case "7000-1.pdf":
				tmpFields.Add("topmostSubform[0].Page1[0].MSHAID[0]",record["irinjury_mine_mshaid"]);
				tmpFields.Add("topmostSubform[0].Page1[0].CTRID[0]",record["irinjury_mine_contrid"]);
                if(record["irinjury_mine_cat"].ToString() == "Metal/Nonmetal Mining") { tmpFields.Add("topmostSubform[0].Page1[0].rptcat[0]","Yes"); }
                if(record["irinjury_mine_cat"].ToString() == "Coal Mining") { tmpFields.Add("topmostSubform[0].Page1[0].rptcat[0]","No"); }
				tmpFields.Add("topmostSubform[0].Page1[0].MineName[0]",record["projects_num"]+", "+record["projects_name"]);
				tmpFields.Add("topmostSubform[0].Page1[0].CompName[0]",record["company_name"]);
				
                if(record["irinjury_mine_cod"].ToString().IndexOf("01 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","01"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("02 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","02"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("03 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","03"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("04 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","04"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("05 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","05"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("06 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","06"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("07 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","07"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("08 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","08"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("09 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","09"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("10 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","10"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("11 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","11"); }
                if(record["irinjury_mine_cod"].ToString().IndexOf("12 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].accode[0]","12"); }
				
				tmpFields.Add("topmostSubform[0].Page1[0].investname[0]",record["irinjury_mine_invname"]);
				tmpFields.Add("topmostSubform[0].Page1[0].month[0]",ClearDate(record["irinjury_mine_invdate"].ToString(),"month"));
				tmpFields.Add("topmostSubform[0].Page1[0].day[0]",ClearDate(record["irinjury_mine_invdate"].ToString(),"day"));
				tmpFields.Add("topmostSubform[0].Page1[0].year[0]",ClearDate(record["irinjury_mine_invdate"].ToString(),"year"));
				tmpFields.Add("topmostSubform[0].Page1[0].steps[0]",record["irinjury_mine_steps"]);
				
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("02 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","02"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("30 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","30"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("03 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","03"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("04 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","04"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("05 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","05"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("06 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","06"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("12 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","12"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("17 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","17"); }
                if(record["irinjury_mine_surfloc"].ToString().IndexOf("99 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].surf1[0]","99"); }
                
				if(record["irinjury_mine_undloc"].ToString().IndexOf("01 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","01"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("02 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","02"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("03 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","03"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("04 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","04"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("05 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","05"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("06 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[0]","06"); }
				if(record["irinjury_mine_undloc"].ToString().IndexOf("07 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug1[1]","06"); }
                
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("01 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","01"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("02 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","02"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("03 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","03"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("04 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","04"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("05 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","05"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("06 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","06"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("07 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","07"); }
				if(record["irinjury_mine_undmeth"].ToString().IndexOf("08 ")>=0) { tmpFields.Add("topmostSubform[0].Page1[0].ug2[0]","08"); }
				
				if(record["irinjury_mine_ocupilln"].ToString()=="Dust Diseases of the Lungs") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","22"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Respiratory Conditions (toxic agents)") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","23"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Occupational Skin Diseases") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","21"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Poisoning (toxic Materials)") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","24"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Disorders (physical agents)") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","25"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Disorders (repeated trauma)") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","26"); }
				if(record["irinjury_mine_ocupilln"].ToString()=="Other") { tmpFields.Add("topmostSubform[0].Page1[0].occcode[0]","29"); }
				
				tmpFields.Add("topmostSubform[0].Page1[0].month2[0]",ClearDate(record["irinjury_incdate"].ToString(),"month"));
				tmpFields.Add("topmostSubform[0].Page1[0].day2[0]",ClearDate(record["irinjury_incdate"].ToString(),"day"));
				tmpFields.Add("topmostSubform[0].Page1[0].year2[0]",ClearDate(record["irinjury_incdate"].ToString(),"year"));
				
				string _time = record["irinjury_inctime"].ToString();
				if(_time.Length>0 && _time.IndexOf(":")>0){
					int _t = Int32.Parse(_time.Split(':')[0]);
					if(_t>13 || _time.IndexOf("PM")>0 || _time.IndexOf("pm")>0){
						tmpFields.Add("topmostSubform[0].Page1[0].time2[0]",record["irinjury_inctime"]);
					}else{
						tmpFields.Add("topmostSubform[0].Page1[0].time1[0]",record["irinjury_inctime"]);
					}
				}
				_time = record["irinjury_timework"].ToString();
				if(_time.Length>0 && _time.IndexOf(":")>0){
					int _t = Int32.Parse(_time.Split(':')[0]);
					if(_t>13 || _time.IndexOf("PM")>0 || _time.IndexOf("pm")>0){
						tmpFields.Add("topmostSubform[0].Page1[0].time4[0]",record["irinjury_timework"]);
					}else{
						tmpFields.Add("topmostSubform[0].Page1[0].time3[0]",record["irinjury_timework"]);
					}
				}
				
				
				tmpFields.Add("topmostSubform[0].Page1[0].desc1[0]",record["irinjury_desc"]);
				
				tmpFields.Add("topmostSubform[0].Page1[0].equiptype[0]",record["irinjury_mine_uqinv"]);
				tmpFields.Add("topmostSubform[0].Page1[0].equiptype2[0]",record["irinjury_mine_uqtype"]);
				tmpFields.Add("topmostSubform[0].Page1[0].equipmfg[0]",record["irinjury_mine_uqmanuf"]);
				tmpFields.Add("topmostSubform[0].Page1[0].modnum[0]",record["irinjury_mine_uqmodel"]);
				
				tmpFields.Add("topmostSubform[0].Page1[0].witness[0]",record["irinjury_whitn"]);
				tmpFields.Add("topmostSubform[0].Page1[0].injemp[0]",record["irinjury_lastname"].ToString()+' '+record["irinjury_firstname"].ToString());
				tmpFields.Add("topmostSubform[0].Page1[0].sex[0]",record["irinjury_sex"]);
				tmpFields.Add("topmostSubform[0].Page1[0].month3[0]",ClearDate(record["irinjury_dob"].ToString(),"month"));
				tmpFields.Add("topmostSubform[0].Page1[0].day3[0]",ClearDate(record["irinjury_dob"].ToString(),"day"));
				tmpFields.Add("topmostSubform[0].Page1[0].year3[0]",ClearDate(record["irinjury_dob"].ToString(),"year"));
				tmpFields.Add("topmostSubform[0].Page1[0].jobtitle[0]",record["irinjury_title"]);
				if(record["irinjury_fatal"].ToString()=="True") { tmpFields.Add("topmostSubform[0].Page1[0].death[1]","Yes"); }
				if(record["irinjury_q7"].ToString()=="Yes") { tmpFields.Add("topmostSubform[0].Page1[0].death[0]","No"); }
				tmpFields.Add("topmostSubform[0].Page1[0].inflict[0]",record["irinjury_causeby"]);
				tmpFields.Add("topmostSubform[0].Page1[0].Nature[0]",record["irinjury_injtype"]);
				tmpFields.Add("topmostSubform[0].Page1[0].Bodypart[0]",record["irinjury_bpart"].ToString()+' '+record["irinjury_bside"].ToString());
				tmpFields.Add("topmostSubform[0].Page1[0].activity[0]",record["irinjury_workact"]);
				tmpFields.Add("topmostSubform[0].Page1[0].rptnum[0]",record["irinjury_relatednum"]);
				if(record["irinjury_q10"].ToString()=="Yes") { tmpFields.Add("topmostSubform[0].Page1[0].Permtrans[0]","No"); }
				
				tmpFields.Add("topmostSubform[0].Page1[0].years5[0]",record["irinjury_mine_exp1y"]);
				tmpFields.Add("topmostSubform[0].Page1[0].weeks5[0]",record["irinjury_mine_exp1w"]);
				tmpFields.Add("topmostSubform[0].Page1[0].years5b[0]",record["irinjury_mine_exp2y"]);
				tmpFields.Add("topmostSubform[0].Page1[0].weeks5b[0]",record["irinjury_mine_exp2w"]);
				tmpFields.Add("topmostSubform[0].Page1[0].years5c[0]",record["irinjury_mine_exp3y"]);
				tmpFields.Add("topmostSubform[0].Page1[0].weeks5c[0]",record["irinjury_mine_exp3w"]);
				
				if(record["returnday"].ToString().Length>0){
					tmpFields.Add("topmostSubform[0].Page1[0].month6[0]",ClearDate(record["returnday"].ToString(),"month"));
					tmpFields.Add("topmostSubform[0].Page1[0].day6[0]",ClearDate(record["returnday"].ToString(),"day"));
					tmpFields.Add("topmostSubform[0].Page1[0].year6[0]",ClearDate(record["returnday"].ToString(),"year"));
				}
				
				tmpFields.Add("topmostSubform[0].Page1[0].daysoff[0]",record["S_totaloffdays3"]);
				tmpFields.Add("topmostSubform[0].Page1[0].daysrest[0]",record["S_mddays3"]);

				break ;
			case "Acord_form11.pdf":
                tmpFields.Add("TextField22",ClearDate(record["irincident_incdate"].ToString()));
				tmpFields.Add("Time11", record["irincident_inctime"] );
				if(record["irincident_inctime"].ToString().IndexOf("AM")>=0) { tmpFields.Add("Time11AM", 1 ); }
				if(record["irincident_inctime"].ToString().IndexOf("PM")>=0) { tmpFields.Add("Time11PM", 1 ); }
				tmpFields.Add("TextFieldMultiline_18", record["irincident_area"] );
				tmpFields.Add("TextFieldMultiline_14", record["irincident_desc"] );
				tmpFields.Add("TextFieldMultiline_17", record["irincident_acontr"]+", "+record["irincident_arep"] );
				tmpFields.Add("TextFieldMultiline_13", record["irincident_veh2model"]+", "+record["irincident_veh2make"]+", "+record["irincident_veh2year"]+", "+record["irincident_veh2plate"] );
				tmpFields.Add("TextFieldMultiline_22", record["irincident_owner"] );
				tmpFields.Add("TelephoneNumber_8", record["irincident_drphone"] );
				tmpFields.Add("TextFieldMultiline_9", record["irincident_drname2"]+", "+record["irincident_draddr"] );
				tmpFields.Add("TextField_3", record["irincident_drlic"] );
				tmpFields.Add("TextFieldMultiline_10", record["irincident_vehdamag"] );
				tmpFields.Add("TextFieldMultiline_19", record["irincident_inj1name"]+", "+record["irincident_inj1addr"] );
				tmpFields.Add("TelephoneNumber_10", record["irincident_inj1phone"] );
				tmpFields.Add("TextField_7", record["irincident_inj1age"] );
				tmpFields.Add("TextFieldMultiline_6", record["irincident_inj1inj"] );
				tmpFields.Add("TextFieldMultiline_24", record["irincident_inj2name"]+", "+record["irincident_inj2addr"] );
				tmpFields.Add("TelephoneNumber_11", record["irincident_inj2phone"] );
				tmpFields.Add("TextField_8", record["irincident_inj2age"] );
				tmpFields.Add("TextFieldMultiline_7", record["irincident_inj2inj"] );
				tmpFields.Add("Year", record["irincident_equip"] );
				tmpFields.Add("TextField_10", record["irincident_vmodel"] );
				tmpFields.Add("TextField_9", "" );
				tmpFields.Add("TextFieldMultiline_2", record["irincident_oname"] );
				tmpFields.Add("TextFieldMultiline_3", record["irincident_drname"]+", "+record["irincident_vehaddr"] );
				tmpFields.Add("TelephoneNumber_5", record["irincident_vehphone"] );
				tmpFields.Add("TextField23", ClearDate(record["irincident_dofb"].ToString()) );
				tmpFields.Add("TextField21", record["irincident_lic"] );
				tmpFields.Add("TextField_6", record["irincident_ins2name2"] );
				tmpFields.Add("TextField_5", record["irincident_ins2pol"] );
				tmpFields.Add("TextField_4", record["irincident_ins2name1"] );
				tmpFields.Add("TextFieldMultiline_1", record["irincident_vdamage"] );
				break ;
            default:
				Response.Write("<br>WCReport N/A for this State");
				Response.End();
				break;

		}
		// Generate PDF from Template
		pdf.ParseAndFillForm(templatePath, file, tmpFields);

	}
}