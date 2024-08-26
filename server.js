require('dotenv').config();
const express = require('express');
const { Client } = require('pg'); 
const bodyParser = require('body-parser');
const app = express();
const PORT = 3003;

// PostgreSQL connection configuration
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

// Connect to PostgreSQL
client.connect();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Endpoint to update or insert validator specs
app.post('/validator/update', async (req, res) => {
  const { address, ip_host, port } = req.body;

  try {
    const query = `
      INSERT INTO validator_specs (address, ip_host, port)
      VALUES ($1, $2, $3)
      ON CONFLICT (address)
      DO UPDATE SET ip_host = EXCLUDED.ip_host, port = EXCLUDED.port;
    `;
    
    await client.query(query, [address.toLowerCase(), ip_host, port]);
    res.status(200).send('Validator spec updated or inserted successfully.');
  } catch (error) {
    console.error('Error updating/inserting validator spec:', error);
    res.status(500).send('An error occurred while updating/inserting validator spec.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
