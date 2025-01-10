-- migration file
-- 20250107154314__variants.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS variants (
    oracle_id VARCHAR (64) NOT NULL,
    flavor_name VARCHAR (256) NULL,
    scryfall_id VARCHAR (256) NOT NULL,
    image_uri VARCHAR (256) NULL,
    lang VARCHAR (5) NOT NULL,
    rarity VARCHAR (1) NOT NULL,
    set_code VARCHAR (10) NOT NULL,
    collector_number VARCHAR(10) NOT NULL,
    collector_number_sort INT NOT NULL,
    finishes VARCHAR (256) NULL,
    image_downloaded BOOLEAN DEFAULT FALSE,
    variant_key VARCHAR (256) NOT NULL,
    UNIQUE (variant_key),
    CONSTRAINT fk_cards_variants
        FOREIGN KEY (oracle_id) 
        REFERENCES cards (oracle_id)
);