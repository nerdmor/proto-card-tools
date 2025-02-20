-- migration file
-- 20250110104554__names.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS card_names (
    oracle_id VARCHAR (64) NOT NULL,
    name_part VARCHAR (256) NOT NULL,
    printed_name VARCHAR (256) NOT NULL,
    name_key VARCHAR (64) NOT NULL,
    UNIQUE (name_key),
    CONSTRAINT fk_cards_names
        FOREIGN KEY (oracle_id)
        REFERENCES cards (oracle_id)
);