import type { heartbeatRuns } from "@paperclipai/db";
import { proveOwnerGone, type LocalOwnerStamp, type OwnerProof, type ProcessProbe } from "./owner-proof.js";
import { runProcessOwnerStamp } from "./native-runtime/native-owner-stamps.js";

export type RunProcessIdentity = Pick<typeof heartbeatRuns.$inferSelect,
  "processPid" | "processGroupId" | "processStartedAt" | "processHostHash">;

export function lostProcessOwnerStamp(run: RunProcessIdentity, scope: string): LocalOwnerStamp | null {
  const pid = run.processPid ?? run.processGroupId ?? null;
  if (pid === null) return null;
  return runProcessOwnerStamp({ ...run, processPid: pid }, scope, { legacyFallback: true });
}

export async function proveRunProcessGone(run: RunProcessIdentity, scope: string,
  probe?: ProcessProbe): Promise<OwnerProof | null> {
  const stamp = lostProcessOwnerStamp(run, scope);
  return stamp ? proveOwnerGone(stamp, probe) : null;
}
