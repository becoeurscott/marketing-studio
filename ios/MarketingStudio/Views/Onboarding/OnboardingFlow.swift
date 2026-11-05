import SwiftUI
import PhotosUI

// MARK: - Steps

private enum Step: Int, CaseIterable {
    case opening
    case upload, analysis
    case goal, platforms
    case socialProof
    case style
    case generation
    case campaign
    case paywall
}

// MARK: - Options data

private let goalOptions: [(value: String, label: String)] = [
    ("launch", "Lancer un nouveau produit"),
    ("sell", "Vendre plus en ligne"),
    ("social", "Développer mes réseaux sociaux"),
    ("test", "Tester de nouvelles créas"),
    ("auto", "Marketing Studio décide pour moi"),
]

private let platformOptions: [(id: String, label: String, icon: String)] = [
    ("WhatsApp", "WhatsApp", "message.circle"),
    ("TikTok", "TikTok", "music.note"),
    ("Instagram", "Instagram", "camera.circle"),
    ("Facebook", "Facebook", "person.2.circle"),
    ("YouTube", "YouTube", "play.rectangle"),
    ("Pinterest", "Pinterest", "pin.circle"),
]

private let styleOptions: [(value: String, label: String, tags: String)] = [
    ("luxe", "LUXE", "Premium · Élégant"),
    ("epure", "ÉPURÉ", "Minimal · Moderne"),
    ("ugc", "UGC", "Authentique · Humain"),
    ("audacieux", "AUDACIEUX", "Énergique · Coloré"),
]

private let genSteps = [
    "Analyse du produit", "Direction créative", "Photos produit", "Accroches",
    "Concept UGC", "Textes pub", "Variantes par plateforme", "Préparation de la campagne",
]

private let socialProofItems: [(String, String, String)] = [
    ("Fatou D.", "Sénégal", "J'ai fait mes photos produit en 5 min au lieu d'aller au studio. Mes ventes WhatsApp ont doublé."),
    ("Kofi M.", "Côte d'Ivoire", "La vidéo UGC a eu 12 000 vues sur TikTok. C'est mon meilleur retour sur investissement."),
    ("Amina K.", "Mali", "Même ma cousine pensait que j'avais payé un photographe pro. Tout était généré par l'IA !"),
]

// MARK: - Product info

private struct ProductInfo {
    var name: String = "Beurre de karité pur"
    var category: String = "Soin · Cosmétiques"
    var description: String = "Beurre de karité 100 % naturel, hydratant intense pour la peau et les cheveux, 250 g."
    var image: UIImage?
    var isSample: Bool = true
}

// MARK: - Onboarding flow

