import SwiftUI

/// Sign-in / sign-up, same accounts and methods as sokozia.com: Google, e-mail code (no password),
/// e-mail + password (with e-mail verification code), password reset by code.
struct AuthView: View {
    @EnvironmentObject private var auth: AuthService

    enum Step: Equatable {
        case welcome
        case emailCode, enterCode
        case password, signUp, verify
        case resetEmail, resetCode, resetPassword
    }

    @State private var step: Step = .welcome
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var code = ""
    @State private var resetToken = ""
    @State private var busy = false
    @State private var error: String?
    @State private var info: String?

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 22) {
                    if step != .welcome { backButton }
                    content
                        .id(step)
                        .transition(.opacity.combined(with: .move(edge: .trailing)))
                    if let error { banner(error, tone: MSColor.danger, icon: "exclamationmark.circle.fill") }
                    if let info { banner(info, tone: MSColor.success, icon: "checkmark.circle.fill") }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, step == .welcome ? 0 : 12)
                .padding(.bottom, 40)
                .animation(MSAnimation.snappy, value: step)
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    @ViewBuilder private var content: some View {
        switch step {
        case .welcome: welcome
        case .emailCode:
            form(title: "Recevoir un code", subtitle: "Pas de mot de passe : on vous envoie un code à 6 chiffres par e-mail.") {
                emailField
                MSButton(title: "Recevoir le code", icon: "envelope.fill", isLoading: busy, isDisabled: email.isEmpty) {
                    run { try await auth.sendCode(email: email); info = "Si l’adresse est valide, un code à 6 chiffres vient de vous être envoyé."; go(.enterCode) }
                }
            }
        case .enterCode:
            form(title: "Entrez le code", subtitle: "Envoyé à \(email). Pensez à regarder dans les spams.") {
                codeField
                MSTextField(label: "Votre nom (nouveau compte)", placeholder: "Nom ou nom de la boutique", text: $name, icon: "person", autocapitalization: .words)
                MSButton(title: "Se connecter", icon: "arrow.right", isLoading: busy, isDisabled: code.count < 6) {
                    run { try await auth.verifyCode(email: email, code: code, name: name) }
                }
                linkButton("Renvoyer le code") { run { try await auth.sendCode(email: email); info = "Nouveau code envoyé." } }
            }
        case .password:
            form(title: "Connexion", subtitle: "Avec votre e-mail et votre mot de passe Marketing Studio.") {
                emailField
                passwordField
                MSButton(title: "Se connecter", icon: "arrow.right", isLoading: busy, isDisabled: email.isEmpty || password.isEmpty) {
                    run {
                        do { try await auth.signIn(email: email, password: password) }
                        catch AuthError.needsVerification { info = "Votre e-mail n’est pas encore vérifié : un nouveau code vient d’être envoyé."; go(.verify) }
                    }
                }
                HStack {
                    linkButton("Mot de passe oublié ?") { go(.resetEmail) }
                    Spacer()
                    linkButton("Créer un compte") { go(.signUp) }
                }
            }
        case .signUp:
            form(title: "Créer mon compte", subtitle: "\(SokoziaConfig.welcomeCredits) crédits offerts pour vos premiers visuels.") {
                MSTextField(label: "Nom", placeholder: "Votre nom ou celui de la boutique", text: $name, icon: "person", autocapitalization: .words)
                emailField
                passwordField
                MSButton(title: "Créer mon compte", icon: "sparkles", isLoading: busy, isDisabled: email.isEmpty || password.isEmpty || name.isEmpty) {
                    run {
                        if try await auth.signUp(name: name, email: email, password: password) == .verifyEmail {
                            info = "Nous vous avons envoyé un code à 6 chiffres par e-mail."
                            go(.verify)
                        }
                    }
                }
                linkButton("J’ai déjà un compte") { go(.password) }
            }
        case .verify:
            form(title: "Vérifiez votre e-mail", subtitle: "Entrez le code reçu à \(email).") {
                codeField
                MSButton(title: "Valider", icon: "checkmark", isLoading: busy, isDisabled: code.count < 6) {
                    run { try await auth.verifyEmail(email: email, code: code) }
                }
                linkButton("Renvoyer le code") { run { await auth.resendVerification(email: email); info = "Nouveau code envoyé." } }
            }
        case .resetEmail:
            form(title: "Mot de passe oublié", subtitle: "On vous envoie un code pour choisir un nouveau mot de passe.") {
                emailField
                MSButton(title: "Recevoir le code", icon: "envelope.fill", isLoading: busy, isDisabled: email.isEmpty) {
                    run { await auth.sendResetCode(email: email); info = "Si un compte existe, un code de réinitialisation vient d’être envoyé."; go(.resetCode) }
                }
            }
        case .resetCode:
            form(title: "Entrez le code", subtitle: "Envoyé à \(email).") {
                codeField
                MSButton(title: "Continuer", icon: "arrow.right", isLoading: busy, isDisabled: code.count < 6) {
                    run { resetToken = try await auth.checkResetCode(email: email, code: code); go(.resetPassword) }
                }
            }
        case .resetPassword:
            form(title: "Nouveau mot de passe", subtitle: "6 caractères minimum.") {
                passwordField
                MSButton(title: "Enregistrer", icon: "checkmark", isLoading: busy, isDisabled: password.count < 6) {
                    run {
                        try await auth.resetPassword(token: resetToken, newPassword: password)
                        password = ""
                        go(.password)
                        info = "Mot de passe modifié. Connectez-vous avec le nouveau mot de passe."
                    }
                }
            }
        }
    }

    // MARK: Welcome

    private var welcome: some View {
        VStack(alignment: .leading, spacing: 22) {
            heroCollage
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 7, style: .continuous).fill(MSColor.accentGradient).frame(width: 26, height: 26)
                        .overlay(Text("M").font(.system(size: 15, weight: .heavy, design: .rounded)).foregroundStyle(MSColor.onAccent))
                    Text("Marketing Studio").font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
                }
                Text("Vos pubs, photos et vidéos UGC en quelques minutes.").msTitle(30)
                Text("Pour les commerçants africains : prix en FCFA, Mobile Money, statuts WhatsApp et créateurs qui parlent vos langues.").msBody(15)
            }
            VStack(spacing: 10) {
                Button { run { try await auth.signInWithGoogle() } } label: {
                    HStack(spacing: 10) {
                        Text("G").font(.system(size: 17, weight: .bold)).foregroundStyle(Color(hex: 0x4285F4))
                        Text("Continuer avec Google").font(MSFont.control(15)).foregroundStyle(Color(hex: 0x111111))
                    }
                    .frame(maxWidth: .infinity).frame(height: 50)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                }
                .buttonStyle(MSPressStyle())
                .disabled(busy)
                MSButton(title: "Recevoir un code par e-mail", icon: "envelope.fill") { go(.emailCode) }
                MSButton(title: "E-mail et mot de passe", icon: "key.fill", style: .secondary) { go(.password) }
            }
            Text("En continuant, vous acceptez les conditions d’utilisation de Marketing Studio. \(SokoziaConfig.welcomeCredits) crédits offerts à l’inscription.")
                .msCaption().multilineTextAlignment(.center).frame(maxWidth: .infinity)
        }
    }

    /// Real creators and styles generated for Sokozia.
    private var heroCollage: some View {
        let items = [Catalog.creators[0].avatarURL, Catalog.styles[0].imageURL, Catalog.creators[2].avatarURL, Catalog.styles[3].imageURL, Catalog.creators[1].avatarURL, Catalog.styles[4].imageURL]
        return HStack(alignment: .top, spacing: 8) {
            ForEach(0..<3, id: \.self) { col in
                VStack(spacing: 8) {
                    ForEach(0..<2, id: \.self) { row in
                        RemoteImage(url: items[col * 2 + row], cornerRadius: 14)
                            .frame(height: col == 1 ? (row == 0 ? 120 : 170) : (row == 0 ? 160 : 130))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
                .padding(.top, col == 1 ? 24 : 0)
            }
        }
        .frame(height: 330, alignment: .top)
        .clipped()
        .mask(LinearGradient(colors: [.black, .black, .clear], startPoint: .top, endPoint: .bottom))
        .padding(.top, 8)
    }

    // MARK: Building blocks

    private func form<Content: View>(title: String, subtitle: String, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(title).msTitle(28)
                Text(subtitle).msBody(15)
            }
            content()
        }
    }

    private var emailField: some View {
        MSTextField(label: "E-mail", placeholder: "vous@exemple.com", text: $email, icon: "envelope", keyboard: .emailAddress, autocapitalization: .never)
            .textContentType(.emailAddress)
    }

    private var passwordField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Mot de passe").msCaption(color: MSColor.text2)
            HStack(spacing: 10) {
                Image(systemName: "lock").foregroundStyle(MSColor.muted).font(.system(size: 14))
                SecureField("", text: $password, prompt: Text("6 caractères minimum").foregroundStyle(MSColor.muted))
                    .font(MSFont.body()).foregroundStyle(MSColor.text)
                    .textContentType(step == .signUp || step == .resetPassword ? .newPassword : .password)
            }
            .padding(.horizontal, 14).frame(height: 48)
            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
    }

    private var codeField: some View {
        MSTextField(label: "Code à 6 chiffres", placeholder: "123456", text: $code, icon: "number", keyboard: .numberPad, autocapitalization: .never)
            .textContentType(.oneTimeCode)
            .onChange(of: code) { _, v in
                let digits = String(v.filter(\.isNumber).prefix(6))
                if digits != v { code = digits }
            }
    }

    private var backButton: some View {
        Button { go(.welcome) } label: {
            HStack(spacing: 6) {
                Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                Text("Retour").font(MSFont.control(14))
            }
            .foregroundStyle(MSColor.text2)
        }
    }

    private func linkButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action).font(MSFont.control(14)).foregroundStyle(MSColor.highlight).disabled(busy)
    }

    private func banner(_ text: String, tone: Color, icon: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon).foregroundStyle(tone)
            Text(text).msBody(14, color: MSColor.text)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tone.opacity(0.12), in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
    }

    private func go(_ next: Step) {
        error = nil
        if next != .verify && next != .enterCode && next != .resetCode { info = nil }
        if [.enterCode, .verify, .resetCode].contains(next) { code = "" }
        withAnimation(MSAnimation.snappy) { step = next }
    }

    /// Runs an auth call with the spinner and French error messages.
    private func run(_ work: @escaping () async throws -> Void) {
        guard !busy else { return }
        busy = true
        error = nil
        Task {
            defer { busy = false }
            do { try await work() }
            catch AuthError.cancelled {}
            catch { self.error = error.localizedDescription; self.info = nil; MSHaptic.warning() }
        }
    }
}
