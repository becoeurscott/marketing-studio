import SwiftUI

/// SPEC §30 — Brand Voice: tone chips, writing style editor, keywords, sample copy preview.
struct BrandVoiceView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var tone: Set<String> = []
    @State private var style = ""
    @State private var keywords = ""
    @State private var avoid = ""
    @State private var sampleIndex = 0
    @State private var regenerating = false
    @State private var loaded = false

    private let tones = ["Luxury", "Friendly", "Bold", "Playful", "Professional", "Minimal", "Urgent"]
    private let toneIcons = ["Luxury": "crown", "Friendly": "hand.wave", "Bold": "bolt", "Playful": "face.smiling", "Professional": "briefcase", "Minimal": "circle", "Urgent": "timer"]

    private var currentTone: String { tone.first ?? store.brand.voice.tone }
    private var isDirty: Bool {
        let v = store.brand.voice
        return currentTone != v.tone || style != v.writingStyle || parsed(keywords) != v.keywords || parsed(avoid) != v.avoid
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Brand Voice").msTitle(30)
                    Text("Used every time the Copywriter, Hook Generator and Ad Creator write for \(store.brand.name).").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Tone").msHeadline(15)
                    ChipGroup(options: tones, selection: $tone, mode: .single, icons: toneIcons, allowDeselect: false)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Writing style").msHeadline(15)
                    MSTextEditor(placeholder: "Short sentences. Confident. Never overly formal.", text: $style, minHeight: 96)
                    Text("Describe rhythm, attitude and what to avoid. The AI follows this literally.").msCaption()
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 12) {
                    MSTextField(label: "Keywords to use", placeholder: "glow, clean, everyday", text: $keywords, icon: "text.badge.checkmark", autocapitalization: .never)
                    MSTextField(label: "Words to avoid", placeholder: "miracle, cheap", text: $avoid, icon: "text.badge.xmark", autocapitalization: .never)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Sample copy", subtitle: "Generated with this voice", actionTitle: regenerating ? nil : "Regenerate") { regenerate() }
                sampleCard.padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 4)
            .padding(.bottom, 110)
        }
        .msScreen()
        .navigationTitle("Brand Voice")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            MSButton(title: isDirty ? "Save voice" : "Saved", icon: isDirty ? "checkmark" : "checkmark.circle.fill", isDisabled: !isDirty) {
                store.updateBrandVoice(BrandVoice(tone: currentTone, writingStyle: style.trimmingCharacters(in: .whitespacesAndNewlines), keywords: parsed(keywords), avoid: parsed(avoid)))
                MSHaptic.success()
                router.toast("Brand voice saved", style: .success)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.vertical, 12)
            .background(MSColor.bg.opacity(0.92))
        }
        .onAppear {
            guard !loaded else { return }
            let v = store.brand.voice
            tone = [v.tone]
            style = v.writingStyle
            keywords = v.keywords.joined(separator: ", ")
            avoid = v.avoid.joined(separator: ", ")
            loaded = true
        }
    }

    private var sampleCard: some View {
        MSCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    MSBadge(text: currentTone, tone: .accent)
                    MSBadge(text: "Instagram caption", tone: .neutral)
                    Spacer()
                    Image(systemName: "sparkles").foregroundStyle(MSColor.highlight).font(.system(size: 12, weight: .semibold))
                }
                if regenerating {
                    VStack(alignment: .leading, spacing: 8) {
                        SkeletonView(cornerRadius: 6).frame(height: 14)
                        SkeletonView(cornerRadius: 6).frame(height: 14).frame(maxWidth: 260)
                        SkeletonView(cornerRadius: 6).frame(height: 14).frame(maxWidth: 180)
                    }
                } else {
                    Text(sample).msBody(15, color: MSColor.text).lineSpacing(4)
                        .id(sampleIndex)
                        .transition(.opacity)
                }
                Divider().overlay(MSColor.border)
                HStack(spacing: 8) {
                    MSButton(title: "Copy", icon: "doc.on.doc", style: .secondary, size: .compact, fullWidth: false) {
                        UIPasteboard.general.string = sample
                        router.toast("Copied to clipboard", style: .success)
                    }
                    MSButton(title: "Open Copywriter", icon: "text.alignleft", style: .ghost, size: .compact, fullWidth: false) {
                        router.push(.copywriter, on: .studio)
                    }
                }
            }
        }
        .animation(MSAnimation.gentle, value: regenerating)
    }

    private func regenerate() {
        regenerating = true
        Task {
            try? await Task.sleep(for: .milliseconds(900))
            sampleIndex += 1
            regenerating = false
        }
    }

    private var sample: String {
        let brand = store.brand.name
        let kw = parsed(keywords).first ?? "glow"
        let samples: [String: [String]] = [
            "Luxury": [
                "\(brand). One serum. Real \(kw). Nothing you don't need.",
                "Made for mornings that matter. \(brand) brings the \(kw) back, quietly.",
            ],
            "Friendly": [
                "Meet your new morning ritual. \(brand) makes \(kw) easy, every single day.",
                "Hey, skin. We brought \(kw). \(brand) is here to help.",
            ],
            "Bold": [
                "Stop settling. \(brand) delivers \(kw) you can actually see.",
                "\(kw.capitalized). Loud and clear. That's \(brand).",
            ],
            "Playful": [
                "Warning: \(brand) may cause excessive \(kw). Side effects include compliments.",
                "Your skin called. It wants \(brand). And a little \(kw).",
            ],
            "Professional": [
                "\(brand) is formulated for consistent \(kw) with daily use. Results in 4 weeks.",
                "Clinically minded. Clearly simple. \(brand) for everyday \(kw).",
            ],
            "Minimal": [
                "\(brand). \(kw.capitalized).",
                "Less routine. More \(kw). \(brand).",
            ],
            "Urgent": [
                "Launch pricing ends Sunday. Get your \(kw) with \(brand) before it's gone.",
                "48 hours left. \(brand) at 20% off. Your \(kw) can't wait.",
            ],
        ]
        let list = samples[currentTone] ?? samples["Friendly"]!
        return list[sampleIndex % list.count]
    }

    private func parsed(_ s: String) -> [String] {
        s.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).lowercased() }.filter { !$0.isEmpty }
    }
}
