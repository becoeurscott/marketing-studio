import SwiftUI

/// SPEC §30 — Brand Voice: tone chips, writing style editor, keywords, sample copy preview.
struct BrandVoiceView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var tone: Set<String> = []
    @State private var style = ""
    @State private var keywords = ""
    @State private var avoid = ""
    @State private var sampleIndex = 0
    @State private var regenerating = false
    @State private var loaded = false

    private let tones = ["Luxury", "Friendly", "Bold", "Playful", "Professional", "Minimal", "Urgent"]
    private let toneIcons = ["Luxury": "crown", "Friendly": "hand.wave", "Bold": "bolt", "Playful": "face.smiling", "Professional": "briefcase", "Minimal": "circle", "Urgent": "timer"]

    private let toneLabels = ["Luxury": "Luxe", "Friendly": "Chaleureux", "Bold": "Audacieux", "Playful": "Ludique", "Professional": "Professionnel", "Minimal": "Minimaliste", "Urgent": "Urgent"]
    private func toneLabel(_ t: String) -> String { toneLabels[t] ?? t }
    private var toneBinding: Binding<Set<String>> {
        Binding(
            get: { Set(tone.map { toneLabel($0) }) },
            set: { new in tone = Set(new.map { label in toneLabels.first(where: { $0.value == label })?.key ?? label }) }
        )
    }

    private var currentTone: String { tone.first ?? store.brand.voice.tone }
    private var isDirty: Bool {
        let v = store.brand.voice
        return currentTone != v.tone || style != v.writingStyle || parsed(keywords) != v.keywords || parsed(avoid) != v.avoid
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Voix de marque").msTitle(30)
                    Text("Utilisée chaque fois que le Rédacteur, le Générateur d'accroches et le Créateur de pubs écrivent pour \(store.brand.name).").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Ton").msHeadline(15)
                    ChipGroup(options: tones.map { toneLabel($0) }, selection: toneBinding, mode: .single, icons: Dictionary(uniqueKeysWithValues: toneIcons.map { (toneLabel($0.key), $0.value) }), allowDeselect: false)
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Style d'écriture").msHeadline(15)
                    MSTextEditor(placeholder: "Phrases courtes. Assurées. Jamais trop formelles.", text: $style, minHeight: 96)
                    Text("Décrivez le rythme, l'attitude et ce qu'il faut éviter. L'IA suit ces consignes à la lettre.").msCaption()
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 12) {
                    MSTextField(label: "Mots-clés à utiliser", placeholder: "éclat, pur, quotidien", text: $keywords, icon: "text.badge.checkmark", autocapitalization: .never)
                    MSTextField(label: "Mots à éviter", placeholder: "miracle, pas cher", text: $avoid, icon: "text.badge.xmark", autocapitalization: .never)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Exemple de texte", subtitle: "Généré avec cette voix", actionTitle: regenerating ? nil : "Régénérer") { regenerate() }
                sampleCard.padding(.horizontal, MSSpacing.gutter)
            }
            .padding(.top, 4)
            .padding(.bottom, 110)
        }
        .msScreen()
        .navigationTitle("Voix de marque")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            MSButton(title: isDirty ? "Enregistrer la voix" : "Enregistrée", icon: isDirty ? "checkmark" : "checkmark.circle.fill", isDisabled: !isDirty) {
                store.updateBrandVoice(BrandVoice(tone: currentTone, writingStyle: style.trimmingCharacters(in: .whitespacesAndNewlines), keywords: parsed(keywords), avoid: parsed(avoid)))
                MSHaptic.success()
                router.toast("Voix de marque enregistrée", style: .success)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.vertical, 12)
            .background(MSColor.bg.opacity(0.92))
        }
        .onAppear {
            guard !loaded else { return }
            let v = store.brand.voice
            tone = [v.tone]
            style = v.writingStyle
            keywords = v.keywords.joined(separator: ", ")
            avoid = v.avoid.joined(separator: ", ")
            loaded = true
        }
    }

    private var sampleCard: some View {
        MSCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    MSBadge(text: toneLabel(currentTone), tone: .accent)
                    MSBadge(text: "Légende Instagram", tone: .neutral)
                    Spacer()
                    Image(systemName: "sparkles").foregroundStyle(MSColor.highlight).font(.system(size: 12, weight: .semibold))
                }
                if regenerating {
                    VStack(alignment: .leading, spacing: 8) {
                        SkeletonView(cornerRadius: 6).frame(height: 14)
                        SkeletonView(cornerRadius: 6).frame(height: 14).frame(maxWidth: 260)
                        SkeletonView(cornerRadius: 6).frame(height: 14).frame(maxWidth: 180)
                    }
                } else {
                    Text(sample).msBody(15, color: MSColor.text).lineSpacing(4)
                        .id(sampleIndex)
                        .transition(.opacity)
                }
                Divider().overlay(MSColor.border)
                HStack(spacing: 8) {
                    MSButton(title: "Copier", icon: "doc.on.doc", style: .secondary, size: .compact, fullWidth: false) {
                        UIPasteboard.general.string = sample
                        router.toast("Copié dans le presse-papiers", style: .success)
                    }
                    MSButton(title: "Ouvrir le Rédacteur", icon: "text.alignleft", style: .ghost, size: .compact, fullWidth: false) {
                        router.push(.copywriter, on: .studio)
                    }
                }
            }
        }
        .animation(MSAnimation.gentle, value: regenerating)
    }

    private func regenerate() {
        regenerating = true
        Task {
            try? await Task.sleep(for: .milliseconds(900))
            sampleIndex += 1
            regenerating = false
        }
    }

    private var sample: String {
        let brand = store.brand.name
        let kw = parsed(keywords).first ?? "éclat"
        let samples: [String: [String]] = [
            "Luxury": [
                "\(brand). La qualité, tout simplement. Un vrai \(kw).",
                "Pensé pour les matins qui comptent. \(brand) ramène l'\(kw), en toute discrétion.",
            ],
            "Friendly": [
                "Voici votre nouveau rituel du matin. Avec \(brand), l'\(kw) devient simple, chaque jour.",
                "Coucou la peau. On vous apporte de l'\(kw). \(brand) est là pour vous.",
            ],
            "Bold": [
                "Fini les compromis. \(brand) vous offre un \(kw) qui se voit vraiment.",
                "\(kw.capitalized). Haut et fort. C'est ça, \(brand).",
            ],
            "Playful": [
                "Attention : \(brand) peut provoquer un excès d'\(kw). Effets secondaires : des compliments.",
                "Votre peau a appelé. Elle veut \(brand). Et un peu d'\(kw).",
            ],
            "Professional": [
                "\(brand) est formulé pour un \(kw) durable avec un usage quotidien. Résultats en 4 semaines.",
                "Une approche clinique. Une simplicité évidente. \(brand) pour un \(kw) au quotidien.",
            ],
            "Minimal": [
                "\(brand). \(kw.capitalized).",
                "Moins de routine. Plus d'\(kw). \(brand).",
            ],
            "Urgent": [
                "Le prix de lancement se termine dimanche. Profitez de l'\(kw) avec \(brand) avant qu'il ne soit trop tard.",
                "Plus que 48 heures. \(brand) à -20 %. Votre \(kw) n'attend pas.",
            ],
        ]
        let list = samples[currentTone] ?? samples["Friendly"]!
        return list[sampleIndex % list.count]
    }

    private func parsed(_ s: String) -> [String] {
        s.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).lowercased() }.filter { !$0.isEmpty }
    }
}
