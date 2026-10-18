import { spawnSync } from 'node:child_process';
const suites = ['access', 'import', 'place-browser', 'planner-dates', 'trip-photo', 'itinerary-time', 'itinerary-cards'];
for (const suite of suites) {
  const result = spawnSync(process.execPath, [`scripts/test-${suite}.mjs`], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PASS: ${suites.length} application test suites`);
