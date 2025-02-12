const express = require("express");
const { getClients, createClient, deleteClient } = require("../controllers/clientController");

const router = express.Router();

router.get("/clients", getClients);
router.post("/clients", createClient);
router.delete("/clients/:slug", deleteClient);

module.exports = router;
