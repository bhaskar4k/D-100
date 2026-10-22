CREATE TABLE IF NOT EXISTS T_LOG (
    id BIGINT NOT NULL AUTO_INCREMENT,
    log_type INT NOT NULL COMMENT '1 = Info, 2 = Error (see enum/LogType.ts)',
    log_message TEXT NOT NULL,
    created_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_by BIGINT NULL DEFAULT NULL COMMENT 'T_USER_MASTER.id; NULL for system or unauthenticated actions',
    PRIMARY KEY (id),
    KEY idx_t_log_created_on (created_on),
    KEY idx_t_log_log_type (log_type)
);
