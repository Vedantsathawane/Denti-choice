const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDb = async () => {
  console.log('🚀 Starting Database Initialization...');

  // Create connection config using the same values as db.js plus multipleStatements
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentichoice',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  };

  let connection;
  try {
    console.log(`📡 Connecting to database at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);
    console.log('✅ Connection established successfully');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    console.log('📖 Reading schema.sql...');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Strip CREATE DATABASE and USE statements to support custom databases on Aiven/TiDB
    schemaSql = schemaSql
      .replace(/CREATE DATABASE IF NOT EXISTS [a-zA-Z0-9_]+\s*[^;]*;/gi, '-- Stripped CREATE DATABASE')
      .replace(/USE [a-zA-Z0-9_]+\s*;/gi, '-- Stripped USE');

    console.log('⏳ Running schema queries...');
    await connection.query(schemaSql);
    console.log('✅ Schema tables created successfully');

    // Read seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('📖 Reading seed.sql...');
      let seedSql = fs.readFileSync(seedPath, 'utf8');
      
      // Strip USE statement
      seedSql = seedSql.replace(/USE [a-zA-Z0-9_]+\s*;/gi, '-- Stripped USE');

      console.log('⏳ Running seed queries (inserting initial data)...');
      await connection.query(seedSql);
      console.log('✅ Seed data inserted successfully');
    } else {
      console.log('ℹ️ No seed.sql file found, skipping seeding.');
    }

    console.log('\n🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDb();
