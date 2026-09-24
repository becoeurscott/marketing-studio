import SwiftUI
import Combine

/// Single source of truth. Every screen reads from here and mutates through the action methods.
/// State is persisted to UserDefaults as one JSON blob (debounced) and seeded from MockData on first launch.
@MainActor
final class AppStore: ObservableObject {

    // MARK: - Persisted state

    private struct PersistedState: Codable {
        var version = 1
        var user: User
        var onboardingDone: Bool
        var onboardingAnswers: OnboardingAnswers
        var projects: [Project]
        var assets: [Asset]
        var campaigns: [Campaign]
        var generations: [Generation]
        var favorites: [String: [String]]
        var brand: Brand
        var credits: Int
        var transactions: [CreditTransaction]
        var notifications: [AppNotification]
        var members: [WorkspaceMember]
        var plan: Plan
        var preferences: UserPreferences
        var currentProjectId: String?
        var copyResults: [CopyResult]
        var savedHooks: [HookResult]
    }

    @Published var user: User { didSet { scheduleSave() } }
    @Published var onboardingDone: Bool { didSet { scheduleSave() } }
    @Published var onboardingAnswers: OnboardingAnswers { didSet { scheduleSave() } }
    @Published var projects: [Project] { didSet { scheduleSave() } }
    @Published var assets: [Asset] { didSet { scheduleSave() } }
    @Published var campaigns: [Campaign] { didSet { scheduleSave() } }
    @Published var generations: [Generation] { didSet { scheduleSave() } }
    /// Keyed by `FavoriteKind.rawValue` → set of ids.
    @Published var favorites: [String: [String]] { didSet { scheduleSave() } }
    @Published var brand: Brand { didSet { scheduleSave() } }
    @Published var credits: Int { didSet { scheduleSave() } }
    @Published var transactions: [CreditTransaction] { didSet { scheduleSave() } }
    @Published var notifications: [AppNotification] { didSet { scheduleSave() } }
    @Published var members: [WorkspaceMember] { didSet { scheduleSave() } }
    @Published var plan: Plan { didSet { scheduleSave() } }
    @Published var preferences: UserPreferences { didSet { scheduleSave() } }
    @Published var currentProjectId: String? { didSet { scheduleSave() } }
    @Published var copyResults: [CopyResult] { didSet { scheduleSave() } }
    @Published var savedHooks: [HookResult] { didSet { scheduleSave() } }

    // MARK: - Additive (library/account agent)

    /// Template chosen via "Use Template"; the Studio reads and clears it when it applies the preset. Not persisted.
    @Published var pendingTemplateId: String?

    /// Additional (inactive) brand kits. `brand` is always the active one. Persisted under its own key.
    @Published var otherBrands: [Brand] = [] { didSet { saveOtherBrands() } }
    private static let brandsKey = "marketingstudio.brands.v1"

    // Static catalog (not user-mutable, not persisted)
    let templates: [Template] = MockData.templates
    let creators: [Creator] = MockData.creators

    // MARK: - Init / persistence

    private static let storageKey = "marketingstudio.state.v1"
    private var saveTask: Task<Void, Never>?
    private var isLoading = true

    init(userDefaults: UserDefaults = .standard) {
        let seed = Self.seed()
        var state = seed
        if let data = userDefaults.data(forKey: Self.storageKey),
           let decoded = try? Self.decoder.decode(PersistedState.self, from: data) {
            state = decoded
        }
        user = state.user
        onboardingDone = state.onboardingDone
        onboardingAnswers = state.onboardingAnswers
        projects = state.projects
        assets = state.assets
        campaigns = state.campaigns
        generations = state.generations
        favorites = state.favorites
        brand = state.brand
        credits = state.credits
        transactions = state.transactions
        notifications = state.notifications
        members = state.members
        plan = state.plan
        preferences = state.preferences
        currentProjectId = state.currentProjectId
        copyResults = state.copyResults
        savedHooks = state.savedHooks
        if let d = userDefaults.data(forKey: Self.brandsKey), let b = try? Self.decoder.decode([Brand].self, from: d) { otherBrands = b }
        isLoading = false
    }

    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()
    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private static func seed() -> PersistedState {
        var favs: [String: [String]] = [:]
        favs[FavoriteKind.asset.rawValue] = MockData.assets.filter { $0.favorite }.map { $0.id }
        favs[FavoriteKind.template.rawValue] = ["tpl_1", "tpl_2", "tpl_5"]
        favs[FavoriteKind.creator.rawValue] = ["creator_maya", "creator_sofia"]
        favs[FavoriteKind.prompt.rawValue] = ["gen_1", "gen_3"]
        return PersistedState(
            user: MockData.user,
            onboardingDone: false,
            onboardingAnswers: OnboardingAnswers(),
            projects: MockData.projects,
            assets: MockData.assets,
            campaigns: MockData.campaigns,
            generations: MockData.generations,
            favorites: favs,
            brand: MockData.brand,
            credits: MockData.startingCredits,
            transactions: MockData.transactions,
            notifications: MockData.notifications,
            members: MockData.members,
            plan: MockData.user.plan,
            preferences: UserPreferences(),
            currentProjectId: "proj_luma_summer",
            copyResults: [],
            savedHooks: []
        )
    }

