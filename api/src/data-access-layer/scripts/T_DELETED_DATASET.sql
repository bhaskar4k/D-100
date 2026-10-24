CREATE TABLE IF NOT EXISTS T_DELETED_DATASET (
    id BIGINT NOT NULL AUTO_INCREMENT,

    dataset_id BIGINT NOT NULL,
    auto_deletion_time BIGINT NOT NULL COMMENT 'UNIX epoch (seconds) at which the dataset is eligible for permanent removal',

    PRIMARY KEY (id),
    UNIQUE KEY uq_t_deleted_dataset_dataset_id (dataset_id)
);
