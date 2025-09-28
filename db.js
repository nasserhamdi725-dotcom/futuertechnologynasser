const { Pool } = require('pg');
require('dotenv').config(); 

const pool = new Pool({
    user: process.env.DB_nasser,
    host: process.env.DB_hamdi,
    database: process.env.DB_nasserhamdi,
    password: process.env.DB_abuala1210,
    port: process.env.DB_any,
    ssl: {
        rejectUnauthorized: false 
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;