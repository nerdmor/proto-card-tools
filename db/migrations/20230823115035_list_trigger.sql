-- 20230823115035_list_trigger.sql

CREATE TRIGGER before_list_update
BEFORE UPDATE ON lists
   FOR EACH ROW
 BEGIN
       SET NEW.updated_at = CURRENT_TIMESTAMP;
   END;