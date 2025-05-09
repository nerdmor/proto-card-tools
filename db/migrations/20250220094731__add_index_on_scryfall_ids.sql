-- migration file
-- 20250220094731__add_index_on_scryfall_ids.sql
-- -----------------------------------------------------------------------------


CREATE UNIQUE INDEX scryfall_id_idx ON card_variants (scryfall_id);