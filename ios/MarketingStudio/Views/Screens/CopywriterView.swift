import SwiftUI

/// SPEC §19 — Copywriter: 10 tools, product/audience/tone/goal, brand-voice aware results.
struct CopywriterView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    static let tools: [(name: String, icon: String)] = [
        ("Ad Copy", "megaphone"), ("Product Description", "shippingbox"), ("Instagram Caption", "camera.circle"),
        ("TikTok Caption", "music.note"), ("Email", "envelope"), ("Headline", "textformat.size"),
        ("Hook", "bolt"), ("CTA", "hand.tap"), ("UGC Script", "person.wave.2"), ("Landing Page Copy", "doc.richtext"),
    ]
    static let toolLabels: [String: String] = [
        "Ad Copy": "Texte publicitaire", "Product Description": "Description produit", "Instagram Caption": "Légende Instagram",
        "TikTok Caption": "Légende TikTok", "Email": "E-mail", "Headline": "Titre", "Hook": "Accroche", "CTA": "Appel à l'action",
        "UGC Script": "Script UGC", "Landing Page Copy": "Texte de landing page",
    ]
    static let toneLabels: [String: String] = [
        "Professional": "Professionnel", "Friendly": "Amical", "Luxury": "Luxe", "Bold": "Audacieux",
        "Funny": "Drôle", "Minimal": "Minimaliste", "Urgent": "Urgent", "Authentic": "Authentique",
    ]
    static let goalLabels: [String: String] = [
        "Sales": "Ventes", "Awareness": "Notoriété", "Engagement": "Engagement", "Leads": "Prospects", "Retention": "Fidélisation",
    ]
    static func toolLabel(_ t: String) -> String { toolLabels[t] ?? t }
    static func toneLabel(_ t: String) -> String { toneLabels[t] ?? t }
    /// Maps a French display label back to its internal (English) key.
    private static func key(_ label: String, in map: [String: String]) -> String { map.first { $0.value == label }?.key ?? label }
    static let tones = ["Professional", "Friendly", "Luxury", "Bold", "Funny", "Minimal", "Urgent"]
    static let goals = ["Sales", "Awareness", "Engagement", "Leads", "Retention"]
    static let cost = GenerationKind.copy.creditCost

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var tool = "Ad Copy"
    @State private var product = "Sérum Luma Glow"
    @State private var audience = "Femmes et hommes de 20 à 35 ans"
    @State private var tone: Set<String> = ["Professionnel"]
    @State private var goal: Set<String> = ["Ventes"]
    @State private var phase: Phase = .idle
    @State private var results: [CopyResult] = []
    @State private var savedIds: Set<String> = []
    @State private var lastError: Error?

    private var canGenerate: Bool { !product.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                toolPicker
                VStack(spacing: 14) {
                    MSTextField(label: "Produit", placeholder: "ex. Sérum Luma Glow", text: $product, icon: "shippingbox")
                    MSTextField(label: "Audience", placeholder: "ex. Femmes et hommes de 20 à 35 ans", text: $audience, icon: "person.2")
                }
                .padding(.horizontal, MSSpacing.gutter)
                CreativeSection(title: "Ton") { ChipGroup(options: Self.tones.map(Self.toneLabel), selection: $tone, allowDeselect: false) }
                CreativeSection(title: "Objectif") { ChipGroup(options: Self.goals.map { Self.goalLabels[$0] ?? $0 }, selection: $goal, allowDeselect: false) }
                brandVoiceCard
                CreditCostRow(cost: Self.cost, label: Self.toolLabel(tool))
                MSButton(title: results.isEmpty ? "Générer" : "Générer une variante", icon: "sparkles", isLoading: phase == .generating, isDisabled: !canGenerate) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                resultsSection
                if !store.copyResults.isEmpty && results.isEmpty && phase == .idle { recentSection }
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Rédacteur")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Rédacteur").msTitle(26)
            Text("Des textes fidèles à votre marque pour chaque emplacement, avec votre ton.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var toolPicker: some View {
        CreativeSection(title: "Outil") {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                ForEach(Self.tools, id: \.name) { t in
                    let selected = tool == t.name
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { tool = t.name }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: t.icon)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(selected ? MSColor.text : MSColor.highlight)
                                .frame(width: 28, height: 28)
                                .background(selected ? MSColor.accent.opacity(0.35) : MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                            Text(Self.toolLabel(t.name)).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1)
                            Spacer(minLength: 0)
                        }
                        .padding(10)
                        .background(selected ? MSColor.elevated : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(selected ? MSColor.accent : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
        }
    }

    private var brandVoiceCard: some View {
        Button { router.push(.brandVoice) } label: {
            HStack(spacing: 12) {
                Image(systemName: "waveform.and.mic")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(MSColor.highlight)
                    .frame(width: 34, height: 34)
                    .background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("Ton de marque · \(store.brand.voice.tone)").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        MSBadge(text: "Utilisé dans les textes générés", tone: .success)
                    }
                    Text(store.brand.voice.writingStyle).msCaption().lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
            }
            .msCard(padding: 12)
        }
        .buttonStyle(MSPressStyle())
        .padding(.horizontal, MSSpacing.gutter)
    }

    @ViewBuilder
    private var resultsSection: some View {
        switch phase {
        case .idle: EmptyView()
        case .generating:
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    ProgressView().tint(MSColor.accent)
                    Text("Rédaction : \(Self.toolLabel(tool).lowercased())...").msHeadline(15)
                }
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonView().frame(height: 14).frame(maxWidth: 160)
                    SkeletonView().frame(height: 12)
                    SkeletonView().frame(height: 12)
                    SkeletonView().frame(height: 12).frame(maxWidth: 220)
                }
                .msCard()
                if !results.isEmpty { resultsList }
            }
            .padding(.horizontal, MSSpacing.gutter)
        case .failed:
            if let lastError { CreativeErrorView(error: lastError, retry: generate, back: { router.popToRoot() }) }
        case .done:
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Résultats", subtitle: "\(results.count) variante\(results.count == 1 ? "" : "s") · \(tone.first ?? "")")
                resultsList
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var resultsList: some View {
        VStack(spacing: 10) {
            ForEach(Array(results.enumerated()), id: \.element.id) { i, r in
                CopyResultCard(result: r, index: results.count - i, saved: savedIds.contains(r.id),
                               onCopy: { copy(r) }, onSave: { save(r) }, onRegenerate: { generate() },
                               onUseInScript: r.tool == "UGC Script" || r.tool == "Hook" ? { router.push(.ugcCreatorWithScript(script: r.text)) } : nil)
            }
        }
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Textes récents", subtitle: "Enregistrés lors de sessions précédentes")
            ForEach(store.copyResults.prefix(3)) { r in
                MSCard(padding: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            MSBadge(text: Self.toolLabel(r.tool), tone: .accent)
                            MSBadge(text: Self.toneLabel(r.tone))
                            Spacer()
                            Text(r.createdAt.relativeString).msCaption()
                        }
                        Text(r.text).msBody(13).lineLimit(3)
                        HStack { Spacer(); ResultAction(title: "Copier", icon: "doc.on.doc") { copy(r) } }
                    }
                }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Actions

    private func generate() {
        guard phase != .generating, canGenerate else { return }
        MSHaptic.tap()
        lastError = nil
        withAnimation(MSAnimation.gentle) { phase = .generating }
        let p = CopyParams(tool: tool, product: product, audience: audience, tone: Self.key(tone.first ?? "Professionnel", in: Self.toneLabels), goal: Self.key(goal.first ?? "Ventes", in: Self.goalLabels))
        Task {
            do {
                let r = try await MockAPI.generateCopy(p, store: store)
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { results.insert(r, at: 0); phase = .done }
                savedIds.insert(r.id)   // MockAPI already stores the result in store.copyResults
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed }
            }
        }
    }

    private func copy(_ r: CopyResult) {
        UIPasteboard.general.string = r.text
        MSHaptic.success()
        router.toast("Copié dans le presse-papiers", style: .success, icon: "doc.on.doc")
    }

    private func save(_ r: CopyResult) {
        guard !savedIds.contains(r.id) else { router.toast("Déjà enregistré", style: .info); return }
        store.addCopyResult(tool: r.tool, tone: r.tone, text: r.text)
        savedIds.insert(r.id)
        MSHaptic.success()
        router.toast("Enregistré dans la bibliothèque de textes", style: .success)
    }
}

