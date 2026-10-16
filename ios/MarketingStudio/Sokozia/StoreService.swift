import Foundation
import StoreKit

/// In-app purchases (StoreKit 2): credit packs (consumables) and monthly passes (auto-renewable).
/// Each purchase carries the user id (appAccountToken); the server re-fetches it from Apple and
/// credits it once (POST /api/iap/transaction). Credits = Apple net payout at 10 FCFA per credit.
@MainActor
final class StoreService: ObservableObject {
    static let shared = StoreService()

    static let packIDs = ["com.sokozia.app.credits.99", "com.sokozia.app.credits.250", "com.sokozia.app.credits.501", "com.sokozia.app.credits.1002"]
    static let subscriptionIDs = ["com.sokozia.app.sub.starter", "com.sokozia.app.sub.pro", "com.sokozia.app.sub.business"]
    /// Same table as the server (lib/billing/apple.ts).
    static let credits: [String: Int] = [
        "com.sokozia.app.credits.99": 99, "com.sokozia.app.credits.250": 250, "com.sokozia.app.credits.501": 501, "com.sokozia.app.credits.1002": 1002,
        "com.sokozia.app.sub.starter": 500, "com.sokozia.app.sub.pro": 1253, "com.sokozia.app.sub.business": 3510,
    ]

    @Published private(set) var packs: [Product] = []
    @Published private(set) var subscriptions: [Product] = []
    @Published private(set) var activeSubscriptionID: String?
    @Published private(set) var loaded = false
    private var updates: Task<Void, Never>?

    private init() {}

    /// Loads products and listens for renewals / purchases made elsewhere. Call once at launch.
    func start() {
        guard updates == nil else { return }
        updates = Task { [weak self] in
            for await result in Transaction.updates { await self?.handle(result) }
        }
        Task { await load() }
    }

    func load() async {
        do {
            let products = try await Product.products(for: Self.packIDs + Self.subscriptionIDs)
            packs = products.filter { Self.packIDs.contains($0.id) }.sorted { $0.price < $1.price }
            subscriptions = products.filter { Self.subscriptionIDs.contains($0.id) }.sorted { $0.price < $1.price }
        } catch {}
        await refreshEntitlements()
        loaded = true
    }

    func refreshEntitlements() async {
        var active: String?
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, Self.subscriptionIDs.contains(t.productID), t.revocationDate == nil { active = t.productID }
        }
        activeSubscriptionID = active
    }

    enum PurchaseOutcome { case credited(Int), pending, cancelled }

    func purchase(_ product: Product, userId: String) async throws -> PurchaseOutcome {
        var options: Set<Product.PurchaseOption> = []
        if let token = UUID(uuidString: userId) { options.insert(.appAccountToken(token)) }
        switch try await product.purchase(options: options) {
        case .success(let result):
            let granted = try await deliver(result)
            await refreshEntitlements()
            return .credited(granted)
        case .pending: return .pending
        case .userCancelled: return .cancelled
        @unknown default: return .cancelled
        }
    }

    private func handle(_ result: VerificationResult<Transaction>) async {
        _ = try? await deliver(result)
        await refreshEntitlements()
    }

    /// Server verification + crediting, then finish the transaction (only once the server accepted it).
    private func deliver(_ result: VerificationResult<Transaction>) async throws -> Int {
        guard case .verified(let t) = result else { throw APIError.failed("Achat non vérifié par l’App Store.") }
        let granted = try await APIClient.redeemAppleTransaction(id: String(t.id))
        await t.finish()
        return granted
    }
}
