import SwiftUI

// MARK: 9. Generation

struct OnboardingGenerationView: View {
    @ObservedObject var model: OnboardingModel
    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Spacer(minLength: 0)
            HStack(spacing: 14) {
                ProductVisual(model: model, cornerRadius: MSRadius.md).frame(width: 64, height: 64)
                VStack(alignment: .leading, spacing: 4) {
                    Text(model.productName).msHeadline(16)
                    Text("\(model.direction?.title ?? "ÉPURÉ") · \(model.boldness.title)").msCaption()
                }
            }
            Text("Construction de votre campagne…").msTitle(28)
            AnimatedChecklist(items: ["Analyse du produit", "Direction créative", "Photos produit", "Accroches",
                                      "Concept UGC", "Textes pub", "Variantes par plateforme", "Préparation de la campagne"],
                              interval: 0.65) {
                MSHaptic.success()
                model.next()
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: 10. Photos

struct OnboardingPhotosView: View {
    @ObservedObject var model: OnboardingModel
    @State private var added = false
    private let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            OnboardingHeadline(title: "Votre produit vient d'avoir son shooting.", subtitle: "Sans photographe.")
            LazyVGrid(columns: columns, spacing: 10) {
                ProductVisual(model: model, cornerRadius: MSRadius.lg).frame(height: 190)
                ForEach(OnboardingSamples.all.dropFirst().map { $0 }, id: \.self) { url in
                    RemoteImage(url: url, cornerRadius: MSRadius.lg).frame(height: 190)
                }
            }
            HStack(spacing: 8) {
                MSButton(title: "Modifier", icon: "slider.horizontal.3", style: .secondary, size: .compact) {}
                MSButton(title: "Générer plus", icon: "sparkles", style: .secondary, size: .compact) {}
            }
            MSButton(title: added ? "Ajouté à la campagne ✓" : "Ajouter à la campagne", icon: added ? nil : "plus") {
                if added { model.next() } else { withAnimation { added = true }; MSHaptic.success() }
            }
            if added {
                Button { model.next() } label: {
                    Text("Voir la suite →").font(MSFont.control(14)).foregroundStyle(MSColor.highlight).frame(maxWidth: .infinity)
                }
            }
        }
    }
}

// MARK: 11. UGC

struct OnboardingUGCView: View {
    @ObservedObject var model: OnboardingModel
    @State private var creator = 0
    private let creators = [("Maya", "Lifestyle", OnboardingSamples.peopleShot1),
                            ("Inès", "Beauté", OnboardingSamples.peopleShot2)]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            OnboardingHeadline(title: "Maintenant, rendons-le humain.")
            HStack {
                Spacer()
                ZStack(alignment: .bottomLeading) {
                    RemoteImage(url: creators[creator].2, cornerRadius: MSRadius.xl)
                        .id(creator)
                    LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .center, endPoint: .bottom)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.xl, style: .continuous))
                    Image(systemName: "play.circle.fill").font(.system(size: 48)).foregroundStyle(.white.opacity(0.9))
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    VStack(alignment: .leading, spacing: 6) {
                        MSBadge(text: "\(creators[creator].0) · \(creators[creator].1)", tone: .overlay, icon: "person.fill")
                        Text("« Ok, je teste ce sérum depuis une semaine… »")
                            .font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                    }
                    .padding(14)
                }
                .frame(width: 230, height: 380)
                Spacer()
            }
            Text("Concept UGC 15 s · TikTok / Reels").msCaption().frame(maxWidth: .infinity)
            Spacer(minLength: 0)
            MSButton(title: "Générer un autre créateur", icon: "arrow.triangle.2.circlepath", style: .secondary) {
                withAnimation(MSAnimation.snappy) { creator = (creator + 1) % creators.count }
            }
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
    }
}

// MARK: 12. Ads

