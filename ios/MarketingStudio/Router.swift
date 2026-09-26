import SwiftUI

// MARK: - Tabs

enum AppTab: String, CaseIterable, Identifiable, Codable {
    case home, studio, projects, assets, more
    var id: String { rawValue }
    var title: String {
        switch self {
        case .home: return "Accueil"
        case .studio: return "Studio"
        case .projects: return "Projets"
        case .assets: return "Ressources"
        case .more: return "Plus"
        }
    }
    var icon: String {
        switch self {
        case .home: return "house"
        case .studio: return "sparkles"
        case .projects: return "folder"
        case .assets: return "photo.on.rectangle"
        case .more: return "ellipsis.circle"
        }
    }
    var selectedIcon: String {
        switch self {
        case .home: return "house.fill"
        case .studio: return "sparkles"
        case .projects: return "folder.fill"
        case .assets: return "photo.on.rectangle.fill"
        case .more: return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Routes (one case per SPEC screen)

enum AppRoute: Hashable {
    // Studio + generators
    case studio
    case imageGenerator
    case videoGenerator
    case ugcCreator
    case ugcCreatorWithScript(script: String)
    case productShoot
    case adCreator
    case copywriter
    case hookGenerator
    case assistant
    // Projects
    case projects
    case projectDetail(id: String)
    // Campaigns
    case campaigns
    case campaignBuilder
    case campaignDetail(id: String)
    case contentCalendar(campaignId: String)
    // Library
    case assets
    case assetDetail(id: String)
    case templates
    case templateDetail(id: String)
    case generations
    case favorites
    case exportCenter
    // Brand
    case brandKit
    case brandVoice
    case creators
    // Account
    case credits
    case pricing
    case notifications
    case workspace
    case profile
    case settings
    case help
}

// MARK: - Sheets

enum AppSheet: Identifiable, Hashable {
    case newProject
    case editProject(id: String)
    case buyCredits
    case upgrade(plan: Plan?)
    case inviteMember
    case uploadProduct
    case exportAssets(ids: [String])
    case addCalendarItem(campaignId: String)
    case newBrand
    /// Shown when a feature is locked on the current plan. `feature` is the human label (e.g. "Video generation").
    case paywall(feature: String)

    /// Presentation detents per sheet. Forms and tall pickers need the full height so their
    /// header never scrolls out of the medium detent.
    var detents: Set<PresentationDetent> { [.large] }

    var id: String {
        switch self {
        case .newProject: return "newProject"
        case .editProject(let id): return "editProject_\(id)"
        case .buyCredits: return "buyCredits"
        case .upgrade(let plan): return "upgrade_\(plan?.rawValue ?? "none")"
        case .inviteMember: return "inviteMember"
        case .uploadProduct: return "uploadProduct"
        case .exportAssets(let ids): return "export_\(ids.joined(separator: ","))"
        case .addCalendarItem(let id): return "addCalendarItem_\(id)"
        case .newBrand: return "newBrand"
        case .paywall(let f): return "paywall_\(f)"
        }
    }
}

// MARK: - Toasts

struct Toast: Identifiable, Equatable {
    enum Style { case info, success, warning, error }
    let id = UUID()
    var message: String
    var style: Style = .info
    var icon: String? = nil
}

// MARK: - Router

/// Owns per-tab navigation stacks, the single presented sheet and the toast queue.
/// Views push with `router.push(.projectDetail(id:))` and never build NavigationLinks by hand.
@MainActor
final class Router: ObservableObject {
    @Published var selectedTab: AppTab = .home
    @Published var paths: [AppTab: NavigationPath] = [:]
    @Published var presentedSheet: AppSheet?
    @Published var toasts: [Toast] = []

    /// Binding for a tab's NavigationStack.
    func pathBinding(for tab: AppTab) -> Binding<NavigationPath> {
        Binding(
            get: { self.paths[tab] ?? NavigationPath() },
            set: { self.paths[tab] = $0 }
        )
    }

    /// Push a route on the current tab (or a specific tab, switching to it first).
    func push(_ route: AppRoute, on tab: AppTab? = nil) {
        let target = tab ?? selectedTab
        if target != selectedTab { selectedTab = target }
        var path = paths[target] ?? NavigationPath()
        path.append(route)
        paths[target] = path
    }

    func pop(on tab: AppTab? = nil) {
        let target = tab ?? selectedTab
        var path = paths[target] ?? NavigationPath()
        if !path.isEmpty { path.removeLast() }
        paths[target] = path
    }

    func popToRoot(on tab: AppTab? = nil) {
        paths[tab ?? selectedTab] = NavigationPath()
    }

    func select(_ tab: AppTab) {
        if selectedTab == tab { popToRoot(on: tab) } else { selectedTab = tab }
    }

    func present(_ sheet: AppSheet) { presentedSheet = sheet }
    func dismissSheet() { presentedSheet = nil }

    // MARK: Toasts

    func toast(_ message: String, style: Toast.Style = .info, icon: String? = nil) {
        let t = Toast(message: message, style: style, icon: icon)
        withAnimation(MSAnimation.snappy) { toasts.append(t) }
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(2.6))
            await MainActor.run { self?.remove(t) }
        }
    }

    func remove(_ toast: Toast) {
        withAnimation(MSAnimation.gentle) { toasts.removeAll { $0.id == toast.id } }
    }
}
