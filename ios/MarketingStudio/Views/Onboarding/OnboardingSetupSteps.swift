import SwiftUI
import PhotosUI

// MARK: 1. Opening

struct OnboardingOpeningView: View {
    @ObservedObject var model: OnboardingModel
    @State private var stage = 0
    private let stages: [(String, String)] = [
        ("shippingbox.fill", "Produit"),
        ("camera.fill", "Photo produit"),
        ("person.crop.rectangle.fill", "Vidéo UGC"),
        ("megaphone.fill", "Pub"),
        ("bubble.left.and.bubble.right.fill", "Post social"),
        ("sparkles", "Campagne"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 6, style: .continuous).fill(MSColor.accentGradient).frame(width: 22, height: 22)
                Text("Sokozia").font(.system(size: 15, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text)
                Spacer()
            }
            .msGutter().padding(.top, 12)

            Spacer(minLength: 12)
            transformation
            Spacer(minLength: 12)

            VStack(alignment: .leading, spacing: 12) {
                Text("Transformez une photo produit en campagne complète.").msTitle(32)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Photos produit, vidéos UGC, pubs et textes, générés pour votre marque en quelques minutes.")
                    .msBody(16).fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .msGutter()

            VStack(spacing: 10) {
                MSButton(title: "Créer ma première campagne →") { model.go(.upload) }
                Button {
                    model.hasAccount = true
                    model.go(.account)
                } label: {
                    Text("J'ai déjà un compte").font(MSFont.control(14)).foregroundStyle(MSColor.text2)
                }
                .padding(.vertical, 6)
            }
            .msGutter().padding(.top, 24).padding(.bottom, 12)
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_100_000_000)
                withAnimation(MSAnimation.snappy) { stage = (stage + 1) % stages.count }
            }
        }
    }

    private var transformation: some View {
        VStack(spacing: 18) {
            ZStack {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(LinearGradient(colors: [MSColor.accent.opacity(0.35), MSColor.accent2.opacity(0.08)],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 200, height: 230)
                RemoteImage(url: OnboardingSamples.all[stage % OnboardingSamples.all.count], cornerRadius: 22)
                    .frame(width: 176, height: 206)
                    .id(stage)
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
                VStack {
                    Spacer()
                    HStack(spacing: 6) {
                        Image(systemName: stages[stage].0).font(.system(size: 12, weight: .semibold))
                        Text(stages[stage].1).font(MSFont.caption(13))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.bottom, 14)
                }
                .frame(width: 200, height: 230)
            }
            HStack(spacing: 6) {
                ForEach(0..<stages.count, id: \.self) { i in
                    Image(systemName: stages[i].0)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(i <= stage ? MSColor.highlight : MSColor.muted)
                        .frame(width: 30, height: 30)
                        .background(i == stage ? MSColor.accent.opacity(0.18) : MSColor.card, in: Circle())
                    if i < stages.count - 1 {
                        Image(systemName: "arrow.right").font(.system(size: 8)).foregroundStyle(MSColor.muted)
                    }
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Un produit devient photo produit, vidéo UGC, pub, post social puis campagne")
    }
}

// MARK: 2. Upload

struct OnboardingUploadView: View {
    @ObservedObject var model: OnboardingModel
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Que voulez-vous promouvoir ?",
                               subtitle: "Une seule photo suffit. Sokozia s'occupe du reste.")
            PhotosPicker(selection: $pickerItem, matching: .images) {
                ZStack {
                    RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous)
                        .fill(MSColor.card)
                    RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous)
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6, 5]))
                        .foregroundStyle(MSColor.accent.opacity(0.6))
                    VStack(spacing: 12) {
                        Image(systemName: "photo.badge.plus").font(.system(size: 34, weight: .medium)).foregroundStyle(MSColor.highlight)
                        Text("Ajoutez la photo de votre produit").msHeadline(17)
                        Text("JPG, PNG ou HEIC · fond simple recommandé").msCaption()
                    }
                }
                .frame(height: 240)
            }
            .buttonStyle(MSPressStyle())

            PhotosPicker(selection: $pickerItem, matching: .images) {
                HStack(spacing: 8) {
                    Image(systemName: "iphone")
                    Text("Choisir depuis l'appareil")
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(MSColor.text)
                .frame(maxWidth: .infinity).frame(height: 50)
                .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
            }
            .buttonStyle(MSPressStyle())

            HStack { Rectangle().fill(MSColor.border).frame(height: 1); Text("ou").msCaption(); Rectangle().fill(MSColor.border).frame(height: 1) }

            Button {
                MSHaptic.tap()
                model.useSample()
                model.go(.analysis)
            } label: {
                HStack(spacing: 14) {
                    RemoteImage(url: OnboardingSamples.productShot1, cornerRadius: MSRadius.sm).frame(width: 52, height: 52)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Utiliser un produit exemple").font(MSFont.headline(16)).foregroundStyle(MSColor.text)
                        Text("Essayez avec Luma Glow Serum, sans photo").msCaption()
                    }
                    Spacer()
                    Image(systemName: "arrow.right").foregroundStyle(MSColor.highlight)
                }
                .msCard(padding: 12)
            }
            .buttonStyle(MSPressStyle())
            Spacer(minLength: 0)
        }
        .onChange(of: pickerItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                    model.setPhoto(img)
                    model.go(.analysis)
                }
            }
        }
    }
}