struct OnboardingAdsView: View {
    @ObservedObject var model: OnboardingModel
    private let ads: [(String, String, String, String, String, String)] = [
        ("A", OnboardingSamples.productShot2, "L'éclat en 7 jours.", "Votre routine mérite un sérum qui tient ses promesses. Testé, adopté, approuvé.", "Acheter", "Instagram · Facebook"),
        ("B", OnboardingSamples.peopleShot1, "Elles ne s'en passent plus.", "Plus de 2 000 avis 5 étoiles. Découvrez pourquoi.", "Découvrir", "TikTok · Reels"),
        ("C", OnboardingSamples.peopleShot2, "-20 % cette semaine", "Offre de lancement : votre teint lumineux, à petit prix.", "En profiter", "Facebook · Google"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            OnboardingHeadline(title: "Votre produit mérite plus d'une pub.")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ads, id: \.0) { ad in
                        VStack(alignment: .leading, spacing: 10) {
                            ZStack(alignment: .topLeading) {
                                RemoteImage(url: ad.1, cornerRadius: MSRadius.md).frame(height: 200)
                                MSBadge(text: "Créa \(ad.0)", tone: .overlay).padding(8)
                            }
                            Text(ad.2).msHeadline(16)
                            Text(ad.3).msBody(13).lineLimit(3).fixedSize(horizontal: false, vertical: true)
                            HStack {
                                Text(ad.4).font(MSFont.caption(12)).foregroundStyle(.white)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .background(MSColor.accentGradient, in: Capsule())
                                Spacer()
                            }
                            Text(ad.5).msCaption()
                        }
                        .frame(width: 230)
                        .msCard(padding: 12)
                    }
                }
            }
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
    }
}

// MARK: 13. Copy

struct OnboardingCopyView: View {
    @ObservedObject var model: OnboardingModel
    @State private var copied: String?

    private var blocks: [(String, String)] {
        [("Accroche", "Et si votre teint brillait enfin sans filtre ?"),
         ("Légende", "7 jours, 1 sérum, 0 filtre. \(model.productName) révèle votre éclat naturel. #routinebeauté"),
         ("Script UGC", "« Ok, je teste ce sérum depuis une semaine… et honnêtement ? Regardez ma peau. »"),
         ("Description produit", model.productDescription)]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                OnboardingHeadline(title: "Votre campagne a une voix.")
                ForEach(blocks, id: \.0) { b in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(b.0.uppercased()).font(MSFont.caption(11)).tracking(1).foregroundStyle(MSColor.highlight)
                        Text(b.1).msBody(15, color: MSColor.text).fixedSize(horizontal: false, vertical: true)
                        HStack(spacing: 16) {
                            Button {
                                UIPasteboard.general.string = b.1
                                MSHaptic.success()
                                copied = b.0
                            } label: { Label(copied == b.0 ? "Copié" : "Copier", systemImage: copied == b.0 ? "checkmark" : "doc.on.doc") }
                            Button {} label: { Label("Régénérer", systemImage: "arrow.clockwise") }
                            Button {} label: { Label("Modifier", systemImage: "pencil") }
                        }
                        .font(MSFont.caption(12)).foregroundStyle(MSColor.text2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .msCard()
                }
                MSButton(title: "Voir ma campagne", icon: "arrow.right") { model.next() }
            }
            .padding(.bottom, 12)
        }
    }
}

// MARK: 14. Summary

struct OnboardingSummaryView: View {
    @ObservedObject var model: OnboardingModel
    static let rows: [(String, String, Int)] = [
        ("camera", "Photos produit", 4), ("video", "Vidéos UGC", 2), ("rectangle.stack", "Variantes pub", 6),
        ("bubble.left.and.bubble.right", "Posts sociaux", 8), ("text.quote", "Accroches", 12),
        ("text.alignleft", "Légendes", 6), ("doc.text", "Textes produit", 3),
    ]
    @State private var shown = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            OnboardingHeadline(title: "Votre campagne est prête.")
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    ProductVisual(model: model, cornerRadius: MSRadius.sm).frame(width: 44, height: 44)
                    VStack(alignment: .leading) {
                        Text(model.productName).msHeadline(16)
                        Text("Campagne · \(model.platforms.count) plateformes").msCaption()
                    }
                    Spacer()
                }
                .padding(.bottom, 12)
                ForEach(Array(Self.rows.enumerated()), id: \.offset) { i, r in
                    HStack {
                        Image(systemName: r.0).foregroundStyle(MSColor.highlight).frame(width: 24)
                        Text(r.1).msBody(15, color: MSColor.text)
                        Spacer()
                        Text("\(r.2)").font(MSFont.headline(16)).foregroundStyle(MSColor.text)
                    }
                    .padding(.vertical, 8)
                    .opacity(i < shown ? 1 : 0)
                    .offset(y: i < shown ? 0 : 8)
                }
                Divider().overlay(MSColor.border).padding(.vertical, 6)
                HStack {
                    Text("TOTAL").font(MSFont.caption(13)).tracking(1).foregroundStyle(MSColor.text2)
                    Spacer()
                    Text("41 contenus").msTitle(24)
                }
            }
            .msCard()
            Text("Une photo produit. Une campagne.").msHeadline(17).frame(maxWidth: .infinity)
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
        .task {
            for i in 1...Self.rows.count {
                try? await Task.sleep(nanoseconds: 180_000_000)
                withAnimation(MSAnimation.snappy) { shown = i }
            }
        }
    }
}

