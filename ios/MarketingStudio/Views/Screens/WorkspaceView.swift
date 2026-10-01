import SwiftUI

/// SPEC §41 — Workspace: name, members with role badges, invite, change role, remove, permissions legend.
struct WorkspaceView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var memberToRemove: WorkspaceMember?

    private let workspaceName = "Sokozia"

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                header.padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Membres", subtitle: "\(store.members.count) sur \(seatLimit) places", actionTitle: "Inviter") { invite() }
                if store.members.isEmpty {
                    EmptyStateView(icon: "person.2", title: "Aucun membre", message: "Invitez vos coéquipiers à collaborer sur vos projets.", ctaTitle: "Inviter", ctaIcon: "person.badge.plus") { invite() }
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(store.members.enumerated()), id: \.element.id) { i, m in
                            memberRow(m)
                            if i < store.members.count - 1 { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 66) }
                        }
                    }
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .padding(.horizontal, MSSpacing.gutter)
                    .animation(MSAnimation.gentle, value: store.members.map { $0.id })
                }

                MSButton(title: "Inviter un coéquipier", icon: "person.badge.plus", style: .secondary) { invite() }
                    .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Permissions par rôle")
                legend.padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Espace de travail")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Retirer \(memberToRemove?.name ?? "ce membre") ?", isPresented: Binding(get: { memberToRemove != nil }, set: { if !$0 { memberToRemove = nil } }), titleVisibility: .visible) {
            Button("Retirer de l’espace de travail", role: .destructive) {
                if let m = memberToRemove {
                    withAnimation(MSAnimation.gentle) { store.removeMember(m.id) }
                    router.toast("\(m.name) a été retiré", style: .warning)
                }
                memberToRemove = nil
            }
            Button("Annuler", role: .cancel) { memberToRemove = nil }
        } message: {
            Text("Cette personne perdra l’accès à tous les projets de cet espace de travail.")
        }
    }

    private var seatLimit: Int {
        switch store.plan {
        case .starter: return 1
        case .creator: return 3
        case .studio: return 10
        case .agency: return 999
        }
    }

    private func invite() {
        if store.members.count >= seatLimit {
            router.present(.paywall(feature: "Plus de places dans l’équipe"))
        } else {
            router.present(.inviteMember)
        }
    }

    private var header: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous).fill(MSColor.accentGradient).frame(width: 60, height: 60)
                Text("SK").font(.system(size: 20, weight: .bold, design: .rounded)).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(workspaceName).msTitle(24)
                HStack(spacing: 6) {
                    MSBadge(text: store.plan.title, tone: .accent)
                    Text("\(store.projects.count) projets · \(store.campaigns.count) campagnes").msCaption()
                }
            }
            Spacer()
        }
        .padding(16)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private func memberRow(_ m: WorkspaceMember) -> some View {
        HStack(spacing: 12) {
            AvatarView(url: m.avatarURL, name: m.name, size: 42)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(m.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    if m.email == store.user.email { Text("Vous").msCaption() }
                }
                Text(m.email).msCaption().lineLimit(1)
            }
            Spacer()
            if m.role == .owner {
                MSBadge(text: "Propriétaire", tone: .accent, icon: "crown")
            } else {
                Menu {
                    Section("Changer le rôle") {
                        ForEach(MemberRole.allCases.filter { $0 != .owner }) { r in
                            Button {
                                store.changeRole(m.id, to: r)
                                router.toast("\(m.name) est maintenant \(r.title)", style: .success)
                            } label: {
                                Label(r.title, systemImage: m.role == r ? "checkmark" : roleIcon(r))
                            }
                        }
                    }
                    Button(role: .destructive) { memberToRemove = m } label: { Label("Retirer", systemImage: "person.badge.minus") }
                } label: {
                    HStack(spacing: 4) {
                        MSBadge(text: m.role.title, tone: roleTone(m.role), icon: roleIcon(m.role))
                        Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                    }
                    .contentShape(Rectangle())
                }
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 64)
    }

    private var legend: some View {
        VStack(spacing: 0) {
            legendRow(.owner, "Facturation, suppression de l’espace, et tout ce qui suit")
            Rectangle().fill(MSColor.border).frame(height: 1)
            legendRow(.admin, "Gérer les membres, kits de marque et réglages")
            Rectangle().fill(MSColor.border).frame(height: 1)
            legendRow(.editor, "Créer et modifier projets, ressources et campagnes")
            Rectangle().fill(MSColor.border).frame(height: 1)
            legendRow(.viewer, "Consultation et téléchargement uniquement")
        }
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private func legendRow(_ r: MemberRole, _ text: String) -> some View {
        HStack(spacing: 12) {
            MSBadge(text: r.title, tone: roleTone(r), icon: roleIcon(r)).frame(width: 84, alignment: .leading)
            Text(text).msBody(13)
            Spacer()
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
    }

    private func roleIcon(_ r: MemberRole) -> String {
        switch r {
        case .owner: return "crown"
        case .admin: return "shield"
        case .editor: return "pencil"
        case .viewer: return "eye"
        }
    }
    private func roleTone(_ r: MemberRole) -> MSBadge.Tone {
        switch r {
        case .owner: return .accent
        case .admin: return .info
        case .editor: return .success
        case .viewer: return .neutral
        }
    }
}

// MARK: - Invite sheet (AppSheet.inviteMember)

struct InviteMemberSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var name = ""
    @State private var email = ""
    @State private var role: MemberRole = .editor
    @State private var sending = false

    private var emailValid: Bool { email.contains("@") && email.contains(".") && !email.hasSuffix(".") }

    var body: some View {
        BottomSheetContainer(title: "Inviter un coéquipier", subtitle: "Cette personne recevra un e-mail avec un lien pour rejoindre Sokozia.") {
            VStack(alignment: .leading, spacing: 14) {
                MSTextField(label: "Nom", placeholder: "ex. Awa Diallo", text: $name, icon: "person", autocapitalization: .words)
                MSTextField(label: "E-mail", placeholder: "nom@entreprise.com", text: $email, icon: "envelope", keyboard: .emailAddress, autocapitalization: .never)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Rôle").msCaption(color: MSColor.text2)
                    HStack(spacing: 8) {
                        ForEach(MemberRole.allCases.filter { $0 != .owner }) { r in
                            MSChip(title: r.title, selected: role == r) { role = r }
                        }
                    }
                    Text(roleHint).msCaption()
                }
                Spacer(minLength: 0)
                MSButton(title: sending ? "Envoi de l’invitation" : "Envoyer l’invitation", icon: sending ? nil : "paperplane.fill", isLoading: sending, isDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty || !emailValid) {
                    sending = true
                    Task {
                        try? await Task.sleep(for: .milliseconds(900))
                        let m = store.inviteMember(name: name.trimmingCharacters(in: .whitespaces), email: email.lowercased(), role: role)
                        MSHaptic.success()
                        router.dismissSheet()
                        router.toast("Invitation envoyée à \(m.name)", style: .success)
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
    }

    private var roleHint: String {
        switch role {
        case .owner: return ""
        case .admin: return "Peut gérer les membres, kits de marque et réglages."
        case .editor: return "Peut créer et modifier projets, ressources et campagnes."
        case .viewer: return "Peut uniquement consulter et télécharger."
        }
    }
}
