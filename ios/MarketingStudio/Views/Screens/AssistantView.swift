import SwiftUI

/// SPEC §32. Chat with mock replies, typing indicator and suggested action chips that route to the right tools.
struct AssistantView: View {
    /// True when shown as a sheet from Studio; routes are then handed to `onRoute` so the sheet can dismiss first.
    var embedded: Bool = false
    var onRoute: ((AppRoute) -> Void)? = nil

    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @State private var messages: [AssistantMessage] = []
    @State private var draft = ""
    @State private var typing = false
    @FocusState private var focused: Bool

    struct AssistantMessage: Identifiable, Equatable {
        let id = UUID()
        var text: String
        var fromUser: Bool
        var action: AgentAction? = nil
        var mediaURL: String? = nil
        var actionState: ActionState = .idle
    }

    enum ActionState: Equatable { case idle, running, done, failed }

    private let suggestions: [(title: String, icon: String)] = [
        ("Une vidéo UGC pour mon produit", "person.wave.2"),
        ("Un shooting photo de mon produit", "camera"),
        ("Un statut WhatsApp promo", "bubble.left"),
        ("Des accroches pour vendre plus", "text.quote"),
        ("Une vidéo produit de 10 s", "video"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            if embedded { sheetHeader }
            ScrollViewReader { proxy in
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 12) {
                        intro
                        ForEach(messages) { m in
                            bubble(m).id(m.id)
                        }
                        if typing { typingIndicator.id("typing") }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages) { _, _ in scrollToEnd(proxy) }
                .onChange(of: typing) { _, _ in scrollToEnd(proxy) }
            }
            suggestionsRow
            composer
        }
        .msScreen()
        .navigationTitle("Assistant IA")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { if !embedded { MSTopBarItems() } }
        .onAppear { if messages.isEmpty { seed() } }
    }

    private var sheetHeader: some View {
        VStack(spacing: 10) {
            Capsule().fill(MSColor.borderStrong).frame(width: 36, height: 4).padding(.top, 8)
            HStack(spacing: 10) {
                assistantAvatar(size: 30)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Assistant IA").msHeadline(16)
                    Text("Connaît votre marque : \(store.brand.name) · \(store.brand.voice.tone)").msCaption()
                }
                Spacer()
            }
            .padding(.horizontal, MSSpacing.gutter)
            Divider().overlay(MSColor.border)
        }
        .background(MSColor.surface)
    }

    private var intro: some View {
        HStack(alignment: .top, spacing: 10) {
            assistantAvatar(size: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text("Que créons-nous aujourd'hui ?").msHeadline(15)
                Text("Je peux créer une campagne complète, photographier votre produit, scénariser une pub UGC, rédiger vos textes ou animer une image. Choisissez une action ci-dessous ou décrivez simplement votre besoin.").msBody(13)
            }
        }
        .padding(.bottom, 4)
    }

    private func bubble(_ m: AssistantMessage) -> some View {
        HStack(alignment: .bottom, spacing: 8) {
            if m.fromUser { Spacer(minLength: 40) } else { assistantAvatar(size: 24) }
            VStack(alignment: .leading, spacing: 8) {
            Text(L(m.text))
                .font(MSFont.body(14))
                .foregroundStyle(MSColor.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    m.fromUser ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(MSColor.card),
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(m.fromUser ? .clear : MSColor.border, lineWidth: 1))
                if let media = m.mediaURL {
                    RemoteImage(url: media, cornerRadius: 14)
                        .frame(width: 200, height: 250)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .onTapGesture { go(.assets) }
                }
                if let a = m.action { actionCard(a, message: m) }
            }
            if !m.fromUser { Spacer(minLength: 40) }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func actionCard(_ a: AgentAction, message m: AssistantMessage) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon(a)).font(.system(size: 13, weight: .bold)).foregroundStyle(MSColor.highlight)
                Text(L(a.summary)).font(MSFont.control(13)).foregroundStyle(MSColor.text)
            }
            switch m.actionState {
            case .idle, .failed:
                Button { run(m) } label: {
                    Text(m.actionState == .failed ? "Réessayer · \(cost(a)) crédits" : "Lancer · \(cost(a)) crédits")
                        .font(MSFont.control(14)).foregroundStyle(MSColor.onAccent)
                        .frame(maxWidth: .infinity).frame(height: 40)
                        .background(MSColor.accent, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(MSPressStyle())
            case .running:
                HStack(spacing: 8) { ProgressView().tint(MSColor.highlight); Text("Création en cours…").msCaption() }
            case .done:
                Label("Terminé", systemImage: "checkmark.circle.fill").font(MSFont.control(13)).foregroundStyle(MSColor.highlight)
            }
        }
        .padding(12)
        .frame(maxWidth: 280, alignment: .leading)
        .background(MSColor.accent.opacity(0.08), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(MSColor.accent.opacity(0.4), lineWidth: 1))
    }

    private var typingIndicator: some View {
        HStack(alignment: .bottom, spacing: 8) {
            assistantAvatar(size: 24)
            TypingDots()
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
            Spacer()
        }
        .transition(.opacity)
    }

    private var suggestionsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(suggestions, id: \.title) { s in
                    Button {
                        MSHaptic.tap()
                        send(s.title)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: s.icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(MSColor.highlight)
                            Text(L(s.title)).font(MSFont.control(12)).foregroundStyle(MSColor.text)
                        }
                        .padding(.horizontal, 12)
                        .frame(height: 32)
                        .background(MSColor.card, in: Capsule())
                        .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.vertical, 8)
    }

    private var composer: some View {
        HStack(spacing: 8) {
            TextField("Demandez ce que vous voulez...", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .font(MSFont.body(14))
                .foregroundStyle(MSColor.text)
                .tint(MSColor.accent)
                .focused($focused)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(focused ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                .onSubmit { send(draft) }
            Button {
                MSHaptic.tap()
                send(draft)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(draft.trimmingCharacters(in: .whitespaces).isEmpty ? AnyShapeStyle(MSColor.card) : AnyShapeStyle(MSColor.accentGradient), in: Circle())
            }
            .buttonStyle(MSPressStyle())
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || typing)
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.top, 4)
        .padding(.bottom, 12)
        .background(MSColor.bg)
    }

    private func assistantAvatar(size: CGFloat) -> some View {
        ZStack {
            Circle().fill(MSColor.accentGradient)
            Image(systemName: "sparkles").font(.system(size: size * 0.45, weight: .bold)).foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }

    // MARK: Logic

    private func seed() {
        messages = [AssistantMessage(text: "Je travaille sur \(store.currentProject?.name ?? "votre projet"). Vous voulez des photos produit, un script UGC ou la campagne complète ?", fromUser: false)]
    }

    private func send(_ text: String) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty, !typing else { return }
        draft = ""
        withAnimation(MSAnimation.snappy) { messages.append(AssistantMessage(text: t, fromUser: true)) }
        Task {
            withAnimation(MSAnimation.gentle) { typing = true }
            let reply: AssistantMessage
            do {
                let r = try await APIClient.agent(agentRequest())
                reply = AssistantMessage(text: r.reply, fromUser: false, action: r.action)
            } catch {
                reply = AssistantMessage(text: (error as? LocalizedError)?.errorDescription ?? "Je n'arrive pas à répondre pour le moment. Réessayez.", fromUser: false)
            }
            withAnimation(MSAnimation.snappy) {
                typing = false
                messages.append(reply)
            }
        }
    }

    private var productAssets: [Asset] {
        Array(store.assets.filter { $0.kind == .image }.sorted { $0.createdAt > $1.createdAt }.prefix(30))
    }

    private func agentRequest() -> AgentRequest {
        AgentRequest(
            messages: messages.dropFirst().map { .init(role: $0.fromUser ? "user" : "assistant", content: $0.text) },
            products: productAssets.map { .init(id: $0.id, name: $0.name, hint: nil) },
            creators: store.creators.map { .init(id: $0.id, name: $0.name, hint: "\($0.gender), \($0.age) ans, \($0.style)") },
            styles: Catalog.styles.map { .init(id: $0.id, name: $0.name, hint: $0.description) },
            ugcFormats: UGCPresets.all.map { .init(id: $0.id, name: $0.title, hint: $0.hint) },
            credits: store.credits
        )
    }

    private func icon(_ a: AgentAction) -> String {
        switch a.type {
        case "ugc": return "person.wave.2"
        case "shoot": return "camera.aperture"
        case "video": return "video"
        default: return "text.quote"
        }
    }

    private func duration(_ a: AgentAction) -> Int {
        a.durationSec ?? UGCPresets.preset(a.ugcFormatId)?.duration ?? 10
    }

    private func cost(_ a: AgentAction) -> Int {
        switch a.type {
        case "ugc": return AIModels.ugcCredits(seconds: duration(a))
        case "shoot": return AIModels.imageModel(nil).credits * 2
        case "video": return AIModels.videoCredits(AIModels.defaultVideo, seconds: duration(a), withPhoto: a.productId != nil)
        default: return 0
        }
    }

    private func update(_ id: UUID, _ change: (inout AssistantMessage) -> Void) {
        guard let i = messages.firstIndex(where: { $0.id == id }) else { return }
        withAnimation(MSAnimation.snappy) { change(&messages[i]) }
    }

    private func run(_ m: AssistantMessage) {
        guard let a = m.action, m.actionState != .running else { return }
        MSHaptic.tap()
        update(m.id) { $0.actionState = .running }
        Task {
            do {
                let result: AssistantMessage
                switch a.type {
                case "ugc":
                    let v = try await API.generateUGC(UGCParams(productAssetId: a.productId, creatorId: a.creatorId ?? "", script: a.script ?? UGCPresets.preset(a.ugcFormatId)?.script ?? "", duration: duration(a), projectId: store.currentProjectId, presetId: a.ugcFormatId), store: store) { _ in }
                    store.addAsset(name: "UGC · \(a.summary)", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: ["ugc", "assistant"], durationSeconds: v.duration, videoURL: v.videoURL)
                    result = AssistantMessage(text: "Votre vidéo UGC est prête. Elle est dans Ressources.", fromUser: false, mediaURL: v.posterURL)
                case "shoot":
                    let imgs = try await API.generateProductShoot(ProductShootParams(productAssetId: a.productId, styleId: a.styleId, count: 2, projectId: store.currentProjectId), store: store)
                    for img in imgs { store.addAsset(name: "Shooting · \(a.summary)", kind: .image, imageURL: img.url, projectId: store.currentProjectId, tags: ["shooting", "assistant"]) }
                    result = AssistantMessage(text: "Voici votre shooting (\(imgs.count) photos), aussi dans Ressources.", fromUser: false, mediaURL: imgs.first?.url)
                case "video":
                    let v = try await API.generateVideo(VideoGenParams(prompt: a.prompt ?? a.summary, sourceAssetId: a.productId, duration: duration(a), projectId: store.currentProjectId), store: store) { _ in }
                    store.addAsset(name: "Vidéo · \(a.summary)", kind: .video, imageURL: v.posterURL, projectId: store.currentProjectId, tags: ["video", "assistant"], durationSeconds: v.duration, videoURL: v.videoURL)
                    result = AssistantMessage(text: "Votre vidéo est prête. Elle est dans Ressources.", fromUser: false, mediaURL: v.posterURL.isEmpty ? nil : v.posterURL)
                default:
                    let product = productAssets.first { $0.id == a.productId }?.name ?? (a.prompt ?? "mon produit")
                    let c = try await API.generateCopy(CopyParams(product: product, audience: "clients sur WhatsApp et les réseaux"), store: store)
                    result = AssistantMessage(text: c.text, fromUser: false)
                }
                update(m.id) { $0.actionState = .done }
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { messages.append(result) }
            } catch {
                update(m.id) { $0.actionState = .failed }
                withAnimation(MSAnimation.snappy) { messages.append(AssistantMessage(text: (error as? LocalizedError)?.errorDescription ?? "La création a échoué. Vos crédits ne sont pas débités.", fromUser: false)) }
            }
        }
    }

    private func go(_ route: AppRoute) {
        if let onRoute { onRoute(route) } else { router.push(route) }
    }

    private func scrollToEnd(_ proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            withAnimation(MSAnimation.gentle) {
                if typing { proxy.scrollTo("typing", anchor: .bottom) } else if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
            }
        }
    }
}

/// Three bouncing dots.
struct TypingDots: View {
    @State private var on = false
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle().fill(MSColor.text2).frame(width: 6, height: 6)
                    .offset(y: on ? -3 : 3)
                    .animation(.easeInOut(duration: 0.45).repeatForever(autoreverses: true).delay(Double(i) * 0.12), value: on)
            }
        }
        .onAppear { on = true }
    }
}
