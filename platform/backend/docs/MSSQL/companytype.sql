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

 Date: 29/03/2026 12:29:24
*/


-- ----------------------------
-- Table structure for companytype
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[companytype]') AND type IN ('U'))
	DROP TABLE [dbo].[companytype]
GO

CREATE TABLE [dbo].[companytype] (
  [companytype_id] int  IDENTITY(1,1) NOT NULL,
  [companytype_rowstamp] timestamp  NULL,
  [companytype_name] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [companytype_risk] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[companytype] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for companytype
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[companytype]', RESEED, 7)
GO


-- ----------------------------
-- Primary Key structure for table companytype
-- ----------------------------
ALTER TABLE [dbo].[companytype] ADD CONSTRAINT [PK__companyt__E35182A247136687] PRIMARY KEY CLUSTERED ([companytype_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

