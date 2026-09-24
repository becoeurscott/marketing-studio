import SwiftUI

/// SPEC §21: 5-step wizard. Objective → Audience → Platforms → Formats → Review & Generate.
struct CampaignBuilderView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var step = 0
    @State private var name = ""
    @State private var objective: CampaignObjective? = nil
    @State private var audience = ""
    @State private var platforms: Set<SocialPlatform> = []
    @State private var formats: Set<ContentFormat> = []

    @State private var generating = false
    @State private var progressStep = 0
    @State private var errorMessage: String? = nil

    private static let steps = ["Objective", "Audience", "Platforms", "Formats", "Review"]
    private static let generationSteps = ["Analysing objective", "Selecting formats", "Generating creatives", "Writing copy", "Building calendar"]
    private static let audienceChips = [
        "Women 20–35, skincare-curious", "Men 25–40, premium buyers", "Gen Z creators", "Parents 30–45",
        "Fitness beginners", "Remote workers", "Gift shoppers", "Past customers",
    ]
    /// Matches MockAPI.createCampaign (60) plus the ad set it generates internally.
    private static let campaignCost = 60 + GenerationKind.ad.creditCost

    private var canContinue: Bool {
        switch step {
        case 0: return objective != nil
        case 1: return !audience.trimmingCharacters(in: .whitespaces).isEmpty
        case 2: return !platforms.isEmpty
        case 3: return !formats.isEmpty
        default: return !name.trimmingCharacters(in: .whitespaces).isEmpty
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            if generating {
                generatingView
            } else if let errorMessage {
                ErrorStateView(message: errorMessage, retry: { self.errorMessage = nil; generate() }, back: { router.pop() })
                    .frame(maxHeight: .infinity)
            } else {
                wizard
            }
        }
        .msScreen()
        .navigationTitle("Campaign Builder")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { CreditBadge() } }
        .onAppear {
            if name.isEmpty, let p = store.currentProject { name = "\(p.name) campaign" }
        }
    }

    // MARK: Wizard

    private var wizard: some View {
        VStack(spacing: 0) {
            progressHeader
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    switch step {
                    case 0: objectiveStep
                    case 1: audienceStep
                    case 2: platformsStep
                    case 3: formatsStep
                    default: reviewStep
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 8)
                .padding(.bottom, 120)
                .id(step)
                .transition(.opacity.combined(with: .move(edge: .trailing)))
            }
            .animation(MSAnimation.gentle, value: step)
        }
        .safeAreaInset(edge: .bottom) { footer }
    }

    private var progressHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                ForEach(0..<Self.steps.count, id: \.self) { i in
                    Capsule()
                        .fill(i <= step ? MSColor.accent : MSColor.elevated)
                        .frame(height: 4)
                        .animation(MSAnimation.gentle, value: step)
                }
            }
            HStack {
                Text("Step \(step + 1) of \(Self.steps.count)").msCaption()
                Spacer()
                Text(Self.steps[step]).msCaption(color: MSColor.text2)
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.top, 8)
        .padding(.bottom, 6)
    }

    private var footer: some View {
        HStack(spacing: 10) {
            if step > 0 {
                MSButton(title: "Back", icon: "chevron.left", style: .secondary, fullWidth: false) {
                    withAnimation(MSAnimation.snappy) { step -= 1 }
                }
            }
            if step < Self.steps.count - 1 {
                MSButton(title: "Continue", icon: "chevron.right", isDisabled: !canContinue) {
                    withAnimation(MSAnimation.snappy) { step += 1 }
                }
            } else {
                MSButton(title: "Generate campaign · \(Self.campaignCost)", icon: "sparkles", isDisabled: !canContinue) { generate() }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.vertical, 12)
        .background(MSColor.bg.opacity(0.94))
        .overlay(alignment: .top) { Rectangle().fill(MSColor.border).frame(height: 1) }
    }

    // MARK: Steps

    private func stepTitle(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).msTitle(26)
            Text(subtitle).msBody(14)
        }
    }

    private var objectiveStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("What is the goal?", "Your objective shapes the formats, copy and calendar we generate.")
            VStack(spacing: 10) {
                ForEach(CampaignObjective.allCases) { o in
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { objective = o }
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: o.icon)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(objective == o ? MSColor.highlight : MSColor.text2)
                                .frame(width: 42, height: 42)
                                .background(objective == o ? MSColor.accent.opacity(0.14) : MSColor.elevated, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(o.title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                Text(objectiveHint(o)).msCaption()
                            }
                            Spacer()
                            Image(systemName: objective == o ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(objective == o ? MSColor.accent : MSColor.muted)
                        }
                        .padding(12)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(objective == o ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
        }
    }

    private func objectiveHint(_ o: CampaignObjective) -> String {
        switch o {
        case .awareness: return "Reach new people with bold visuals"
        case .engagement: return "Spark saves, shares and comments"
        case .leads: return "Collect sign-ups and inquiries"
        case .sales: return "Drive purchases with offers and proof"
        }
    }

    private var audienceStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Who is it for?", "Describe your audience or pick a suggestion.")
            MSTextEditor(label: "Target audience", placeholder: "e.g. Women and men 20–35 who want simpler skincare", text: $audience, minHeight: 100)
            VStack(alignment: .leading, spacing: 8) {
                Text("Suggested").msCaption(color: MSColor.text2)
                FlowLayout(spacing: 8) {
                    ForEach(Self.audienceChips, id: \.self) { chip in
                        MSChip(title: chip, selected: audience == chip) { audience = chip }
                    }
                }
            }
            if !store.brand.audience.isEmpty {
                MSCard(padding: 12) {
                    HStack(spacing: 10) {
                        Image(systemName: "paintpalette").foregroundStyle(MSColor.text2)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("From \(store.brand.name) brand kit").font(MSFont.control(13)).foregroundStyle(MSColor.text)
                            Text(store.brand.audience).msCaption().lineLimit(2)
                        }
                        Spacer()
                        Button("Use") { audience = store.brand.audience }
                            .font(MSFont.control(13)).foregroundStyle(MSColor.highlight)
                    }
                }
            }
        }
    }

    private var platformsStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Where will it run?", "Pick one or more platforms. Formats adapt to each.")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(SocialPlatform.allCases) { p in
                    let on = platforms.contains(p)
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { if on { platforms.remove(p) } else { platforms.insert(p) } }
                    } label: {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: p.icon)
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(on ? MSColor.highlight : MSColor.text2)
                                Spacer()
                                Image(systemName: on ? "checkmark.circle.fill" : "circle").foregroundStyle(on ? MSColor.accent : MSColor.muted)
                            }
                            Text(p.title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(on ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
        }
    }

    private var formatsStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Creative formats", "We generate a set of assets for every format you choose.")
            VStack(spacing: 10) {
                ForEach(ContentFormat.allCases) { f in
                    let on = formats.contains(f)
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { if on { formats.remove(f) } else { formats.insert(f) } }
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: formatIcon(f))
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(on ? MSColor.highlight : MSColor.text2)
                                .frame(width: 40, height: 40)
                                .background(on ? MSColor.accent.opacity(0.14) : MSColor.elevated, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(f.title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                Text(formatHint(f)).msCaption()
                            }
                            Spacer()
                            Image(systemName: on ? "checkmark.circle.fill" : "circle").foregroundStyle(on ? MSColor.accent : MSColor.muted)
                        }
                        .padding(12)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(on ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
        }
    }

    private func formatIcon(_ f: ContentFormat) -> String {
        switch f {
        case .productPhotos: return "camera"
        case .ugc: return "person.crop.square.badge.video"
        case .videoAds: return "video"
        case .stories: return "rectangle.portrait"
        case .carousels: return "rectangle.stack"
        }
    }

    private func formatHint(_ f: ContentFormat) -> String {
        switch f {
        case .productPhotos: return "Studio and lifestyle shots"
        case .ugc: return "Creator-style talking videos"
        case .videoAds: return "Short motion ads, 5–15s"
        case .stories: return "Vertical 9:16 sequences"
        case .carousels: return "Multi-slide posts"
        }
    }

    private var reviewStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepTitle("Review", "Name the campaign and generate creatives, copy and a calendar.")
            MSTextField(label: "Campaign name", placeholder: "e.g. Luma Glow Summer Launch", text: $name, icon: "flag")
            VStack(spacing: 8) {
                reviewRow("Objective", objective?.title ?? "—", icon: objective?.icon ?? "target") { withAnimation(MSAnimation.snappy) { step = 0 } }
                reviewRow("Audience", audience, icon: "person.2") { withAnimation(MSAnimation.snappy) { step = 1 } }
                reviewRow("Platforms", platforms.isEmpty ? "—" : SocialPlatform.allCases.filter { platforms.contains($0) }.map { $0.title }.joined(separator: ", "), icon: "square.grid.2x2") { withAnimation(MSAnimation.snappy) { step = 2 } }
                reviewRow("Formats", formats.isEmpty ? "—" : ContentFormat.allCases.filter { formats.contains($0) }.map { $0.title }.joined(separator: ", "), icon: "rectangle.stack") { withAnimation(MSAnimation.snappy) { step = 3 } }
                reviewRow("Project", store.currentProject?.name ?? "No project", icon: "folder", action: nil)
            }
            MSCard(padding: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "bolt.fill").foregroundStyle(MSColor.highlight)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(Self.campaignCost) credits").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        Text("6 creatives, 4 ad variations, 5 calendar slots").msCaption()
                    }
                    Spacer()
                    Text("\(store.credits) left").msCaption(color: store.canAfford(Self.campaignCost) ? MSColor.text2 : MSColor.danger)
                }
            }
        }
    }

    private func reviewRow(_ label: String, _ value: String, icon: String, action: (() -> Void)?) -> some View {
        MSCard(padding: 12, action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2).frame(width: 20)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).msCaption()
                    Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(2).multilineTextAlignment(.leading)
                }
                Spacer()
                if action != nil { Image(systemName: "pencil").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted) }
            }
        }
    }

    // MARK: Generating

    private var generatingView: some View {
        VStack(spacing: 24) {
            Spacer()
            ZStack {
                Circle().strokeBorder(MSColor.accent.opacity(0.25), lineWidth: 6).frame(width: 92, height: 92)
                Circle().trim(from: 0, to: CGFloat(progressStep + 1) / CGFloat(Self.generationSteps.count))
                    .stroke(MSColor.accentGradient, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 92, height: 92)
                    .animation(MSAnimation.slow, value: progressStep)
                Image(systemName: "sparkles").font(.system(size: 28, weight: .semibold)).foregroundStyle(MSColor.highlight)
            }
            VStack(spacing: 6) {
                Text("Building \(name)").msHeadline(20).multilineTextAlignment(.center)
                Text("Creatives, ad variations and a content calendar.").msBody(14).multilineTextAlignment(.center)
            }
            ProgressIndicator(steps: Self.generationSteps, currentStep: progressStep)
                .msCard()
                .padding(.horizontal, MSSpacing.gutter)
            Spacer()
            Spacer()
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private func generate() {
        guard let objective else { return }
        let params = CampaignParams(
            name: name.trimmingCharacters(in: .whitespaces),
            objective: objective,
            audience: audience.trimmingCharacters(in: .whitespacesAndNewlines),
            platforms: SocialPlatform.allCases.filter { platforms.contains($0) },
            formats: ContentFormat.allCases.filter { formats.contains($0) },
            projectId: store.currentProjectId
        )
        progressStep = 0
        withAnimation(MSAnimation.gentle) { generating = true }
        Task {
            do {
                let campaign = try await MockAPI.createCampaign(params, store: store) { label in
                    if let i = Self.generationSteps.firstIndex(of: label) { progressStep = i }
                }
                progressStep = Self.generationSteps.count
                try? await Task.sleep(for: .milliseconds(350))
                MSHaptic.success()
                router.toast("Campaign ready", style: .success)
                router.pop()
                router.push(.campaignDetail(id: campaign.id))
            } catch {
                generating = false
                errorMessage = error.localizedDescription
            }
        }
    }
}