struct OnboardingFlow: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var step: Step = .upload
    @State private var forward = true

    @State private var product = ProductInfo()
    @State private var goal: String?
    @State private var platforms: Set<String> = ["WhatsApp"]
    @State private var style: String?
    @State private var photoItem: PhotosPickerItem?

    // Editable copy

    // Photo edit sheet

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                if step != .opening && step != .paywall {
                    header
                }
                ScrollView(showsIndicators: false) {
                    content
                        .padding(.horizontal, MSSpacing.gutter)
                        .padding(.top, step == .opening ? 0 : 16)
                        .padding(.bottom, 100)
                }
                .id(step)
                footer
            }
        }
        .animation(MSAnimation.snappy, value: step)
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 12) {
            let total = Double(Step.allCases.count - 2) // exclude opening & paywall
            let current = Double(step.rawValue)
            MSProgressBar(progress: min(current / total, 1.0))
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.vertical, 10)
    }

    // MARK: Footer

    private var footer: some View {
        VStack(spacing: 8) {
            switch step {
            case .opening:
                MSButton(title: "Créer ma première campagne", icon: "sparkles") { go(to: .upload) }
            case .upload:
                EmptyView()
            case .analysis:
                EmptyView()
            case .goal:
                MSButton(title: "Continuer", isDisabled: goal == nil) { go(to: .platforms) }
            case .platforms:
                MSButton(title: "Continuer", isDisabled: platforms.isEmpty) { go(to: .socialProof) }
            case .socialProof:
                MSButton(title: "Continuer") { go(to: .style) }
            case .style:
                MSButton(title: "Construire ma campagne", icon: "sparkles", isDisabled: style == nil) { go(to: .generation) }
            case .generation:
                EmptyView()
            case .campaign:
                EmptyView()
            case .paywall:
                EmptyView()
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(
            LinearGradient(colors: [MSColor.bg.opacity(0), MSColor.bg, MSColor.bg], startPoint: .top, endPoint: .bottom)
                .frame(height: 90)
                .allowsHitTesting(false),
            alignment: .top
        )
    }

    // MARK: Navigation

    private func go(to next: Step) {
        MSHaptic.tap()
        forward = true
        withAnimation(MSAnimation.snappy) { step = next }
    }

    private func finish() {
        MSHaptic.success()
        store.completeOnboarding(buildAnswers())
    }

    private func buildAnswers() -> OnboardingAnswers {
        var a = OnboardingAnswers()
        a.goal = goal.map { [$0] } ?? []
        a.platforms = Array(platforms)
        a.style = style
        a.productName = product.name
        a.productCategory = product.category
        return a
    }

    // MARK: Content

    @ViewBuilder private var content: some View {
        switch step {
        case .opening: openingStep
        case .upload: uploadStep
        case .analysis: analysisStep
        case .goal: goalStep
        case .platforms: platformsStep
        case .socialProof: socialProofStep
        case .style: styleStep
        case .generation: generationStep
        case .campaign: campaignStep
        case .paywall: paywallStep
        }
    }

    // MARK: 1. Opening

    private var openingStep: some View {
        VStack(spacing: 0) {
            ShowcaseWall(names: ["temoignage-karite", "atelier-couture", "degustation-maquis"], height: 400)
            VStack(alignment: .leading, spacing: 14) {
                (Text("Transformez une photo en ")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundColor(MSColor.text)
                + Text("campagne complète.")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundColor(MSColor.highlight))

                Text("Photos produit, vidéos UGC, pubs et textes, générés pour votre marque en quelques minutes.")
                    .font(MSFont.body(15))
                    .foregroundStyle(MSColor.text2)

                HStack(spacing: 6) {
                    chainPill("photo.on.rectangle.angled", "Photo")
                    Image(systemName: "arrow.right").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                    chainPill("person.wave.2", "UGC")
                    Image(systemName: "arrow.right").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                    chainPill("megaphone", "Pub")
                    Image(systemName: "arrow.right").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                    chainPill("text.alignleft", "Texte")
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.top, 20)
        }
    }

    private func chainPill(_ icon: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.highlight)
                .frame(width: 38, height: 38).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Text(L(label)).font(MSFont.caption(10)).foregroundStyle(MSColor.text2)
        }
    }

    // MARK: 2. Upload

    private var uploadStep: some View {
        VStack(spacing: 24) {
            stepTitle("Que voulez-vous promouvoir ?", "Une seule photo suffit. L'IA s'occupe du reste.")

            PhotosPicker(selection: $photoItem, matching: .images) {
                VStack(spacing: 14) {
                    ZStack {
                        Circle().fill(MSColor.accent.opacity(0.15)).frame(width: 72, height: 72)
                        Image(systemName: "camera.fill").font(.system(size: 28, weight: .semibold)).foregroundStyle(MSColor.highlight)
                    }
                    Text("Prendre ou choisir une photo").font(MSFont.control(16)).foregroundStyle(MSColor.text)
                    Text("JPG, PNG ou HEIC").font(MSFont.caption(12)).foregroundStyle(MSColor.muted)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.accent.opacity(0.3), style: StrokeStyle(lineWidth: 2, dash: [8, 6])))
            }
            .buttonStyle(MSPressStyle())
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                        product.image = img
                        product.isSample = false
                        product.name = "Mon produit"
                        product.category = "Produit"
                        product.description = "Un produit soigné, prêt à être promu."
                        go(to: .analysis)
                    }
                }
            }

            Text("ou").font(MSFont.caption(13)).foregroundStyle(MSColor.muted).frame(maxWidth: .infinity, alignment: .center)

            Button {
                product = ProductInfo()
                go(to: .analysis)
            } label: {
                HStack(spacing: 10) {
                    RemoteImage(url: Catalog.sampleProducts.first?.url, cornerRadius: 8)
                        .frame(width: 44, height: 44)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Essayer avec un produit exemple").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        Text("Beurre de karité pur").font(MSFont.caption(12)).foregroundStyle(MSColor.muted)
                    }
                    Spacer()
                    Image(systemName: "arrow.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
                }
                .padding(14)
                .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
            }
            .buttonStyle(MSPressStyle())
        }
    }

    // MARK: 3. Analysis

    @State private var analysisProgress = 0

    private var analysisChecks: [String] {
        if product.isSample {
            return ["Produit détecté : cosmétique", "Type identifié : soin hydratant", "Ingrédient clé : karité", "Public cible : femmes 18–45", "4 styles de shooting possibles"]
        } else {
            return ["Produit détecté", "Catégorie identifiée", "Caractéristiques analysées", "Public cible estimé", "Opportunités créatives trouvées"]
        }
    }

    private var analysisStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 20)
            // Product preview
            ZStack {
                Circle().fill(MSColor.accent.opacity(0.08)).frame(width: 180, height: 180)
                if let img = product.image {
                    Image(uiImage: img).resizable().scaledToFill().frame(width: 140, height: 140)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(MSColor.accent.opacity(0.5), lineWidth: 2))
                } else {
                    RoundedRectangle(cornerRadius: 20, style: .continuous).fill(MSColor.elevated)
                        .frame(width: 140, height: 140)
                        .overlay(Image(systemName: "cube.box").font(.system(size: 40)).foregroundStyle(MSColor.muted))
                }
            }

            if analysisProgress < analysisChecks.count {
                HStack(spacing: 8) {
                    ProgressView().tint(MSColor.highlight)
                    Text("Analyse en cours…").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                }

                VStack(alignment: .leading, spacing: 10) {
                    ForEach(Array(analysisChecks.enumerated()), id: \.offset) { i, check in
                        HStack(spacing: 10) {
                            ZStack {
                                if i < analysisProgress {
                                    Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.onAccent)
                                        .frame(width: 24, height: 24).background(MSColor.accent, in: Circle())
                                } else if i == analysisProgress {
                                    ProgressView().tint(MSColor.highlight).scaleEffect(0.7).frame(width: 24, height: 24)
                                } else {
                                    Circle().fill(MSColor.elevated).frame(width: 24, height: 24)
                                }
                            }
                            Text(L(check)).font(MSFont.body(14)).foregroundStyle(i <= analysisProgress ? MSColor.text : MSColor.muted.opacity(0.4))
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 36)).foregroundStyle(MSColor.accent)
                    Text("Produit analysé").msHeadline(20)

                    VStack(alignment: .leading, spacing: 8) {
                        HStack { Text("Nom").font(MSFont.caption(12)).foregroundStyle(MSColor.muted); Spacer(); Text(L(product.name)).font(MSFont.control(14)).foregroundStyle(MSColor.text) }
                        Divider().foregroundStyle(MSColor.border)
                        HStack { Text("Catégorie").font(MSFont.caption(12)).foregroundStyle(MSColor.muted); Spacer(); Text(L(product.category)).font(MSFont.control(14)).foregroundStyle(MSColor.highlight) }
                        Divider().foregroundStyle(MSColor.border)
                        Text(L(product.description)).msBody(13)
                    }
                    .padding(14)
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))

                    MSButton(title: "C'est mon produit", icon: "arrow.right") { go(to: .goal) }
                        .padding(.top, 8)
                }
            }
        }
        .task(id: "analysis-\(step.rawValue)") {
            guard step == .analysis else { return }
            analysisProgress = 0
            for _ in analysisChecks {
                try? await Task.sleep(for: .milliseconds(600))
                guard step == .analysis else { return }
                withAnimation(MSAnimation.snappy) { analysisProgress += 1 }
            }
        }
    }

    // MARK: 4. Goal (no icons)

    private var goalStep: some View {
        VStack(spacing: 14) {
            stepTitle("Quel est votre objectif ?", "On optimise toute la campagne autour de lui.")
            ForEach(goalOptions, id: \.value) { g in
                Button {
                    MSHaptic.tap()
                    withAnimation(MSAnimation.snappy) { goal = g.value }
                } label: {
                    HStack(spacing: 12) {
                        Text(L(g.label)).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                        Spacer()
                        if goal == g.value {
                            Image(systemName: "checkmark.circle.fill").font(.system(size: 20)).foregroundStyle(MSColor.accent)
                        } else {
                            Circle().strokeBorder(MSColor.border, lineWidth: 1.5).frame(width: 20, height: 20)
                        }
                    }
                    .padding(16)
                    .background(goal == g.value ? MSColor.accent.opacity(0.10) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(goal == g.value ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                }
                .buttonStyle(MSPressStyle())
            }
        }
    }

    // MARK: 5. Platforms

    private var platformsStep: some View {
        VStack(spacing: 16) {
            stepTitle("Où vivra cette campagne ?", "Choisissez une ou plusieurs plateformes.")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(platformOptions, id: \.id) { p in
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) {
                            if platforms.contains(p.id) { platforms.remove(p.id) } else { platforms.insert(p.id) }
                        }
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: p.icon).font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(platforms.contains(p.id) ? MSColor.highlight : MSColor.muted)
                            Text(L(p.label)).font(MSFont.caption(11)).foregroundStyle(platforms.contains(p.id) ? MSColor.text : MSColor.text2)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 76)
                        .background(platforms.contains(p.id) ? MSColor.accent.opacity(0.12) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(platforms.contains(p.id) ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }

            if !platforms.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "sparkles").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.highlight).padding(.top, 2)
                    Text(L(platformFeedback)).font(MSFont.caption(13)).foregroundStyle(MSColor.text2)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(MSColor.accent.opacity(0.08), in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            }
        }
    }

    private var platformFeedback: String {
        let p = platforms
        if p.contains("WhatsApp") && p.count == 1 { return "Parfait. Je prépare des statuts 9:16, des fiches catalogue et un bouton « Commander sur WhatsApp »." }
        if p.contains("TikTok") || p.contains("Instagram") { return "Parfait. Formats verticaux courts optimisés pour \(p.sorted().joined(separator: ", "))." }
        return "Parfait. Chaque créa sera adaptée à \(p.sorted().joined(separator: ", "))."
    }

    // MARK: 6. Social proof

    @State private var reviewIndex = 0
    private let reviewTimer = Timer.publish(every: 3, on: .main, in: .common).autoconnect()

    private var socialProofStep: some View {
        VStack(spacing: 20) {
            stepTitle("Ils utilisent déjà Marketing Studio.", nil)

            TabView(selection: $reviewIndex) {
                ForEach(Array(socialProofItems.enumerated()), id: \.offset) { i, item in
                    VStack(alignment: .leading, spacing: 14) {
                        HStack(spacing: 4) {
                            ForEach(0..<5) { _ in
                                Image(systemName: "star.fill").font(.system(size: 14)).foregroundStyle(MSColor.accent)
                            }
                        }
                        Text("« \(item.2) »").font(MSFont.body(17)).foregroundStyle(MSColor.text).italic()
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                        HStack(spacing: 10) {
                            Circle().fill(MSColor.accent.opacity(0.18)).frame(width: 40, height: 40)
                                .overlay(Text(String(item.0.prefix(1))).font(.system(size: 16, weight: .bold)).foregroundStyle(MSColor.highlight))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(L(item.0)).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                Text(L(item.1)).font(MSFont.caption(12)).foregroundStyle(MSColor.muted)
                            }
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .padding(.horizontal, 2)
                    .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 250)
            .onReceive(reviewTimer) { _ in
                guard step == .socialProof else { return }
                withAnimation(.easeInOut(duration: 0.6)) { reviewIndex = (reviewIndex + 1) % socialProofItems.count }
            }

            HStack(spacing: 6) {
                ForEach(0..<socialProofItems.count, id: \.self) { i in
                    Capsule().fill(i == reviewIndex ? MSColor.accent : MSColor.muted.opacity(0.35))
                        .frame(width: i == reviewIndex ? 18 : 6, height: 6)
                }
            }
            .animation(MSAnimation.snappy, value: reviewIndex)

            HStack(spacing: 8) {
                Image(systemName: "person.3.fill").font(.system(size: 14)).foregroundStyle(MSColor.highlight)
                Text("+2 400 commerçants en Afrique de l'Ouest").font(MSFont.control(13)).foregroundStyle(MSColor.text2)
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    // MARK: 8. Style

    private var styleStep: some View {
        VStack(spacing: 16) {
            stepTitle("Quelle sensation pour votre marque ?", "La direction créative de toute la campagne.")

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(styleOptions, id: \.value) { s in
                    let on = style == s.value
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { style = s.value }
                    } label: {
                        VStack(alignment: .leading, spacing: 0) {
                            Color.clear
                                .aspectRatio(1, contentMode: .fit)
                                .overlay { StyleVisual(style: s.value) }
                                .clipped()
                            VStack(alignment: .leading, spacing: 2) {
                                Text(L(s.label)).font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
                                Text(L(s.tags)).font(MSFont.caption(11)).foregroundStyle(MSColor.muted).lineLimit(1)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .background(MSColor.card)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: on ? 2 : 1))
                        .overlay(alignment: .topTrailing) {
                            if on {
                                Image(systemName: "checkmark.circle.fill").font(.system(size: 22))
                                    .foregroundStyle(MSColor.onAccent, MSColor.accent)
                                    .padding(8)
                            }
                        }
                    }
                    .buttonStyle(MSPressStyle())
                }
            }

            Button {
                MSHaptic.tap()
                withAnimation(MSAnimation.snappy) { style = "surprise" }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "dice").font(.system(size: 15, weight: .semibold))
                    Text("Surprenez-moi").font(MSFont.control(15))
                }
                .foregroundStyle(style == "surprise" ? MSColor.onAccent : MSColor.text)
                .frame(maxWidth: .infinity).frame(height: 48)
                .background(style == "surprise" ? MSColor.accent : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(style == "surprise" ? MSColor.accent : MSColor.border, lineWidth: 1))
            }
            .buttonStyle(MSPressStyle())
        }
    }

    // MARK: 10. Generation

    @State private var genProgress = 0
    @State private var genSpin = false
    @State private var genPulse = false

    private var generationStep: some View {
        VStack(spacing: 28) {
            Spacer().frame(height: 40)
            ZStack {
                Circle().fill(MSColor.accent.opacity(genPulse ? 0.22 : 0.08)).frame(width: 220, height: 220).blur(radius: 30)
                Circle()
                    .trim(from: 0, to: 0.72)
                    .stroke(AngularGradient(colors: [MSColor.accent.opacity(0), MSColor.accent], center: .center), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 168, height: 168)
                    .rotationEffect(.degrees(genSpin ? 360 : 0))
                Circle()
                    .trim(from: 0, to: CGFloat(genProgress) / CGFloat(genSteps.count))
                    .stroke(MSColor.accent.opacity(0.35), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .frame(width: 196, height: 196)
                    .rotationEffect(.degrees(-90))
                MSBrandMark(size: 88)
                    .shadow(color: MSColor.accent.opacity(0.55), radius: genPulse ? 28 : 10)
                    .scaleEffect(genPulse ? 1.06 : 0.94)
            }
            .frame(height: 230)

            VStack(spacing: 8) {
                Text("Construction de votre campagne…").msHeadline(20)
                Text(genSteps[min(genProgress, genSteps.count - 1)])
                    .font(MSFont.body(15)).foregroundStyle(MSColor.highlight)
                    .id(genProgress)
                    .transition(.asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .move(edge: .top).combined(with: .opacity)))
                Text("\(Int(Double(genProgress) / Double(genSteps.count) * 100)) %")
                    .font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.muted)
                    .contentTransition(.numericText())
            }
            .frame(maxWidth: .infinity)
        }
        .onAppear {
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) { genSpin = true }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { genPulse = true }
        }
        .task(id: "gen-\(step.rawValue)") {
            guard step == .generation else { return }
            genProgress = 0
            for _ in genSteps {
                try? await Task.sleep(for: .milliseconds(600))
                guard step == .generation else { return }
                withAnimation(MSAnimation.snappy) { genProgress += 1 }
            }
            try? await Task.sleep(for: .milliseconds(400))
            guard step == .generation else { return }
            go(to: .campaign)
        }
    }

    private var goalLabel: String {
        goalOptions.first { $0.value == goal }?.label ?? "Marketing"
    }

    // MARK: Campaign ready (teaser built from the user's own photo, blurred until unlocked)

    private var campaignStep: some View {
        VStack(spacing: 18) {
            stepTitle("Votre campagne est prête.", "Photos, vidéo UGC, pubs et textes pour \(product.name).")

            Color.clear
                .aspectRatio(4.0/5.0, contentMode: .fit)
                .overlay {
                    Group {
                        if let img = product.image {
                            Image(uiImage: img).resizable().scaledToFill()
                        } else {
                            RemoteImage(url: Catalog.sampleProducts.first?.url, cornerRadius: 0)
                        }
                    }
                    .scaleEffect(1.2)
                    .blur(radius: 18)
                }
                .overlay(LinearGradient(colors: [.black.opacity(0.1), .black.opacity(0.55)], startPoint: .top, endPoint: .bottom))
                .overlay {
                    VStack(spacing: 12) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 30, weight: .bold)).foregroundStyle(MSColor.onAccent)
                            .frame(width: 72, height: 72)
                            .background(MSColor.accent, in: Circle())
                            .shadow(color: MSColor.accent.opacity(0.6), radius: 24)
                        Text("Contenu verrouillé").font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(.white)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.accent.opacity(0.4), lineWidth: 1))

            MSButton(title: "Débloquer ma campagne", icon: "lock.open") { go(to: .paywall) }
        }
    }

    // MARK: 16. Paywall (locks the app)

    private var paywallStep: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 10)

            VStack(spacing: 8) {
                Image(systemName: "lock.open.fill").font(.system(size: 36)).foregroundStyle(MSColor.accent)
                Text("Débloquez votre campagne").msHeadline(24)
                Text("Choisissez un pack de crédits pour accéder à votre espace et générer vos contenus.").font(MSFont.body(14)).foregroundStyle(MSColor.text2).multilineTextAlignment(.center)
            }

            ForEach(Market.usagePacks, id: \.id) { pack in
                Button {
                    MSHaptic.tap()
                    // Open web payment flow
                    if let url = URL(string: "\(SokoziaConfig.siteURL.absoluteString)/credits") {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    HStack(spacing: 14) {
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 6) {
                                Text(L(pack.name)).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                if pack.popular {
                                    Text("POPULAIRE").font(.system(size: 9, weight: .bold)).tracking(0.5)
                                        .foregroundStyle(MSColor.onAccent)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(MSColor.accent, in: Capsule())
                                }
                            }
                            Text("\(pack.credits) crédits · \(pack.pitch)").font(MSFont.caption(12)).foregroundStyle(MSColor.muted)
                        }
                        Spacer()
                        Text("\(pack.priceXof) FCFA").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(MSColor.highlight)
                    }
                    .padding(14)
                    .background(pack.popular ? MSColor.accent.opacity(0.10) : MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(pack.popular ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                }
                .buttonStyle(MSPressStyle())
            }

            Divider().foregroundStyle(MSColor.border).padding(.vertical, 4)

            Button {
                MSHaptic.tap()
                finish()
            } label: {
                Text("Continuer avec \(SokoziaConfig.welcomeCredits) crédits offerts")
                    .font(MSFont.control(14)).foregroundStyle(MSColor.text2)
            }

            Text("Vous pourrez recharger en Mobile Money à tout moment, sans abonnement.")
                .font(MSFont.caption(12)).foregroundStyle(MSColor.muted).multilineTextAlignment(.center)
        }
    }

    // MARK: Helpers

    private func stepTitle(_ t: String, _ subtitle: String?) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(L(t)).font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
            if let subtitle { Text(L(subtitle)).font(MSFont.body(15)).foregroundStyle(MSColor.text2) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 4)
    }
}


