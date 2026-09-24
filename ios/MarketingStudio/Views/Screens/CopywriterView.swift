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
    static let tones = ["Professional", "Friendly", "Luxury", "Bold", "Funny", "Minimal", "Urgent"]
    static let goals = ["Sales", "Awareness", "Engagement", "Leads", "Retention"]
    static let cost = GenerationKind.copy.creditCost

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var tool = "Ad Copy"
    @State private var product = "Luma Glow Serum"
    @State private var audience = "Women and men 20–35"
    @State private var tone: Set<String> = ["Professional"]
    @State private var goal: Set<String> = ["Sales"]
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
                    MSTextField(label: "Product", placeholder: "e.g. Luma Glow Serum", text: $product, icon: "shippingbox")
                    MSTextField(label: "Audience", placeholder: "e.g. Women and men 20–35", text: $audience, icon: "person.2")
                }
                .padding(.horizontal, MSSpacing.gutter)
                CreativeSection(title: "Tone") { ChipGroup(options: Self.tones, selection: $tone, allowDeselect: false) }
                CreativeSection(title: "Goal") { ChipGroup(options: Self.goals, selection: $goal, allowDeselect: false) }
                brandVoiceCard
                CreditCostRow(cost: Self.cost, label: tool)
                MSButton(title: results.isEmpty ? "Generate" : "Generate Variation", icon: "sparkles", isLoading: phase == .generating, isDisabled: !canGenerate) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                resultsSection
                if !store.copyResults.isEmpty && results.isEmpty && phase == .idle { recentSection }
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Copywriter")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Copywriter").msTitle(26)
            Text("On-brand copy for every placement, in your voice.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var toolPicker: some View {
        CreativeSection(title: "Tool") {
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
                            Text(t.name).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1)
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
                        Text("Brand voice · \(store.brand.voice.tone)").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        MSBadge(text: "Used in generated copy", tone: .success)
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
                    Text("Writing \(tool.lowercased())...").msHeadline(15)
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
                SectionHeader(title: "Results", subtitle: "\(results.count) variation\(results.count == 1 ? "" : "s") · \(tone.first ?? "")")
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
            SectionHeader(title: "Recent copy", subtitle: "Saved from earlier sessions")
            ForEach(store.copyResults.prefix(3)) { r in
                MSCard(padding: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            MSBadge(text: r.tool, tone: .accent)
                            MSBadge(text: r.tone)
                            Spacer()
                            Text(r.createdAt.relativeString).msCaption()
                        }
                        Text(r.text).msBody(13).lineLimit(3)
                        HStack { Spacer(); ResultAction(title: "Copy", icon: "doc.on.doc") { copy(r) } }
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
        let p = CopyParams(tool: tool, product: product, audience: audience, tone: tone.first ?? "Professional", goal: goal.first ?? "Sales")
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
        router.toast("Copied to clipboard", style: .success, icon: "doc.on.doc")
    }

    private func save(_ r: CopyResult) {
        guard !savedIds.contains(r.id) else { router.toast("Already saved", style: .info); return }
        store.addCopyResult(tool: r.tool, tone: r.tone, text: r.text)
        savedIds.insert(r.id)
        MSHaptic.success()
        router.toast("Saved to copy library", style: .success)
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
                MSBadge(text: "Variation \(index)", tone: .accent)
                MSBadge(text: result.tone)
                Spacer()
                if saved { MSBadge(text: "Saved", tone: .success, icon: "checkmark") }
            }
            Text(result.text)
                .msBody(15, color: MSColor.text)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 6) {
                Text("\(result.text.split(separator: " ").count) words").msCaption()
                Text("·").msCaption()
                Text(result.tool).msCaption()
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ResultAction(title: "Copy", icon: "doc.on.doc", action: onCopy)
                    ResultAction(title: saved ? "Saved" : "Save", icon: saved ? "checkmark" : "bookmark", tint: saved ? MSColor.success : MSColor.text, action: onSave)
                    ResultAction(title: "Regenerate", icon: "arrow.clockwise", action: onRegenerate)
                    if let onUseInScript { ResultAction(title: "Use in Script", icon: "person.wave.2", action: onUseInScript) }
                }
            }
        }
        .msCard()
    }
}
