import SwiftUI

/// Single switch that maps every AppRoute to its screen. To add a screen:
/// 1) add a case to AppRoute, 2) create the view file, 3) add the case here.
struct RouteDestination: View {
    let route: AppRoute

    var body: some View {
        switch route {
        case .studio: StudioView()
        case .imageGenerator: ImageGeneratorView()
        case .videoGenerator: VideoGeneratorView()
        case .ugcCreator: UGCCreatorView()
        case .ugcCreatorWithScript(let script): UGCCreatorView(initialScript: script)
        case .productShoot: ProductShootView()
        case .adCreator: AdCreatorView()
        case .copywriter: CopywriterView()
        case .hookGenerator: HookGeneratorView()
        case .assistant: AssistantView()
        case .projects: ProjectsView()
        case .projectDetail(let id): ProjectDetailView(projectId: id)
        case .campaigns: CampaignsView()
        case .campaignBuilder: CampaignBuilderView()
        case .campaignDetail(let id): CampaignDetailView(campaignId: id)
        case .contentCalendar(let id): ContentCalendarView(campaignId: id)
        case .assets: AssetsView()
        case .assetDetail(let id): AssetDetailView(assetId: id)
        case .templates: TemplatesView()
        case .templateDetail(let id): TemplateDetailView(templateId: id)
        case .generations: GenerationsView()
        case .favorites: FavoritesView()
        case .exportCenter: ExportCenterView()
        case .brandKit: BrandKitView()
        case .brandVoice: BrandVoiceView()
        case .creators: CreatorsView()
        case .credits: CreditsView()
        case .pricing: PricingView()
        case .notifications: NotificationsView()
        case .workspace: WorkspaceView()
        case .profile: ProfileView()
        case .settings: SettingsView()
        case .help: HelpView()
        }
    }
}
