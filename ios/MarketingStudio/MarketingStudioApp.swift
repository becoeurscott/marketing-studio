import SwiftUI

@main
struct MarketingStudioApp: App {
    @StateObject private var store = AppStore()
    @StateObject private var router = Router()
    @StateObject private var auth = AuthService.shared

    init() {
        Self.configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(router)
                .environmentObject(auth)
                .preferredColorScheme(.dark)
                .tint(MSColor.accent)
        }
    }

    /// Dark, flat chrome for UIKit-backed bars.
    private static func configureAppearance() {
        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor(MSColor.surface)
        tab.shadowColor = UIColor.white.withAlphaComponent(0.08)
        let normal = UIColor(MSColor.muted)
        let selected = UIColor.white
        for item in [tab.stackedLayoutAppearance, tab.inlineLayoutAppearance, tab.compactInlineLayoutAppearance] {
            item.normal.iconColor = normal
            item.normal.titleTextAttributes = [.foregroundColor: normal, .font: UIFont.systemFont(ofSize: 10, weight: .medium)]
            item.selected.iconColor = selected
            item.selected.titleTextAttributes = [.foregroundColor: selected, .font: UIFont.systemFont(ofSize: 10, weight: .semibold)]
        }
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab

        UINavigationBar.appearance().tintColor = .white
    }
}
