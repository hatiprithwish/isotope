import type { ClerkClient } from "@clerk/backend";
import { createClerkClient } from "@clerk/backend";
import EnvConfig from "@/config/EnvConfig";

let clerkClient: ClerkClient | undefined;

export default class ClerkProvider {
  static getClerkClient(env: Env): ClerkClient {
    if (!clerkClient) {
      clerkClient = createClerkClient({
        publishableKey: EnvConfig.clerkPublishableKey(env),
        secretKey: EnvConfig.clerkSecretKey(env),
      });
    }
    return clerkClient;
  }
}
