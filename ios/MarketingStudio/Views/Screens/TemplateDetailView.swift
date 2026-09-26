import SwiftUI

/// SPEC §28 — Template detail: large preview, name, description, platforms, "Use Template" → Studio.
struct TemplateDetailView: View {
    let templateId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    private var template: Template? { store.template(templateId) }

    var body: some View {
        Group {
            if let t = template {
                content(t)
            } else {
                EmptyStateView(icon: "rectangle.on.rectangle.angled", title: "Modèle introuvable", message: "Ce modèle a peut-être été supprimé.", ctaTitle: "Retour aux modèles") {
                    router.pop()
                }
                .padding(.top, 60)
            }
        }
        .msScreen()
        .navigationTitle(template?.title ?? "Modèle")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let t = template {
                ToolbarItem(placement: .topBarTrailing) {
                    let fav = store.isFavorite(.template, t.id)
                    MSIconButton(icon: fav ? "heart.fill" : "heart", size: 30, tint: fav ? MSColor.danger : MSColor.text) {
                        store.toggleFavorite(.template, t.id)
                        router.toast(fav ? "Retiré des favoris" : "Ajouté aux favoris", style: .success)
                    }
                }
            }
        }
    }

    private func content(_ t: Template) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                RemoteImage(url: t.thumbnailURL, cornerRadius: MSRadius.xl)
                    .aspectRatio(0.85, contentMode: .fit)
                    .overlay(alignment: .bottomLeading) {
                        HStack(spacing: 6) {
                            MSBadge(text: t.format, tone: .overlay)
                            MSBadge(text: t.ratio, tone: .overlay)
                            MSBadge(text: t.style, tone: .overlay)
                        }
                        .padding(12)
                    }
                    .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 8) {
                    Text(t.category.title.uppercased(with: Locale(identifier: "fr_FR")))
                        .font(.system(size: 11, weight: .semibold)).tracking(0.8).foregroundStyle(MSColor.highlight)
                    Text(t.title).msTitle(26)
                    Text(t.description).msBody(15).lineSpacing(3)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Plateformes").msHeadline(15)
                    FlowLayout(spacing: 8) {
                        ForEach(t.platforms) { p in
                            HStack(spacing: 6) {
                                Image(systemName: p.icon).font(.system(size: 12, weight: .semibold))
                                Text(p.title).font(MSFont.control(13))
                            }
                            .foregroundStyle(MSColor.text2)
                            .padding(.horizontal, 12).frame(height: 32)
                            .background(MSColor.elevated, in: Capsule())
                            .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                MSCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Préréglage").msHeadline(15)
                        presetRow("Prompt", t.prompt)
                        Divider().overlay(MSColor.border)
                        HStack(spacing: 0) {
                            presetStat("Style", t.style)
                            presetStat("Format d’image", t.ratio)
                            presetStat("Format", t.format)
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                Text("Utiliser un modèle ouvre le Studio avec le prompt, le style et le format déjà renseignés.")
                    .msCaption()
                    .padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 8)
            .padding(.bottom, 110)
        }
        .safeAreaInset(edge: .bottom) {
            MSButton(title: "Utiliser le modèle", icon: "sparkles") {
                store.pendingTemplateId = t.id
                router.toast("\(t.title) appliqué dans le Studio", style: .success, icon: "sparkles")
                router.popToRoot(on: .studio)
                router.select(.studio)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.vertical, 12)
            .background(MSColor.bg.opacity(0.92))
        }
    }

    private func presetRow(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).msCaption()
            Text(value).msBody(14, color: MSColor.text)
        }
    }

    private func presetStat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).msCaption()
            Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
