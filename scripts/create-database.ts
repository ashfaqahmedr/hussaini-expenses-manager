import { exec as _exec } from "child_process"
import { promisify } from "util"
import * as dotenv from "dotenv"
import * as readline from "readline"

const exec = promisify(_exec)
dotenv.config()
const adminUser = process.env.MYSQL_ADMIN_USER || "root"
const adminPass = process.env.MYSQL_ADMIN_PASS || ""


// Load environment variables

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

// Parse the database URL to extract the database name and connection details
const dbUrlRegex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
const match = dbUrl.match(dbUrlRegex)

if (!match) {
  console.error("Invalid DATABASE_URL format")
  process.exit(1)
}

const [, username, password, host, port, dbName] = match

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("Database setup script")
console.log("---------------------")
console.log(`Host: ${host}`)
console.log(`Port: ${port}`)
console.log(`Database: ${dbName}`)
console.log(`Username: ${username}`)
console.log("")

// Function to execute MySQL commands
function executeMySQL(command: string, options?: { user?: string; pass?: string; database?: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = options?.user || username
    const pass = options?.pass || password
    const db = options?.database ?? (command.includes("CREATE DATABASE") ? "" : dbName)

    const mysqlCmd = `mysql -h ${host} -P ${port} -u ${user} ${pass ? `-p${pass}` : ""} ${db} -e "${command.replace(/"/g, '\\"')}"`


    exec(mysqlCmd)
      .then(({ stdout, stderr }) => {
        if (stderr) {
          console.error(`MySQL stderr: ${stderr}`)
        }
        resolve(stdout)
      })
      .catch((error) => {
        console.error(`Error executing MySQL command: ${error.message}`)
        reject(error)
      })
  })
}


// Check if database exists
async function checkDatabaseExists(): Promise<boolean> {
  try {
    const result = await executeMySQL(`SHOW DATABASES LIKE '${dbName}'`)
    return result.includes(dbName)
  } catch (error) {
    console.error("Error checking if database exists:", error)
    return false
  }
}

// Create database if it doesn't exist
async function createDatabase() {
  try {
    console.log(`Creating database ${dbName}...`)
    await executeMySQL(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`Database ${dbName} created successfully.`)
  } catch (error) {
    console.error("Error creating database:", error)
    process.exit(1)
  }
}

// Create the database user if it doesn't exist
async function createUserIfNotExists() {
  try {
    console.log(`Ensuring MySQL user '${username}' exists...`)
    const command = `
      CREATE USER IF NOT EXISTS '${username}'@'localhost' IDENTIFIED BY '${password}';
      GRANT ALL PRIVILEGES ON *.* TO '${username}'@'localhost';
      FLUSH PRIVILEGES;
    `
    await executeMySQL(command, { user: adminUser, pass: adminPass })
    console.log(`User '${username}' verified/created successfully.`)
  } catch (error) {
    console.error("Error creating MySQL user:", error)
    process.exit(1)
  }
}


// Main function
async function main() {
  try {
    // await createUserIfNotExists() // 👈 Add this

    const dbExists = await checkDatabaseExists()

    if (dbExists) {
      console.log(`Database ${dbName} already exists.`)
      rl.question("Do you want to reset the database? This will delete all existing data. (y/N): ", async (answer) => {
        if (answer.toLowerCase() === "y") {
          console.log(`Dropping database ${dbName}...`)
          await executeMySQL(`DROP DATABASE ${dbName}`)
          await createDatabase()
          runMigrations()
        } else {
          console.log("Database reset cancelled.")
          rl.close()
          process.exit(0)
        }
      })
    } else {
      await createDatabase()
      runPrismaSetup()
      // runMigrations()

    }
  } catch (error) {
    console.error("Error in main function:", error)
    rl.close()
    process.exit(1)
  }
}


// Run Prisma migrations
async function runMigrations() {
  console.log("Running Prisma migrations...");

  try {
    const { stdout, stderr } = await exec("npx prisma migrate dev", { env: process.env });
    if (stderr) console.error(stderr);
    console.log(stdout);

    console.log("Running database seed script...");
    const { stdout: seedOut, stderr: seedErr } = await exec("tsx scripts/init-db.ts", { env: process.env });
    if (seedErr) console.error(seedErr);
    console.log(seedOut);

    console.log("Database setup completed successfully!");
    rl.close();
  } catch (error) {
    console.error(`Error running migrations or seed: ${error}`);
    rl.close();
    process.exit(1);
  }
}


async function runPrismaSetup() {
  console.log("Running Prisma migrations (init)...");

  try {
    const { stdout, stderr } = await exec("npx prisma migrate dev --name init", { env: process.env });
    if (stderr) console.error(stderr);
    console.log(stdout);

    console.log("Running database seed script...");
    const { stdout: seedOut, stderr: seedErr } = await exec("tsx scripts/init-db.ts", { env: process.env });
    if (seedErr) console.error(seedErr);
    console.log(seedOut);

    console.log("Database setup completed successfully!");
    rl.close();
  } catch (error) {
    console.error(`Error during setup: ${error}`);
    rl.close();
    process.exit(1);
  }
}





// // Start the script
main()
// </QuickEdit>

// Let's update the package.json to include scripts for database setup:
