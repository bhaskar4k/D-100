CREATE TABLE IF NOT EXISTS T_DATASET (
    id BIGINT NOT NULL AUTO_INCREMENT,

    dataset_uid CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    filesize BIGINT NOT NULL,
    row_count BIGINT NULL DEFAULT NULL,

    status INT NOT NULL DEFAULT 1,
    initiated_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    upload_completed_on DATETIME(3) NULL DEFAULT NULL,
    uploading_time BIGINT NULL DEFAULT NULL COMMENT 'milliseconds from initiated_on to upload_completed_on',

    is_processed INT NOT NULL DEFAULT 0,
    processing_status INT NOT NULL DEFAULT 0,
    processing_initiated_on DATETIME(3) NULL DEFAULT NULL,
    processing_completed_on DATETIME(3) NULL DEFAULT NULL,
    processing_time BIGINT NULL DEFAULT NULL COMMENT 'milliseconds from processing_initiated_on to processing_completed_on', 

    created_by INT NOT NULL,
    created_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    modified_on DATETIME(3) NULL DEFAULT NULL,

    is_active INT NOT NULL DEFAULT 1,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_t_dataset_dataset_uid (dataset_uid)
);
