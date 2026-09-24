import SwiftUI

/// SPEC §37 — Pricing: four plan cards, monthly/yearly toggle, current plan badge, upgrade flow.
struct PricingView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var yearly = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Plans").msTitle(30)
                    Text("Every plan includes the full studio. Pick the volume that fits your output.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                billingToggle.padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 12) {
                    ForEach(Plan.allCases) { plan in
                        PlanCard(plan: plan, yearly: yearly, current: store.plan == plan, recommended: plan == .studio) {
                            router.present(.upgrade(plan: plan))
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                MSCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("All plans include").msHeadline(15)
                        ForEach(["Image, video, UGC and ad generation", "Copywriter and hook generator", "Campaign builder and content calendar", "Export in PNG, JPG, MP4 and PDF", "Cancel anytime"], id: \.self) { f in
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.success)
                                Text(f).msBody(14)
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                Text("Prototype: no card is charged. Upgrading switches your plan and adds the plan's monthly credits.")
                    .msCaption()
                    .padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Pricing")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var billingToggle: some View {
        HStack(spacing: 10) {
            SegmentedTabs(tabs: ["Monthly", "Yearly"], selection: Binding(get: { yearly ? 1 : 0 }, set: { yearly = $0 == 1 }))
                .frame(maxWidth: 240)
            if yearly { MSBadge(text: "Save 20%", tone: .success) }
            Spacer()
        }
        .animation(MSAnimation.gentle, value: yearly)
    }
}

/// Price per month for the given billing cycle.
extension Plan {
    func price(yearly: Bool) -> Int { yearly ? Int((Double(monthlyPrice) * 0.8).rounded()) : monthlyPrice }
    var tagline: String {
        switch self {
        case .starter: return "For trying ideas and small shops"
        case .creator: return "For creators posting every week"
        case .studio: return "For brands running campaigns"
        case .agency: return "For teams serving many clients"
        }
    }
    var icon: String {
        switch self {
        case .starter: return "leaf"
        case .creator: return "camera"
        case .studio: return "sparkles"
        case .agency: return "building.2"
        }
    }
    /// Ordering used to decide upgrade vs downgrade.
    var rank: Int { Plan.allCases.firstIndex(of: self) ?? 0 }
}

struct PlanCard: View {
    var plan: Plan
    var yearly: Bool
    var current: Bool
    var recommended: Bool
    var action: () -> Void
    @EnvironmentObject private var store: AppStore

    private var isDowngrade: Bool { plan.rank < store.plan.rank }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                HStack(spacing: 10) {
                    Image(systemName: plan.icon).font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(recommended ? MSColor.highlight : MSColor.text2)
                        .frame(width: 34, height: 34)
                        .background((recommended ? MSColor.accent.opacity(0.14) : MSColor.elevated), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(plan.title).msHeadline(18)
                        Text(plan.tagline).msCaption()
                    }
                }
                Spacer()
                if current { MSBadge(text: "Current plan", tone: .success, icon: "checkmark") }
                else if recommended { MSBadge(text: "Recommended", tone: .accent) }
            }
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("$\(plan.price(yearly: yearly))").font(.system(size: 34, weight: .bold, design: .rounded)).tracking(-1).foregroundStyle(MSColor.text)
                    .contentTransition(.numericText())
                Text("/ month").msBody(14)
                if yearly { Text("billed yearly").msCaption() }
            }
            .animation(MSAnimation.snappy, value: yearly)
            VStack(alignment: .leading, spacing: 7) {
                ForEach(plan.features, id: \.self) { f in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(recommended ? MSColor.highlight : MSColor.success)
                        Text(f).msBody(14, color: MSColor.text)
                    }
                }
            }
            MSButton(
                title: current ? "Your plan" : (isDowngrade ? "Switch to \(plan.title)" : "Upgrade to \(plan.title)"),
                icon: current ? "checkmark" : (isDowngrade ? "arrow.down" : "arrow.up"),
                style: current ? .secondary : (recommended ? .primary : .secondary),
                isDisabled: current,
                action: action
            )
        }
        .padding(18)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous).strokeBorder(recommended ? MSColor.accent.opacity(0.55) : (current ? MSColor.success.opacity(0.4) : MSColor.border), lineWidth: 1))
    }
}

// MARK: - Upgrade confirm + success (AppSheet.upgrade)

struct UpgradeSheet: View {
    var plan: Plan?
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var selected: Plan
    @State private var yearly = false
    @State private var working = false
    @State private var done = false

    init(plan: Plan?) {
        self.plan = plan
        _selected = State(initialValue: plan ?? .studio)
    }

