CREATE TABLE IF NOT EXISTS t_menu_master (
    id INT NOT NULL AUTO_INCREMENT,
    active INT NOT NULL,
    display_order INT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    parent_id INT NULL,
    route VARCHAR(500) NULL,
    access_type INT NOT NULL,
    PRIMARY KEY (id)
);