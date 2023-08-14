-- 20230813205741_user_trigger.sql

CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
   FOR EACH ROW
 BEGIN
       SET NEW.updated_at = CURRENT_TIMESTAMP;
   END;