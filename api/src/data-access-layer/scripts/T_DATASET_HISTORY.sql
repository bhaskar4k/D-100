CREATE TABLE IF NOT EXISTS T_DATASET_HISTORY (
    id BIGINT NOT NULL AUTO_INCREMENT,
    dataset_id BIGINT NOT NULL,
    action_type VARCHAR(100) NOT NULL COMMENT 'DatasetHistoryActionType enum value (e.g. MISSING_VALUE_HANDLING, DUPLICATE_HANDLING)',
    column_id BIGINT NOT NULL,
    previous_state TEXT NOT NULL COMMENT 'JSON-serialized snapshot of the entity before the action',
    current_state TEXT NOT NULL COMMENT 'JSON-serialized snapshot of the entity after the action',
    extra_data TEXT NULL COMMENT 'JSON-serialized action-specific context (e.g. { replacement_strategy, constant_value } for MISSING_VALUE_HANDLING)',
    is_active INT NOT NULL DEFAULT 1,
    created_on DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_t_dataset_history_dataset_id (dataset_id),
    KEY idx_t_dataset_history_created_on (created_on)
);
