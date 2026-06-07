CREATE DATABASE IF NOT EXISTS promotion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE promotion_db;

CREATE TABLE IF NOT EXISTS promotion_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_suggestions INT,
    created_at DATETIME,
    validated_at DATETIME
);

CREATE TABLE IF NOT EXISTS promotions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255),
    category VARCHAR(100),
    current_price DOUBLE,
    suggested_discount DOUBLE NOT NULL,
    promotional_price DOUBLE,
    suggested_date DATE,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    batch_id BIGINT,
    created_at DATETIME,
    validated_at DATETIME,
    FOREIGN KEY (batch_id) REFERENCES promotion_batches(id)
);
