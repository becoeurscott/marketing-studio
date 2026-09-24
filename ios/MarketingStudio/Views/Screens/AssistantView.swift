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
    }

    private let suggestions: [(title: String, icon: String, route: AppRoute)] = [
        ("Generate Campaign", "flag", .campaignBuilder),
        ("Generate Product Shoot", "camera", .productShoot),
        ("Generate UGC", "person.wave.2", .ugcCreator),
        ("Write Ad Copy", "text.quote", .copywriter),
        ("Generate Video", "video", .videoGenerator),
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
        .navigationTitle("AI Assistant")
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
                    Text("AI Assistant").msHeadline(16)
                    Text("Knows your brand: \(store.brand.name) · \(store.brand.voice.tone)").msCaption()
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
                Text("What are we making today?").msHeadline(15)
                Text("I can build a full campaign, shoot your product, script a UGC ad, write copy or animate a still. Pick an action below or just describe it.").msBody(13)
            }
        }
        .padding(.bottom, 4)
    }

    private func bubble(_ m: AssistantMessage) -> some View {
        HStack(alignment: .bottom, spacing: 8) {
            if m.fromUser { Spacer(minLength: 40) } else { assistantAvatar(size: 24) }
            Text(m.text)
                .font(MSFont.body(14))
                .foregroundStyle(MSColor.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    m.fromUser ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(MSColor.card),
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(m.fromUser ? .clear : MSColor.border, lineWidth: 1))
            if !m.fromUser { Spacer(minLength: 40) }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
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
                        send(s.title, thenRoute: s.route)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: s.icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(MSColor.highlight)
                            Text(s.title).font(MSFont.control(12)).foregroundStyle(MSColor.text)
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
            TextField("Ask for anything...", text: $draft, axis: .vertical)
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
        messages = [AssistantMessage(text: "Working on \(store.currentProject?.name ?? "your project"). Want product shots, a UGC script, or the full campaign?", fromUser: false)]
    }

    private func send(_ text: String, thenRoute route: AppRoute? = nil) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty, !typing else { return }
        draft = ""
        withAnimation(MSAnimation.snappy) { messages.append(AssistantMessage(text: t, fromUser: true)) }
        Task {
            withAnimation(MSAnimation.gentle) { typing = true }
            let reply = await MockAPI.assistantReply(to: t, store: store)
            let final = route.map { "On it. Opening \(routeTitle($0)) with your brand settings loaded." } ?? reply
            withAnimation(MSAnimation.snappy) {
                typing = false
                messages.append(AssistantMessage(text: final, fromUser: false))
            }
            if let route {
                try? await Task.sleep(for: .milliseconds(700))
                go(route)
            }
        }
    }

    private func go(_ route: AppRoute) {
        if let onRoute { onRoute(route) } else { router.push(route) }
    }

    private func routeTitle(_ r: AppRoute) -> String {
        switch r {
        case .campaignBuilder: return "Campaign Builder"
        case .productShoot: return "AI Product Shoot"
        case .ugcCreator: return "UGC Creator"
        case .copywriter: return "Copywriter"
        case .videoGenerator: return "Video Generator"
        default: return "the tool"
        }
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
