USE voicetextbot;
CREATE TABLE IF NOT EXISTS `reminder` (
  `idreminder` INT NOT NULL auto_increment,
  `creation` TIMESTAMP default CURRENT_TIMESTAMP,
  `triggerDate` TIMESTAMP NULL,
  `pending` TINYINT NOT NULL DEFAULT 1,
  `cancelled` TINYINT NULL DEFAULT 0,
  `targetUser` NVARCHAR(100) NULL,
  `guild` BIGINT UNSIGNED,
  `msgUrl` NVARCHAR(100) NULL,
  `dm` TINYINT NULL DEFAULT 0,
  `msgSummary` NVARCHAR(100) NULL,
  PRIMARY KEY (`idreminder`));
