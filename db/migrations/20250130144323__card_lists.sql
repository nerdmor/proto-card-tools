-- migration file
-- 20250130111157__card_lists.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS public.card_lists (
    id serial NOT NULL,
    user_id int NULL,
    list_name varchar NOT NULL,
    archived bool DEFAULT false NOT NULL,
    list_body text NULL,
    CONSTRAINT card_lists_pk PRIMARY KEY (id)
);