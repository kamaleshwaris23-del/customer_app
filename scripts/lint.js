import { spawnSync } from 'node:child_process';
import process from 'node:process';

const isCI = Boolean(process.env.CI);
const isWindows = process.platform === 'win32';

// Attempt to run Oxlint via npx using local dependency
const oxlint = spawnSync('npx --no-install oxlint', {
  shell: true,
  encoding: 'utf-8',
});

// If Oxlint succeeded (0 errors), output findings and exit cleanly
if (oxlint.status === 0) {
  if (oxlint.stdout) process.stdout.write(oxlint.stdout);
  process.exit(0);
}

const stderr = oxlint.stderr || '';
const stdout = oxlint.stdout || '';
const combinedOutput = stdout + '\n' + stderr;

// Check whether the failure is specifically caused by Windows Application Control blocking the native .node binary
const isNativeBinaryBlocked =
  isWindows &&
  !isCI &&
  (combinedOutput.includes('Application Control policy has blocked this file') ||
    combinedOutput.includes('Cannot find native binding') ||
    combinedOutput.includes('ERR_DLOPEN_FAILED'));

if (isNativeBinaryBlocked) {
  console.warn(
    '\n[lint] Notice: Local Windows Application Control policy blocked native Oxlint binary execution.'
  );
  console.warn(
    '[lint] Falling back to TypeScript compiler check (tsc -b) for local validation.'
  );
  console.warn(
    '       Important: tsc -b validates TypeScript types and syntax, but is not a full replacement for Oxlint rules.\n'
  );

  const tsc = spawnSync('npx --no-install tsc -b', {
    shell: true,
    stdio: 'inherit',
  });

  process.exit(tsc.status ?? 1);
}

// In CI (GitHub Actions/Linux) or when Oxlint fails due to genuine lint rule violations,
// forward the complete output and exit with Oxlint failure status code
if (stdout) process.stdout.write(stdout);
if (stderr) process.stderr.write(stderr);
process.exit(oxlint.status ?? 1);

