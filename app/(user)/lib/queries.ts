"use server"
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
const bcrypt = require('bcrypt')


export async function getCustomerId(uId: number): Promise<number | null> {
  if (!Number.isFinite(uId) || uId <= 0) {
    return null;
  }

  try {
    const [rows]: any = await db.execute(sql`
      SELECT customer_id
      FROM customers WHERE user_id = ${uId}
    `);
    if (rows.length === 0) {
      return null;
    }

    return rows[0].customer_id;
  } catch (error) {
    console.error("Error fetching customer ID by userId:", error);
    return null;
  }
}
export async function getUserAccounts(uId: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT account_id, account_type, balance
      FROM accounts WHERE customer_id = ${uId}
    `);
    return rows;
  } catch (error) {
    return [];
  }
}

interface Transaction {
  txn_id: number;
  account_id: number;
  account_type: string;
  reference_note: string;
  txn_type: string;
  direction: "CREDIT" | "DEBIT";
  created_at: string;
  amount: number;
}

export async function getRecentTransactions(uId: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT * FROM transaction_ledger 
      WHERE account_id IN (SELECT account_id FROM accounts WHERE customer_id = ${uId})
      ORDER BY created_at DESC LIMIT 6
    `);
    return rows;
  } catch (error) {
    return [];
  }
}

export async function getTransactionHistory(userId: number): Promise<Transaction[]> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return [];
    }

    try {
      const [rows]: any = await db.execute(sql`
        SELECT
          tl.txn_id,
          tl.account_id,
          a.account_type,
          tl.reference_note,
          tl.txn_type,
          tl.direction,
          tl.amount,
          tl.created_at
        FROM transaction_ledger tl
        JOIN accounts a ON a.account_id = tl.account_id
        JOIN customers c ON c.customer_id = a.customer_id
        WHERE c.customer_id = (
          SELECT customer_id FROM customers WHERE user_id = ${userId} LIMIT 1
        )
        ORDER BY tl.created_at DESC
        LIMIT 20
      `);
      return rows;

    } catch {
      return [];
    }
  }

  // -----------------------------settings

  export async function getUserProfile(userId: number) {
    try {
      const [rows]: any = await db.execute(sql`
        SELECT full_name, phone, email, username
        FROM customer_profile_view
        WHERE user_id = ${userId}
      `);
      
      if (rows.length === 0) {
        return { full_name: "", phone: "", email: "", username: "" };
      }
      return rows[0];
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { full_name: "", phone: "", email: "", username: "" };
    }
  }


  export async function updateFullName(userId: number, fullName: string) {
  try {
    await db.execute(sql`
      UPDATE customers 
      SET full_name = ${fullName}
      WHERE user_id = ${userId}
    `);
    return { success: true, message: "Full name updated successfully" };
  } catch (error) {
    console.error("Error updating full name:", error);
    return { success: false, message: "Failed to update full name" };
  }
} 
  
  
export async function updatePhone(userId: number, phone: string) {
  try {
    await db.execute(sql`
      UPDATE customers 
      SET phone = ${phone}
      WHERE user_id = ${userId}
    `);
    return { success: true, message: "Phone number updated successfully" };
  } catch (error) {
    console.error("Error updating phone:", error);
    return { success: false, message: "Failed to update phone number" };
  }
}

export async function updateEmail(userId: number, email: string) {
  try {
    await db.execute(sql`
      UPDATE customers 
      SET email = ${email}
      WHERE user_id = ${userId}
    `);
    return { success: true, message: "Email updated successfully" };
  } catch (error) {
    console.error("Error updating email:", error);
    return { success: false, message: "Failed to update email" };
  }
}
export async function updateUsername(userId: number, username: string) {
  try {
    const [existing]: any = await db.execute(sql`
      SELECT user_id FROM users WHERE username = ${username} AND user_id != ${userId}
    `);
    
    if (existing.length > 0) {
      return { success: false, message: "Username already taken" };
    }
    
    await db.execute(sql`
      UPDATE users 
      SET username = ${username}
      WHERE user_id = ${userId}
    `);
    
    return { success: true, message: "Username updated successfully" };
  } catch (error) {
    console.error("Error updating username:", error);
    return { success: false, message: "Failed to update username" };
  }
}

export async function updatePassword(userId: number, oldPassword: string, newPassword: string) {
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

export async function getWadiahAccount(customerId: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT account_id, status, balance
      FROM customer_accounts_view
      WHERE customer_id = ${customerId} AND account_type = 'wadiah'
    `);
    
    if (rows.length === 0) {
      return { account_id: "", status: "active", balance: 0 };
    }
    return rows[0];
  } catch (error) {
    console.error("Error fetching Wadiah account:", error);
    return { account_id: "", status: "active", balance: 0 };
  }
}

export async function updateAccountStatus(accountId: string, newStatus: string) {
  try {
    await db.execute(sql`
      UPDATE account 
      SET status = ${newStatus}
      WHERE account_id = ${accountId}
    `);
    return { success: true, message: `Account status updated to ${newStatus}` };
  } catch (error) {
    console.error("Error updating account status:", error);
    return { success: false, message: "Failed to update account status" };
  }
}

export async function downloadStatement(accountId: string, days: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT 
        txn_id as transaction_id,
        reference_note,
        txn_type,
        direction,
        amount,
        DATE(created_at) as transaction_date,
        DATE_FORMAT(created_at, '%Y-%m-%d') as date
      FROM account_statement_view
      WHERE account_id = ${accountId}
      AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      ORDER BY created_at DESC
    `);
    
    return {
      success: true,
      data: rows,
      accountId: accountId,
      days: days,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating statement:", error);
    return {
      success: false,
      message: "Failed to generate statement",
      data: []
    };
  }
}

export async function hasMudarabahAccount(customerId: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM customer_accounts_view
      WHERE customer_id = ${customerId} AND account_type = 'mudarabah'
    `);
    
    return rows[0].count > 0;
  } catch (error) {
    console.error("Error checking Mudarabah account:", error);
    return false;
  }
}


export async function getMudarabahAccount(customerId: number) {
  try {
    const [rows]: any = await db.execute(sql`
      SELECT 
        account_id, 
        status,
        profit_sharing_ratio,
        investment_period_months
      FROM customer_accounts_view
      WHERE customer_id = ${customerId} AND account_type = 'mudarabah'
    `);
    
    if (rows.length === 0) {
      return { 
        account_id: "", 
        status: "active", 
        profit_sharing_ratio: null, 
        investment_period_months: null 
      };
    }
    return rows[0];
  } catch (error) {
    console.error("Error fetching Mudarabah account:", error);
    return { 
      account_id: "", 
      status: "active", 
      profit_sharing_ratio: null, 
      investment_period_months: null 
    };
  }
}

export async function updateMudarabahStatus(accountId: string, newStatus: string) {
  try {
    await db.execute(sql`
      UPDATE account 
      SET status = ${newStatus}
      WHERE account_id = ${accountId}
    `);
    return { success: true, message: `Mudarabah account status updated to ${newStatus}` };
  } catch (error) {
    console.error("Error updating Mudarabah status:", error);
    return { success: false, message: "Failed to update Mudarabah account status" };
  }
}

