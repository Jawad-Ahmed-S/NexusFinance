import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../app/drizzle/schema";

// 1. HARDCODE EVERYTHING HERE - No variables, no backticks.
const pool = mysql.createPool("mysql://root:jawad123@127.0.0.1:3306/nexusfinance");

// 2. Export the db instance
export const db = drizzle(pool, { schema, mode: "default" });