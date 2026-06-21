const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const password = process.argv[2] || process.env.DB_PASSWORD;

if (!password) {
  console.error('Error: Please provide the Supabase database password.');
  console.error('Usage: node init-db.js [password]');
  process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.nlopbjecbveyumsspvqw.supabase.co:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read and run supabase_schema.sql
    console.log('Reading supabase_schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf8');
    console.log('Executing schema queries...');
    await client.query(schemaSql);
    console.log('Schema queries executed successfully!');

    // Read and run supabase_storage.sql
    console.log('Reading supabase_storage.sql...');
    if (fs.existsSync(path.join(__dirname, 'supabase_storage.sql'))) {
      const storageSql = fs.readFileSync(path.join(__dirname, 'supabase_storage.sql'), 'utf8');
      console.log('Executing storage policy queries...');
      await client.query(storageSql);
      console.log('Storage policy queries executed successfully!');
    }

    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('An error occurred during database initialization:');
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
