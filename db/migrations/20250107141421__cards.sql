-- migration file
-- 20250107141421__cards.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS cards (
    oracle_id VARCHAR (64) PRIMARY KEY,
    name VARCHAR (256) NOT NULL,
    names VARCHAR (256) NOT NULL,
    cmc FLOAT NOT NULL,
    color_identity VARCHAR (5) NOT NULL,
    colors VARCHAR (5) NOT NULL,
    type_line VARCHAR (256) NOT NULL,
    number_faces INT NOT NULL,
    is_white BOOLEAN NOT NULL,
    is_blue BOOLEAN NOT NULL,
    is_black BOOLEAN NOT NULL,
    is_red BOOLEAN NOT NULL,
    is_green BOOLEAN NOT NULL,
    is_multicolor BOOLEAN NOT NULL,
    is_colorless BOOLEAN NOT NULL,
    is_land BOOLEAN NOT NULL
);