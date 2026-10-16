import StoreKit
import SwiftUI

/// Credits: balance (server truth), cost table, usage history, pay-as-you-go packs in FCFA.
struct CreditsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var historyFilter = "Tout"

    private var transactions: [CreditTransaction] {
        store.transactions
            .filter {
                switch historyFilter {
                case "Dépensés": return $0.amount < 0
                case "Ajoutés": return $0.amount > 0
                default: return true
                }
            }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var spentThisMonth: Int {
        let start = Calendar.current.date(from: Calendar.current.dateComponents([.year, .month], from: Date())) ?? .daysAgo(30)
        return store.transactions.filter { $0.amount < 0 && $0.createdAt >= start }.reduce(0) { $0 - $1.amount }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                hero.padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 10) {
                    StatTile(label: "Dépensés ce mois-ci", value: spentThisMonth.formatted(.number.locale(Locale(identifier: "fr_FR"))), icon: "arrow.down.right", tint: MSColor.warning)
                    StatTile(label: "Pack le moins cher", value: store.price(Market.usagePacks[0].priceXof), icon: "bag", tint: MSColor.success) {
                        router.present(.buyCredits)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Coût des actions")
                costTable.padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Historique d'utilisation", subtitle: "\(store.transactions.count) transaction\(store.transactions.count == 1 ? "" : "s")")
                ChipRow(options: ["Tout", "Dépensés", "Ajoutés"], selection: $historyFilter)
                if transactions.isEmpty {
                    EmptyStateView(icon: "clock.arrow.circlepath", title: "Aucune activité pour l'instant", message: "Générez quelque chose et cela apparaîtra ici.", ctaTitle: "Ouvrir le Studio") {
                        router.select(.studio)
                    }
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(transactions.enumerated()), id: \.element.id) { i, tx in
                            TransactionRow(tx: tx)
                            if i < transactions.count - 1 {
                                Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
                            }
                        }
                    }
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .padding(.horizontal, MSSpacing.gutter)
                    .animation(MSAnimation.gentle, value: transactions.map { $0.id })
                }
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .task { await API.refreshAccount(store) }
        .refreshable { await API.refreshAccount(store) }
        .navigationTitle("Crédits")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.fill").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.highlight)
                    Text("CRÉDITS DISPONIBLES").font(.system(size: 11, weight: .semibold)).tracking(0.8).foregroundStyle(MSColor.text2)
                }
                Spacer()
                MSBadge(text: store.plan.title, tone: .accent)
            }
            Text(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR"))))
                .font(.system(size: 52, weight: .bold, design: .rounded))
                .tracking(-1.5)
                .foregroundStyle(MSColor.text)
                .contentTransition(.numericText())
                .animation(MSAnimation.snappy, value: store.credits)
            Text(store.credits < 20 ? "Solde faible. Rechargez pour continuer à générer." : "Environ \(store.credits / AIModels.imageModel(nil).credits) photos produit ou \(store.credits / AIModels.ugcCredits(seconds: 8)) vidéos UGC de 8 s.")
                .msBody(14)
            HStack(spacing: 10) {
                MSButton(title: "Recharger", icon: "plus") { router.present(.buyCredits) }
                MSButton(title: "Forfaits", icon: "creditcard", style: .secondary, fullWidth: false) { router.push(.pricing) }
            }
        }
        .padding(20)
        .background(
            ZStack {
                MSColor.card
                LinearGradient(colors: [MSColor.accent.opacity(0.22), .clear], startPoint: .topTrailing, endPoint: .bottomLeading)
            }
            .clipShape(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
        )
        .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
    }

    private var costTable: some View {
        VStack(spacing: 0) {
            costRow("Photo produit Standard", "Votre produit reste identique", cost: AIModels.imageModel("marketing-studio-1k").credits, icon: "photo.on.rectangle.angled", each: "par image")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Image Éco", "Idées et portraits, très économique", cost: AIModels.imageModel("soul-2").credits, icon: "person.crop.square", each: "par image")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Vidéo UGC", "Créateur IA · 8 secondes", cost: AIModels.ugcCredits(seconds: 8), icon: "video", each: "par vidéo")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Vidéo Éco", "8 secondes", cost: AIModels.videoCredits("wan-3.0-prime", seconds: 8), icon: "film", each: "par vidéo")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Agrandissement 4K", "Même image, plus nette", cost: AIModels.creditsFor(usd: AIModels.upscaleUsd), icon: "arrow.up.left.and.arrow.down.right", each: "par image")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Textes et accroches", "Tous les outils de rédaction", cost: 0, icon: "text.alignleft", each: "gratuit")
        }
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private func costRow(_ title: String, _ subtitle: String, cost: Int, icon: String, each: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                .frame(width: 30, height: 30).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                Text(subtitle).msCaption()
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 3) {
                    Image(systemName: "bolt.fill").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.highlight)
                    Text("\(cost)").font(.system(size: 15, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text)
                }
                Text(each).msCaption()
            }
        }
        .padding(.horizontal, 14)
        .frame(height: 58)
    }
}

