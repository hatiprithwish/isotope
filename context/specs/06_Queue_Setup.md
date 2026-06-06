Create a queue named `isotope-queue`. Add corresponding DLQ. dlq doesn't need consumer.

Add a consumer worker named `isotope-processor`. Write the boiler plate code for this worker's entry point - `worker/src/processor/index.ts`.

Current `worker/src/index.ts` will move to `worker/src/api/index.ts` along with the existing wrangler.jsonc & worker-configuration file

We need 2 .dev.vars files along with correct examples file for 2 workers.

Update commands in package.json too.

We want code sharing. So all the routes, repos, etc will stay at same place.

Create correct queue bindings in wrangler.jsonc for both workers.

Add CI/CD for this worker in `deploy-worker-{env}.yml` files
