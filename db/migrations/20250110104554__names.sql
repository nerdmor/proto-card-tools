-- migration file
-- 20250110104554__names.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS names (
    oracle_id VARCHAR (64) NOT NULL,
    name VARCHAR (256) NOT NULL,
    UNIQUE (name),
    CONSTRAINT fk_cards_names
        FOREIGN KEY (oracle_id) 
        REFERENCES cards (oracle_id)
);