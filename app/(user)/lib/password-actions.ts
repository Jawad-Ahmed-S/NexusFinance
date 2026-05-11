"use server";

import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function updatePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
) {
  try {
    const [user]: any = await db.execute(sql`
      SELECT password_hash FROM users WHERE user_id = ${userId}
    `);

    if (user.length === 0) {
      return { success: false, message: "User not found" };
    }

    const isValid = await bcrypt.compare(oldPassword, user[0].password_hash);

    if (!isValid) {
      return { success: false, message: "Old password is incorrect" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.execute(sql`
      UPDATE users 
      SET password_hash = ${newHash}
      WHERE user_id = ${userId}
    `);

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: "Failed to update password" };
  }
}
