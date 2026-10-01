import Foundation
import UIKit

/// One generation request, same shape as the web app's /api/hf/generate body.
struct GenerationRequest: Encodable {
    enum Kind: String, Encodable { case image, video }
    var kind: Kind
    var model: String?
    var prompt: String
    /// Image: product photo (edit mode). Video: first frame.
    var imageUrls: [String]?
    var aspectRatio: String?
    var durationSec: Int?
    /// Lighter video (480p) for slow connections and WhatsApp.
    var light: Bool?
    /// Image only: render at very high definition.
    var upscale: Bool?
    /// Video only: reference images (creator sheet, product) for reference-to-video.
    var references: [String]?
}

struct GenerationJob: Decodable {
    var requestId: String
    var status: String
    var images: [String]
    var videoUrl: String?
    var credits: Int?

    var isFinal: Bool { ["completed", "failed", "nsfw", "canceled"].contains(status) }
}

struct AccountSummary: Decodable {
    struct Entry: Decodable {
        var id: String
        var amount: Int
        var action: String
        var description: String
        var created_at: String
    }
    var credits: Int
    var plan: String
    var ledger: [Entry]
}

enum APIError: LocalizedError {
    case insufficientCredits(String)
    case signedOut
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .insufficientCredits(let m): return m
        case .signedOut: return "Connectez-vous pour continuer."
        case .failed(let m): return m
        }
    }
}

/// sokozia.com API (same routes as the web app). Every call sends the InsForge access token;
/// credits are computed, debited and refunded on the server.
@MainActor
enum APIClient {
    private static let pollInterval: Duration = .seconds(4)
    private static let maxWait: TimeInterval = 15 * 60

    private static let failures = [
        "failed": "La génération a échoué. Vos crédits ont été rendus, vous pouvez réessayer.",
        "nsfw": "Le contenu a été refusé par la modération. Modifiez la description ou la photo.",
        "canceled": "La génération a été annulée.",
    ]

    // MARK: Account

    static func account() async throws -> AccountSummary {
        try await call("api/account")
    }

    // MARK: Generation

    /// Starts a job and polls until it finishes. Returns only on success with at least one output.
    static func run(_ req: GenerationRequest, onStatus: ((String) -> Void)? = nil) async throws -> GenerationJob {
        var job: GenerationJob = try await call("api/hf/generate", method: "POST", json: req)
        let started = Date()
        onStatus?(job.status)
        while !job.isFinal {
            if Date().timeIntervalSince(started) > maxWait {
                throw APIError.failed("La génération prend trop de temps. Retrouvez-la plus tard dans vos générations.")
            }
            try await Task.sleep(for: pollInterval)
            job = try await call("api/hf/requests/\(job.requestId)")
            onStatus?(job.status)
        }
        guard job.status == "completed", !job.images.isEmpty || job.videoUrl != nil else {
            throw APIError.failed(failures[job.status] ?? failures["failed"]!)
        }
        return job
    }

    // MARK: Upload

    /// Shrinks a photo (max 2000 px, JPEG) under the 4 MB limit and stores it in the user's space.
    /// Returns a public URL the generation models can read.
    static func upload(_ image: UIImage) async throws -> String {
        guard let data = jpeg(image) else { throw APIError.failed("Impossible de lire cette photo.") }
        struct Uploaded: Decodable { var url: String }
        let r: Uploaded = try await call("api/hf/uploads", method: "POST", body: data, contentType: "image/jpeg")
        return r.url
    }

    private static func jpeg(_ image: UIImage) -> Data? {
        let maxSide: CGFloat = 2000
        let size = image.size
        let scale = min(1, maxSide / max(size.width, size.height))
        let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: target)) }
        var quality: CGFloat = 0.88
        var data = resized.jpegData(compressionQuality: quality)
        while let d = data, d.count > 3_800_000, quality > 0.4 {
            quality -= 0.15
            data = resized.jpegData(compressionQuality: quality)
        }
        return data
    }

    // MARK: Transport

    private static func call<T: Decodable>(_ path: String, method: String = "GET", json: Encodable? = nil, body: Data? = nil, contentType: String? = nil) async throws -> T {
        var req = URLRequest(url: SokoziaConfig.siteURL.appendingPathComponent(path))
        req.httpMethod = method
        req.timeoutInterval = 60
        req.cachePolicy = .reloadIgnoringLocalCacheData
        if let json {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(json)
        } else if let body {
            req.setValue(contentType, forHTTPHeaderField: "Content-Type")
            req.httpBody = body
        }

        let auth = AuthService.shared
        guard auth.isSignedIn else { throw APIError.signedOut }
        var (data, status) = try await send(req, token: try await auth.validAccessToken())
        if status == 401 {
            // Token rejected: refresh once and retry.
            try await auth.refresh()
            (data, status) = try await send(req, token: try await auth.validAccessToken())
        }
        guard (200..<300).contains(status) else {
            let message = (try? JSONDecoder().decode(ServerMessage.self, from: data))?.error ?? "Erreur serveur (\(status)). Réessayez."
            if status == 402 { throw APIError.insufficientCredits(message) }
            if status == 401 { auth.clear(); throw APIError.signedOut }
            throw APIError.failed(message)
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw APIError.failed("Réponse inattendue du serveur. Réessayez.") }
    }

    private struct ServerMessage: Decodable { var error: String? }

    private static func send(_ request: URLRequest, token: String) async throws -> (Data, Int) {
        var req = request
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            return (data, (response as? HTTPURLResponse)?.statusCode ?? 0)
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw APIError.failed("Pas de connexion internet. Vérifiez votre réseau et réessayez.")
        }
    }
}
