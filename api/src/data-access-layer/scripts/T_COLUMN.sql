CREATE TABLE IF NOT EXISTS T_COLUMN (
    id BIGINT NOT NULL AUTO_INCREMENT,

    dataset_id BIGINT NOT NULL,
    column_name VARCHAR(500) NOT NULL,
    type INT NOT NULL COMMENT 'DataType enum value (see enum/DataType.ts)',
    nullable INT NOT NULL DEFAULT 0,
    unique_count BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    KEY idx_t_column_dataset_id (dataset_id)
);
