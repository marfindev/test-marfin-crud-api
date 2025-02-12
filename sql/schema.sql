CREATE TABLE my_client (
  id SERIAL PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  client_prefix CHAR(4) NOT NULL,
  client_logo VARCHAR(255) DEFAULT 'no-image.jpg',
  address TEXT,
  phone_number CHAR(50),
  city CHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL
);
