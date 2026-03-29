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

 Date: 29/03/2026 12:29:09
*/


-- ----------------------------
-- Table structure for mails
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[mails]') AND type IN ('U'))
	DROP TABLE [dbo].[mails]
GO

CREATE TABLE [dbo].[mails] (
  [mails_id] int  IDENTITY(1,1) NOT NULL,
  [mails_rowstamp] timestamp  NULL,
  [mails_users_id] int  NULL,
  [mails_date] datetime  NULL,
  [mails_timezone] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_from] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_to] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_cc] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_bcc] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_subject] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_body] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_who] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_files] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_urls] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_table] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [mails_recid] int  NULL
)
GO

ALTER TABLE [dbo].[mails] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for mails
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[mails]', RESEED, 1149)
GO


-- ----------------------------
-- Indexes structure for table mails
-- ----------------------------
CREATE NONCLUSTERED INDEX [mails_users_id]
ON [dbo].[mails] (
  [mails_users_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [mails_recid]
ON [dbo].[mails] (
  [mails_recid] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table mails
-- ----------------------------
ALTER TABLE [dbo].[mails] ADD CONSTRAINT [PK__mails__9ADEBD484AD7F028] PRIMARY KEY CLUSTERED ([mails_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

