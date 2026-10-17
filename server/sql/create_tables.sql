-- =============================================================================
-- Volt / ELGEN — schemat MariaDB 10.11 (Cyber Folks)
-- Baza: lxsxnvawhg_volt
-- Uruchom w phpMyAdmin / HeidiSQL / mysql CLI po zalogowaniu do bazy.
-- =============================================================================

USE `lxsxnvawhg_volt`;

-- ---------------------------------------------------------------------------
-- Katalog komponentów rozdzielnicy (API: /api/components)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `electric_components` (
  `id`           VARCHAR(100)  NOT NULL,
  `name`         VARCHAR(255)  NOT NULL,
  `fields`       INT           NOT NULL DEFAULT 0 COMMENT 'Liczba pól/modułów w rozdzielnicy',
  `description`  TEXT          NULL,
  `price`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image`        VARCHAR(500)  NULL,
  `category`     VARCHAR(100)  NULL,
  `subcategory`  VARCHAR(100)  NULL,
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_components_name` (`name`),
  KEY `idx_components_price` (`price`),
  KEY `idx_components_fields` (`fields`),
  KEY `idx_components_category` (`category`),
  KEY `idx_components_subcategory` (`subcategory`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Typy bezpieczników (API: /api/components/fuse-types)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fuse_types` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `fuse_type`   VARCHAR(20)  NOT NULL COMMENT 'np. 10A, 16A, 32A',
  `phase_type`  VARCHAR(10)  NOT NULL COMMENT '1φ lub 3φ',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fuse_phase` (`fuse_type`, `phase_type`),
  KEY `idx_fuse_types_phase_type` (`phase_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Seed: bezpieczniki 1-fazowe i 3-fazowe
-- ---------------------------------------------------------------------------
INSERT INTO `fuse_types` (`fuse_type`, `phase_type`) VALUES
  ('6A', '1φ'), ('10A', '1φ'), ('13A', '1φ'), ('16A', '1φ'),
  ('20A', '1φ'), ('25A', '1φ'), ('32A', '1φ'), ('40A', '1φ'),
  ('50A', '1φ'), ('63A', '1φ'),
  ('16A', '3φ'), ('20A', '3φ'), ('25A', '3φ'), ('32A', '3φ'),
  ('40A', '3φ'), ('50A', '3φ'), ('63A', '3φ'), ('80A', '3φ'),
  ('100A', '3φ'), ('125A', '3φ')
ON DUPLICATE KEY UPDATE `fuse_type` = VALUES(`fuse_type`);

-- Przykład wiersza komponentu (opcjonalny — usuń lub rozbuduj):
-- INSERT INTO `electric_components`
--   (`id`, `name`, `fields`, `description`, `price`, `image`, `category`, `subcategory`)
-- VALUES
--   ('fuse16A', 'Wyłącznik nadprądowy 16A', 1, 'B16 1P', 25.00, '', 'Zabezpieczenia', 'Wyłączniki nadprądowe');
