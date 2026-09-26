import SwiftUI

// MARK: 20. Account (mock)

struct OnboardingAccountView: View {
    @ObservedObject var model: OnboardingModel
    var onSignedIn: () -> Void
    @State private var loading: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Spacer(minLength: 0)
            if model.hasAccount {
                OnboardingHeadline(title: "Bon retour sur Sokozia.", subtitle: "Connectez-vous pour retrouver vos campagnes.")
            } else {
                ProductVisual(model: model).frame(height: 180)
                OnboardingHeadline(title: "Sauvegardez votre campagne.", subtitle: "Vos 41 contenus sont prêts.")
            }
            Spacer(minLength: 0)
            VStack(spacing: 10) {
                Button { signIn("apple") } label: {
                    HStack(spacing: 8) {
                        if loading == "apple" { ProgressView().tint(.black) } else { Image(systemName: "apple.logo") }
                        Text("Continuer avec Apple")
                    }
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity).frame(height: 54)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                }
                .buttonStyle(MSPressStyle())
                MSButton(title: "Continuer avec Google", icon: "g.circle", style: .secondary, isLoading: loading == "google") { signIn("google") }
                MSButton(title: "Continuer avec un e-mail", icon: "envelope", style: .secondary, isLoading: loading == "email") { signIn("email") }
            }
            Text("En continuant, vous acceptez les Conditions d'utilisation et la Politique de confidentialité de Sokozia.")
                .msCaption().multilineTextAlignment(.center).frame(maxWidth: .infinity)
        }
    }

    private func signIn(_ provider: String) {
        guard loading == nil else { return }
        loading = provider
        Task {
            try? await Task.sleep(nanoseconds: 800_000_000)
            loading = nil
            MSHaptic.success()
            onSignedIn()
        }
    }
}

// MARK: 21. Paywall

struct OnboardingPaywallView: View {
    @ObservedObject var model: OnboardingModel
    private struct Plan: Identifiable { let id: String; let name: String; let price: String; let features: [String]; let badge: String? }
    private let plans: [Plan] = [
        Plan(id: "free", name: "Gratuit", price: "0 $", features: ["1 campagne", "Contenus en filigrane", "Formats de base"], badge: nil),
        Plan(id: "creator", name: "Creator", price: "12 $/mois", features: ["Campagnes illimitées", "Photos produit HD", "Vidéos UGC", "Sans filigrane"], badge: "Populaire"),
        Plan(id: "studio", name: "Studio", price: "29 $/mois", features: ["Tout Creator", "Kit de marque", "Variantes pub A/B", "Calendrier & planification"], badge: nil),
        Plan(id: "agency", name: "Agency", price: "59 $+/mois", features: ["Tout Studio", "Plusieurs marques", "Collaboration d'équipe", "Support prioritaire"], badge: nil),
    ]

    var body: some View {
        VStack(spacing: 14) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        ProductVisual(model: model, cornerRadius: MSRadius.md).frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Campagne \(model.productName)").msHeadline(16)
                            Text("41 contenus · prête à lancer").msCaption(color: MSColor.success)
                        }
                        Spacer()
                    }
                    .msCard(padding: 12)
                    OnboardingHeadline(title: "Choisissez comment lancer.")
                    ForEach(plans) { p in
                        Button { MSHaptic.tap(); model.plan = p.id } label: { planCard(p) }
                            .buttonStyle(MSPressStyle())
                    }
                }
            }
            MSButton(title: model.plan == "free" ? "Continuer à créer →" : "Lancer ma campagne →") {
                MSHaptic.success()
                model.next()
            }
            Text("Sans engagement · Annulable à tout moment").msCaption()
        }
    }

    private func planCard(_ p: Plan) -> some View {
        let on = model.plan == p.id
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(p.name).msHeadline(17)
                if let b = p.badge { MSBadge(text: b, tone: .accent) }
                Spacer()
                Text(p.price).font(MSFont.headline(16)).foregroundStyle(on ? MSColor.highlight : MSColor.text)
            }
            ForEach(p.features, id: \.self) { f in
                Label(f, systemImage: "checkmark").font(MSFont.body(13)).foregroundStyle(MSColor.text2)
            }
        }
        .padding(16)
        .background(on ? MSColor.accent.opacity(0.12) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: 1))
    }
}

// MARK: 22. After

struct OnboardingAfterView: View {
    @ObservedObject var model: OnboardingModel
    var onFinish: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 12) {
                ProductVisual(model: model, cornerRadius: MSRadius.md).frame(width: 56, height: 56)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Campagne prête · 41 contenus").msHeadline(18)
                    Text(model.productName).msCaption()
                }
            }
            section("AUJOURD'HUI", icon: "checkmark.circle.fill", tint: MSColor.success,
                    items: ["4 photos produit générées", "2 concepts UGC prêts", "6 variantes pub créées", "Calendrier de la semaine planifié"])
            section("ENSUITE", icon: "arrow.right.circle", tint: MSColor.highlight,
                    items: ["Publier le Reel Instagram de lundi", "Générer un autre créateur UGC", "Tester la créa B sur TikTok"])
            Spacer(minLength: 0)
            MSButton(title: "Ouvrir mon espace", icon: "arrow.right") { onFinish() }
        }
    }

    private func section(_ title: String, icon: String, tint: Color, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(MSFont.caption(11)).tracking(1).foregroundStyle(MSColor.muted)
            ForEach(items, id: \.self) { i in
                Label(i, systemImage: icon).font(MSFont.body(15)).foregroundStyle(MSColor.text)
                    .symbolRenderingMode(.hierarchical).tint(tint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .msCard()
    }
}
