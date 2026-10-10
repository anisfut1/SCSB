import UIKit
import Capacitor

/// Contrôleur principal : enregistre le plugin natif de l'app (Keychain, connexion Safari, badge).
class BMViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(BMNativePlugin())
    }
}
