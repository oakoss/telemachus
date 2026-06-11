import { startStack } from '@oakoss/test-postgres';
import { spawn } from 'node:child_process';

// Playwright starts `webServer` before globalSetup runs, so containers must
// exist before `playwright test` runs — a wrapper script, not a setup hook.
// REQUIRE_ELECTRIC=1 turns Electric spec skips into failures since the stack
// is guaranteed here.
const stack = await startStack();

try {
  process.exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn('playwright', ['test', ...process.argv.slice(2)], {
      env: {
        ...process.env,
        DATABASE_URL: stack.databaseUrl,
        ELECTRIC_URL: stack.electricUrl,
        REQUIRE_ELECTRIC: '1',
      },
      stdio: 'inherit',
    });
    child.on('error', (cause) => {
      reject(
        new Error(
          'Failed to spawn `playwright` — is @playwright/test installed and on PATH?',
          { cause },
        ),
      );
    });
    // A signal kill (segfault, OOM) reports code === null; surface the signal
    // instead of coercing it into an ordinary test failure.
    child.on('close', (code, signal) => {
      if (code === null) reject(new Error(`playwright killed by ${signal}`));
      else resolve(code);
    });
  });
} finally {
  // Always reclaim the stack, even when spawn rejects. A teardown failure must
  // not overwrite the Playwright exit code, so it's logged rather than thrown.
  try {
    await stack.stop();
  } catch (error) {
    process.stderr.write(`stack teardown failed: ${String(error)}\n`);
  }
}
