-- 20230810111552_lists.sql


DROP TABLE IF EXISTS lists;

CREATE TABLE IF NOT EXISTS lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NULL,
    comments TEXT NULL,
    body LONGTEXT NULL,
    public BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE lists AUTO_INCREMENT = 1001;