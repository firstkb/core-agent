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

 Date: 12/04/2026 17:22:40
*/


-- ----------------------------
-- Table structure for state
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[state]') AND type IN ('U'))
	DROP TABLE [dbo].[state]
GO

CREATE TABLE [dbo].[state] (
  [state_id] int  IDENTITY(1,1) NOT NULL,
  [state_rowstamp] timestamp  NULL,
  [state_name] nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[state] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of state
-- ----------------------------
BEGIN TRANSACTION
GO

SET IDENTITY_INSERT [dbo].[state] ON
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'1', 0x0000000000000CDB, N'[AK] Alaska')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'2', 0x0000000000000CDC, N'[AL] Alabama')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'3', 0x0000000000000CDD, N'[AR] Arkansas')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'4', 0x0000000000000CDE, N'[AZ] Arizona')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'5', 0x0000000000000CDF, N'[CA] California')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'6', 0x0000000000000CE0, N'[CO] Colorado')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'7', 0x0000000000000CE1, N'[CT] Connecticut')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'8', 0x0000000000000CE2, N'[DC] District of Columbia')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'9', 0x0000000000000CE3, N'[DE] Delaware')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'10', 0x0000000000000CE4, N'[FL] Florida')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'11', 0x0000000000000CE5, N'[GA] Georgia')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'12', 0x0000000000000CE6, N'[HI] Hawaii')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'13', 0x0000000000000CE7, N'[IA] Iowa')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'14', 0x0000000000000CE8, N'[ID] Idaho')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'15', 0x0000000000000CE9, N'[IL] Illinois')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'16', 0x0000000000000CEA, N'[IN] Indiana')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'17', 0x0000000000000CEB, N'[KS] Kansas')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'18', 0x0000000000000CEC, N'[KY] Kentucky')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'19', 0x0000000000000CED, N'[LA] Louisiana')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'20', 0x0000000000000CEE, N'[MA] Massachusetts')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'21', 0x0000000000000CEF, N'[MD] Maryland')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'22', 0x0000000000000CF0, N'[ME] Maine')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'23', 0x0000000000000CF1, N'[MI] Michigan')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'24', 0x0000000000000CF2, N'[MN] Minnesota')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'25', 0x0000000000000CF3, N'[MO] Missouri')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'26', 0x0000000000000CF4, N'[MS] Mississippi')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'27', 0x0000000000000CF5, N'[MT] Montana')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'28', 0x0000000000000CF6, N'[NC] North Carolina')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'29', 0x0000000000000CF7, N'[ND] North Dakota')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'30', 0x0000000000000CF8, N'[NE] Nebraska')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'31', 0x0000000000000CFA, N'[NH] New Hampshire')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'32', 0x0000000000000CFB, N'[NJ] New Jersey')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'33', 0x0000000000000CFC, N'[NM] New Mexico')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'34', 0x0000000000000CFD, N'[NV] Nevada')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'35', 0x0000000000000CFE, N'[NY] New York')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'36', 0x0000000000000CFF, N'[OH] Ohio')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'37', 0x0000000000000D01, N'[OK] Oklahoma')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'38', 0x0000000000000D02, N'[OR] Oregon')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'39', 0x0000000000000D03, N'[PA] Pennsylvania')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'40', 0x0000000000000D04, N'[RI] Rhode Island')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'41', 0x0000000000000D05, N'[SC] South Carolina')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'42', 0x0000000000000D06, N'[SD] South Dakota')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'43', 0x0000000000000D07, N'[TN] Tennessee')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'44', 0x0000000000000D08, N'[TX] Texas')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'45', 0x0000000000000D09, N'[UT] Utah')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'46', 0x0000000000000D0A, N'[VA] Virginia')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'47', 0x0000000000000D0B, N'[VT] Vermont')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'48', 0x0000000000000D0C, N'[WA] Washington')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'49', 0x0000000000000D0D, N'[WI] Wisconsin')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'50', 0x0000000000000D0E, N'[WV] West Virginia')
GO

INSERT INTO [dbo].[state] ([state_id], [state_rowstamp], [state_name]) VALUES (N'51', 0x0000000000000D0F, N'[WY] Wyoming')
GO

SET IDENTITY_INSERT [dbo].[state] OFF
GO

COMMIT
GO


-- ----------------------------
-- Auto increment value for state
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[state]', RESEED, 51)
GO


-- ----------------------------
-- Primary Key structure for table state
-- ----------------------------
ALTER TABLE [dbo].[state] ADD CONSTRAINT [PK__state__81A47417B6ECB024] PRIMARY KEY CLUSTERED ([state_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