// MARK: - Result card

struct CopyResultCard: View {
    var result: CopyResult
    var index: Int
    var saved: Bool
    var onCopy: () -> Void
    var onSave: () -> Void
    var onRegenerate: () -> Void
    var onUseInScript: (() -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                MSBadge(text: "Variante \(index)", tone: .accent)
                MSBadge(text: CopywriterView.toneLabel(result.tone))
                Spacer()
                if saved { MSBadge(text: "Enregistré", tone: .success, icon: "checkmark") }
            }
            Text(result.text)
                .msBody(15, color: MSColor.text)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 6) {
                Text("\(result.text.split(separator: " ").count) mots").msCaption()
                Text("·").msCaption()
                Text(CopywriterView.toolLabel(result.tool)).msCaption()
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ResultAction(title: "Copier", icon: "doc.on.doc", action: onCopy)
                    ResultAction(title: saved ? "Enregistré" : "Enregistrer", icon: saved ? "checkmark" : "bookmark", tint: saved ? MSColor.success : MSColor.text, action: onSave)
                    ResultAction(title: "Régénérer", icon: "arrow.clockwise", action: onRegenerate)
                    if let onUseInScript { ResultAction(title: "Utiliser dans le script", icon: "person.wave.2", action: onUseInScript) }
                }
            }
        }
        .msCard()
    }
}
