import packageJson from "../package.json";

/** Canonical app version from root package.json (keeps Settings label in sync). */
export const APP_VERSION: string = packageJson.version;
