-- migration file
-- 20250130111002__card_images.sql
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS card_images (
    id SERIAL NOT NULL,
    oracle_id VARCHAR NOT NULL,
    image_uri VARCHAR NOT NULL,
    image_filename VARCHAR NOT NULL,
    card_set VARCHAR(5) NOT NULL,
    oracle_id_card_set VARCHAR NOT NULL,
    rarity VARCHAR(1),
    CONSTRAINT cardimages_unique PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS card_image_oracle_id_idx ON public.card_images USING btree (oracle_id);
