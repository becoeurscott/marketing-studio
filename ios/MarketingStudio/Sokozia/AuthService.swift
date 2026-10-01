import AuthenticationServices
import CryptoKit
import Foundation
import Security
import SwiftUI

/// Signed-in account (no tokens).
struct SessionUser: Codable, Hashable {
    var id: String
    var email: String
    var name: String
}

enum AuthError: LocalizedError {
    /// The account exists but the e-mail is not verified yet: a fresh code was sent.
    case needsVerification(email: String)
    case message(String)
    case cancelled

    var errorDescription: String? {
        switch self {
        case .needsVerification: return "Votre e-mail n’est pas encore vérifié. Entrez le code reçu."
        case .message(let m): return m
        case .cancelled: return nil
        }
    }
}

/// Outcome of a sign-up: either signed in right away, or a 6-digit code was e-mailed.
enum SignUpResult { case signedIn, verifyEmail }

/// InsForge authentication for the native app (mobile flow: tokens in the response body, stored
/// in the Keychain). Same accounts as sokozia.com: Google, e-mail code, e-mail + password.
@MainActor
final class AuthService: NSObject, ObservableObject {
    static let shared = AuthService()

    @Published private(set) var user: SessionUser?
    /// True until the stored session has been checked at launch.
    @Published private(set) var restoring = true

    private var accessToken: String?
    private var refreshToken: String?
    private var refreshTask: Task<Void, Error>?

    var isSignedIn: Bool { user != nil }

    private override init() {
        super.init()
        if let data = Keychain.read(), let saved = try? JSONDecoder().decode(StoredSession.self, from: data) {
            user = saved.user
            accessToken = saved.accessToken
            refreshToken = saved.refreshToken
        }
    }

    /// Validates the stored session once at launch (refreshes the access token if needed).
    func restore() async {
        defer { restoring = false }
        guard refreshToken != nil else { return }
        // A rejected token ends the session (inside refresh); a network error keeps it for a retry.
        _ = try? await validAccessToken()
    }

    // MARK: E-mail + password

    func signIn(email: String, password: String) async throws {
        let email = normalized(email)
        do {
            let r: TokenResponse = try await post("/api/auth/sessions?client_type=mobile", ["email": email, "password": password])
            save(r)
        } catch let AuthHTTPError.status(code, _) where code == 403 {
            try? await postVoid("/api/auth/email/send-verification", ["email": email])
            throw AuthError.needsVerification(email: email)
        }
    }

    func signUp(name: String, email: String, password: String) async throws -> SignUpResult {
        let name = name.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { throw AuthError.message("Indiquez votre nom ou celui de votre boutique.") }
        guard password.count >= 6 else { throw AuthError.message("Le mot de passe doit faire au moins 6 caractères.") }
        let r: TokenResponse = try await post("/api/auth/users?client_type=mobile", ["email": normalized(email), "password": password, "name": name])
        if r.accessToken != nil { save(r); return .signedIn }
        return .verifyEmail
    }

    /// 6-digit code sent after sign-up. Signs the user in on success.
    func verifyEmail(email: String, code: String) async throws {
        let r: TokenResponse = try await post("/api/auth/email/verify?client_type=mobile", ["email": normalized(email), "otp": code.trimmingCharacters(in: .whitespaces)])
        save(r)
    }

    func resendVerification(email: String) async {
        try? await postVoid("/api/auth/email/send-verification", ["email": normalized(email)])
    }

    // MARK: Passwordless e-mail code

