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

 Date: 29/03/2026 12:27:35
*/


-- ----------------------------
-- Table structure for users
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type IN ('U'))
	DROP TABLE [dbo].[users]
GO

CREATE TABLE [dbo].[users] (
  [users_id] int  IDENTITY(1,1) NOT NULL,
  [users_rowstamp] timestamp  NULL,
  [users_tourread] bit  NULL,
  [users_access] bit  NULL,
  [users_act] bit DEFAULT 1 NOT NULL,
  [users_admin] bit  NULL,
  [users_company_id] int  NULL,
  [users_date] datetime  NULL,
  [users_dob] datetime  NULL,
  [users_email] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_firstname] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_lastname] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_middlename] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_mobilephone] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pager] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_password] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_phone] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_title] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_username] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_supervisor] int  NULL,
  [users_foreman] int  NULL,
  [users_desc] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_hiredate] datetime  NULL,
  [users_rehiredate] datetime  NULL,
  [users_lastwork] datetime  NULL,
  [users_termwork] datetime  NULL,
  [users_sex] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_num] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pcode] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_last] datetime  NULL,
  [users_lastModule] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_lastAction] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_lastPage] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_lastWizard] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_TimeZone] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_address] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_city] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_state] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_zip] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_ssn] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pwddate] datetime  NULL,
  [users_terms] bit  NULL,
  [users_pwdchanged] int  NULL,
  [users_demo] bit  NULL,
  [users_status] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_reason] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_occupation] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_salery] money  NULL,
  [users_saleryper] money  NULL,
  [users_systemid] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_auth] int  NULL,
  [users_sysid] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_site] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_usersid] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_etsadmin] int  NULL,
  [users_1027_super] int  NULL,
  [users_1042_dep] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_1042_super2] int  NULL,
  [users_1042_super3] int  NULL,
  [users_1042_super1] int  NULL,
  [users_wccode] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_wcdesc] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pushapp] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pushacc] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_covidcheck] bit  NULL,
  [users_honorific] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_pincode] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_codes] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [users_guid] uniqueidentifier DEFAULT newid() NOT NULL
)
GO

ALTER TABLE [dbo].[users] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for users
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[users]', RESEED, 1043)
GO


-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE NONCLUSTERED INDEX [users_act]
ON [dbo].[users] (
  [users_act] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_admin]
ON [dbo].[users] (
  [users_admin] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_company_id]
ON [dbo].[users] (
  [users_company_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_firstname]
ON [dbo].[users] (
  [users_firstname] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_lastname]
ON [dbo].[users] (
  [users_lastname] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_middlename]
ON [dbo].[users] (
  [users_middlename] ASC
)
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_users_guid]
ON [dbo].[users] (
  [users_guid] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_auth]
ON [dbo].[users] (
  [users_auth] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_etsadmin]
ON [dbo].[users] (
  [users_etsadmin] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_1042_super2]
ON [dbo].[users] (
  [users_1042_super2] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_1042_super3]
ON [dbo].[users] (
  [users_1042_super3] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_1042_super1]
ON [dbo].[users] (
  [users_1042_super1] ASC
)
GO

CREATE NONCLUSTERED INDEX [users_guid]
ON [dbo].[users] (
  [users_guid] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE [dbo].[users] ADD CONSTRAINT [PK__users__EAA7D14BCC2B51CD] PRIMARY KEY CLUSTERED ([users_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

