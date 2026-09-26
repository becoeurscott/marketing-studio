import SwiftUI

/// Create or rename a project.
struct NewProjectSheet: View {
    var editingId: String? = nil
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var name = ""
    @State private var description = ""

    private var isEditing: Bool { editingId != nil }

    var body: some View {
        BottomSheetContainer(title: isEditing ? "Renommer le projet" : "Nouveau projet", subtitle: isEditing ? nil : "Regroupez visuels, générations et campagnes.") {
            VStack(spacing: 14) {
                MSTextField(label: "Nom", placeholder: "ex. Lancement été Luma Skin", text: $name, icon: "folder")
                if !isEditing {
                    MSTextEditor(label: "Description", placeholder: "À quoi sert ce projet ?", text: $description, minHeight: 90)
                }
                Spacer(minLength: 0)
                MSButton(title: isEditing ? "Enregistrer" : "Créer le projet", icon: isEditing ? "checkmark" : "plus", isDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty) {
                    let trimmed = name.trimmingCharacters(in: .whitespaces)
                    if let editingId {
                        store.renameProject(editingId, to: trimmed)
                        router.toast("Renommé en \(trimmed)", style: .success)
                        router.dismissSheet()
                    } else {
                        let p = store.createProject(name: trimmed, description: description.trimmingCharacters(in: .whitespacesAndNewlines))
                        router.dismissSheet()
                        router.toast("Projet créé", style: .success)
                        router.push(.projectDetail(id: p.id), on: .projects)
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
        .onAppear {
            if let editingId, let p = store.project(editingId) {
                name = p.name
                description = p.description
            }
        }
    }
}
