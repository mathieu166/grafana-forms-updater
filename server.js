require('dotenv').config();
const express = require('express');
const { Client } = require('pg'); 
const app = express();
const PORT = 3002;

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
app.use(express.json()); 

// Default GET route
app.get('/', (req, res) => {
  res.status(200).send('Server is up and running.');
});

// Endpoint to update or insert validator specs
app.post('/validator/update', async (req, res) => {
  const { 
    address, 
    is_uptimerobot_active = false,  // default to false if not provided
    is_notify_on_low_peer_count = false,  // default to false if not provided
    low_peer_count_threshold = 0,  // default to 0 if not provided
    last_validated_block_alert_delay = 0  // default to 0 if not provided
  } = req.body;

  try {
    const query = `
      INSERT INTO validator (
        address, 
        is_uptimerobot_active, 
        is_notify_on_low_peer_count, 
        low_peer_count_threshold, 
        last_validated_block_alert_delay
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (address)
      DO UPDATE SET 
        is_uptimerobot_active = EXCLUDED.is_uptimerobot_active,
        is_notify_on_low_peer_count = EXCLUDED.is_notify_on_low_peer_count,
        low_peer_count_threshold = EXCLUDED.low_peer_count_threshold,
        last_validated_block_alert_delay = EXCLUDED.last_validated_block_alert_delay;
    `;
    
    await client.query(query, [
      address.trim().toLowerCase(), 
      is_uptimerobot_active, 
      is_notify_on_low_peer_count, 
      low_peer_count_threshold, 
      last_validated_block_alert_delay
    ]);
    
    res.status(200).send('Validator spec updated or inserted successfully.');
  } catch (error) {
    console.error('Error updating/inserting validator spec:', error);
    res.status(500).send('An error occurred while updating/inserting validator spec.');
  }
});


app.get('/validator/:address', async (req, res) => {
  const { address } = req.params;

  try {
    const query = `
      SELECT * FROM validator_specs
      WHERE address = $1;
    `;
    
    const result = await client.query(query, [address.toLowerCase()]);
  
    if (result.rows.length === 0) {
      return res.status(404).send('Validator not found.');
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving validator spec:', error);
    res.status(500).send('An error occurred while getting validator specs.');
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
