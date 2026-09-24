import SwiftUI

/// Help: FAQ accordion, quick links, contact, version.
struct HelpView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.openURL) private var openURL

    @State private var query = ""
    @State private var expanded: Set<String> = []

    private struct FAQ: Identifiable {
        let id: String
        let q: String
        let a: String
    }

    private let faqs: [FAQ] = [
        FAQ(id: "credits", q: "How do credits work?", a: "Every generation costs credits: 10 per image, 50 per video, 15 per upscale, 20 per ad set and 2 per copy result. Your plan refills credits monthly and you can top up anytime from the Credits screen."),
        FAQ(id: "template", q: "What happens when I use a template?", a: "The Studio opens with the template's prompt, style and aspect ratio already filled in. Swap in your product, tweak the prompt and generate."),
        FAQ(id: "brand", q: "How does the brand kit affect results?", a: "Colors, fonts and the brand voice are passed to every generator. Copy follows your tone and writing style; visuals lean on your palette."),
        FAQ(id: "ugc", q: "Are the creators real people?", a: "No. Every creator is a fictional AI presenter. Pick one in Creators, then use them in the UGC Creator with your script, tone and product."),
        FAQ(id: "campaign", q: "Can I publish directly to Instagram or TikTok?", a: "Not in this prototype. The content calendar plans posts by platform and status; exports give you the files to publish yourself."),
        FAQ(id: "export", q: "Which export formats are supported?", a: "PNG, JPG, MP4 and PDF in Standard, High or Maximum quality. Export a selection of assets or a whole campaign from the Export Center."),
        FAQ(id: "team", q: "How many teammates can I invite?", a: "Starter includes 1 seat, Creator 3, Studio 10 and Agency unlimited. Owners and admins manage members from the Workspace screen."),
        FAQ(id: "data", q: "Where is my data stored?", a: "Everything in this prototype lives on this device. Reset demo data in Settings wipes it and restarts onboarding."),
    ]

    private var filteredFAQs: [FAQ] {
        query.isEmpty ? faqs : faqs.filter { $0.q.localizedCaseInsensitiveContains(query) || $0.a.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Help").msTitle(30)
                    Text("Answers, shortcuts and a way to reach us.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SearchBar(placeholder: "Search help", text: $query).padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Quick links")
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    quickLink("Getting started", "Upload, generate, export", icon: "play.circle") { router.select(.studio) }
                    quickLink("Templates", "Ready-made presets", icon: "rectangle.on.rectangle") { router.push(.templates) }
                    quickLink("Credits & plans", "What things cost", icon: "bolt") { router.push(.credits) }
                    quickLink("Brand kit", "Stay on brand", icon: "paintpalette") { router.push(.brandKit) }
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "FAQ", subtitle: "\(filteredFAQs.count) questions")
                if filteredFAQs.isEmpty {
                    EmptyStateView(icon: "questionmark.circle", title: "No answers found", message: "Try another keyword or contact support.", ctaTitle: "Clear search") { query = "" }
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(filteredFAQs.enumerated()), id: \.element.id) { i, f in
                            faqRow(f)
                            if i < filteredFAQs.count - 1 { Rectangle().fill(MSColor.border).frame(height: 1) }
                        }
                    }
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .padding(.horizontal, MSSpacing.gutter)
                }

                SectionHeader(title: "Contact")
                MSCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.highlight)
                                .frame(width: 36, height: 36).background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Talk to the team").msHeadline(15)
                                Text("We reply within one business day.").msCaption()
                            }
                        }
                        HStack(spacing: 8) {
                            MSButton(title: "Email support", icon: "envelope", style: .secondary, size: .compact) {
                                if let url = URL(string: "mailto:support@marketingstudio.app?subject=Marketing%20Studio%20support") {
                                    openURL(url) { ok in if !ok { router.toast("Mail is not set up on this device", style: .warning) } }
                                }
                            }
                            MSButton(title: "Report a bug", icon: "ladybug", style: .ghost, size: .compact) {
                                router.toast("Bug report sent (mock)", style: .success)
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 4) {
                    Text("Marketing Studio").font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                    Text("Version \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0") (\(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")) · Prototype").msCaption()
                    Text("Signed in as \(store.user.email)").msCaption()
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Help")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func quickLink(_ title: String, _ subtitle: String, icon: String, action: @escaping () -> Void) -> some View {
        MSCard(padding: 14, action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: icon).font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.text2)
                    .frame(width: 32, height: 32).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                    Text(subtitle).msCaption()
                }
            }
        }
    }

    private func faqRow(_ f: FAQ) -> some View {
        let open = expanded.contains(f.id)
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                MSHaptic.tap()
                withAnimation(MSAnimation.snappy) {
                    if open { expanded.remove(f.id) } else { expanded.insert(f.id) }
                }
            } label: {
                HStack(spacing: 12) {
                    Text(f.q).font(MSFont.control(15)).foregroundStyle(MSColor.text).multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: "chevron.down").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
                        .rotationEffect(.degrees(open ? 180 : 0))
                }
                .padding(.horizontal, 14).padding(.vertical, 14)
                .contentShape(Rectangle())
            }
            .buttonStyle(MSPressStyle())
            if open {
                Text(f.a).msBody(14).lineSpacing(3)
                    .padding(.horizontal, 14).padding(.bottom, 14)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .clipped()
    }
}
