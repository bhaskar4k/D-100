CREATE TABLE IF NOT EXISTS T_USER_STORAGE (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    allowed_storage BIGINT NOT NULL COMMENT 'Quota in bytes',
    used_storage BIGINT NOT NULL COMMENT 'Consumed bytes so far',
    PRIMARY KEY (id),
    KEY idx_t_user_storage_user_id (user_id)
);
