/*
 Navicat Premium Data Transfer

 Source Server         : Docker local
 Source Server Type    : SQL Server
 Source Server Version : 16004095 (16.00.4095)
 Source Host           : localhost:1433
 Source Catalog        : 103-1047-3
 Source Schema         : dbo

 Target Server Type    : SQL Server
 Target Server Version : 16004095 (16.00.4095)
 File Encoding         : 65001

 Date: 29/03/2026 12:28:20
*/


-- ----------------------------
-- Table structure for projects
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type IN ('U'))
	DROP TABLE [dbo].[projects]
GO

CREATE TABLE [dbo].[projects] (
  [projects_id] int  IDENTITY(1,1) NOT NULL,
  [projects_rowstamp] timestamp  NULL,
  [projects_user] int  NULL,
  [projects_date] datetime  NULL,
  [projects_act] bit DEFAULT 1 NOT NULL,
  [projects_address] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_address2] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_city] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_phone] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_fax] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_mail] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_company_id] int  NULL,
  [projects_contractor] int  NULL,
  [projects_datebegin] datetime  NULL,
  [projects_dateend] datetime  NULL,
  [projects_desc] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_info] nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_name] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_num] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_projectsstatus_id] int  NULL,
  [projects_state_id] int  NULL,
  [projects_url] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_value] money  NULL,
  [projects_zip] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_ocip] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_medfac8] int  NULL,
  [projects_medfac24] int  NULL,
  [projects_glocip] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_glbid] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_wcocip] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_wcbid] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_status] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_year] nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_pc] nvarchar(4) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_rate] nvarchar(2) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_type] nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_detailer] int  NULL,
  [projects_estimator] int  NULL,
  [projects_salesp] int  NULL,
  [projects_sov] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_estnum] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_estweight] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_fiunit] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_averate] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_camount] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_detunit] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_mrg] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_gamount] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_gmanhr] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_grate] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_lettersent] datetime  NULL,
  [projects_complete] datetime  NULL,
  [projects_contact] int  NULL,
  [projects_ptvender] int  NULL,
  [projects_sub] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_ve] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_payroll] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_applied] datetime  NULL,
  [projects_approved] datetime  NULL,
  [projects_pinnam] nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_pinncost] nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_pinnmarg] nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_pinnpr] nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_pcode] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_OHP] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_prman] int  NULL,
  [projects_psuper] int  NULL,
  [projects_psafrep] int  NULL,
  [projects_tar] int  NULL,
  [projects_subcontr] int  NULL,
  [projects_guid] uniqueidentifier  NULL,
  [projects_demo] bit  NULL,
  [projects_NAICSCode] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_inddesc] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_size] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_avg] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [projects_geocode] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[projects] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for projects
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[projects]', RESEED, 3)
GO


-- ----------------------------
-- Indexes structure for table projects
-- ----------------------------
CREATE NONCLUSTERED INDEX [projects_user]
ON [dbo].[projects] (
  [projects_user] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_date]
ON [dbo].[projects] (
  [projects_date] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_act]
ON [dbo].[projects] (
  [projects_act] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_company_id]
ON [dbo].[projects] (
  [projects_company_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_name]
ON [dbo].[projects] (
  [projects_name] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_num]
ON [dbo].[projects] (
  [projects_num] ASC
)
GO

CREATE NONCLUSTERED INDEX [projects_guid]
ON [dbo].[projects] (
  [projects_guid] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table projects
-- ----------------------------
ALTER TABLE [dbo].[projects] ADD CONSTRAINT [PK__projects__B40CD6DA1733699E] PRIMARY KEY CLUSTERED ([projects_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