// MARK: 3. Analysis

struct OnboardingAnalysisView: View {
    @ObservedObject var model: OnboardingModel
    @State private var found = false
    @State private var editing = false

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            if !found {
                ProductVisual(model: model).frame(height: 220).frame(maxWidth: .infinity)
                    .overlay(ScanLine())
                Text("Analyse du produit…").msTitle(26)
                AnimatedChecklist(items: ["Produit détecté", "Catégorie identifiée", "Caractéristiques visuelles analysées",
                                          "Composition comprise", "Opportunités créatives trouvées"], interval: 0.6) {
                    withAnimation(MSAnimation.slow) { found = true }
                    MSHaptic.success()
                }
            } else {
                Text("Je l'ai trouvé.").msTitle(30)
                VStack(alignment: .leading, spacing: 14) {
                    ProductVisual(model: model).frame(height: 240)
                    if editing {
                        MSTextField(placeholder: "Nom du produit", text: $model.productName)
                        MSTextField(placeholder: "Catégorie", text: $model.productCategory)
                        MSTextField(placeholder: "Description", text: $model.productDescription)
                    } else {
                        Text(model.productName).msHeadline(22)
                        MSBadge(text: model.productCategory)
                        Text(model.productDescription).msBody(15)
                    }
                }
                .msCard()
                Spacer(minLength: 0)
                Text("C'est correct ?").msHeadline(17)
                MSButton(title: "C'est bon →") { model.next() }
                Button { withAnimation { editing.toggle() } } label: {
                    Text(editing ? "Terminer la modification" : "Modifier les détails")
                        .font(MSFont.control(14)).foregroundStyle(MSColor.text2).frame(maxWidth: .infinity)
                }
            }
        }
    }
}

private struct ScanLine: View {
    @State private var y: CGFloat = 0
    var body: some View {
        GeometryReader { geo in
            Rectangle()
                .fill(LinearGradient(colors: [.clear, MSColor.highlight.opacity(0.7), .clear], startPoint: .leading, endPoint: .trailing))
                .frame(height: 2)
                .shadow(color: MSColor.accent, radius: 8)
                .offset(y: y * geo.size.height)
                .onAppear {
                    withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) { y = 1 }
                }
        }
        .allowsHitTesting(false)
    }
}

// MARK: 4. Goal

