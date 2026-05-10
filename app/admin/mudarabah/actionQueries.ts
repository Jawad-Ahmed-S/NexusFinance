"use server";

import {
  callCreateMudarabahCycle,
  callLockMudarabahCycle,
  callSettleMudarabahCycle,
} from "../lib/queries";

export async function createCycleAction() {
  return await callCreateMudarabahCycle();
}

export async function lockCycleAction() {
  return await callLockMudarabahCycle();
}

export async function settleCycleAction(formData: FormData) {
  const percent = parseFloat(formData.get("percent") as string);
  if (isNaN(percent) || percent < -100 || percent > 100) {
    return { status: "ERROR", message: "Invalid profit/loss percent" };
  }
  return await callSettleMudarabahCycle(percent);
}