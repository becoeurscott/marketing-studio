import SwiftUI

/// Temporary body for screens other agents will implement. Keeps navigation working end-to-end.
struct PlaceholderScreen: View {
    var title: String
    var icon: String
    var message: String
    var ctaTitle: String? = nil
    var ctaRoute: AppRoute? = nil
    @EnvironmentObject private var router: Router

    var body: some View {
        ScrollView {
            EmptyStateView(icon: icon, title: title, message: message, ctaTitle: ctaTitle) {
                if let ctaRoute { router.push(ctaRoute) }
            }
            .padding(.top, 60)
        }
        .msScreen()
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }
}
