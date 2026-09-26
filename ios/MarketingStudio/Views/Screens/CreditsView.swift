import SwiftUI

/// SPEC §36 — Credits: balance hero, cost table, usage history, buy credits.
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
                    StatTile(label: "Recharge forfait \(store.plan.title)", value: store.plan.monthlyCredits.formatted(.number.locale(Locale(identifier: "fr_FR"))), icon: "arrow.clockwise", tint: MSColor.success) {
                        router.push(.pricing)
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
            Text(store.credits < 100 ? "Solde faible. Rechargez pour continuer à générer." : "Environ \(store.credits / 10) images ou \(store.credits / 50) vidéos.")
                .msBody(14)
            HStack(spacing: 10) {
                MSButton(title: "Acheter des crédits", icon: "plus") { router.present(.buyCredits) }
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
            costRow("Génération d'images", "4 images par lancement", cost: 10, icon: "photo.on.rectangle.angled", each: "par image")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Génération de vidéos", "5 à 15 secondes", cost: 50, icon: "video", each: "par vidéo")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Agrandissement", "Résolution ×2", cost: 15, icon: "arrow.up.left.and.arrow.down.right", each: "par image")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Variantes publicitaires", "Créas A à D", cost: 20, icon: "rectangle.stack", each: "par lot")
            Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
            costRow("Rédaction", "Tous les outils", cost: 2, icon: "text.alignleft", each: "par résultat")
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

struct CreditPack: Identifiable, Hashable {
    let id: String
    let credits: Int
    let price: Int
    let bonus: Int
    let tag: String?
    static let all: [CreditPack] = [
        CreditPack(id: "pack_s", credits: 500, price: 9, bonus: 0, tag: nil),
        CreditPack(id: "pack_m", credits: 1500, price: 24, bonus: 100, tag: "Populaire"),
        CreditPack(id: "pack_l", credits: 4000, price: 59, bonus: 500, tag: "Meilleur rapport"),
        CreditPack(id: "pack_xl", credits: 10000, price: 129, bonus: 2000, tag: nil),
    ]
}

struct BuyCreditsSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var selected: CreditPack = CreditPack.all[1]
    @State private var purchasing = false
    @State private var purchased: CreditPack?

    var body: some View {
        BottomSheetContainer(title: purchased == nil ? "Acheter des crédits" : nil, subtitle: purchased == nil ? "Les crédits n'expirent jamais. Aucun paiement réel dans ce prototype." : nil) {
            if let p = purchased {
                successView(p)
            } else {
                VStack(spacing: 14) {
                    VStack(spacing: 10) {
                        ForEach(CreditPack.all) { pack in
                            packRow(pack)
                        }
                    }
                    Spacer(minLength: 0)
                    VStack(spacing: 8) {
                        HStack {
                            Text("Solde après l'achat").msCaption()
                            Spacer()
                            Text((store.credits + selected.credits + selected.bonus).formatted(.number.locale(Locale(identifier: "fr_FR")))).font(MSFont.mono(13)).foregroundStyle(MSColor.text)
                        }
                        MSButton(title: purchasing ? "Traitement en cours" : "Payer \(selected.price) $", icon: purchasing ? nil : "lock.fill", isLoading: purchasing) { purchase() }
                        Text("Paiement simulé : les crédits sont ajoutés instantanément.").msCaption()
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 16)
            }
        }
    }

    private func packRow(_ pack: CreditPack) -> some View {
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
                        Text("\(pack.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                        if let tag = pack.tag { MSBadge(text: tag, tone: .accent) }
                    }
                    Text(pack.bonus > 0 ? "+\(pack.bonus) en bonus · \((Double(pack.price) / Double(pack.credits + pack.bonus) * 100).formatted(.number.precision(.fractionLength(1)).locale(Locale(identifier: "fr_FR")))) ¢ par crédit" : "\((Double(pack.price) / Double(pack.credits) * 100).formatted(.number.precision(.fractionLength(1)).locale(Locale(identifier: "fr_FR")))) ¢ par crédit").msCaption()
                }
                Spacer()
                Text("\(pack.price) $").font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
            }
            .padding(14)
            .background(isSel ? MSColor.accent.opacity(0.08) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(isSel ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    private func successView(_ p: CreditPack) -> some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(MSColor.success.opacity(0.14)).frame(width: 84, height: 84)
                Image(systemName: "checkmark").font(.system(size: 34, weight: .bold)).foregroundStyle(MSColor.success)
            }
            .padding(.top, 20)
            Text("+\((p.credits + p.bonus).formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits").msTitle(28)
            Text("Votre solde est maintenant de \(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))). À vous de créer.").msBody(15).multilineTextAlignment(.center)
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

    private func purchase() {
        purchasing = true
        Task {
            try? await Task.sleep(for: .seconds(1.4))
            store.buyCredits(selected.credits + selected.bonus, price: selected.price)
            MSHaptic.success()
            withAnimation(MSAnimation.snappy) { purchasing = false; purchased = selected }
        }
    }
}
