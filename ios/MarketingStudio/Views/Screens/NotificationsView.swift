import SwiftUI

/// SPEC §38 — Notifications: grouped Today / Earlier, icons per kind, unread dots, mark all read, tap → route.
struct NotificationsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var filter = "Toutes"

    private var visible: [AppNotification] {
        store.notifications
            .filter { filter == "Toutes" || (filter == "Non lues" && !$0.read) }
            .sorted { $0.createdAt > $1.createdAt }
    }
    private var today: [AppNotification] { visible.filter { Calendar.current.isDateInToday($0.createdAt) } }
    private var earlier: [AppNotification] { visible.filter { !Calendar.current.isDateInToday($0.createdAt) } }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notifications").msTitle(30)
                        Text(store.unreadNotificationCount == 0 ? "Vous êtes à jour." : "\(store.unreadNotificationCount) non lue\(store.unreadNotificationCount > 1 ? "s" : "")").msBody(14)
                    }
                    Spacer()
                    if store.unreadNotificationCount > 0 {
                        MSButton(title: "Tout marquer comme lu", icon: "checkmark.circle", style: .secondary, size: .compact, fullWidth: false) {
                            withAnimation(MSAnimation.gentle) { store.markAllRead() }
                            router.toast("Toutes les notifications sont lues", style: .success)
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                ChipRow(options: ["Toutes", "Non lues"], selection: $filter)

                if visible.isEmpty {
                    EmptyStateView(
                        icon: "bell.slash",
                        title: filter == "Non lues" ? "Aucune notification non lue" : "Aucune notification pour le moment",
                        message: filter == "Non lues" ? "Les nouvelles activités apparaîtront ici." : "Vos générations, exports et mises à jour de campagne apparaîtront ici.",
                        ctaTitle: filter == "Non lues" ? "Tout afficher" : "Ouvrir le Studio"
                    ) {
                        if filter == "Non lues" { filter = "Toutes" } else { router.select(.studio) }
                    }
                } else {
                    if !today.isEmpty { group("Aujourd'hui", today) }
                    if !earlier.isEmpty { group("Plus tôt", earlier) }
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func group(_ title: String, _ items: [AppNotification]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased(with: Locale(identifier: "fr_FR"))).font(.system(size: 11, weight: .semibold)).tracking(0.8).foregroundStyle(MSColor.muted)
                .padding(.horizontal, MSSpacing.gutter + 4)
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { i, n in
                    NotificationRow(notification: n) { open(n) }
                        .contextMenu {
                            if !n.read { Button { store.markRead(n.id) } label: { Label("Marquer comme lu", systemImage: "checkmark") } }
                            Button(role: .destructive) {
                                withAnimation(MSAnimation.gentle) { store.deleteNotification(n.id) }
                            } label: { Label("Supprimer", systemImage: "trash") }
                        }
                    if i < items.count - 1 { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 62) }
                }
            }
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
            .padding(.horizontal, MSSpacing.gutter)
        }
        .animation(MSAnimation.gentle, value: items.map { $0.id })
    }

    private func open(_ n: AppNotification) {
        store.markRead(n.id)
        switch n.kind {
        case .generationComplete: router.push(.generations)
        case .campaignReady:
            if let hint = n.routeHint, store.campaign(hint) != nil { router.push(.campaignDetail(id: hint)) } else { router.push(.campaigns) }
        case .exportComplete: router.push(.exportCenter)
        case .creditsLow: router.push(.credits)
        case .newTemplate: router.push(.templates)
        case .projectShared:
            if let hint = n.routeHint, store.project(hint) != nil { router.push(.projectDetail(id: hint)) } else { router.push(.workspace) }
        }
    }
}

struct NotificationRow: View {
    var notification: AppNotification
    var action: () -> Void

    private var tint: Color {
        switch notification.kind {
        case .generationComplete: return MSColor.highlight
        case .campaignReady: return MSColor.success
        case .exportComplete: return Color(hex: 0x60A5FA)
        case .creditsLow: return MSColor.warning
        case .newTemplate: return MSColor.text2
        case .projectShared: return MSColor.text2
        }
    }

    var body: some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: notification.kind.icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(tint)
                        .frame(width: 36, height: 36)
                        .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    if !notification.read {
                        Circle().fill(MSColor.accent).frame(width: 9, height: 9)
                            .overlay(Circle().strokeBorder(MSColor.card, lineWidth: 2))
                            .offset(x: 3, y: -3)
                    }
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(notification.title)
                        .font(.system(size: 15, weight: notification.read ? .medium : .semibold))
                        .foregroundStyle(MSColor.text)
                    Text(notification.message).msBody(13).lineLimit(2).multilineTextAlignment(.leading)
                    Text(notification.createdAt.relativeString).msCaption()
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted).padding(.top, 10)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
            .opacity(notification.read ? 0.78 : 1)
        }
        .buttonStyle(MSPressStyle())
    }
}
