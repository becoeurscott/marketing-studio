import SwiftUI

/// SPEC §42: five chip-select steps → "Your studio is ready."
struct OnboardingFlow: View {
    @EnvironmentObject private var store: AppStore

    private struct Step {
        let title: String
        let subtitle: String
        let options: [String]
        let icons: [String: String]
        let multi: Bool
        let keyPath: WritableKeyPath<OnboardingAnswers, [String]>
    }

    private let steps: [Step] = [
        Step(title: "What are you creating?", subtitle: "We'll tune the studio around it.",
             options: ["Product", "Brand", "Content", "Ads", "Campaigns", "Other"],
             icons: ["Product": "shippingbox", "Brand": "paintpalette", "Content": "text.below.photo", "Ads": "megaphone", "Campaigns": "flag", "Other": "sparkles"],
             multi: false, keyPath: \.creating),
        Step(title: "What's your role?", subtitle: "Helps us pick the right templates.",
             options: ["Founder", "Marketer", "Creator", "Agency", "Freelancer", "E-commerce seller"],
             icons: ["Founder": "star", "Marketer": "chart.line.uptrend.xyaxis", "Creator": "camera", "Agency": "building.2", "Freelancer": "laptopcomputer", "E-commerce seller": "cart"],
             multi: false, keyPath: \.role),
        Step(title: "What do you want to create?", subtitle: "Pick everything that applies.",
             options: ["Images", "Videos", "Ads", "Social content", "Full campaigns"],
             icons: ["Images": "photo", "Videos": "video", "Ads": "rectangle.stack", "Social content": "bubble.left.and.bubble.right", "Full campaigns": "flag.checkered"],
             multi: true, keyPath: \.wants),
        Step(title: "Where do you publish?", subtitle: "We'll default to the right formats and ratios.",
             options: ["Instagram", "TikTok", "Facebook", "YouTube", "Google", "Pinterest"],
             icons: ["Instagram": "camera.circle", "TikTok": "music.note", "Facebook": "person.2.circle", "YouTube": "play.rectangle", "Google": "magnifyingglass.circle", "Pinterest": "pin.circle"],
             multi: true, keyPath: \.platforms),
        Step(title: "What's your biggest goal?", subtitle: "One thing you'd love this studio to do.",
             options: ["More sales", "More content", "Brand awareness", "Save time", "Scale marketing"],
             icons: ["More sales": "cart", "More content": "square.grid.2x2", "Brand awareness": "eye", "Save time": "clock", "Scale marketing": "arrow.up.right"],
             multi: false, keyPath: \.goal),
    ]

    @State private var index = 0
    @State private var answers = OnboardingAnswers()
    @State private var selection: Set<String> = []
    @State private var finished = false
    @State private var direction: Edge = .trailing

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            if finished {
                readyScreen.transition(.opacity.combined(with: .scale(scale: 0.96)))
            } else {
                stepScreen
            }
        }
        .animation(MSAnimation.slow, value: finished)
    }

    // MARK: Step

    private var stepScreen: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            ZStack {
                stepContent(steps[index])
                    .id(index)
                    .transition(.asymmetric(
                        insertion: .move(edge: direction).combined(with: .opacity),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing).combined(with: .opacity)
                    ))
            }
            .animation(MSAnimation.snappy, value: index)
            Spacer(minLength: 0)
            footer
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                if index > 0 {
                    Button { back() } label: {
                        Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.text2)
                            .frame(width: 32, height: 32)
                    }
                } else {
                    HStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 6, style: .continuous).fill(MSColor.accentGradient).frame(width: 22, height: 22)
                        Text("Marketing Studio").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text)
                    }
                }
                Spacer()
                Text("\(index + 1) / \(steps.count)").msCaption()
            }
            MSProgressBar(progress: Double(index + 1) / Double(steps.count))
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.top, 12)
        .padding(.bottom, 28)
    }

    private func stepContent(_ step: Step) -> some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Text(step.title).msTitle(30)
                Text(step.subtitle).msBody(15)
            }
            ChipGroup(options: step.options, selection: $selection, mode: step.multi ? .multi : .single, icons: step.icons)
            if step.multi {
                Text("Select one or more").msCaption()
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var footer: some View {
        VStack(spacing: 10) {
            MSButton(title: index == steps.count - 1 ? "Finish" : "Continue", icon: "arrow.right", isDisabled: selection.isEmpty) {
                next()
            }
            Button { skip() } label: {
                Text("Skip for now").font(MSFont.control(13)).foregroundStyle(MSColor.muted)
            }
            .padding(.top, 2)
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 16)
    }

    // MARK: Ready

    private var readyScreen: some View {
        VStack(spacing: 28) {
            Spacer()
            ZStack {
                Circle().fill(MSColor.accent.opacity(0.12)).frame(width: 120, height: 120)
                Circle().strokeBorder(MSColor.accent.opacity(0.35), lineWidth: 1).frame(width: 120, height: 120)
                Image(systemName: "sparkles").font(.system(size: 42, weight: .medium)).foregroundStyle(MSColor.highlight)
            }
            VStack(spacing: 10) {
                Text("Your studio is ready.").msTitle(32)
                Text("Upload a product, pick a format and generate your first campaign in minutes.")
                    .msBody(15).multilineTextAlignment(.center).lineSpacing(3)
                    .frame(maxWidth: 320)
            }
            Spacer()
            MSButton(title: "Enter the studio", icon: "arrow.right") {
                MSHaptic.success()
                store.completeOnboarding(answers)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
    }

    // MARK: Logic

    private func commitSelection() {
        answers[keyPath: steps[index].keyPath] = Array(selection).sorted()
    }

    private func loadSelection() {
        selection = Set(answers[keyPath: steps[index].keyPath])
    }

    private func next() {
        commitSelection()
        if index == steps.count - 1 {
            finished = true
        } else {
            direction = .trailing
            index += 1
            loadSelection()
        }
    }

    private func back() {
        commitSelection()
        direction = .leading
        index -= 1
        loadSelection()
    }

    private func skip() {
        commitSelection()
        finished = true
    }
}
