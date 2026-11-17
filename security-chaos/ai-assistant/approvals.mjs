// Human-in-the-loop approvals for effect actions (plan P5 mitigation 3).
// In v1 the assistant never executes an effect action; it files a request here. A human decides,
// and if approved the action runs under the HUMAN's identity, not the agent's.
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function requestApproval({ action, args, requestedBy, outDir, autoDecision }) {
  mkdirSync(outDir, { recursive: true });
  const id = `apr-${Date.now()}`;
  const record = {
    id, ts_requested: new Date().toISOString(), action, args,
    requested_by: requestedBy, decision: 'pending', decided_by: null, ts_decided: null,
  };
  // autoDecision lets a non-interactive run (tests, R1 batch) record a deterministic decision.
  // The game day denies injected actions by default; a real operator overrides in the console.
  if (autoDecision) {
    record.decision = autoDecision.decision;      // 'approved' | 'denied'
    record.decided_by = autoDecision.decided_by;  // the human account
    record.ts_decided = new Date().toISOString();
  }
  appendFileSync(join(outDir, 'approvals.jsonl'), `${JSON.stringify(record)}\n`);
  return record;
}
