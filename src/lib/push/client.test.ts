import { describe, expect, it } from "vitest";
import { pushEnabled, urlBase64ToUint8Array } from "./client";

describe("Web Push (préparé, inactif)", () => {
  it("inactif par défaut : aucun abonnement possible sans configuration", () => {
    expect(pushEnabled()).toBe(false);
  });
  it("décode une clé VAPID base64url", () => {
    expect(Array.from(urlBase64ToUint8Array("SGVsbG8_Pz8-"))).toEqual(Array.from(Buffer.from("SGVsbG8/Pz8+", "base64")));
  });
});
