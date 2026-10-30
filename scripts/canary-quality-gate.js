
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateCanary } from '../src/observability/canary-quality-gate.js';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const snapshotPath = process.argv[2];

if (!snapshotPath) {
  console.error(
    'Usage: node scripts/canary-quality-gate.js <snapshot.json>',
  );
  process.exitCode = 3;
} else {
  try {
    const slo = JSON.parse(
      await readFile(
        path.join(root, 'observability/canary-slo.json'),
        'utf8',
      ),
    );

    const snapshot = JSON.parse(
      await readFile(path.resolve(snapshotPath), 'utf8'),
    );

    const result = evaluateCanary(snapshot, slo);

    console.log(JSON.stringify(result, null, 2));

    if (result.decision === 'pause') {
      process.exitCode = 1;
    } else if (result.decision === 'abort') {
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`Quality gate failed: ${error.message}`);
    process.exitCode = 3;
  }
}