struct OnboardingGoalView: View {
    @ObservedObject var model: OnboardingModel
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Quel est votre objectif ?", subtitle: "Pour \(model.productName).")
            VStack(spacing: 10) {
                ForEach(OnboardingGoal.allCases) { g in
                    OnboardingSelectCard(title: g.label, selected: model.goal == g) {
                        Image(systemName: g.icon).font(.system(size: 22, weight: .semibold)).foregroundStyle(MSColor.accent).frame(width: 40)
                    } action: {
                        model.goal = g
                        Task {
                            try? await Task.sleep(nanoseconds: 300_000_000)
                            model.next()
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: 5. Platforms

struct OnboardingPlatformsView: View {
    @ObservedObject var model: OnboardingModel
    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Où vivra cette campagne ?", subtitle: "Sélectionnez une ou plusieurs plateformes.")
            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(OnboardingPlatform.allCases) { p in
                    let on = model.platforms.contains(p)
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) {
                            if on { model.platforms.remove(p) } else { model.platforms.insert(p) }
                        }
                    } label: {
                        VStack(spacing: 10) {
                            Image(systemName: p.icon).font(.system(size: 24, weight: .medium))
                                .foregroundStyle(on ? MSColor.highlight : MSColor.text2)
                            Text(p.label).font(MSFont.headline(15)).foregroundStyle(MSColor.text)
                        }
                        .frame(maxWidth: .infinity).frame(height: 96)
                        .background(on ? MSColor.accent.opacity(0.12) : MSColor.card,
                                    in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous)
                            .strokeBorder(on ? MSColor.accent : MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                    .accessibilityAddTraits(on ? .isSelected : [])
                }
            }
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "sparkles").foregroundStyle(MSColor.highlight)
                Text(model.platformFeedback).msBody(14, color: MSColor.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .msElevated(padding: 14)
            .animation(MSAnimation.gentle, value: model.platforms)
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right", isDisabled: model.platforms.isEmpty) { model.next() }
        }
    }
}

// MARK: 6. Creative direction

struct OnboardingDirectionView: View {
    @ObservedObject var model: OnboardingModel
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                OnboardingHeadline(title: "Quelle sensation pour votre marque ?")
                ForEach(CreativeDirection.allCases.filter { $0 != .surprise }) { d in
                    Button {
                        MSHaptic.tap()
                        model.direction = d
                        advance()
                    } label: {
                        ZStack(alignment: .bottomLeading) {
                            LinearGradient(colors: d.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                            HStack {
                                Spacer()
                                ProductVisual(model: model, cornerRadius: MSRadius.md)
                                    .frame(width: 84, height: 84)
                                    .shadow(color: .black.opacity(0.35), radius: 10, y: 6)
                                    .padding(16)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(d.title).font(.system(size: 22, weight: .heavy, design: .rounded)).tracking(1.5)
                                Text(d.tags).font(MSFont.caption(13)).opacity(0.85)
                            }
                            .foregroundStyle(d == .epure ? Color.black : Color.white)
                            .padding(16)
                        }
                        .frame(height: 116)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous)
                            .strokeBorder(model.direction == d ? MSColor.highlight : MSColor.border, lineWidth: model.direction == d ? 2 : 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
                MSButton(title: "Surprenez-moi", style: .secondary) {
                    model.direction = .surprise
                    advance()
                }
            }
            .padding(.bottom, 12)
        }
    }

    private func advance() {
        Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            model.next()
        }
    }
}

// MARK: 7. Brand

struct OnboardingBrandView: View {
    @ObservedObject var model: OnboardingModel
    @State private var pickerItem: PhotosPickerItem?
    @State private var analysing = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Personnalisez-la.",
                               subtitle: "Ajoutez votre logo ou votre charte pour que chaque contenu vous ressemble. Optionnel.")
            if model.brandUploaded || analysing {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 10) {
                        Image(systemName: "paintpalette.fill").foregroundStyle(MSColor.highlight)
                        Text("Kit de marque").msHeadline(16)
                    }
                    if model.brandUploaded {
                        ForEach(["Logo détecté", "Couleurs détectées", "Ton identifié"], id: \.self) { s in
                            Label(s, systemImage: "checkmark.circle.fill").foregroundStyle(MSColor.success)
                                .font(MSFont.body(15))
                        }
                        HStack(spacing: 8) {
                            ForEach([0xA855F7, 0xF5E6D3, 0x1C1C1C, 0xE8B86D], id: \.self) { c in
                                Circle().fill(Color(hex: UInt(c))).frame(width: 28, height: 28)
                                    .overlay(Circle().strokeBorder(MSColor.borderStrong, lineWidth: 1))
                            }
                        }
                    } else {
                        AnimatedChecklist(items: ["Logo détecté", "Couleurs détectées", "Ton identifié"], interval: 0.55) {
                            withAnimation { model.brandUploaded = true; analysing = false }
                        }
                    }
                }
                .msCard()
            } else {
                PhotosPicker(selection: $pickerItem, matching: .images) {
                    VStack(spacing: 12) {
                        Image(systemName: "square.and.arrow.up").font(.system(size: 28)).foregroundStyle(MSColor.highlight)
                        Text("Importer mon kit de marque").msHeadline(16)
                        Text("Logo, couleurs, typographies").msCaption()
                    }
                    .frame(maxWidth: .infinity).frame(height: 180)
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous)
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6, 5])).foregroundStyle(MSColor.borderStrong))
                }
                .buttonStyle(MSPressStyle())
            }
            Spacer(minLength: 0)
            if model.brandUploaded {
                MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
            } else if !analysing {
                MSButton(title: "Je le ferai plus tard", style: .secondary) { model.next() }
            }
        }
        .onChange(of: pickerItem) { _, item in
            if item != nil { withAnimation { analysing = true } }
        }
    }
}

// MARK: 8. Boldness

struct OnboardingBoldnessView: View {
    @ObservedObject var model: OnboardingModel
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Jusqu'où on ose ?", subtitle: "Vous pourrez toujours ajuster ensuite.")
            VStack(spacing: 10) {
                ForEach(Boldness.allCases) { b in
                    OnboardingSelectCard(title: b.title, subtitle: b.subtitle, selected: model.boldness == b) {
                        Image(systemName: b.icon).font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(MSColor.highlight)
                            .frame(width: 40, height: 40)
                            .background(MSColor.accent.opacity(0.12), in: Circle())
                    } action: { model.boldness = b }
                }
            }
            Spacer(minLength: 0)
            MSButton(title: "Construire ma campagne →") { model.next() }
        }
    }
}