/// Welcome screen shown the very first time the app is opened (before sign-in).
struct WelcomeOpening: View {
    var onContinue: () -> Void
    @State private var launching = false
    @State private var markVisible = false

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                HStack {
                    MSBrandMark(size: 48)
                }
                .padding(.top, 8)

                Spacer(minLength: 16)

                VideoMarquee(cardWidth: min(360, max(220, geometry.size.height * 0.46)) * 9 / 16)

                Spacer(minLength: 24)

                VStack(spacing: 12) {
                    (Text("Transformez une photo en ")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(MSColor.text)
                    + Text("campagne complète.")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(MSColor.highlight))
                    .multilineTextAlignment(.center)

                    Text("Photos produit, vidéos UGC, pubs et textes, générés pour votre marque en quelques minutes.")
                        .font(MSFont.body(14))
                        .foregroundStyle(MSColor.text2)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 24)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(MSColor.bg.ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            MSButton(title: "Commencer", isDisabled: launching) { startOnboarding() }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 12)
                .padding(.bottom, 12)
                .background(MSColor.bg)
        }
        .overlay {
            if launching {
                ZStack {
                    MSColor.bg.opacity(0.96).ignoresSafeArea()
                    RadialGradient(
                        colors: [MSColor.accent.opacity(0.24), .clear],
                        center: .center,
                        startRadius: 8,
                        endRadius: 220
                    )
                    .ignoresSafeArea()
                    MSBrandMark(size: 112)
                        .shadow(color: MSColor.accent.opacity(0.65), radius: markVisible ? 32 : 4)
                        .scaleEffect(markVisible ? 1 : 0.42)
                        .opacity(markVisible ? 1 : 0)
                }
                .transition(.opacity)
            }
        }
        .animation(MSAnimation.slow, value: launching)
        .animation(.spring(response: 0.52, dampingFraction: 0.68), value: markVisible)
    }

    private func startOnboarding() {
        guard !launching else { return }
        MSHaptic.success()
        launching = true
        markVisible = false
        DispatchQueue.main.async {
            withAnimation(.spring(response: 0.52, dampingFraction: 0.68)) { markVisible = true }
        }
        Task {
            if !MSAnimation.reduced { try? await Task.sleep(for: .milliseconds(780)) }
            guard !Task.isCancelled else { return }
            onContinue()
        }
    }
}


