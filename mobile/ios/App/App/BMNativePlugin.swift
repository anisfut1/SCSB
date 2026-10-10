import Foundation
import Capacitor
import Security
import CryptoKit
import AuthenticationServices
import UserNotifications

/// Plugin natif de Ball Manager (docs/IOS_SECURITY.md) :
/// - Keychain : secret de session d'appareil, `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`
///   (jamais sauvegardé vers un autre appareil, lisible après le premier déverrouillage) ;
/// - PKCE (RFC 7636, S256) et `state` générés ici avec CryptoKit / SecRandomCopyBytes ;
/// - ASWebAuthenticationSession : « Continuer avec Ball Manager » depuis Safari ;
/// - badge de l'icône.
@objc(BMNativePlugin)
public class BMNativePlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "BMNativePlugin"
    public let jsName = "BMNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "secureGet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureRemove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createPkce", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "webAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearBadge", returnType: CAPPluginReturnPromise),
    ]

    private let service = "fr.ballmanager.app.session"
    private var authSession: ASWebAuthenticationSession?

    // MARK: Keychain

    private func baseQuery(_ key: String) -> [String: Any] {
        return [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }

    @objc func secureGet(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key manquant") }
        var query = baseQuery(key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return call.resolve(["value": NSNull()]) }
        guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
            return call.reject("Lecture du trousseau impossible (\(status))")
        }
        call.resolve(["value": value])
    }

    @objc func secureSet(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value"), let data = value.data(using: .utf8) else {
            return call.reject("key / value manquants")
        }
        let query = baseQuery(key)
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var insert = query
            insert.merge(attributes) { _, new in new }
            status = SecItemAdd(insert as CFDictionary, nil)
        }
        status == errSecSuccess ? call.resolve() : call.reject("Écriture du trousseau impossible (\(status))")
    }

    @objc func secureRemove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key manquant") }
        let status = SecItemDelete(baseQuery(key) as CFDictionary)
        (status == errSecSuccess || status == errSecItemNotFound) ? call.resolve() : call.reject("Suppression du trousseau impossible (\(status))")
    }

    // MARK: PKCE

    private func randomBase64Url(_ count: Int) -> String? {
        var bytes = [UInt8](repeating: 0, count: count)
        guard SecRandomCopyBytes(kSecRandomDefault, count, &bytes) == errSecSuccess else { return nil }
        return base64Url(Data(bytes))
    }

    private func base64Url(_ data: Data) -> String {
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    @objc func createPkce(_ call: CAPPluginCall) {
        guard let verifier = randomBase64Url(32), let state = randomBase64Url(16) else { return call.reject("Aléa indisponible") }
        let challenge = base64Url(Data(SHA256.hash(data: Data(verifier.utf8))))
        call.resolve(["verifier": verifier, "challenge": challenge, "state": state])
    }

    // MARK: ASWebAuthenticationSession

    @objc func webAuth(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString), url.scheme == "https",
              let scheme = call.getString("callbackScheme") else {
            return call.reject("Paramètres de connexion invalides")
        }
        DispatchQueue.main.async {
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callbackURL, error in
                self?.authSession = nil
                if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
                    return call.reject("cancelled", "CANCELLED")
                }
                guard let callbackURL = callbackURL else { return call.reject(error?.localizedDescription ?? "Connexion interrompue") }
                call.resolve(["url": callbackURL.absoluteString])
            }
            session.presentationContextProvider = self
            // Partage la session de Safari (cookies persistants) : c'est ce qui permet « Continuer avec Ball Manager ».
            session.prefersEphemeralWebBrowserSession = false
            self.authSession = session
            if !session.start() { call.reject("Impossible d'ouvrir la connexion") }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }

    // MARK: Badge

    @objc func clearBadge(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if #available(iOS 16.0, *) {
                UNUserNotificationCenter.current().setBadgeCount(0) { _ in call.resolve() }
            } else {
                UIApplication.shared.applicationIconBadgeNumber = 0
                call.resolve()
            }
        }
    }
}
