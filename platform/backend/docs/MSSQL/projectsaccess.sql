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

 Date: 29/03/2026 12:28:32
*/


-- ----------------------------
-- Table structure for projectsaccess
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[projectsaccess]') AND type IN ('U'))
	DROP TABLE [dbo].[projectsaccess]
GO

CREATE TABLE [dbo].[projectsaccess] (
  [projectsaccess_id] int  IDENTITY(1,1) NOT NULL,
  [projectsaccess_rowstamp] timestamp  NULL,
  [projectsaccess_projects_id] int  NULL,
  [projectsaccess_users_id] int  NULL,
  [projectsaccess_role] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[projectsaccess] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for projectsaccess
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[projectsaccess]', RESEED, 41)
GO


-- ----------------------------
-- Primary Key structure for table projectsaccess
-- ----------------------------
ALTER TABLE [dbo].[projectsaccess] ADD CONSTRAINT [PK__projects__EC5FDF60775E2FE4] PRIMARY KEY CLUSTERED ([projectsaccess_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

