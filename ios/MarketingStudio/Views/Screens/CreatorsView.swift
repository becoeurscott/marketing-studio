import SwiftUI

/// AI creators: each card plays the creator's intro clip (muted, speaker button to listen; one voice
/// at a time). The detail shows the clip, the character sheet and "Utiliser en UGC".
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
                    Text("Créateurs").msTitle(30)
                    Text("16 créateurs IA africains pour vos vidéos UGC. Chaque créateur garde le même visage d'une vidéo à l'autre.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 8) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(styles, id: \.self) { s in
                                MSChip(title: s == "All" ? "Tous" : s, selected: styleFilter == s) {
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
                    MSChip(title: "Favoris", icon: onlyFavorites ? "heart.fill" : "heart", selected: onlyFavorites) {
                        withAnimation(MSAnimation.snappy) { onlyFavorites.toggle() }
                    }
                    .padding(.trailing, MSSpacing.gutter)
                }

                if filtered.isEmpty {
                    EmptyStateView(
                        icon: onlyFavorites ? "heart" : "person.2",
                        title: onlyFavorites ? "Aucun créateur favori" : "Aucun créateur dans \(styleFilter)",
                        message: onlyFavorites ? "Touchez le cœur d'un créateur pour le retrouver ici." : "Essayez un autre style.",
                        ctaTitle: "Tout afficher"
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
        .navigationTitle("Créateurs")
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
                Color.clear
                    .aspectRatio(9.0 / 14.0, contentMode: .fit)
                    .overlay { CreatorIntroView(creator: creator) }
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
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
                    .overlay(alignment: .topLeading) {
                        MSBadge(text: creator.style, tone: .overlay).lineLimit(1).padding(8).padding(.trailing, 36)
                    }
                HStack(spacing: 6) {
                    Text(creator.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    Text("\(creator.age)").msCaption()
                }
                Text(creator.country).msCaption()
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
                    // Compact vertical frame: the intro clip, never taller than ~45% of the screen.
                    HStack {
                        Spacer(minLength: 0)
                        CreatorIntroView(creator: creator)
                            .frame(width: 210, height: 373)
                            .clipShape(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
                            .overlay(alignment: .topLeading) {
                                MSBadge(text: "Créateur IA", tone: .overlay, icon: "sparkles").padding(10)
                            }
                        Spacer(minLength: 0)
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
                        stat("Pays", creator.country)
                        stat("Âge", "\(creator.age) ans")
                    }
                    .msCard(padding: 14)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Langues").msHeadline(15)
                        FlowLayout(spacing: 8) {
                            ForEach(creator.languages, id: \.self) { l in
                                MSBadge(text: l, tone: .neutral, icon: "globe")
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        RemoteImage(url: creator.sheetURL, contentMode: .fit, cornerRadius: MSRadius.md)
                            .aspectRatio(16.0 / 9.0, contentMode: .fit)
                            .background(MSColor.surface, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        Text("Fiche personnage : la même personne dans toutes vos vidéos.").msCaption()
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Idéal pour").msHeadline(15)
                        FlowLayout(spacing: 8) {
                            ForEach(["Avis produit", "Déballage", "Témoignages", "Tutoriels"], id: \.self) { t in
                                MSBadge(text: t, tone: .neutral)
                            }
                        }
                    }
                    MSButton(title: "Utiliser en UGC", icon: "video.fill") {
                        store.pendingCreatorId = creator.id
                        dismiss()
                        router.push(.ugcCreator, on: .studio)
                        router.toast("\(creator.name) sélectionné(e) pour l'UGC", style: .success)
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
