import SwiftUI

/// Maps `AppSheet` to sheet content. Screens present with `router.present(.newProject)`.
/// Other agents replace the placeholder branches as they build their features.
struct SheetHost: View {
    let sheet: AppSheet
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        switch sheet {
        case .newProject:
            NewProjectSheet()
        case .editProject(let id):
            NewProjectSheet(editingId: id)
        case .buyCredits:
            BuyCreditsSheet()
        case .upgrade(let plan):
            UpgradeSheet(plan: plan)
        case .inviteMember:
            InviteMemberSheet()
        case .uploadProduct:
            UploadProductSheet { asset in
                router.toast("\(asset.name) ajouté aux ressources", style: .success, icon: "checkmark.circle.fill")
            }
        case .exportAssets(let ids):
            ExportCenterView(preselectedIds: ids, inSheet: true)
        case .addCalendarItem(let campaignId):
            CalendarItemEditSheet(campaignId: campaignId) { router.dismissSheet() }
        case .newBrand:
            NewBrandSheet()
        case .paywall(let feature):
            PaywallSheet(feature: feature)
        }
    }

    private func placeholder(_ title: String, _ message: String, icon: String) -> some View {
        BottomSheetContainer(title: title) {
            EmptyStateView(icon: icon, title: title, message: message, ctaTitle: "Fermer") {
                router.dismissSheet()
            }
        }
    }
}