struct TransactionRow: View {
    var tx: CreditTransaction
    private var isSpend: Bool { tx.amount < 0 }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isSpend ? "arrow.down.right" : "arrow.up.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(isSpend ? MSColor.text2 : MSColor.success)
                .frame(width: 30, height: 30)
                .background((isSpend ? MSColor.elevated : MSColor.success.opacity(0.12)), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.reason).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                Text(tx.createdAt.relativeString).msCaption()
            }
            Spacer()
            Text((isSpend ? "" : "+") + tx.amount.formatted(.number.locale(Locale(identifier: "fr_FR"))))
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(isSpend ? MSColor.text : MSColor.success)
        }
        .padding(.horizontal, 14)
        .frame(height: 56)
    }
}

// MARK: - Buy credits (AppSheet.buyCredits)

/// Credit packs bought with the App Store (in-app purchase). The server verifies each purchase with Apple.
struct BuyCreditsSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @EnvironmentObject private var auth: AuthService
    @ObservedObject private var shop = StoreService.shared
    @State private var busy: String?

    var body: some View {
        BottomSheetContainer(title: "Recharger des crédits", subtitle: "Paiement sécurisé par l’App Store. Les crédits n’expirent pas.") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    if shop.packs.isEmpty {
                        Text(shop.loaded ? "Les achats ne sont pas encore disponibles." : "Chargement…").msBody(14).padding(.top, 20)
                    }
                    ForEach(shop.packs, id: \.id) { p in
                        StoreProductRow(product: p, credits: StoreService.credits[p.id] ?? 0, subscription: false, current: false, busy: busy == p.id) { buy(p) }
                    }
                    MSButton(title: "Voir les abonnements", icon: "arrow.triangle.2.circlepath", style: .ghost) { router.dismissSheet(); router.push(.pricing, on: .more) }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 16)
            }
        }
        .task { if !shop.loaded { await shop.load() } }
    }

    private func buy(_ p: Product) {
        guard let user = auth.user else { return }
        busy = p.id
        Task {
            defer { busy = nil }
            do {
                switch try await shop.purchase(p, userId: user.id) {
                case .credited(let n):
                    await API.refreshAccount(store)
                    MSHaptic.success()
                    router.toast(n > 0 ? "+\(n) crédits ajoutés" : "Achat enregistré", style: .success, icon: "bolt.fill")
                    router.dismissSheet()
                case .pending: router.toast("Achat en attente d’approbation", style: .info)
                case .cancelled: break
                }
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
        }
    }
}

/// One App Store product row (pack or monthly pass).
struct StoreProductRow: View {
    var product: Product
    var credits: Int
    var subscription: Bool
    var current: Bool
    var busy: Bool
    var action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(product.displayName.isEmpty ? "\(credits) crédits" : product.displayName).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                Text(subscription ? "\(credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits chaque mois" : "\(credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits · sans expiration").msCaption()
            }
            Spacer()
            MSButton(title: current ? "Actuel" : product.displayPrice + (subscription ? " / mois" : ""), style: current ? .secondary : .primary, size: .compact, isLoading: busy, isDisabled: current || busy, fullWidth: false, action: action)
        }
        .padding(14)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }
}
