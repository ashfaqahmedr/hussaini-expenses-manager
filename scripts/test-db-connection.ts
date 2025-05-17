import { createConnection } from "mysql2/promise"
import * as dotenv from "dotenv"

dotenv.config()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set in the environment.")
  process.exit(1)
}

// Parse the database URL
const dbUrlRegex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
const match = dbUrl.match(dbUrlRegex)

if (!match) {
  console.error("❌ Invalid DATABASE_URL format.")
  process.exit(1)
}

const [, user, password, host, port, database] = match

async function testConnection() {
  console.log("🔄 Connecting to database...")

  try {
    const connection = await createConnection({
      host,
      port: Number(port),
      user,
      password,
      database,
    })

    console.log("✅ Connected to database!")

    // Get all table names from the current database
    const [tables]: any[] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${database}'`
    )

    if (!tables.length) {
      console.log("⚠️ No tables found in the database.")
    }

    for (const row of tables) {
      const tableName = row["table_name"]
      console.log(`\n📋 Table: ${tableName}`)

      try {
        const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``)
        if ((rows as any[]).length === 0) {
          console.log("  (empty table)")
        } else {
          console.table(rows)
        }
      } catch (err) {
        console.error(`❌ Error reading table ${tableName}:`, err)
      }
    }

    await connection.end()
    console.log("\n🔌 Connection closed.")
  } catch (error) {
    console.error("❌ Error connecting to database or fetching data:")
    console.error(error)
    process.exit(1)
  }
}

testConnection()
