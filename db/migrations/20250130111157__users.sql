-- migration file
-- 20250130144323__users.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS public.users (
    id serial NOT NULL,
    username varchar(100) NULL,
    CONSTRAINT users_pk PRIMARY KEY (id)
);