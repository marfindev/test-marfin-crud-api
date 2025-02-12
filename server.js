require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const redis = require("redis");
const multer = require("multer");
const AWS = require("aws-sdk");

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redisClient = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });

app.use(cors());
app.use(express.json());

// Konfigurasi AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload ke S3
app.post("/api/upload", upload.single("file"), async (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}_${req.file.originalname}`,
    Body: req.file.buffer,
    ACL: "public-read",
  };

  try {
    const { Location } = await s3.upload(params).promise();
    res.json({ url: Location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Clients
app.get("/api/clients", async (req, res) => {
  const cachedData = await redisClient.get("clients");
  if (cachedData) return res.json(JSON.parse(cachedData));

  const result = await pool.query("SELECT * FROM my_client WHERE deleted_at IS NULL");
  redisClient.set("clients", JSON.stringify(result.rows));
  res.json(result.rows);
});

// Create Client
app.post("/api/clients", async (req, res) => {
  const { name, slug, client_prefix, client_logo, address, phone_number, city } = req.body;
  await pool.query(
    "INSERT INTO my_client (name, slug, client_prefix, client_logo, address, phone_number, city) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [name, slug, client_prefix, client_logo, address, phone_number, city]
  );

  redisClient.del("clients");
  redisClient.set(slug, JSON.stringify(req.body));
  res.status(201).json({ message: "Client added successfully" });
});

// Delete Client (Soft Delete)
app.delete("/api/clients/:slug", async (req, res) => {
  const { slug } = req.params;
  await pool.query("UPDATE my_client SET deleted_at = NOW() WHERE slug = $1", [slug]);

  redisClient.del(slug);
  redisClient.del("clients");
  res.json({ message: "Client deleted" });
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
