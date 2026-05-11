import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

async function hashExistingPasswords() {
  const result = await db.execute(sql`SELECT user_id, password_hash FROM users`);
  const rows   = (result as any)[0];

  for (const row of rows) {
    const current = String(row.password_hash);
    
    // skip already hashed ones
    if (current.startsWith("$2b$") || current.startsWith("$2a$")) {
      console.log(`user_id ${row.user_id} — already hashed, skipping`);
      continue;
    }

    // hash the plain text password
    const hashed = await bcrypt.hash(current, 10);
    await db.execute(sql`
      UPDATE users SET password_hash = ${hashed} WHERE user_id = ${row.user_id}
    `);
    console.log(`user_id ${row.user_id} — hashed successfully`);
  }

  console.log("Done.");
  process.exit(0);
}

hashExistingPasswords();