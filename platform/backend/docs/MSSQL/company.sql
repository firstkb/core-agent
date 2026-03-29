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

 Date: 29/03/2026 12:27:55
*/


-- ----------------------------
-- Table structure for company
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[company]') AND type IN ('U'))
	DROP TABLE [dbo].[company]
GO

CREATE TABLE [dbo].[company] (
  [company_id] int  IDENTITY(1,1) NOT NULL,
  [company_rowstamp] timestamp  NULL,
  [company_act] bit DEFAULT 1 NOT NULL,
  [company_address] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_address2] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_city] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_comppol] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_fax] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_name] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_phone] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_state_id] int  NULL,
  [company_unempol] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_url] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_type] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_zip] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_email] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_maincomp] int  NULL,
  [company_desc] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_vendor] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_tax] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_liaison] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_key] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_premium] int  NULL,
  [company_safpol] nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_TimeZone] nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_guid] uniqueidentifier  NULL,
  [company_demo] bit  NULL,
  [company_contactname] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_naic] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_product] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_num] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_recgroup] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_geo] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_connumber] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [company_joined] datetime  NULL
)
GO

ALTER TABLE [dbo].[company] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for company
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[company]', RESEED, 15)
GO


-- ----------------------------
-- Indexes structure for table company
-- ----------------------------
CREATE NONCLUSTERED INDEX [company_act]
ON [dbo].[company] (
  [company_act] ASC
)
GO

CREATE NONCLUSTERED INDEX [company_name]
ON [dbo].[company] (
  [company_name] ASC
)
GO

CREATE NONCLUSTERED INDEX [company_guid]
ON [dbo].[company] (
  [company_guid] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table company
-- ----------------------------
ALTER TABLE [dbo].[company] ADD CONSTRAINT [PK__company__3E2672352229FD39] PRIMARY KEY CLUSTERED ([company_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

