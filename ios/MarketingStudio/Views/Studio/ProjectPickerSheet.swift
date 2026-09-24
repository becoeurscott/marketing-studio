import SwiftUI

/// Studio top-bar project switcher.
struct ProjectPickerSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetContainer(title: "Switch project", subtitle: "New assets and generations land in the selected project.") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 8) {
                    ForEach(store.activeProjects) { p in
                        let on = p.id == store.currentProject?.id
                        Button {
                            MSHaptic.tap()
                            store.setCurrentProject(p.id)
                            dismiss()
                        } label: {
                            HStack(spacing: 12) {
                                RemoteImage(url: p.thumbnailURL, cornerRadius: 10).frame(width: 46, height: 46)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(p.name).msHeadline(15).lineLimit(1)
                                    Text("\(store.assets(in: p.id).count) assets · updated \(p.updatedAt.relativeString)").msCaption().lineLimit(1)
                                }
                                Spacer()
                                if on {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.accent)
                                }
                            }
                            .padding(12)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: 1))
                        }
                        .buttonStyle(MSPressStyle())
                    }
                    MSButton(title: "New project", icon: "plus", style: .secondary) {
                        dismiss()
                        router.present(.newProject)
                    }
                    .padding(.top, 6)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }
}
