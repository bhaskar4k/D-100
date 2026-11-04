CREATE TABLE IF NOT EXISTS T_STORAGE_MASTER (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'Display name, e.g. "Bronze Plan"',
    `enum` VARCHAR(50) NOT NULL COMMENT 'StorageMaster enum value (e.g. BRONZE, SILVER, IRON, GOLD, DIAMOND)',
    storage BIGINT NOT NULL COMMENT 'Plan allowance in bytes',
    is_active INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_t_storage_master_enum (`enum`)
);
