CREATE TABLE IF NOT EXISTS t_missing_value_replacement_strategy_master (
    id INT NOT NULL AUTO_INCREMENT,
    replacement_strategy_name VARCHAR(255) NOT NULL,
    replacment_strategy_enum VARCHAR(50) NOT NULL,
    replacment_strategy_description VARCHAR(1000) NOT NULL,
    is_active INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_t_missing_value_replacement_strategy_master_enum (replacment_strategy_enum)
);
