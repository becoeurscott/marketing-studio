import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var router: Router

    var body: some View {
        TabView(selection: tabSelection) {
            ForEach(AppTab.allCases) { tab in
                NavigationStack(path: router.pathBinding(for: tab)) {
                    tabRoot(tab)
                        .navigationDestination(for: AppRoute.self) { route in
                            RouteDestination(route: route)
                        }
                }
                .tabItem {
                    Label(tab.title, systemImage: router.selectedTab == tab ? tab.selectedIcon : tab.icon)
                }
                .tag(tab)
            }
        }
    }

    /// Re-selecting the current tab pops it to root.
    private var tabSelection: Binding<AppTab> {
        Binding(
            get: { router.selectedTab },
            set: { router.select($0) }
        )
    }

    @ViewBuilder
    private func tabRoot(_ tab: AppTab) -> some View {
        switch tab {
        case .home: HomeView()
        case .studio: StudioView()
        case .projects: ProjectsView()
        case .assets: AssetsView()
        case .more: MoreView()
        }
    }
}
