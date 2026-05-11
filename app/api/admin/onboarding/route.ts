import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  checkUsernameExists,
  checkNationalIdExists,
  createCustomerAccount,
} from "@/app/admin/lib/queries";

export const runtime = "nodejs";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = String(
    (session?.user as { role?: string } | undefined)?.role ?? ""
  ).toLowerCase();
  if (!session || role !== "admin") return null;
  return session;
}

/** GET ?check=username|nationalId&value=… */
export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const check = searchParams.get("check");
  const value = (searchParams.get("value") ?? "").trim();

  try {
    if (check === "username") {
      const exists = await checkUsernameExists(value);
      return NextResponse.json({ exists });
    }
    if (check === "nationalId") {
      const exists = await checkNationalIdExists(value);
      return NextResponse.json({ exists });
    }
    return NextResponse.json({ error: "Invalid check" }, { status: 400 });
  } catch (e) {
    console.error("admin/onboarding GET:", e);
    return NextResponse.json(
      { error: "Check failed" },
      { status: 500 }
    );
  }
}

type CreateBody = {
  username?: string;
  password?: string;
  fullName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  accountType?: string;
  initialBalance?: number;
};

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  const fullName = (body.fullName ?? "").trim();
  const nationalId = (body.nationalId ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim();
  const accountType = body.accountType ?? "";
  const initialBalance = Number(body.initialBalance ?? 0);

  if (!username || !password || !fullName || !nationalId || !phone || !email) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  if (accountType !== "wadi_ah" && accountType !== "mudarabah") {
    return NextResponse.json(
      { success: false, message: "Invalid account type" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(initialBalance) || initialBalance < 0) {
    return NextResponse.json(
      { success: false, message: "Invalid initial balance" },
      { status: 400 }
    );
  }

  try {
    const result = await createCustomerAccount({
      username,
      password,
      fullName,
      nationalId,
      phone,
      email,
      accountType,
      initialBalance,
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to create account";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