// MARK: 15. Platform formats

struct OnboardingFormatsView: View {
    @ObservedObject var model: OnboardingModel
    private let formats: [(String, String, CGFloat, String)] = [
        ("TikTok", "9:16", 9.0 / 16.0, OnboardingSamples.peopleShot1),
        ("Instagram", "9:16", 9.0 / 16.0, OnboardingSamples.productShot2),
        ("YouTube", "16:9", 16.0 / 9.0, OnboardingSamples.peopleShot2),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Un format pour chaque plateforme.",
                               subtitle: "Chaque créa est préparée pour la plateforme ciblée.")
            VStack(spacing: 6) {
                ProductVisual(model: model, cornerRadius: MSRadius.md).frame(width: 72, height: 72)
                Text("Votre campagne").msCaption()
                Image(systemName: "arrow.triangle.branch").font(.system(size: 22)).foregroundStyle(MSColor.highlight)
                    .rotationEffect(.degrees(180))
            }
            .frame(maxWidth: .infinity)
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(formats.prefix(2), id: \.0) { f in formatCard(f).frame(height: 200) }
            }
            formatCard(formats[2]).frame(height: 150)
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
    }

    private func formatCard(_ f: (String, String, CGFloat, String)) -> some View {
        ZStack(alignment: .topLeading) {
            RemoteImage(url: f.3, cornerRadius: MSRadius.md)
            MSBadge(text: "\(f.0) · \(f.1)", tone: .overlay).padding(8)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: 16. Value

struct OnboardingValueView: View {
    @ObservedObject var model: OnboardingModel
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            OnboardingHeadline(title: "Regardez ce que vous venez de créer.")
            HStack(spacing: 10) {
                VStack(spacing: 6) {
                    ProductVisual(model: model, cornerRadius: MSRadius.md).frame(width: 90, height: 90)
                    Text("1 photo").msHeadline(15)
                }
                Image(systemName: "arrow.right").foregroundStyle(MSColor.highlight)
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(OnboardingSummaryView.rows, id: \.1) { r in
                        Text("\(r.2) \(r.1.lowercased())").msCaption(color: MSColor.text2)
                    }
                }
            }
            HStack {
                Text("=").msTitle(28).foregroundStyle(MSColor.muted)
                Text("41 contenus").font(.system(size: 40, weight: .heavy, design: .rounded))
                    .foregroundStyle(MSColor.accentGradient)
            }
            VStack(alignment: .leading, spacing: 8) {
                ForEach(["Sans photographe.", "Sans designer.", "Sans rédacteur.", "Sans agence."], id: \.self) { s in
                    Label(s, systemImage: "xmark.circle").font(MSFont.headline(16)).foregroundStyle(MSColor.text)
                }
            }
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
    }
}

// MARK: 17. Workflow avoided

