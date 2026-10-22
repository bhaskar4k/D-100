CREATE TABLE IF NOT EXISTS T_DATASET (
    id BIGINT NOT NULL AUTO_INCREMENT,
    dataset_uid CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    filesize BIGINT NOT NULL,
    status INT NOT NULL DEFAULT 1,
    created_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    initiated_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    upload_completed_on DATETIME(3) NULL DEFAULT NULL,
    uploading_time BIGINT NULL DEFAULT NULL COMMENT 'milliseconds from initiated_on to upload_completed_on',
    PRIMARY KEY (id),
    UNIQUE KEY uq_t_dataset_dataset_uid (dataset_uid)
);
