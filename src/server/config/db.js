import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

// Create database connection pool
const pool = mysql.createPool({
  host: DB_HOST || "localhost",
  user: DB_USER || "root",
  password: DB_PASSWORD || "Sakthi@05",
  database: DB_NAME || "adrap",
  port: DB_PORT ? Number(DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const createTables = async () => {
  try {
    // Drop unique indexes on username and studentUsername if they exist
    await pool
      .query(`ALTER TABLE subjects DROP INDEX username;`)
      .catch(() => {});
    await pool
      .query(`ALTER TABLE subjects DROP INDEX studentUsername;`)
      .catch(() => {});

    // Create subjects table with only (code, name) as unique via a composite key
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
         id VARCHAR(100) PRIMARY KEY, 
         code VARCHAR(50) NOT NULL,  
         name VARCHAR(255) NOT NULL,
         semester INT NOT NULL,  
         batch VARCHAR(50) NOT NULL,
         section VARCHAR(10) NOT NULL,
         staffName VARCHAR(255) NOT NULL,
         username VARCHAR(100) NOT NULL, 
         password VARCHAR(255) NOT NULL, 
         studentUsername VARCHAR(100) NOT NULL,  
         studentPassword VARCHAR(255) NOT NULL,  
         academicYear VARCHAR(50) NOT NULL,
         UNIQUE KEY unique_subject (code, name)
      )
    `);
    console.log('✅ Table "subjects" updated: Only (code, name) are unique.');

    // Create serial_tests table (normalized: basic test info)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS serial_tests (
         id BIGINT AUTO_INCREMENT PRIMARY KEY,
         subjectId VARCHAR(100) NOT NULL,
         serialTestNumber INT NOT NULL,
         batch VARCHAR(50) NOT NULL,
         section VARCHAR(10) NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (subjectId) REFERENCES subjects(id)
      )
    `);
    console.log('✅ Table "serial_tests" created (if not exists).');

    // Create questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
         id INT AUTO_INCREMENT PRIMARY KEY,
         testId BIGINT NOT NULL,
         questionNumber VARCHAR(50) NOT NULL,
         co INT NOT NULL,
         maxMarks INT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (testId) REFERENCES serial_tests(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table "questions" created (if not exists).');

    // Create student_marks table with additional columns for marks and CO
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_marks (
         id INT AUTO_INCREMENT PRIMARY KEY,
         testId BIGINT NOT NULL,
         rollNumber BIGINT NOT NULL,
         name VARCHAR(255) NOT NULL,
         submitted BOOLEAN DEFAULT FALSE,
         coMarks JSON,
         questionMarks JSON,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (testId) REFERENCES serial_tests(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table "student_marks" created (if not exists).');

    // Create app_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
         name VARCHAR(100) PRIMARY KEY,
         value VARCHAR(255) NOT NULL
      )
    `);
    console.log('✅ Table "app_settings" created (if not exists).');

    // Insert default settings if they do not exist
    await pool.query(`
      INSERT IGNORE INTO app_settings (name, value) VALUES 
      ('subjects_published', 'false'),
      ('current_batch', '2022-2026'),
      ('current_section', 'A')
    `);
    console.log("✅ Default settings inserted (if not exists).");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  }
};

const testConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("✅ Database connected successfully!");
    return rows[0].result;
  } catch (error) {
    console.error(
      `❌ Database connection error: ${error.code} - ${error.message}`
    );
    throw error;
  }
};

// Run table creation when this module is loaded
createTables();

export { pool, testConnection };