    func sendCode(email: String) async throws {
        let email = normalized(email)
        guard email.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#, options: .regularExpression) != nil else {
            throw AuthError.message("Entrez une adresse e-mail valide.")
        }
        try await postVoid("/api/auth/email/send-otp", ["email": email])
    }

    func verifyCode(email: String, code: String, name: String? = nil) async throws {
        var body = ["email": normalized(email), "otp": code.trimmingCharacters(in: .whitespaces), "method": "otp"]
        if let name, !name.isEmpty { body["name"] = name }
        let r: TokenResponse = try await post("/api/auth/sessions?client_type=mobile", body)
        save(r)
    }

    // MARK: Google

    private var webSession: ASWebAuthenticationSession?

    func signInWithGoogle() async throws {
        let verifier = Self.randomVerifier()
        let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URL
        var c = URLComponents(url: SokoziaConfig.authURL.appendingPathComponent("api/auth/oauth/google"), resolvingAgainstBaseURL: false)!
        c.queryItems = [
            URLQueryItem(name: "redirect_uri", value: SokoziaConfig.oauthReturnURL),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "prompt", value: "select_account"),
        ]
        let start: AuthURLResponse = try await send(URLRequest(url: c.url!))
        guard let authURL = URL(string: start.authUrl) else { throw AuthError.message("Connexion Google indisponible.") }

        let callback: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: SokoziaConfig.callbackScheme) { url, error in
                if let url { cont.resume(returning: url) }
                else if let e = error as? ASWebAuthenticationSessionError, e.code == .canceledLogin { cont.resume(throwing: AuthError.cancelled) }
                else { cont.resume(throwing: AuthError.message("Connexion Google interrompue. Réessayez.")) }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            webSession = session
            session.start()
        }
        webSession = nil
        let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems ?? []
        guard let code = items.first(where: { $0.name == "insforge_code" })?.value else {
            throw AuthError.message("Connexion Google refusée. Réessayez.")
        }
        let r: TokenResponse = try await post("/api/auth/oauth/exchange?client_type=mobile", ["code": code, "code_verifier": verifier])
        save(r)
    }

    // MARK: Password reset (code method)

    func sendResetCode(email: String) async {
        try? await postVoid("/api/auth/email/send-reset-password", ["email": normalized(email)])
    }

    /// Exchanges the e-mailed code for a one-time reset token.
    func checkResetCode(email: String, code: String) async throws -> String {
        let r: ResetTokenResponse = try await post("/api/auth/email/exchange-reset-password-token", ["email": normalized(email), "code": code.trimmingCharacters(in: .whitespaces)])
        return r.token
    }

    func resetPassword(token: String, newPassword: String) async throws {
        guard newPassword.count >= 6 else { throw AuthError.message("Le mot de passe doit faire au moins 6 caractères.") }
        try await postVoid("/api/auth/email/reset-password", ["newPassword": newPassword, "otp": token])
    }

    // MARK: Session

    func signOut() async {
        if let refreshToken {
            var req = jsonRequest("/api/auth/logout?client_type=mobile", ["refresh_token": refreshToken])
            if let accessToken { req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization") }
            _ = try? await URLSession.shared.data(for: req)
        }
        clear()
    }

    /// Access token for API calls, refreshed shortly before it expires.
    func validAccessToken() async throws -> String {
        if let accessToken, !Self.isExpiring(accessToken) { return accessToken }
        try await refresh()
        guard let accessToken else { throw AuthHTTPError.status(401, "Session expirée") }
        return accessToken
    }

    /// Called by the API client after a 401: one shared refresh at a time.
    func refresh() async throws {
        if let refreshTask { return try await refreshTask.value }
        guard let refreshToken else { throw AuthHTTPError.status(401, "Session expirée") }
        let task = Task { @MainActor in
            do {
                let r: TokenResponse = try await post("/api/auth/refresh?client_type=mobile", ["refresh_token": refreshToken, "refreshToken": refreshToken])
                save(r)
            } catch let AuthHTTPError.status(code, _) where code == 401 || code == 403 {
                clear()
                throw AuthError.message("Votre session a expiré. Reconnectez-vous.")
            }
        }
        refreshTask = task
        defer { refreshTask = nil }
        try await task.value
    }

    /// Ends the local session (expired or signed out).
    func clear() {
        user = nil
        accessToken = nil
        refreshToken = nil
        Keychain.delete()
    }

    // MARK: - Private

    private struct StoredSession: Codable {
        var user: SessionUser
        var accessToken: String
        var refreshToken: String?
    }

    private struct TokenResponse: Decodable {
        struct Profile: Decodable { var name: String? }
        struct User: Decodable { var id: String; var email: String; var profile: Profile? }
        var accessToken: String?
        var refreshToken: String?
        var user: User?
    }

    private struct AuthURLResponse: Decodable { var authUrl: String }
    private struct ResetTokenResponse: Decodable { var token: String }

    private func save(_ r: TokenResponse) {
        guard let token = r.accessToken else { return }
        accessToken = token
        if let rt = r.refreshToken { refreshToken = rt }
        if let u = r.user {
            user = SessionUser(id: u.id, email: u.email, name: u.profile?.name ?? user?.name ?? "")
        }
        guard let user else { return }
        if let data = try? JSONEncoder().encode(StoredSession(user: user, accessToken: token, refreshToken: refreshToken)) {
            Keychain.write(data)
        }
    }

    private func normalized(_ email: String) -> String { email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }

    private func jsonRequest(_ path: String, _ body: [String: String]) -> URLRequest {
        var req = URLRequest(url: URL(string: path, relativeTo: SokoziaConfig.authURL)!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        req.timeoutInterval = 30
        return req
    }

    private func post<T: Decodable>(_ path: String, _ body: [String: String]) async throws -> T {
        try await send(jsonRequest(path, body))
    }

    private func postVoid(_ path: String, _ body: [String: String]) async throws {
        let _: Empty = try await send(jsonRequest(path, body))
    }

    private struct Empty: Decodable {}

    private func send<T: Decodable>(_ req: URLRequest) async throws -> T {
        let data: Data, response: URLResponse
        do { (data, response) = try await URLSession.shared.data(for: req) }
        catch { throw AuthError.message("Pas de connexion internet. Réessayez.") }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let msg = (try? JSONDecoder().decode(ServerError.self, from: data))?.message ?? ""
            throw AuthHTTPError.status(status, Self.french(msg, status: status))
        }
        if T.self == Empty.self { return Empty() as! T }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw AuthError.message("Réponse inattendue du serveur. Réessayez.") }
    }

    private struct ServerError: Decodable { var message: String? }

    /// Same wording as the web app.
    static func french(_ message: String, status: Int) -> String {
        let m = message.lowercased()
        if m.contains("already") { return "Un compte existe déjà avec cet e-mail. Connectez-vous." }
        if m.contains("verif") { return "Votre e-mail n’est pas encore vérifié. Entrez le code reçu." }
        if m.contains("invalid") || m.contains("credential") || m.contains("password") { return "E-mail ou mot de passe incorrect." }
        if m.contains("otp") || m.contains("code") || m.contains("expired") { return "Code incorrect ou expiré." }
        if m.contains("too many") || m.contains("rate") || status == 429 { return "Trop de tentatives. Patientez une minute." }
        return "Une erreur est survenue. Réessayez."
    }

    private static func randomVerifier() -> String {
        var bytes = [UInt8](repeating: 0, count: 48)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes).base64URL
    }

    /// True when the JWT expires within a minute (or can't be read).
    private static func isExpiring(_ jwt: String) -> Bool {
        let parts = jwt.split(separator: ".")
        guard parts.count == 3 else { return true }
        var b64 = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64 += "=" }
        guard let data = Data(base64Encoded: b64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let exp = json["exp"] as? Double else { return true }
        return Date(timeIntervalSince1970: exp).timeIntervalSinceNow < 60
    }
}

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first ?? ASPresentationAnchor()
        }
    }
}

enum AuthHTTPError: LocalizedError {
    case status(Int, String)
    var errorDescription: String? {
        switch self { case .status(_, let m): return m.isEmpty ? "Une erreur est survenue. Réessayez." : m }
    }
}

private extension Data {
    var base64URL: String {
        base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}

/// One Keychain item holding the session (this device only, available after first unlock).
private enum Keychain {
    private static let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "com.sokozia.session",
        kSecAttrAccount as String: "insforge",
    ]

    static func read() -> Data? {
        var q = query
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        return SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess ? out as? Data : nil
    }

    static func write(_ data: Data) {
        delete()
        var q = query
        q[kSecValueData as String] = data
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(q as CFDictionary, nil)
    }

    static func delete() { SecItemDelete(query as CFDictionary) }
}