    var body: some View {
        BottomSheetContainer(title: done ? nil : "Confirm your plan") {
            if done { success } else { confirm }
        }
    }

    private var confirm: some View {
        VStack(alignment: .leading, spacing: 16) {
            if plan == nil {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Plan.allCases) { p in
                            MSChip(title: "\(p.title) $\(p.monthlyPrice)", selected: selected == p) { selected = p }
                        }
                    }
                }
            }
            MSCard(elevated: true) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(selected.title).msHeadline(20)
                            Text(selected.tagline).msCaption()
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("$\(selected.price(yearly: yearly))").font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
                            Text("per month").msCaption()
                        }
                    }
                    Divider().overlay(MSColor.border)
                    row("Current plan", store.plan.title)
                    row("Credits added now", "+\(selected.monthlyCredits.formatted())")
                    row("Billing", yearly ? "Yearly, $\(selected.price(yearly: true) * 12)" : "Monthly")
                    row("Next charge", "Prototype: none")
                }
            }
            Toggle(isOn: $yearly) {
                HStack(spacing: 8) {
                    Text("Bill yearly").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    MSBadge(text: "Save 20%", tone: .success)
                }
            }
            .tint(MSColor.accent)
            Spacer(minLength: 0)
            MSButton(title: working ? "Updating plan" : (selected == store.plan ? "Already on \(selected.title)" : "Confirm \(selected.title)"), icon: working ? nil : "lock.fill", isLoading: working, isDisabled: selected == store.plan) {
                working = true
                Task {
                    try? await Task.sleep(for: .seconds(1.3))
                    store.setPlan(selected)
                    MSHaptic.success()
                    withAnimation(MSAnimation.snappy) { working = false; done = true }
                }
            }
            MSButton(title: "Not now", style: .ghost) { router.dismissSheet() }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 16)
    }

    private var success: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(MSColor.accent.opacity(0.16)).frame(width: 92, height: 92)
                Image(systemName: selected.icon).font(.system(size: 36, weight: .semibold)).foregroundStyle(MSColor.highlight)
            }
            .padding(.top, 24)
            Text("Welcome to \(selected.title)").msTitle(28)
            Text("\(selected.monthlyCredits.formatted()) credits were added. Your balance is \(store.credits.formatted()).")
                .msBody(15).multilineTextAlignment(.center)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(selected.features.prefix(3), id: \.self) { f in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success).font(.system(size: 14))
                        Text(f).msBody(14, color: MSColor.text)
                    }
                }
            }
            .msCard()
            Spacer(minLength: 0)
            MSButton(title: "Start creating", icon: "sparkles") {
                router.dismissSheet()
                router.select(.studio)
            }
            MSButton(title: "Done", style: .ghost) { router.dismissSheet() }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 16)
        .transition(.opacity.combined(with: .scale(scale: 0.96)))
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).msBody(14)
            Spacer()
            Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text)
        }
    }
}

// MARK: - Paywall (AppSheet.paywall) — present when a feature is locked on the current plan.

struct PaywallSheet: View {
    var feature: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    private var suggested: Plan {
        Plan.allCases.first { $0.rank > store.plan.rank } ?? .agency
    }

    var body: some View {
        BottomSheetContainer {
            VStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 22, style: .continuous).fill(MSColor.accent.opacity(0.14)).frame(width: 76, height: 76)
                    Image(systemName: "lock.fill").font(.system(size: 30, weight: .semibold)).foregroundStyle(MSColor.highlight)
                }
                .padding(.top, 8)
                VStack(spacing: 6) {
                    Text("\(feature) is locked").msTitle(24).multilineTextAlignment(.center)
                    Text("Your \(store.plan.title) plan has reached its limit for this. Upgrade to \(suggested.title) to keep going.")
                        .msBody(14).multilineTextAlignment(.center)
                }
                MSCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(suggested.title).msHeadline(16)
                            Spacer()
                            Text("$\(suggested.monthlyPrice)/mo").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        }
                        ForEach(suggested.features.prefix(3), id: \.self) { f in
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.success)
                                Text(f).msBody(13)
                            }
                        }
                    }
                }
                Spacer(minLength: 0)
                MSButton(title: "Upgrade to \(suggested.title)", icon: "arrow.up") {
                    router.present(.upgrade(plan: suggested))
                }
                MSButton(title: "Buy credits instead", icon: "bolt", style: .secondary) { router.present(.buyCredits) }
                MSButton(title: "See all plans", style: .ghost) {
                    router.dismissSheet()
                    router.push(.pricing, on: .more)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
    }
}
