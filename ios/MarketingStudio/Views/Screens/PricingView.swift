import StoreKit
import SwiftUI

/// Monthly passes bought with the App Store (auto-renewable subscriptions). Credits are added
/// at each renewal after the server verifies the transaction with Apple.
struct PricingView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @EnvironmentObject private var auth: AuthService
    @ObservedObject private var shop = StoreService.shared
    @State private var busy: String?

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Abonnements").msTitle(30)
                    Text("Des crédits ajoutés chaque mois. Paiement par l’App Store, annulable à tout moment dans vos réglages Apple.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 10) {
                    if shop.subscriptions.isEmpty {
                        Text(shop.loaded ? "Les abonnements ne sont pas encore disponibles." : "Chargement…").msBody(14)
                    }
                    ForEach(shop.subscriptions, id: \.id) { p in
                        StoreProductRow(product: p, credits: StoreService.credits[p.id] ?? 0, subscription: true, current: shop.activeSubscriptionID == p.id, busy: busy == p.id) { buy(p) }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                if shop.activeSubscriptionID != nil {
                    MSButton(title: "Gérer mon abonnement", icon: "gearshape", style: .secondary) {
                        Task { if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene { try? await StoreKit.AppStore.showManageSubscriptions(in: scene) } }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
                MSButton(title: "Plutôt un pack de crédits", icon: "bag", style: .ghost) { router.present(.buyCredits) }
                    .padding(.horizontal, MSSpacing.gutter)
                Button("Restaurer mes achats") { Task { try? await StoreKit.AppStore.sync(); await shop.refreshEntitlements() } }
                    .font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                    .padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Tarifs")
        .navigationBarTitleDisplayMode(.inline)
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
                    router.toast(n > 0 ? "Abonné ! +\(n) crédits" : "Abonnement enregistré", style: .success, icon: "bolt.fill")
                case .pending: router.toast("Achat en attente d’approbation", style: .info)
                case .cancelled: break
                }
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
        }
    }
}

/// Price per month for the given billing cycle.
extension Plan {
    /// FCFA per month for the given billing cycle (shown with `AppStore.price`).
    func price(yearly: Bool) -> Int { yearly ? Int((Double(monthlyPriceXof) * 0.8 / 100).rounded()) * 100 : monthlyPriceXof }
    var tagline: String {
        switch self {
        case .starter: return "Pour tester des idées et les petites boutiques"
        case .creator: return "Pour les créateurs qui publient chaque semaine"
        case .studio: return "Pour les marques qui mènent des campagnes"
        case .agency: return "Pour les équipes au service de nombreux clients"
        }
    }
    var icon: String {
        switch self {
        case .starter: return "leaf"
        case .creator: return "camera"
        case .studio: return "sparkles"
        case .agency: return "building.2"
        }
    }
    /// Ordering used to decide upgrade vs downgrade.
    var rank: Int { Plan.allCases.firstIndex(of: self) ?? 0 }
}

struct PlanCard: View {
    var plan: Plan
    var yearly: Bool
    var current: Bool
    var recommended: Bool
    var action: () -> Void
    @EnvironmentObject private var store: AppStore

    private var isDowngrade: Bool { plan.rank < store.plan.rank }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                HStack(spacing: 10) {
                    Image(systemName: plan.icon).font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(recommended ? MSColor.highlight : MSColor.text2)
                        .frame(width: 34, height: 34)
                        .background((recommended ? MSColor.accent.opacity(0.14) : MSColor.elevated), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(plan.title).msHeadline(18)
                        Text(plan.tagline).msCaption()
                    }
                }
                Spacer()
                if current { MSBadge(text: "Forfait actuel", tone: .success, icon: "checkmark") }
                else if recommended { MSBadge(text: "Recommandé", tone: .accent) }
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(store.price(plan.price(yearly: yearly))).font(.system(size: 34, weight: .bold, design: .rounded)).tracking(-1).foregroundStyle(MSColor.text)
                    .contentTransition(.numericText())
                Text("/ mois").msBody(14)
                if yearly { Text("facturé annuellement").msCaption() }
            }
            .animation(MSAnimation.snappy, value: yearly)
            VStack(alignment: .leading, spacing: 7) {
                ForEach(plan.features, id: \.self) { f in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(recommended ? MSColor.highlight : MSColor.success)
                        Text(f).msBody(14, color: MSColor.text)
                    }
                }
            }
            MSButton(
                title: current ? "Votre forfait" : (isDowngrade ? "Passer à \(plan.title)" : "Passer à \(plan.title)"),
                icon: current ? "checkmark" : (isDowngrade ? "arrow.down" : "arrow.up"),
                style: current ? .secondary : (recommended ? .primary : .secondary),
                isDisabled: current,
                action: action
            )
        }
        .padding(18)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous).strokeBorder(recommended ? MSColor.accent.opacity(0.55) : (current ? MSColor.success.opacity(0.4) : MSColor.border), lineWidth: 1))
    }
}

// MARK: - Upgrade confirm + success (AppSheet.upgrade)

struct UpgradeSheet: View {
    @Environment(\.openURL) private var openURL
    var plan: Plan?
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var selected: Plan
    @State private var yearly = false
    @State private var working = false
    @State private var done = false

