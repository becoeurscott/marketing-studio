import SwiftUI

/// SPEC §20 — Hook Generator: "Generate 10 hooks" → Copy / Save / Use in Script.
struct HookGeneratorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    static let cost = GenerationKind.copy.creditCost * 2

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var product = ""
    @State private var audience = "Femmes et hommes de 20 à 35 ans"
    @State private var phase: Phase = .idle
    @State private var hooks: [HookResult] = []
    @State private var lastError: Error?
    @State private var showSaved = false

    private var canGenerate: Bool { !product.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                VStack(spacing: 14) {
                    MSTextField(label: "Produit", placeholder: "ex. Beurre de karité pur", text: $product, icon: "shippingbox")
                    MSTextField(label: "Audience", placeholder: "ex. Femmes et hommes de 20 à 35 ans", text: $audience, icon: "person.2")
                }
                .padding(.horizontal, MSSpacing.gutter)
                CreditCostRow(cost: Self.cost, label: "10 accroches")
                MSButton(title: hooks.isEmpty ? "Générer 10 accroches" : "En générer 10 de plus", icon: "bolt.fill", isLoading: phase == .generating, isDisabled: !canGenerate) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                resultsSection
                savedSection
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Générateur d'accroches")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Générateur d'accroches").msTitle(26)
            Text("Des premières phrases qui stoppent le scroll, pour vos vidéos courtes et vos pubs.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    @ViewBuilder
    private var resultsSection: some View {
        switch phase {
        case .idle:
            if hooks.isEmpty {
                EmptyStateView(icon: "bolt", title: "Aucune accroche pour l'instant", message: "Décrivez votre produit et votre audience, puis générez 10 accroches en un seul geste.", ctaTitle: "Générer 10 accroches", ctaIcon: "bolt.fill") { generate() }
            }
        case .generating:
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    ProgressView().tint(MSColor.accent)
                    Text("Rédaction des accroches...").msHeadline(15)
                }
                ForEach(0..<5, id: \.self) { _ in
                    HStack(spacing: 12) {
                        SkeletonView(cornerRadius: 8).frame(width: 26, height: 26)
                        SkeletonView().frame(height: 14)
                    }
                    .msCard(padding: 12)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        case .failed:
            if let lastError { CreativeErrorView(error: lastError, retry: generate, back: { router.popToRoot() }) }
        case .done:
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "\(hooks.count) accroches", subtitle: "Pour \(product)", actionTitle: "Tout enregistrer") { saveAll() }
                ForEach(Array(hooks.enumerated()), id: \.element.id) { i, h in
                    HookRow(index: i + 1, hook: h, saved: store.savedHooks.contains { $0.text == h.text },
                            onCopy: { copy(h) }, onSave: { save(h) }, onUse: { use(h) })
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    @ViewBuilder
    private var savedSection: some View {
        if !store.savedHooks.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Accroches enregistrées", subtitle: "\(store.savedHooks.count) dans votre bibliothèque", actionTitle: showSaved ? "Masquer" : "Afficher") {
                    withAnimation(MSAnimation.snappy) { showSaved.toggle() }
                }
                if showSaved {
                    ForEach(Array(store.savedHooks.prefix(10).enumerated()), id: \.element.id) { i, h in
                        HookRow(index: i + 1, hook: h, saved: true, onCopy: { copy(h) }, onSave: { router.toast("Déjà enregistrée", style: .info) }, onUse: { use(h) })
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    // MARK: Actions

    private func generate() {
        guard phase != .generating, canGenerate else { return }
        MSHaptic.tap()
        lastError = nil
        withAnimation(MSAnimation.gentle) { phase = .generating }
        Task {
            do {
                let r = try await API.generateHooks(product: product, audience: audience, store: store)
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { hooks = r; phase = .done }
                router.toast("10 accroches prêtes", style: .success, icon: "bolt.fill")
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed }
            }
        }
    }

    private func copy(_ h: HookResult) {
        UIPasteboard.general.string = h.text
        MSHaptic.success()
        router.toast("Accroche copiée", style: .success, icon: "doc.on.doc")
    }

    private func save(_ h: HookResult) {
        store.saveHook(h)
        MSHaptic.success()
        router.toast("Accroche enregistrée", style: .success)
    }

    private func saveAll() {
        for h in hooks { store.saveHook(h) }
        MSHaptic.success()
        router.toast("\(hooks.count) accroches enregistrées", style: .success)
    }

    private func use(_ h: HookResult) {
        MSHaptic.tap()
        router.push(.ugcCreatorWithScript(script: "\(h.text)\n\nCréez une vidéo de 15 secondes façon TikTok pour présenter \(product)."))
    }
}

// MARK: - Row

struct HookRow: View {
    var index: Int
    var hook: HookResult
    var saved: Bool
    var onCopy: () -> Void
    var onSave: () -> Void
    var onUse: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                Text(String(format: "%02d", index))
                    .font(MSFont.mono(12)).foregroundStyle(MSColor.highlight)
                    .frame(width: 28, height: 28)
                    .background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 4) {
                    Text(hook.text).msBody(15, color: MSColor.text).fixedSize(horizontal: false, vertical: true)
                    MSBadge(text: hook.category)
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 8) {
                ResultAction(title: "Copier", icon: "doc.on.doc", action: onCopy)
                ResultAction(title: saved ? "Enregistrée" : "Enregistrer", icon: saved ? "checkmark" : "bookmark", tint: saved ? MSColor.success : MSColor.text, action: onSave)
                ResultAction(title: "Utiliser dans un script", icon: "person.wave.2", action: onUse)
            }
        }
        .msCard(padding: 12)
    }
}
