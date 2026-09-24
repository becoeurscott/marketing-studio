import SwiftUI

/// Credits pill shown in the top bar. Tapping opens the Credits screen.
struct CreditBadge: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var compact: Bool = true

    var body: some View {
        Button {
            router.push(.credits)
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(MSColor.highlight)
                Text(store.credits.formatted())
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(MSColor.text)
                    .contentTransition(.numericText())
            }
            .padding(.horizontal, 10)
            .frame(height: 30)
            .background(MSColor.elevated, in: Capsule())
            .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
        .animation(MSAnimation.snappy, value: store.credits)
    }
}

/// Bell with unread count.
struct NotificationBell: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        Button {
            router.push(.notifications)
        } label: {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "bell")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(MSColor.text)
                    .frame(width: 30, height: 30)
                    .background(MSColor.elevated, in: Circle())
                    .overlay(Circle().strokeBorder(MSColor.border, lineWidth: 1))
                if store.unreadNotificationCount > 0 {
                    Text("\(min(store.unreadNotificationCount, 9))")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 15, height: 15)
                        .background(MSColor.accent, in: Circle())
                        .offset(x: 3, y: -3)
                }
            }
        }
        .buttonStyle(MSPressStyle())
    }
}

/// Standard trailing top-bar items for tab roots.
struct MSTopBarItems: ToolbarContent {
    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            HStack(spacing: 8) {
                CreditBadge()
                NotificationBell()
            }
        }
    }
}
