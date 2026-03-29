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

 Date: 29/03/2026 12:27:07
*/


-- ----------------------------
-- Table structure for events
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[events]') AND type IN ('U'))
	DROP TABLE [dbo].[events]
GO

CREATE TABLE [dbo].[events] (
  [events_id] int  IDENTITY(1,1) NOT NULL,
  [events_rowstamp] timestamp  NULL,
  [events_date] datetime  NULL,
  [events_event] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_module] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_record] int  NULL,
  [events_table] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_text] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_time] datetime  NULL,
  [events_timezone] nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_users_id] int  NULL,
  [events_users_ip] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_to] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_subject] nvarchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_body] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_files] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL,
  [events_urls] nvarchar(max) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[events] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for events
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[events]', RESEED, 7323)
GO


-- ----------------------------
-- Indexes structure for table events
-- ----------------------------
CREATE NONCLUSTERED INDEX [events_event]
ON [dbo].[events] (
  [events_event] ASC
)
GO

CREATE NONCLUSTERED INDEX [events_module]
ON [dbo].[events] (
  [events_module] ASC
)
GO

CREATE NONCLUSTERED INDEX [events_record]
ON [dbo].[events] (
  [events_record] ASC
)
GO

CREATE NONCLUSTERED INDEX [events_table]
ON [dbo].[events] (
  [events_table] ASC
)
GO

CREATE NONCLUSTERED INDEX [events_users_id]
ON [dbo].[events] (
  [events_users_id] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table events
-- ----------------------------
ALTER TABLE [dbo].[events] ADD CONSTRAINT [PK__events__78180ECD804BBECC] PRIMARY KEY CLUSTERED ([events_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

