import { get } from "@vercel/edge-config";

export async function isRegistrationAllowed(): Promise<boolean> {
  try {
    const value = await get("vph-allow-register");
    return value === true;
  } catch {
    // If edge config is unavailable, default to false
    return false;
  }
}
