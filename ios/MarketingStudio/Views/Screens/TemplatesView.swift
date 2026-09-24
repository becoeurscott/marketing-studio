import SwiftUI

/// SPEC §27 — Templates: category chips, search, grid of template cards with favorite toggle.
struct TemplatesView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var category = "All"
    @State private var query = ""
    @State private var loading = true

    private var categories: [String] { ["All"] + TemplateCategory.allCases.map { $0.title } }

    private var filtered: [Template] {
        store.templates
            .filter { category == "All" || $0.category.title == category }
            .filter {
                query.isEmpty
                || $0.title.localizedCaseInsensitiveContains(query)
                || $0.format.localizedCaseInsensitiveContains(query)
                || $0.style.localizedCaseInsensitiveContains(query)
                || $0.platforms.contains { $0.title.localizedCaseInsensitiveContains(query) }
            }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Templates").msTitle(30)
                    Text("\(store.templates.count) ready-to-run presets. Pick one and generate in seconds.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)
                SearchBar(placeholder: "Search templates, formats, platforms", text: $query)
                    .padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: categories, selection: $category)

                if loading {
                    SkeletonGrid(count: 6, columns: 2, aspect: 0.72).padding(.horizontal, MSSpacing.gutter)
                } else if filtered.isEmpty {
                    EmptyStateView(
                        icon: "rectangle.on.rectangle",
                        title: "No templates found",
                        message: query.isEmpty ? "Nothing in \(category) yet. Try another category." : "No template matches \"\(query)\".",
                        ctaTitle: query.isEmpty ? "Show all" : "Clear search"
                    ) {
                        withAnimation(MSAnimation.snappy) { query = ""; category = "All" }
                    }
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(filtered) { template in
                            TemplateCard(template: template) {
                                router.push(.templateDetail(id: template.id))
                            }
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
        .navigationTitle("Templates")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .task {
            guard loading else { return }
            try? await Task.sleep(for: .milliseconds(450))
            withAnimation(MSAnimation.gentle) { loading = false }
        }
    }
}

/// Grid card: thumbnail, title, platform, format, favorite toggle.
struct TemplateCard: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var template: Template
    var action: () -> Void

    private var isFav: Bool { store.isFavorite(.template, template.id) }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                RemoteImage(url: template.thumbnailURL, cornerRadius: 12)
                    .aspectRatio(0.8, contentMode: .fit)
                    .overlay(alignment: .topLeading) {
                        MSBadge(text: template.format, tone: .overlay).padding(8)
                    }
                    .overlay(alignment: .topTrailing) {
                        Button {
                            MSHaptic.tap()
                            store.toggleFavorite(.template, template.id)
                            router.toast(isFav ? "Removed from favorites" : "Added to favorites", style: .success, icon: isFav ? "heart" : "heart.fill")
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
                Text(template.title)
                    .font(MSFont.control(14))
                    .foregroundStyle(MSColor.text)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                HStack(spacing: 6) {
                    ForEach(template.platforms.prefix(3)) { p in
                        Image(systemName: p.icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(MSColor.muted)
                    }
                    Text(template.platforms.map { $0.title }.prefix(2).joined(separator: ", "))
                        .msCaption()
                        .lineLimit(1)
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}
