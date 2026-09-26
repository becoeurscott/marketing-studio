import SwiftUI

/// SPEC §24.
struct ProjectsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var filter = "Tous"
    @State private var query = ""

    private var filtered: [Project] {
        store.projects
            .filter { p in
                switch filter {
                case "Actifs": return p.status == .active
                case "Archivés": return p.status == .archived
                default: return true
                }
            }
            .filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) || $0.description.localizedCaseInsensitiveContains(query) }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Projets").msTitle(30).padding(.horizontal, MSSpacing.gutter).padding(.bottom, 4)
                SearchBar(placeholder: "Rechercher des projets", text: $query)
                    .padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: ["Tous", "Actifs", "Archivés"], selection: $filter)
                if filtered.isEmpty {
                    EmptyStateView(
                        icon: query.isEmpty ? "folder.badge.plus" : "magnifyingglass",
                        title: query.isEmpty ? (filter == "Archivés" ? "Aucun projet archivé" : "Aucun projet pour l'instant") : "Aucun résultat",
                        message: query.isEmpty ? "Les projets regroupent vos visuels, générations et campagnes." : "Essayez un autre nom ou effacez la recherche.",
                        ctaTitle: query.isEmpty ? "Nouveau projet" : "Effacer la recherche",
                        ctaIcon: query.isEmpty ? "plus" : nil
                    ) {
                        if query.isEmpty { router.present(.newProject) } else { query = "" }
                    }
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(filtered) { project in
                            ProjectCard(project: project) {
                                router.push(.projectDetail(id: project.id))
                            }
                            .contextMenu { ProjectMenu(project: project) }
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
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 8) {
                    CreditBadge()
                    MSIconButton(icon: "plus", size: 30) { router.present(.newProject) }
                }
            }
        }
    }
}

struct ProjectCard: View {
    @EnvironmentObject private var store: AppStore
    var project: Project
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                RemoteImage(url: project.thumbnailURL, cornerRadius: 12)
                    .aspectRatio(1.35, contentMode: .fit)
                    .overlay(alignment: .topTrailing) {
                        if project.status == .archived {
                            MSBadge(text: "Archivé", tone: .neutral).padding(8)
                        }
                    }
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(2).multilineTextAlignment(.leading)
                    Text("\(store.assets(in: project.id).count) visuels").msCaption()
                    Text("Créé le \(project.createdAt.shortString)").msCaption()
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

/// Shared rename / duplicate / archive / delete menu.
struct ProjectMenu: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var project: Project
    var onDeleted: (() -> Void)? = nil

    var body: some View {
        Button { router.present(.editProject(id: project.id)) } label: { Label("Renommer", systemImage: "pencil") }
        Button {
            if let copy = store.duplicateProject(project.id) {
                router.toast("Dupliqué sous « \(copy.name) »", style: .success)
            }
        } label: { Label("Dupliquer", systemImage: "plus.square.on.square") }
        Button {
            if project.status == .archived {
                store.unarchiveProject(project.id)
                router.toast("Projet restauré", style: .success)
            } else {
                store.archiveProject(project.id)
                router.toast("Projet archivé")
            }
        } label: {
            Label(project.status == .archived ? "Désarchiver" : "Archiver", systemImage: project.status == .archived ? "tray.and.arrow.up" : "archivebox")
        }
        Button(role: .destructive) {
            store.deleteProject(project.id)
            router.toast("Projet supprimé", style: .warning)
            onDeleted?()
        } label: { Label("Supprimer", systemImage: "trash") }
    }
}
