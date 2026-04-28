import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",   // Where the generated code will live
  out: "./drizzle",           // Where migrations will be stored
  dialect: "mysql",           // The DB type
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "jawad123", 
    database: "nexusfinance",       
  },
});