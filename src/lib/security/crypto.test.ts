import { describe, expect, it } from "vitest";
import { decryptSecret, DecryptionError, encryptSecret } from "./crypto";

describe("encryptSecret / decryptSecret", () => {
  it("round-trip : déchiffre exactement ce qui a été chiffré", () => {
    const payload = encryptSecret("mon-mot-de-passe-fbi");
    expect(decryptSecret(payload)).toBe("mon-mot-de-passe-fbi");
  });

  it("produit un IV différent à chaque chiffrement (pas de réutilisation de nonce)", () => {
    const a = encryptSecret("secret");
    const b = encryptSecret("secret");
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("ne contient jamais le texte en clair dans le ciphertext encodé", () => {
    const payload = encryptSecret("mot-de-passe-tres-secret");
    expect(payload.ciphertext).not.toContain("mot-de-passe-tres-secret");
  });

  it("lève DecryptionError si le ciphertext est altéré", () => {
    const payload = encryptSecret("secret");
    const tampered = { ...payload, ciphertext: Buffer.from("altere-completement").toString("base64") };
    expect(() => decryptSecret(tampered)).toThrow(DecryptionError);
  });

  it("lève DecryptionError si le tag d'authentification est altéré", () => {
    const payload = encryptSecret("secret");
    const tampered = { ...payload, authTag: Buffer.alloc(16, 1).toString("base64") };
    expect(() => decryptSecret(tampered)).toThrow(DecryptionError);
  });

  it("gère une chaîne vide et des caractères unicode", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("");
    expect(decryptSecret(encryptSecret("éàü€😀"))).toBe("éàü€😀");
  });
});
