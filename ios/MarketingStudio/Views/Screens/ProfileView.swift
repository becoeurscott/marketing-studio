import SwiftUI

/// SPEC §39 — Profile: avatar, name, email, company, stats, edit sheet, sign out.
struct ProfileView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var showEdit = false
    @State private var confirmSignOut = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                header.padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 10) {
                    StatTile(label: "Projets", value: "\(store.projects.count)", icon: "folder", tint: MSColor.highlight) { router.select(.projects) }
                    StatTile(label: "Ressources", value: "\(store.assets.count)", icon: "photo.on.rectangle", tint: Color(hex: 0x60A5FA)) { router.select(.assets) }
                    StatTile(label: "Campagnes", value: "\(store.campaigns.count)", icon: "flag", tint: MSColor.success) { router.push(.campaigns) }
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Compte")
                VStack(spacing: 0) {
                    infoRow("Nom", store.user.name, icon: "person")
                    divider
                    infoRow("E-mail", store.user.email, icon: "envelope")
                    divider
                    infoRow("Entreprise", store.user.company, icon: "building.2")
                    divider
                    infoRow("Rôle", store.user.role, icon: "briefcase")
                    divider
                    infoRow("Forfait", "\(store.plan.title) · \(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) crédits", icon: "creditcard")
                }
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Votre studio", subtitle: "D’après votre inscription")
                onboardingSummary.padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 10) {
                    MSButton(title: "Modifier le profil", icon: "pencil", style: .secondary) { showEdit = true }
                    MSButton(title: "Se déconnecter", icon: "rectangle.portrait.and.arrow.right", style: .danger) { confirmSignOut = true }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 6)
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Profil")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                MSIconButton(icon: "gearshape", size: 30) { router.push(.settings) }
            }
        }
        .msSheet(isPresented: $showEdit, detents: [.large]) { EditProfileSheet() }
        .confirmationDialog("Se déconnecter de Sokozia ?", isPresented: $confirmSignOut, titleVisibility: .visible) {
            Button("Se déconnecter", role: .destructive) { Task { await AuthService.shared.signOut() } }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Vous pourrez vous reconnecter avec le même compte ; vos crédits sont gardés.")
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                AvatarView(url: store.user.avatarURL, name: store.user.name, size: 96)
                Button { showEdit = true } label: {
                    Image(systemName: "pencil").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        .frame(width: 26, height: 26).background(MSColor.accent, in: Circle())
                        .overlay(Circle().strokeBorder(MSColor.bg, lineWidth: 2))
                }
                .buttonStyle(MSPressStyle())
            }
            VStack(spacing: 4) {
                Text(store.user.name).msTitle(26)
                Text(store.user.email).msBody(14)
                HStack(spacing: 6) {
                    MSBadge(text: store.user.role, tone: .neutral)
                    MSBadge(text: store.user.company, tone: .neutral, icon: "building.2")
                    MSBadge(text: store.plan.title, tone: .accent)
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var divider: some View { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 52) }

    private func infoRow(_ label: String, _ value: String, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                .frame(width: 28, height: 28).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            Text(label).msBody(14)
            Spacer()
            Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
        }
        .padding(.horizontal, 12).frame(height: 50)
    }

    private var onboardingSummary: some View {
        let a = store.onboardingAnswers
        let rows: [(String, [String])] = [("Création", a.creating), ("Rôle", a.role), ("Envies", a.wants), ("Plateformes", a.platforms), ("Objectif", a.goal)].filter { !$0.1.isEmpty }
        return Group {
            if rows.isEmpty {
                MSCard { Text("Aucune réponse d’inscription enregistrée.").msBody(14) }
            } else {
                MSCard {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(rows, id: \.0) { label, values in
                            HStack(alignment: .top, spacing: 10) {
                                Text(label).msCaption().frame(width: 70, alignment: .leading)
                                FlowLayout(spacing: 6) {
                                    ForEach(values, id: \.self) { MSBadge(text: $0, tone: .neutral) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

struct EditProfileSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var company = ""
    @State private var role = ""
    private let roles = ["Commerçant(e)", "Boutique en ligne", "Restaurant / maquis", "Couture", "Coiffure & beauté", "Créateur(trice)", "Agence"]

    var body: some View {
        BottomSheetContainer(title: "Modifier le profil") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 14) {
                        AvatarView(url: nil, name: name, size: 64)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Compte").msCaption()
                            Text(email).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                        }
                    }
                    MSTextField(label: "Nom", placeholder: "Votre nom", text: $name, icon: "person", autocapitalization: .words)
                    MSTextField(label: "Boutique", placeholder: "Nom de votre boutique ou marque", text: $company, icon: "storefront", autocapitalization: .words)
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Rôle").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            ForEach(roles, id: \.self) { r in MSChip(title: r, selected: role == r) { role = r } }
                        }
                    }
                    MSButton(title: "Enregistrer les modifications", icon: "checkmark", isDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty) {
                        var u = store.user
                        u.name = name.trimmingCharacters(in: .whitespaces)
                        u.company = company.trimmingCharacters(in: .whitespaces)
                        u.role = role
                        u.avatarURL = ""
                        store.updateUser(u)
                        router.toast("Profil mis à jour", style: .success)
                        dismiss()
                    }
                    .padding(.top, 6)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
        .onAppear {
            let u = store.user
            name = u.name; email = u.email; company = u.company; role = u.role
        }
    }
}
