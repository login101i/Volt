-- =============================================================================
-- DevelopmentIssues — tablica zadań / notatek deweloperskich (kanban /development)
-- Baza: lxsxnvawhg_volt (Cyber Folks MariaDB)
-- =============================================================================

USE `lxsxnvawhg_volt`;

CREATE TABLE IF NOT EXISTS `DevelopmentIssues` (
  `Id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `PublicId`        VARCHAR(64)  NOT NULL COMMENT 'Client-facing id (np. dev-1789034821870-e4tc20)',
  `Title`           VARCHAR(500) NOT NULL,
  `Description`     TEXT         NULL,
  `Page`            VARCHAR(512) NULL COMMENT 'pathname gdzie utworzono notatkę',
  `ScreenshotUrl`   VARCHAR(1024) NULL,
  `Flag`            ENUM('pending', 'testing', 'corrected', 'blocked', 'skipped')
                      NOT NULL DEFAULT 'pending',
  `Priority`        ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `PlannedDate`     DATE         NULL COMMENT 'Dzień w kalendarzu YYYY-MM-DD',
  `CreatedBy`       VARCHAR(255) NULL COMMENT 'email / nazwa autora',
  `CreatedByUserId` INT          NULL,
  `SourceHost`      VARCHAR(255) NULL COMMENT 'hostname (localhost vs produkcja)',
  `CreatedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UpdatedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                 ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_DevelopmentIssues_PublicId` (`PublicId`),
  KEY `IX_DevelopmentIssues_Flag_CreatedAt` (`Flag`, `CreatedAt` DESC),
  KEY `IX_DevelopmentIssues_CreatedAt` (`CreatedAt` DESC),
  KEY `IX_DevelopmentIssues_PlannedDate` (`PlannedDate`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;
