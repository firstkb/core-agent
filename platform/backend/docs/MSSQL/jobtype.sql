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

 Date: 12/04/2026 17:27:04
*/


-- ----------------------------
-- Table structure for jobtype
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[jobtype]') AND type IN ('U'))
	DROP TABLE [dbo].[jobtype]
GO

CREATE TABLE [dbo].[jobtype] (
  [jobtype_id] int  IDENTITY(1,1) NOT NULL,
  [jobtype_rowstamp] timestamp  NULL,
  [jobtype_name] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [jobtype_act] bit DEFAULT 1 NOT NULL,
  [jobtype_guid] uniqueidentifier DEFAULT newid() NOT NULL
)
GO

ALTER TABLE [dbo].[jobtype] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of jobtype
-- ----------------------------
BEGIN TRANSACTION
GO

SET IDENTITY_INSERT [dbo].[jobtype] ON
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'1', 0x000000000000AF4D, N'Administrator', N'1', N'C958D6DE-4F54-4EBA-B35C-DB5D43D05722')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'2', 0x000000000000ABFC, N'Superintendent', N'1', N'7971035D-5F9D-432E-8D72-3063B1E19F18')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'3', 0x000000000000AF9F, N'Foreman', N'1', N'4CC0A3C2-11CC-40D0-B64B-0D3D9F124AC9')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'4', 0x000000000000ABFE, N'Project Manager', N'1', N'1D4967E1-E42C-415A-924E-B375068E4328')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'5', 0x000000000000ABFF, N'Director of Operations Safety & Security', N'1', N'BFF032C2-6BE9-42B8-A4DB-F3E6135BD044')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'6', 0x000000000000AC01, N'Chief of Safety & Security', N'1', N'A1286BAF-D56F-4F43-857F-371EF3CF1750')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'7', 0x000000000000AC02, N'Safety Director', N'1', N'CC76766E-010C-4D0D-99AD-5A361D1F4CEF')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'8', 0x000000000000AC03, N'Safety Manager', N'1', N'85E799EF-294F-4A32-8586-16F4E73E68AC')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'9', 0x000000000000AC04, N'Field Safety Manager', N'1', N'5F0EEC54-2DD3-4914-A636-01FAA2EE3730')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'11', 0x000000000000AFC6, N'Test', N'0', N'D5539C0E-6A26-40C6-80D8-5948892314C8')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'12', 0x000000000000B02C, N'test22', N'1', N'3696841A-F86F-4887-A822-F82628035E0C')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'13', 0x000000000000B024, N'Test333', N'0', N'BFA031D5-4EFD-4624-A60F-65C9D32F3A92')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'14', 0x000000000000B071, N'test44', N'0', N'5A2F3415-A55B-4B33-BAD2-5433848903D2')
GO

INSERT INTO [dbo].[jobtype] ([jobtype_id], [jobtype_rowstamp], [jobtype_name], [jobtype_act], [jobtype_guid]) VALUES (N'18', 0x000000000000B07A, N'test46', N'0', N'36F53BC2-4190-422B-9E39-ED433D4DFD5E')
GO

SET IDENTITY_INSERT [dbo].[jobtype] OFF
GO

COMMIT
GO


-- ----------------------------
-- Auto increment value for jobtype
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[jobtype]', RESEED, 18)
GO


-- ----------------------------
-- Indexes structure for table jobtype
-- ----------------------------
CREATE NONCLUSTERED INDEX [jobtype_act]
ON [dbo].[jobtype] (
  [jobtype_act] ASC
)
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_jobtype_guid]
ON [dbo].[jobtype] (
  [jobtype_guid] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table jobtype
-- ----------------------------
ALTER TABLE [dbo].[jobtype] ADD CONSTRAINT [PK__jobtype__4F4B76E6EE17C56A] PRIMARY KEY CLUSTERED ([jobtype_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

