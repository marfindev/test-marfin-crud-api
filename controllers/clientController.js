const pool = require("../db");
const redisClient = require("../redis");

const getClients = async (req, res) => {
  const cachedData = await redisClient.get("clients");
  if (cachedData) return res.json(JSON.parse(cachedData));

  const result = await pool.query("SELECT * FROM my_client WHERE deleted_at IS NULL");
  redisClient.set("clients", JSON.stringify(result.rows));
  res.json(result.rows);
};

const createClient = async (req, res) => {
  const { name, slug, client_prefix, client_logo, address, phone_number, city } = req.body;
  await pool.query(
    "INSERT INTO my_client (name, slug, client_prefix, client_logo, address, phone_number, city) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [name, slug, client_prefix, client_logo, address, phone_number, city]
  );

  redisClient.del("clients");
  redisClient.set(slug, JSON.stringify(req.body));
  res.status(201).json({ message: "Client added successfully" });
};

const deleteClient = async (req, res) => {
  const { slug } = req.params;
  await pool.query("UPDATE my_client SET deleted_at = NOW() WHERE slug = $1", [slug]);

  redisClient.del(slug);
  redisClient.del("clients");
  res.json({ message: "Client deleted" });
};

module.exports = { getClients, createClient, deleteClient };