    init(plan: Plan?) {
        self.plan = plan
        _selected = State(initialValue: plan ?? .studio)
    }

    var body: some View {
        BottomSheetContainer(title: done ? nil : "Confirmez votre forfait") {
            if done { success } else { confirm }
        }
    }

    private var confirm: some View {
        VStack(alignment: .leading, spacing: 16) {
            if plan == nil {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Plan.allCases) { p in
                            MSChip(title: "\(p.title) \(store.price(p.monthlyPriceXof))", selected: selected == p) { selected = p }
                        }
                    }
                }
            }
            MSCard(elevated: true) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(selected.title).msHeadline(20)
                            Text(selected.tagline).msCaption()
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 0) {
                            Text(store.price(selected.price(yearly: yearly))).font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
                            Text("par mois").msCaption()
                        }
                    }
                    Divider().overlay(MSColor.border)
                    row("Forfait actuel", store.plan.title)
                    row("Crédits par mois", "+\(selected.monthlyCredits.formatted(.number.locale(Locale(identifier: "fr_FR"))))")
                    row("Facturation", yearly ? "Annuelle, \(store.price(selected.price(yearly: true) * 12))" : "Mensuelle")
                    row("Paiement", "Mobile Money (bientôt)")
                }
            }
            Toggle(isOn: $yearly) {
                HStack(spacing: 8) {
                    Text("Facturation annuelle").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    MSBadge(text: "Économisez 20 %", tone: .success)
                }
            }
            .tint(MSColor.accent)
            Spacer(minLength: 0)
            MSButton(title: working ? "Mise à jour du forfait" : (selected == store.plan ? "Déjà sur \(selected.title)" : "Confirmer \(selected.title)"), icon: working ? nil : "lock.fill", isLoading: working, isDisabled: selected == store.plan) {
                // Mobile Money subscriptions aren't connected yet: continue on WhatsApp (no plan change here).
                let message = "Bonjour Marketing Studio, je veux le forfait \(selected.title) (\(store.price(selected.price(yearly: yearly)))/mois) pour le compte \(store.user.email)."
                router.toast("Mobile Money bientôt disponible", style: .info, icon: "clock")
                if let url = Market.whatsappLink(Market.sokoziaWhatsApp, message: message) { openURL(url) }
            }
            MSButton(title: "Pas maintenant", style: .ghost) { router.dismissSheet() }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 16)
    }

    private var success: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(MSColor.accent.opacity(0.16)).frame(width: 92, height: 92)
                Image(systemName: selected.icon).font(.system(size: 36, weight: .semibold)).foregroundStyle(MSColor.highlight)
            }
            .padding(.top, 24)
            Text("Bienvenue dans \(selected.title)").msTitle(28)
            Text("\(selected.monthlyCredits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits ont été ajoutés. Votre solde est de \(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))).")
                .msBody(15).multilineTextAlignment(.center)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(selected.features.prefix(3), id: \.self) { f in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success).font(.system(size: 14))
                        Text(f).msBody(14, color: MSColor.text)
                    }
                }
            }
            .msCard()
            Spacer(minLength: 0)
            MSButton(title: "Commencer à créer", icon: "sparkles") {
                router.dismissSheet()
                router.select(.studio)
            }
            MSButton(title: "Terminé", style: .ghost) { router.dismissSheet() }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 16)
        .transition(.opacity.combined(with: .scale(scale: 0.96)))
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).msBody(14)
            Spacer()
            Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text)
        }
    }
}

// MARK: - Paywall (AppSheet.paywall) — present when a feature is locked on the current plan.

struct PaywallSheet: View {
    var feature: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    private var suggested: Plan {
        Plan.allCases.first { $0.rank > store.plan.rank } ?? .agency
    }

    var body: some View {
        BottomSheetContainer {
            VStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 22, style: .continuous).fill(MSColor.accent.opacity(0.14)).frame(width: 76, height: 76)
                    Image(systemName: "lock.fill").font(.system(size: 30, weight: .semibold)).foregroundStyle(MSColor.highlight)
                }
                .padding(.top, 8)
                VStack(spacing: 6) {
                    Text("\(feature) est verrouillé").msTitle(24).multilineTextAlignment(.center)
                    Text("Votre forfait \(store.plan.title) a atteint sa limite pour cette fonctionnalité. Passez à \(suggested.title) pour continuer.")
                        .msBody(14).multilineTextAlignment(.center)
                }
                MSCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(suggested.title).msHeadline(16)
                            Spacer()
                            Text("\(store.price(suggested.monthlyPriceXof))/mois").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        }
                        ForEach(suggested.features.prefix(3), id: \.self) { f in
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.success)
                                Text(f).msBody(13)
                            }
                        }
                    }
                }
                Spacer(minLength: 0)
                MSButton(title: "Passer à \(suggested.title)", icon: "arrow.up") {
                    router.present(.upgrade(plan: suggested))
                }
                MSButton(title: "Acheter des crédits à la place", icon: "bolt", style: .secondary) { router.present(.buyCredits) }
                MSButton(title: "Voir tous les forfaits", style: .ghost) {
                    router.dismissSheet()
                    router.push(.pricing, on: .more)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
    }
}
