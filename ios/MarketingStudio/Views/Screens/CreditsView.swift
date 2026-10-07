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
            costRow("Agrandissement 4K", "Même image, plus nette", cost: AIModels.imageModel("marketing-studio").credits + AIModels.upscaleExtra, icon: "arrow.up.left.and.arrow.down.right", each: "par image")
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

/// Pay-as-you-go packs in the user's currency, paid with Mobile Money. Payments are not connected
/// yet: choosing a pack explains how to top up through WhatsApp (no credits are granted here).
struct BuyCreditsSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.openURL) private var openURL

    @State private var selected: Market.UsagePack = Market.usagePacks[1]

    private var packs: [Market.UsagePack] { Market.usagePacks + Market.topUpPacks }

    var body: some View {
        BottomSheetContainer(title: "Recharger des crédits", subtitle: "Sans abonnement. Payez avec \(paymentNames).") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    VStack(spacing: 10) {
                        ForEach(packs) { pack in packRow(pack) }
                    }
                    paymentStrip
                    VStack(spacing: 8) {
                        MSButton(title: "Payer \(store.price(selected.priceXof))", icon: "lock.fill") { pay() }
                        Text(Market.paymentsComingSoon).msCaption().multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 16)
            }
        }
    }

    private var paymentNames: String {
        store.country.payments.compactMap { Market.paymentMethods[$0] }.filter(\.mobile).map(\.label).prefix(3).joined(separator: ", ")
    }

    private var paymentStrip: some View {
        HStack(spacing: 8) {
            ForEach(store.country.payments.compactMap { Market.paymentMethods[$0] }) { m in
                Text(m.label)
                    .font(MSFont.caption(11))
                    .foregroundStyle(MSColor.text)
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(Color(hex: m.colorHex).opacity(0.18), in: Capsule())
                    .overlay(Capsule().strokeBorder(Color(hex: m.colorHex).opacity(0.5), lineWidth: 1))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func packRow(_ pack: Market.UsagePack) -> some View {
        let isSel = pack == selected
        return Button {
            MSHaptic.tap()
            withAnimation(MSAnimation.snappy) { selected = pack }
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().strokeBorder(isSel ? MSColor.accent : MSColor.borderStrong, lineWidth: 1.5).frame(width: 20, height: 20)
                    if isSel { Circle().fill(MSColor.accent).frame(width: 10, height: 10) }
                }
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(pack.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                        if pack.popular { MSBadge(text: "Le plus pris", tone: .accent) }
                    }
                    Text("\(pack.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits · \(pack.pitch)\(pack.validityDays.map { " · \($0) jours" } ?? "")").msCaption()
                }
                Spacer()
                Text(store.price(pack.priceXof)).font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
            }
            .padding(14)
            .background(isSel ? MSColor.accent.opacity(0.08) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(isSel ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    /// Mobile Money checkout isn't connected yet: hand over to WhatsApp with the chosen pack.
    private func pay() {
        let message = "Bonjour Marketing Studio, je veux le \(selected.name) (\(selected.credits) crédits, \(store.price(selected.priceXof))) pour le compte \(store.user.email)."
        router.toast("Mobile Money bientôt disponible", style: .info, icon: "clock")
        if let url = Market.whatsappLink(Market.sokoziaWhatsApp, message: message) { openURL(url) }
    }
}
