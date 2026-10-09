import { describe, expect, it } from "vitest";
import { detectInstallEnvironment, iosNeedsSafari } from "./platform";

const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPHONE_INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 Instagram 330.0.0.0";
const IPHONE_WKWEBVIEW = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const ANDROID_WEBVIEW = "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36";
const IPAD_DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

describe("detectInstallEnvironment", () => {
  it("iPhone Safari", () => {
    const env = detectInstallEnvironment({ userAgent: IPHONE_SAFARI });
    expect(env).toMatchObject({ os: "ios", browser: "safari", inAppBrowser: null, standalone: false });
    expect(iosNeedsSafari(env)).toBe(false);
  });
  it("navigateur intégré Instagram → à ouvrir dans Safari", () => {
    const env = detectInstallEnvironment({ userAgent: IPHONE_INSTAGRAM });
    expect(env.inAppBrowser).toBe("Instagram");
    expect(iosNeedsSafari(env)).toBe(true);
  });
  it("WKWebView sans marqueur (vue intégrée type WhatsApp) détectée", () => {
    expect(detectInstallEnvironment({ userAgent: IPHONE_WKWEBVIEW }).inAppBrowser).not.toBeNull();
  });
  it("Chrome iOS : pas intégré, mais Safari recommandé", () => {
    const env = detectInstallEnvironment({ userAgent: IPHONE_CHROME });
    expect(env).toMatchObject({ os: "ios", browser: "chrome", inAppBrowser: null });
    expect(iosNeedsSafari(env)).toBe(true);
  });
  it("Android Chrome et WebView", () => {
    expect(detectInstallEnvironment({ userAgent: ANDROID_CHROME })).toMatchObject({ os: "android", browser: "chrome", inAppBrowser: null });
    expect(detectInstallEnvironment({ userAgent: ANDROID_WEBVIEW }).inAppBrowser).not.toBeNull();
  });
  it("iPadOS qui se présente comme un Mac", () => {
    expect(detectInstallEnvironment({ userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 5 }).os).toBe("ios");
    expect(detectInstallEnvironment({ userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 0 }).os).toBe("other");
  });
  it("mode standalone reconnu", () => {
    expect(detectInstallEnvironment({ userAgent: IPHONE_SAFARI, standalone: true }).standalone).toBe(true);
  });
});
