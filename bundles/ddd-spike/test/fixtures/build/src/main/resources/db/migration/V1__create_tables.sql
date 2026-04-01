CREATE TABLE orders (
    order_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    status VARCHAR(255) DEFAULT &#x27;CREATED&#x27;,
    total_amount DECIMAL(19,2)
);