struct OnboardingWorkflowView: View {
    @ObservedObject var model: OnboardingModel
    private let roles = ["Photographe", "Designer", "Vidéaste", "Rédacteur", "Designer pub", "Community manager", "Agence"]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            OnboardingHeadline(title: "Créez votre marketing sans monter une équipe marketing.")
            VStack(alignment: .leading, spacing: 10) {
                Text("TRADITIONNELLEMENT").font(MSFont.caption(11)).tracking(1).foregroundStyle(MSColor.muted)
                FlowLayout(spacing: 6) {
                    ForEach(Array(roles.enumerated()), id: \.offset) { i, r in
                        HStack(spacing: 6) {
                            Text(r).font(MSFont.caption(12)).foregroundStyle(MSColor.text2).strikethrough(color: MSColor.danger)
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .background(MSColor.elevated, in: Capsule())
                            if i < roles.count - 1 { Image(systemName: "arrow.right").font(.system(size: 9)).foregroundStyle(MSColor.muted) }
                        }
                    }
                }
            }
            .msCard()
            VStack(alignment: .leading, spacing: 12) {
                Text("SOKOZIA").font(MSFont.caption(11)).tracking(1).foregroundStyle(MSColor.highlight)
                ForEach(["UN PRODUIT", "SOKOZIA", "CAMPAGNE COMPLÈTE"], id: \.self) { s in
                    HStack {
                        Text(s).font(.system(size: 17, weight: .heavy, design: .rounded)).foregroundStyle(MSColor.text)
                        Spacer()
                    }
                    .padding(14)
                    .background(s == "SOKOZIA" ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(MSColor.elevated),
                                in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    if s != "CAMPAGNE COMPLÈTE" {
                        Image(systemName: "arrow.down").foregroundStyle(MSColor.highlight).frame(maxWidth: .infinity)
                    }
                }
            }
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
    }
}

// MARK: 18. Campaign card

struct OnboardingCampaignView: View {
    @ObservedObject var model: OnboardingModel
    @State private var tab = "Aperçu"
    private let tabs = ["Aperçu", "Contenus", "Pubs", "Vidéos", "Textes", "Calendrier"]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            OnboardingHeadline(title: "Retrouvez tout au même endroit.")
            VStack(alignment: .leading, spacing: 14) {
                ProductVisual(model: model, cornerRadius: MSRadius.md).frame(height: 170)
                Text("Campagne \(model.productName)").msHeadline(18)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(tabs, id: \.self) { t in
                            MSChip(title: t, selected: tab == t) { tab = t }
                        }
                    }
                }
                HStack(spacing: 10) {
                    stat("41", "contenus")
                    stat("6", "variantes")
                    stat("\(max(model.platforms.count, 3))", "plateformes")
                }
            }
            .msCard()
            Spacer(minLength: 0)
            MSButton(title: "Ouvrir la campagne →") { model.next() }
        }
    }

    private func stat(_ v: String, _ l: String) -> some View {
        VStack(spacing: 2) {
            Text(v).msHeadline(20)
            Text(l).msCaption()
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
    }
}

// MARK: 19. Calendar

struct OnboardingCalendarView: View {
    @ObservedObject var model: OnboardingModel
    private let days: [(String, String, String)] = [
        ("LUN", "Reel Instagram", "camera.circle"), ("MAR", "UGC TikTok", "music.note"),
        ("MER", "Carrousel produit", "square.stack"), ("JEU", "Story Instagram", "circle.dashed"),
        ("VEN", "Pub TikTok", "megaphone"),
    ]
    @State private var shown = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            OnboardingHeadline(title: "Et Sokozia peut aussi la planifier.")
            VStack(spacing: 8) {
                ForEach(Array(days.enumerated()), id: \.offset) { i, d in
                    HStack(spacing: 14) {
                        Text(d.0).font(MSFont.caption(12)).tracking(1).foregroundStyle(MSColor.highlight).frame(width: 40, alignment: .leading)
                        Image(systemName: d.2).foregroundStyle(MSColor.text2)
                        Text(d.1).msBody(15, color: MSColor.text)
                        Spacer()
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success)
                    }
                    .msCard(padding: 14, radius: MSRadius.md)
                    .opacity(i < shown ? 1 : 0.15)
                }
            }
            Text("Votre campagne n'est pas seulement créée. Elle est organisée.").msBody(15)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            MSButton(title: "Continuer", icon: "arrow.right") { model.next() }
        }
        .task {
            for i in 1...days.count {
                try? await Task.sleep(nanoseconds: 220_000_000)
                withAnimation(MSAnimation.snappy) { shown = i }
            }
        }
    }
}