    private func snapshot() -> PersistedState {
        PersistedState(
            user: user, onboardingDone: onboardingDone, onboardingAnswers: onboardingAnswers,
            projects: projects, assets: assets, campaigns: campaigns, generations: generations,
            favorites: favorites, brand: brand, credits: credits, transactions: transactions,
            notifications: notifications, members: members, plan: plan, preferences: preferences,
            currentProjectId: currentProjectId, copyResults: copyResults, savedHooks: savedHooks
        )
    }

    private func scheduleSave() {
        guard !isLoading else { return }
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled, let self else { return }
            self.saveNow()
        }
    }

    func saveNow() {
        if let data = try? Self.encoder.encode(snapshot()) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }

    /// Wipe persisted state and return to the seeded, pre-onboarding state.
    func resetAll() {
        UserDefaults.standard.removeObject(forKey: Self.storageKey)
        let s = Self.seed()
        isLoading = true
        user = s.user; onboardingDone = s.onboardingDone; onboardingAnswers = s.onboardingAnswers
        projects = s.projects; assets = s.assets; campaigns = s.campaigns; generations = s.generations
        favorites = s.favorites; brand = s.brand; credits = s.credits; transactions = s.transactions
        notifications = s.notifications; members = s.members; plan = s.plan; preferences = s.preferences
        currentProjectId = s.currentProjectId; copyResults = s.copyResults; savedHooks = s.savedHooks
        otherBrands = []; pendingTemplateId = nil
        UserDefaults.standard.removeObject(forKey: Self.brandsKey)
        isLoading = false
        saveNow()
    }

    // MARK: - Derived

    var currentProject: Project? {
        projects.first { $0.id == currentProjectId } ?? projects.first { $0.status == .active }
    }
    var activeProjects: [Project] { projects.filter { $0.status == .active }.sorted { $0.updatedAt > $1.updatedAt } }
    var unreadNotificationCount: Int { notifications.filter { !$0.read }.count }
    var recentAssets: [Asset] { assets.sorted { $0.createdAt > $1.createdAt } }
    var recentGenerations: [Generation] { generations.sorted { $0.createdAt > $1.createdAt } }

    func project(_ id: String) -> Project? { projects.first { $0.id == id } }
    func asset(_ id: String) -> Asset? { assets.first { $0.id == id } }
    func campaign(_ id: String) -> Campaign? { campaigns.first { $0.id == id } }
    func template(_ id: String) -> Template? { templates.first { $0.id == id } }
    func creator(_ id: String) -> Creator? { creators.first { $0.id == id } }
    func generation(_ id: String) -> Generation? { generations.first { $0.id == id } }

    func assets(in projectId: String) -> [Asset] { assets.filter { $0.projectId == projectId }.sorted { $0.createdAt > $1.createdAt } }
    func generations(in projectId: String) -> [Generation] { generations.filter { $0.projectId == projectId }.sorted { $0.createdAt > $1.createdAt } }
    func campaigns(in projectId: String) -> [Campaign] { campaigns.filter { $0.projectId == projectId }.sorted { $0.createdAt > $1.createdAt } }

    // MARK: - Onboarding

    func completeOnboarding(_ answers: OnboardingAnswers) {
        onboardingAnswers = answers
        onboardingDone = true
    }

    // MARK: - Projects

    @discardableResult
    func createProject(name: String, description: String) -> Project {
        let p = Project(
            id: IDGen.make("proj"), name: name, description: description, brandId: brand.id,
            thumbnailURL: MockData.image("proj-\(Int.random(in: 100...999))", w: 800, h: 600),
            status: .active, createdAt: Date(), updatedAt: Date()
        )
        projects.insert(p, at: 0)
        currentProjectId = p.id
        return p
    }

    func updateProject(_ project: Project) {
        guard let i = projects.firstIndex(where: { $0.id == project.id }) else { return }
        var p = project
        p.updatedAt = Date()
        projects[i] = p
    }

    func renameProject(_ id: String, to name: String) {
        guard var p = project(id) else { return }
        p.name = name
        updateProject(p)
    }

    @discardableResult
    func duplicateProject(_ id: String) -> Project? {
        guard let source = project(id) else { return nil }
        var copy = source
        copy.id = IDGen.make("proj")
        copy.name = source.name + " (Copy)"
        copy.status = .active
        copy.createdAt = Date()
        copy.updatedAt = Date()
        projects.insert(copy, at: 0)
        let copiedAssets = assets(in: id).map { a -> Asset in
            var c = a
            c.id = IDGen.make("asset")
            c.projectId = copy.id
            c.createdAt = Date()
            return c
        }
        assets.append(contentsOf: copiedAssets)
        return copy
    }

    func setProjectStatus(_ id: String, _ status: ProjectStatus) {
        guard var p = project(id) else { return }
        p.status = status
        updateProject(p)
    }

    func archiveProject(_ id: String) { setProjectStatus(id, .archived) }
    func unarchiveProject(_ id: String) { setProjectStatus(id, .active) }

    func deleteProject(_ id: String) {
        projects.removeAll { $0.id == id }
        assets.removeAll { $0.projectId == id }
        generations.removeAll { $0.projectId == id }
        campaigns.removeAll { $0.projectId == id }
        if currentProjectId == id { currentProjectId = projects.first { $0.status == .active }?.id }
    }

    func setCurrentProject(_ id: String?) { currentProjectId = id }

    // MARK: - Favorites

    func isFavorite(_ kind: FavoriteKind, _ id: String) -> Bool {
        favorites[kind.rawValue]?.contains(id) ?? false
    }

    func favoriteIds(_ kind: FavoriteKind) -> [String] { favorites[kind.rawValue] ?? [] }

    func toggleFavorite(_ kind: FavoriteKind, _ id: String) {
        var set = favorites[kind.rawValue] ?? []
        if let i = set.firstIndex(of: id) { set.remove(at: i) } else { set.insert(id, at: 0) }
        favorites[kind.rawValue] = set
        if kind == .asset, let i = assets.firstIndex(where: { $0.id == id }) {
            assets[i].favorite = set.contains(id)
        }
    }

    // MARK: - Assets

    @discardableResult
    func addAsset(name: String, kind: AssetKind, imageURL: String, projectId: String?, tags: [String] = [], durationSeconds: Int? = nil) -> Asset {
        let a = Asset(
            id: IDGen.make("asset"), name: name, kind: kind, imageURL: imageURL,
            projectId: projectId ?? currentProjectId, favorite: false, createdAt: Date(),
            tags: tags, width: kind == .video ? 1080 : 1600, height: kind == .video ? 1920 : 2000,
            durationSeconds: durationSeconds
        )
        assets.insert(a, at: 0)
        touchProject(a.projectId)
        return a
    }

    func updateAsset(_ asset: Asset) {
        guard let i = assets.firstIndex(where: { $0.id == asset.id }) else { return }
        assets[i] = asset
    }

    func renameAsset(_ id: String, to name: String) {
        guard var a = asset(id) else { return }
        a.name = name
        updateAsset(a)
    }

    func moveAsset(_ id: String, to projectId: String?) {
        guard var a = asset(id) else { return }
        a.projectId = projectId
        updateAsset(a)
    }

    func deleteAsset(_ id: String) {
        assets.removeAll { $0.id == id }
        favorites[FavoriteKind.asset.rawValue]?.removeAll { $0 == id }
    }

    private func touchProject(_ id: String?) {
        guard let id, let i = projects.firstIndex(where: { $0.id == id }) else { return }
        projects[i].updatedAt = Date()
    }

    // MARK: - Generations

    @discardableResult
    func addGeneration(kind: GenerationKind, prompt: String, thumbnails: [String], projectId: String? = nil, model: String = "Studio v2", credits: Int, status: GenerationStatus = .completed, resultText: String? = nil) -> Generation {
        let g = Generation(
            id: IDGen.make("gen"), kind: kind, prompt: prompt, status: status, thumbnails: thumbnails,
            projectId: projectId ?? currentProjectId, model: model, creditsSpent: credits, createdAt: Date(), resultText: resultText
        )
        generations.insert(g, at: 0)
        touchProject(g.projectId)
        return g
    }

    func updateGeneration(_ generation: Generation) {
        guard let i = generations.firstIndex(where: { $0.id == generation.id }) else { return }
        generations[i] = generation
    }

    func setGenerationStatus(_ id: String, _ status: GenerationStatus) {
        guard var g = generation(id) else { return }
        g.status = status
        updateGeneration(g)
    }

    func deleteGeneration(_ id: String) { generations.removeAll { $0.id == id } }

    func addCopyResult(tool: String, tone: String, text: String) {
        copyResults.insert(CopyResult(id: IDGen.make("copy"), tool: tool, tone: tone, text: text, createdAt: Date()), at: 0)
    }

    func saveHook(_ hook: HookResult) {
        guard !savedHooks.contains(where: { $0.text == hook.text }) else { return }
        savedHooks.insert(hook, at: 0)
    }

    // MARK: - Campaigns

    @discardableResult
    func createCampaign(name: String, objective: CampaignObjective, audience: String, platforms: [SocialPlatform], formats: [ContentFormat], projectId: String? = nil, assetIds: [String] = [], variations: [AdVariation] = []) -> Campaign {
        let c = Campaign(
            id: IDGen.make("camp"), name: name, projectId: projectId ?? currentProjectId,
            objective: objective, audience: audience, platforms: platforms, formats: formats,
            status: .draft, assetIds: assetIds, calendarItems: [], variations: variations, createdAt: Date()
        )
        campaigns.insert(c, at: 0)
        touchProject(c.projectId)
        return c
    }

    func updateCampaign(_ campaign: Campaign) {
        guard let i = campaigns.firstIndex(where: { $0.id == campaign.id }) else { return }
        campaigns[i] = campaign
    }

    func setCampaignStatus(_ id: String, _ status: CampaignStatus) {
        guard var c = campaign(id) else { return }
        c.status = status
        updateCampaign(c)
    }

    func deleteCampaign(_ id: String) { campaigns.removeAll { $0.id == id } }

    func addAssets(_ ids: [String], toCampaign campaignId: String) {
        guard var c = campaign(campaignId) else { return }
        for id in ids where !c.assetIds.contains(id) { c.assetIds.append(id) }
        updateCampaign(c)
    }

    func addCalendarItem(_ item: CalendarItem, to campaignId: String) {
        guard var c = campaign(campaignId) else { return }
        c.calendarItems.append(item)
        c.calendarItems.sort { $0.date < $1.date }
        updateCampaign(c)
    }

    func updateCalendarItem(_ item: CalendarItem, in campaignId: String) {
        guard var c = campaign(campaignId), let i = c.calendarItems.firstIndex(where: { $0.id == item.id }) else { return }
        c.calendarItems[i] = item
        updateCampaign(c)
    }

    func removeCalendarItem(_ itemId: String, from campaignId: String) {
        guard var c = campaign(campaignId) else { return }
        c.calendarItems.removeAll { $0.id == itemId }
        updateCampaign(c)
    }

    // MARK: - Brand

    func updateBrand(_ b: Brand) { brand = b }
    func updateBrandVoice(_ v: BrandVoice) { brand.voice = v }

    /// Active brand first, then the others.
    var allBrands: [Brand] { [brand] + otherBrands }

    private func saveOtherBrands() {
        guard !isLoading else { return }
        if let d = try? Self.encoder.encode(otherBrands) { UserDefaults.standard.set(d, forKey: Self.brandsKey) }
    }

    @discardableResult
    func addBrand(name: String, industry: String, colors: [String], fonts: [String], website: String = "", description: String = "", audience: String = "", makeActive: Bool = true) -> Brand {
        let slug = name.lowercased().replacingOccurrences(of: " ", with: "-")
        let b = Brand(
            id: IDGen.make("brand"), name: name,
            logoURL: MockData.image("\(slug)-logo", w: 600, h: 600), iconURL: MockData.image("\(slug)-icon", w: 300, h: 300),
            colors: colors, fonts: fonts, website: website, description: description, industry: industry, audience: audience,
            voice: BrandVoice(tone: "Friendly", writingStyle: "Clear and direct. Warm, never salesy.", keywords: [], avoid: []),
            assetIds: []
        )
        if makeActive { otherBrands.insert(brand, at: 0); brand = b } else { otherBrands.append(b) }
        return b
    }

    func setActiveBrand(_ id: String) {
        guard id != brand.id, let i = otherBrands.firstIndex(where: { $0.id == id }) else { return }
        let next = otherBrands.remove(at: i)
        otherBrands.insert(brand, at: 0)
        brand = next
    }

    /// Deletes a brand. Deleting the active brand promotes the next one; the last brand cannot be deleted.
    func deleteBrand(_ id: String) {
        if id == brand.id {
            guard !otherBrands.isEmpty else { return }
            brand = otherBrands.removeFirst()
        } else {
            otherBrands.removeAll { $0.id == id }
        }
    }

    // MARK: - Credits

    /// Returns false (and does nothing) when the balance is insufficient.
    @discardableResult
    func spendCredits(_ amount: Int, reason: String) -> Bool {
        guard amount <= credits else { return false }
        credits -= amount
        transactions.insert(CreditTransaction(id: IDGen.make("tx"), amount: -amount, reason: reason, createdAt: Date()), at: 0)
        if credits < 100 {
            pushNotification(kind: .creditsLow, title: "Credits running low", message: "You have \(credits) credits left. Top up to keep generating.")
        }
        return true
    }

    func canAfford(_ amount: Int) -> Bool { credits >= amount }

    func buyCredits(_ amount: Int, price: Int) {
        credits += amount
        transactions.insert(CreditTransaction(id: IDGen.make("tx"), amount: amount, reason: "Purchased \(amount) credits ($\(price))", createdAt: Date()), at: 0)
    }

    // MARK: - Notifications

    func pushNotification(kind: NotificationKind, title: String, message: String, routeHint: String? = nil) {
        notifications.insert(AppNotification(id: IDGen.make("notif"), kind: kind, title: title, message: message, createdAt: Date(), read: false, routeHint: routeHint), at: 0)
    }

    func markRead(_ id: String) {
        guard let i = notifications.firstIndex(where: { $0.id == id }) else { return }
        notifications[i].read = true
    }

    func markAllRead() {
        for i in notifications.indices { notifications[i].read = true }
    }

    func deleteNotification(_ id: String) { notifications.removeAll { $0.id == id } }

    // MARK: - Workspace

    @discardableResult
    func inviteMember(name: String, email: String, role: MemberRole) -> WorkspaceMember {
        let m = WorkspaceMember(id: IDGen.make("mem"), name: name, email: email, role: role, avatarURL: MockData.avatar(Int.random(in: 1...70)), joinedAt: Date())
        members.append(m)
        return m
    }

    func removeMember(_ id: String) {
        members.removeAll { $0.id == id && $0.role != .owner }
    }

    func changeRole(_ id: String, to role: MemberRole) {
        guard let i = members.firstIndex(where: { $0.id == id }), members[i].role != .owner else { return }
        members[i].role = role
    }

    // MARK: - Plan / profile / preferences

    func setPlan(_ p: Plan) {
        plan = p
        user.plan = p
        credits += p.monthlyCredits
        transactions.insert(CreditTransaction(id: IDGen.make("tx"), amount: p.monthlyCredits, reason: "\(p.title) plan credits", createdAt: Date()), at: 0)
    }

    func updateUser(_ u: User) { user = u }
    func updatePreferences(_ p: UserPreferences) { preferences = p }
}
