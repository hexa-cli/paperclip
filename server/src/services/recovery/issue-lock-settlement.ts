import type { Db } from "@paperclipai/db";
import type { OwnerProof } from "../owner-proof.js";
import type { InProgressRecord, SettleOutcome } from "./ownership-registry.js";

/** Settle a task lock only after the shared reconciler proves its run ended. */
export async function settleIssueLock(db: Db, record: InProgressRecord,
  _context: { now: Date; proof: OwnerProof }): Promise<SettleOutcome> {
  if (record.owner.kind !== "run" || !record.companyId || !record.issueId) {
    return { settled: false, reason: "owner_not_a_run" };
  }

  // Reuse the guarded lock sweep: it rechecks both lock owners and preserves
  // same-run resumes, live runs, explicit retry claims, and manual holds.
  const { recoveryService } = await import("./service.js");
  const result = await recoveryService(db, { enqueueWakeup: async () => null })
    .sweepStaleIssueLocks({ companyId: record.companyId, issueId: record.issueId });
  return result.issueIds.includes(record.issueId)
    ? { settled: true, reason: "stale_lock_cleared" }
    : { settled: false, reason: "lock_still_needed" };
}
