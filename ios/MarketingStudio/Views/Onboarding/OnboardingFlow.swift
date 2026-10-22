import SwiftUI

/// First-run setup, shown once after sign-in: country + language, business, channels, then what
/// Sokozia can make (real creators, styles and templates) and the welcome credits.
struct OnboardingFlow: View {
    @EnvironmentObject private var store: AppStore

    private enum Step: Int, CaseIterable { case welcome, country, business, goals, examples, ready }

    @State private var step: Step = .welcome
    @State private var forward = true
    @State private var country = Market.defaultCountry
    @State private var language = "fr"
    @State private var sector: String?
    @State private var shopName = ""
    @State private var goals: Set<String> = []
    @State private var channels: Set<String> = ["WhatsApp"]

    static let sectors: [(name: String, icon: String, category: TemplateCategory)] = [
        ("Couture & wax", "tshirt", .waxCouture), ("Cosmétiques", "drop", .cosmetics), ("Coiffure", "comb", .hair),
        ("Restaurant / maquis", "fork.knife", .restaurant), ("Électronique", "iphone", .electronics),
        ("Alimentation", "basket", .grocery), ("Boutique / marché", "storefront", .promo), ("Autre", "sparkles", .ugc),
    ]
    static let goalOptions = ["Vendre plus", "Lancer un produit", "Préparer une fête (Tabaski, Noël…)", "Être plus visible", "Gagner du temps"]
    static let channelOptions = ["WhatsApp", "Facebook", "TikTok", "Instagram", "YouTube"]

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                if step != .welcome { header }
                ScrollView(showsIndicators: false) {
                    content
                        .padding(.horizontal, MSSpacing.gutter)
                        .padding(.top, step == .welcome ? 0 : 8)
                        .padding(.bottom, 24)
                }
                .id(step)
                .transition(.asymmetric(
                    insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
                    removal: .move(edge: forward ? .leading : .trailing).combined(with: .opacity)))
                footer
            }
        }
        .animation(MSAnimation.snappy, value: step)
        .onAppear {
            country = store.preferences.country
            language = store.preferences.language
            shopName = store.brand.name == "Ma boutique" ? "" : store.brand.name
        }
    }

    // MARK: Chrome

    private var header: some View {
        HStack(spacing: 12) {
            Button { move(-1) } label: {
                Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.text2)
                    .frame(width: 36, height: 36).background(MSColor.elevated, in: Circle())
            }
            MSProgressBar(progress: Double(step.rawValue) / Double(Step.allCases.count - 1))
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.vertical, 10)
    }

    private var footer: some View {
        VStack(spacing: 8) {
            MSButton(title: step == .ready ? "Commencer à créer" : "Continuer", icon: step == .ready ? "sparkles" : "arrow.right", isDisabled: !canContinue) {
                step == .ready ? finish() : move(1)
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(MSColor.bg)
    }

    private var canContinue: Bool {
        switch step {
        case .business: return sector != nil
        default: return true
        }
    }

    private func move(_ delta: Int) {
        guard let next = Step(rawValue: step.rawValue + delta) else { return }
        MSHaptic.tap()
        forward = delta > 0
        withAnimation(MSAnimation.snappy) { step = next }
    }

    @ViewBuilder private var content: some View {
        switch step {
        case .welcome: welcome
        case .country: countryStep
        case .business: businessStep
        case .goals: goalsStep
        case .examples: examplesStep
        case .ready: readyStep
        }
    }

    private func title(_ t: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(t).msTitle(28)
            Text(subtitle).msBody(15)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 8)
    }

    // MARK: Steps

    private var firstName: String { store.user.name.split(separator: " ").first.map(String.init) ?? "" }

    private var welcome: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top, spacing: 8) {
                ForEach(Array(Catalog.creators.filter(\.featured).prefix(3))) { c in
                    CreatorIntroView(creator: c)
                        .aspectRatio(9.0 / 15.0, contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
            .padding(.top, 20)
            VStack(alignment: .leading, spacing: 8) {
                Text(firstName.isEmpty ? "Bienvenue sur Marketing Studio" : "Bienvenue, \(firstName) !").msTitle(30)
                Text("En une minute, on prépare votre espace : pays, activité et réseaux. Ensuite, vos photos produit deviennent des pubs, des statuts WhatsApp et des vidéos UGC.").msBody(15)
            }
        }
    }

    private var countryStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            title("Où vendez-vous ?", "Pour vos prix, vos moyens de paiement et vos langues.")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(Market.countries) { c in
                    selectable(selected: country == c.code) {
                        country = c.code
                        if !c.languages.contains(language) { language = c.languages.first ?? "fr" }
                    } label: {
                        HStack(spacing: 8) {
                            Text(c.flag).font(.system(size: 22))
                            Text(c.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1).minimumScaleFactor(0.8)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
            Text("Langue principale").msHeadline(16).padding(.top, 6)
            FlowLayout(spacing: 8) {
                ForEach(Market.country(country).languages, id: \.self) { id in
                    MSChip(title: Market.languageLabel(id), selected: language == id) { MSHaptic.tap(); language = id }
                }
            }
            let payments = Market.country(country).payments.compactMap { Market.paymentMethods[$0]?.label }.joined(separator: ", ")
            Text("Prix en \(Market.currencies[Market.country(country).currency]?.symbol ?? "FCFA") · paiement \(payments)").msCaption()
        }
    }

    private var businessStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            title("Que vendez-vous ?", "On vous montrera des exemples de votre secteur.")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(Self.sectors, id: \.name) { s in
                    selectable(selected: sector == s.name) { sector = s.name } label: {
                        HStack(spacing: 8) {
                            Image(systemName: s.icon).font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.highlight).frame(width: 22)
                            Text(s.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(2).minimumScaleFactor(0.85)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
            MSTextField(label: "Nom de la boutique (facultatif)", placeholder: "Ex. Chez Awa Couture", text: $shopName, icon: "storefront", autocapitalization: .words)
                .padding(.top, 4)
        }
    }

    private var goalsStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            title("Vos objectifs", "Choisissez tout ce qui compte pour vous.")
            FlowLayout(spacing: 8) {
                ForEach(Self.goalOptions, id: \.self) { g in
                    MSChip(title: g, selected: goals.contains(g)) { MSHaptic.tap(); toggle(&goals, g) }
                }
            }
            Text("Où publiez-vous ?").msHeadline(16).padding(.top, 8)
            FlowLayout(spacing: 8) {
                ForEach(Self.channelOptions, id: \.self) { c in
                    MSChip(title: c, icon: c == "WhatsApp" ? "message.fill" : nil, selected: channels.contains(c)) { MSHaptic.tap(); toggle(&channels, c) }
                }
            }
        }
    }

    private var sectorCategory: TemplateCategory? { Self.sectors.first { $0.name == sector }?.category }

    private var sectorTemplates: [Template] {
        let own = Catalog.templates.filter { $0.category == sectorCategory }
        let rest = Catalog.templates.filter { $0.popular && $0.category != sectorCategory }
        return Array((own + rest).prefix(6))
    }

    private var examplesStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            title("Ce que vous pouvez créer", "De vrais exemples faits avec Marketing Studio. Vous ferez pareil avec vos produits.")
            Text("Styles photo").msHeadline(16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Catalog.styles) { st in
                        VStack(alignment: .leading, spacing: 4) {
                            RemoteImage(url: st.imageURL, cornerRadius: 12).frame(width: 120, height: 150)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            Text(st.name).font(MSFont.caption(12)).foregroundStyle(MSColor.text).lineLimit(1)
                            Text(st.product).msCaption(color: MSColor.muted).lineLimit(1)
                        }
                        .frame(width: 120, alignment: .leading)
                    }
                }
            }
            Text("Vidéos UGC avec nos créateurs").msHeadline(16)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(Catalog.creators.prefix(8))) { c in
                        VStack(alignment: .leading, spacing: 4) {
                            CreatorIntroView(creator: c)
                                .frame(width: 108, height: 170)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            Text(c.name).font(MSFont.caption(12)).foregroundStyle(MSColor.text)
                            Text(c.languages.joined(separator: ", ")).msCaption(color: MSColor.muted).lineLimit(1)
                        }
                        .frame(width: 108, alignment: .leading)
                    }
                }
            }
            Text("Modèles pour votre activité").msHeadline(16)
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(sectorTemplates) { t in
                    VStack(alignment: .leading, spacing: 4) {
                        RemoteImage(url: t.thumbnailURL, cornerRadius: 12)
                            .aspectRatio(0.8, contentMode: .fit)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(alignment: .topLeading) { MSBadge(text: t.format, tone: .overlay).padding(6) }
                        Text(t.title).font(MSFont.caption(12)).foregroundStyle(MSColor.text).lineLimit(2)
                    }
                }
            }
        }
    }

    private var readyStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            title("Tout est prêt", "Votre espace est configuré.")
            HStack(spacing: 14) {
                Image(systemName: "bolt.fill").font(.system(size: 22, weight: .bold)).foregroundStyle(MSColor.onAccent)
                    .frame(width: 52, height: 52).background(MSColor.accentGradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(SokoziaConfig.welcomeCredits) crédits offerts").msHeadline(18)
                    Text("Environ \(SokoziaConfig.welcomeCredits / AIModels.imageModel(nil).credits) visuels produit, ou une vidéo UGC.").msCaption()
                }
            }
            .msCard()
            if let next = Market.upcomingMoments().first {
                HStack(spacing: 14) {
                    Image(systemName: "calendar").font(.system(size: 20, weight: .semibold)).foregroundStyle(MSColor.highlight)
                        .frame(width: 52, height: 52).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(next.moment.name) dans \(next.daysLeft) jours").msHeadline(16)
                        Text(next.moment.pitch).msCaption()
                    }
                }
                .msCard()
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Pour commencer").msHeadline(16)
                bullet("Importez une photo de votre produit (même prise au téléphone).")
                bullet("Choisissez un style ou un créateur.")
                bullet("Partagez directement sur WhatsApp.")
            }
        }
    }

    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.green)
            Text(text).msBody(14, color: MSColor.text)
        }
    }

    // MARK: Helpers

    private func selectable<Label: View>(selected: Bool, action: @escaping () -> Void, @ViewBuilder label: () -> Label) -> some View {
        Button {
            MSHaptic.tap()
            withAnimation(MSAnimation.snappy) { action() }
        } label: {
            label()
                .padding(.horizontal, 12)
                .frame(height: 52)
                .background(selected ? MSColor.accent.opacity(0.14) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(selected ? MSColor.accent.opacity(0.7) : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    private func toggle(_ set: inout Set<String>, _ value: String) {
        if set.contains(value) { set.remove(value) } else { set.insert(value) }
    }

    private func finish() {
        var prefs = store.preferences
        prefs.country = country
        prefs.language = language
        store.updatePreferences(prefs)

        var brand = store.brand
        let name = shopName.trimmingCharacters(in: .whitespaces)
        if !name.isEmpty { brand.name = name }
        brand.industry = sector ?? brand.industry
        store.updateBrand(brand)
        if !name.isEmpty {
            var u = store.user
            u.company = name
            store.updateUser(u)
        }

        var answers = OnboardingAnswers()
        answers.creating = sector.map { [$0] } ?? []
        answers.goal = Array(goals)
        answers.platforms = Array(channels)
        MSHaptic.success()
        store.completeOnboarding(answers)
    }
}
