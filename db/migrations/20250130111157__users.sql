-- migration file
-- 20250130144323__users.sql
-- -----------------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS public.users (
    id serial NOT NULL,
    'name' varchar(200) NULL,
    external_id varchar(200) NOT NULL,
    external_id_type varchar(50) NOT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    CONSTRAINT users_pk PRIMARY KEY (id)
);