/// Searchable list of every African country.
struct CountryPickerSheet: View {
    var selection: String
    var onPick: (Market.Country) -> Void
    @State private var query = ""

    private var filtered: [Market.Country] {
        let q = query.trimmingCharacters(in: .whitespaces).folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        guard !q.isEmpty else { return Market.countries }
        return Market.countries.filter { $0.name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current).contains(q) }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { c in
                Button { MSHaptic.tap(); onPick(c) } label: {
                    HStack(spacing: 12) {
                        Text(L(c.flag)).font(.system(size: 24))
                        Text(L(c.name)).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                        Spacer()
                        if c.code == selection { Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.accent) }
                    }
                }
                .listRowBackground(c.code == selection ? MSColor.accent.opacity(0.10) : MSColor.card)
            }
            .scrollContentBackground(.hidden)
            .background(MSColor.bg)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Rechercher un pays")
            .navigationTitle("Votre pays")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}


/// Brand-feel tile. Drop a Canva export named "style-<value>" (e.g. style-luxe) into Assets to replace the drawn tile.
private struct StyleVisual: View {
    let style: String

    private var look: (colors: [Color], icon: String) {
        switch style {
        case "luxe": return ([Color(hex: 0x1A1408), Color(hex: 0xC9A24B)], "crown.fill")
        case "epure": return ([Color(hex: 0xEDEDED), Color(hex: 0xBFC3C7)], "circle.dotted")
        case "ugc": return ([Color(hex: 0x2B1A3A), Color(hex: 0xE76F51)], "person.wave.2.fill")
        default: return ([Color(hex: 0xFF3D7F), Color(hex: 0xFFB800)], "bolt.fill")
        }
    }

    var body: some View {
        if let img = UIImage(named: "style-\(style)") {
            Image(uiImage: img).resizable().scaledToFill()
        } else {
            ZStack {
                LinearGradient(colors: look.colors, startPoint: .topLeading, endPoint: .bottomTrailing)
                Image(systemName: look.icon)
                    .font(.system(size: 40, weight: .semibold))
                    .foregroundStyle(style == "epure" ? Color.black.opacity(0.55) : Color.white.opacity(0.9))
            }
        }
    }
}
