// Environment configuration helper
export const envConfig = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || "",
    user: process.env.MYSQL_ADMIN_USER || "",
    password: process.env.MYSQL_ADMIN_PASS || "",
  },

  // Authentication
  auth: {
    secret: process.env.NEXTAUTH_SECRET || "",
  },

  // Google App Script
  google: {
    scriptUrl: process.env.GOOGLE_SCRIPT_URL || "",
    // For client-side access
    publicScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "",
  },

  // App configuration
  app: {
    name: "Hussaini Maintenance App",
    version: "2.0.0",
  },
}
