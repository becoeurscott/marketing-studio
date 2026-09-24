import SwiftUI

/// SPEC §31 — Creators: grid of AI creator cards, style filter, favorites, detail sheet → UGC.
struct CreatorsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var styleFilter = "All"
    @State private var onlyFavorites = false
    @State private var selected: Creator?

    private var styles: [String] {
        ["All"] + Array(Set(store.creators.map { $0.style })).sorted()
    }

    private var filtered: [Creator] {
        store.creators
            .filter { styleFilter == "All" || $0.style == styleFilter }
            .filter { !onlyFavorites || store.isFavorite(.creator, $0.id) }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Creators").msTitle(30)
                    Text("Fictional AI presenters for UGC videos. Pick a face, a style and a language.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 8) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(styles, id: \.self) { s in
                                MSChip(title: s, selected: styleFilter == s) {
                                    withAnimation(MSAnimation.snappy) { styleFilter = s }
                                }
                            }
                        }
                        .padding(.leading, MSSpacing.gutter)
                        .padding(.trailing, 12)
                    }
                    .mask(
                        HStack(spacing: 0) {
                            Rectangle()
                            LinearGradient(colors: [.black, .clear], startPoint: .leading, endPoint: .trailing).frame(width: 24)
                        }
                    )
                    MSChip(title: "Favorites", icon: onlyFavorites ? "heart.fill" : "heart", selected: onlyFavorites) {
                        withAnimation(MSAnimation.snappy) { onlyFavorites.toggle() }
                    }
                    .padding(.trailing, MSSpacing.gutter)
                }

                if filtered.isEmpty {
                    EmptyStateView(
                        icon: onlyFavorites ? "heart" : "person.2",
                        title: onlyFavorites ? "No favorite creators" : "No creators in \(styleFilter)",
                        message: onlyFavorites ? "Tap the heart on a creator to keep them here." : "Try another style.",
                        ctaTitle: "Show all"
                    ) {
                        withAnimation(MSAnimation.snappy) { onlyFavorites = false; styleFilter = "All" }
                    }
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(filtered) { c in
                            CreatorCard(creator: c) { selected = c }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .animation(MSAnimation.gentle, value: filtered.map { $0.id })
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Creators")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(item: $selected, detents: [.large]) { c in CreatorDetailSheet(creator: c) }
    }
}

struct CreatorCard: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var creator: Creator
    var action: () -> Void

    private var isFav: Bool { store.isFavorite(.creator, creator.id) }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                RemoteImage(url: creator.avatarURL, cornerRadius: 12)
                    .aspectRatio(0.85, contentMode: .fit)
                    .overlay(alignment: .topTrailing) {
                        Button {
                            MSHaptic.tap()
                            store.toggleFavorite(.creator, creator.id)
                        } label: {
                            Image(systemName: isFav ? "heart.fill" : "heart")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(isFav ? MSColor.danger : MSColor.text)
                                .frame(width: 30, height: 30)
                                .background(.black.opacity(0.45), in: Circle())
                        }
                        .buttonStyle(MSPressStyle())
                        .padding(6)
                    }
                    .overlay(alignment: .bottomLeading) {
                        MSBadge(text: creator.style, tone: .accent).padding(8)
                    }
                HStack(spacing: 6) {
                    Text(creator.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    Text("\(creator.age)").msCaption()
                }
                Text("\(creator.gender) · \(creator.ageRange)").msCaption()
                Text(creator.languages.joined(separator: ", ")).msCaption(color: MSColor.text2).lineLimit(1)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}

struct CreatorDetailSheet: View {
    var creator: Creator
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss

    private var isFav: Bool { store.isFavorite(.creator, creator.id) }

    var body: some View {
        BottomSheetContainer {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    RemoteImage(url: creator.avatarURL, cornerRadius: MSRadius.xl)
                        .aspectRatio(1, contentMode: .fit)
                        .overlay(alignment: .topTrailing) {
                            MSBadge(text: "Fictional AI creator", tone: .neutral, icon: "sparkles").padding(12)
                        }
                    HStack(alignment: .firstTextBaseline) {
                        Text(creator.name).msTitle(26)
                        Text("\(creator.age)").msBody(16)
                        Spacer()
                        MSIconButton(icon: isFav ? "heart.fill" : "heart", tint: isFav ? MSColor.danger : MSColor.text) {
                            store.toggleFavorite(.creator, creator.id)
                        }
                    }
                    Text(creator.bio).msBody(15).lineSpacing(3)
                    HStack(spacing: 0) {
                        stat("Style", creator.style)
                        stat("Gender", creator.gender)
                        stat("Age range", creator.ageRange)
                    }
                    .msCard(padding: 14)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Languages").msHeadline(15)
                        FlowLayout(spacing: 8) {
                            ForEach(creator.languages, id: \.self) { l in
                                MSBadge(text: l, tone: .neutral, icon: "globe")
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Best for").msHeadline(15)
                        FlowLayout(spacing: 8) {
                            ForEach(["Product reviews", "Unboxing", "Testimonials", "How-to"], id: \.self) { t in
                                MSBadge(text: t, tone: .neutral)
                            }
                        }
                    }
                    MSButton(title: "Use in UGC", icon: "video.fill") {
                        dismiss()
                        router.push(.ugcCreator, on: .studio)
                        router.toast("\(creator.name) selected for UGC", style: .success)
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).msCaption()
            Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
