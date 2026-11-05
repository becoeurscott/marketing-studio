import AVFoundation
import Photos
import SwiftUI

// MARK: - Logo animation while a template is analysed or assembled

struct TemplateWorkingOverlay: View {
    var title: String
    var steps: [String]
    var progress: Double
    @State private var spin = false
    @State private var pulse = false

    private var stepIndex: Int { min(steps.count - 1, Int(progress * Double(steps.count))) }

    var body: some View {
        ZStack {
            MSColor.bg.opacity(0.97).ignoresSafeArea()
            RadialGradient(colors: [MSColor.accent.opacity(pulse ? 0.22 : 0.08), .clear], center: .center, startRadius: 10, endRadius: 300)
                .ignoresSafeArea()
            VStack(spacing: 26) {
                ZStack {
                    Circle().stroke(MSColor.elevated, lineWidth: 5).frame(width: 170, height: 170)
                    Circle()
                        .trim(from: 0, to: max(0.03, progress))
                        .stroke(MSColor.accent, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .frame(width: 170, height: 170)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeOut(duration: 0.3), value: progress)
                    Circle()
                        .trim(from: 0, to: 0.18)
                        .stroke(MSColor.highlight.opacity(0.6), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                        .frame(width: 200, height: 200)
                        .rotationEffect(.degrees(spin ? 360 : 0))
                    MSBrandMark(size: 80)
                        .shadow(color: MSColor.accent.opacity(0.6), radius: pulse ? 26 : 8)
                        .scaleEffect(pulse ? 1.06 : 0.94)
                }
                VStack(spacing: 8) {
                    Text(L(title)).msHeadline(20)
                    Text(L(steps[stepIndex]))
                        .font(MSFont.body(15)).foregroundStyle(MSColor.highlight)
                        .id(stepIndex)
                        .transition(.asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity), removal: .opacity))
                    Text("\(Int(progress * 100)) %").font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.muted)
                }
                .animation(MSAnimation.snappy, value: stepIndex)
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1.1).repeatForever(autoreverses: false)) { spin = true }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}

// MARK: - Library video with its duration

struct LibraryVideo: Identifiable, Hashable {
    let asset: PHAsset
    var id: String { asset.localIdentifier }
    var duration: Double { asset.duration }
}

@MainActor
final class LibraryVideos: ObservableObject {
    enum Kind: String, CaseIterable { case videos = "Vidéos" }
    @Published var items: [PHAsset] = []
    @Published var denied = false
    let images = PHCachingImageManager()

    func load(_ kind: Kind) async {
        var status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        if status == .notDetermined { status = await PHPhotoLibrary.requestAuthorization(for: .readWrite) }
        guard status == .authorized || status == .limited else { denied = true; return }
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        if kind == .videos { options.predicate = NSPredicate(format: "mediaType == %d", PHAssetMediaType.video.rawValue) }
        let result = PHAsset.fetchAssets(with: options)
        var list: [PHAsset] = []
        result.enumerateObjects { a, _, _ in if a.mediaType == .video { list.append(a) } }
        items = list
    }

    static func avAsset(_ asset: PHAsset) async -> AVAsset? {
        let options = PHVideoRequestOptions()
        options.isNetworkAccessAllowed = true
        options.deliveryMode = .highQualityFormat
        return await withCheckedContinuation { cont in
            PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { av, _, _ in cont.resume(returning: av) }
        }
    }
}

// MARK: - CapCut-style slot picker

/// Full-screen library with the template's numbered slots at the bottom: tap a video to fill the
/// current slot; clips shorter than the slot are dimmed.
struct TemplateSlotPicker: View {
    let template: VideoTemplate
    var onDone: ([PHAsset]) -> Void
    @Environment(\.dismiss) private var dismiss
    @StateObject private var library = LibraryVideos()
    @State private var kind: LibraryVideos.Kind = .videos
    @State private var picks: [Int: PHAsset] = [:]
    @State private var current = 0

    private var allFilled: Bool { picks.count == template.shots.count }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            tabs
            grid
            tray
        }
        .background(Color.black.ignoresSafeArea())
        .preferredColorScheme(.dark)
        .task(id: kind) { await library.load(kind) }
    }

    private var topBar: some View {
        HStack {
            Button { dismiss() } label: { Image(systemName: "xmark").font(.system(size: 18, weight: .semibold)).foregroundStyle(.white) }
            Spacer()
            Text("Récents").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            Spacer()
            Image(systemName: "xmark").opacity(0)
        }
        .padding(.horizontal, 18).padding(.vertical, 12)
    }

    private var tabs: some View {
        HStack(spacing: 0) {
            ForEach(LibraryVideos.Kind.allCases, id: \.self) { k in
                Button { kind = k } label: {
                    VStack(spacing: 6) {
                        Text(L(k.rawValue)).font(.system(size: 15, weight: .semibold)).foregroundStyle(kind == k ? MSColor.highlight : .white.opacity(0.6))
                        Capsule().fill(kind == k ? MSColor.highlight : .clear).frame(width: 34, height: 3)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.bottom, 4)
    }

    private var grid: some View {
        let slot = template.shots[safe: current]
        return ScrollView {
            if library.denied {
                Text("Autorisez l'accès à vos vidéos dans Réglages › Marketing Studio › Photos.")
                    .font(MSFont.body(14)).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center).padding(30)
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 3), spacing: 3) {
                ForEach(library.items, id: \.localIdentifier) { a in
                    let short = a.mediaType == .video && slot.map { a.duration + 0.05 < $0.duration } == true
                    let usedIn = picks.first { $0.value.localIdentifier == a.localIdentifier }?.key
                    Button { pick(a) } label: {
                        LibraryThumb(asset: a, manager: library.images)
                            .overlay(alignment: .bottomTrailing) {
                                if a.mediaType == .video {
                                    Text(timeLabel(a.duration)).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
                                        .shadow(radius: 2).padding(6)
                                }
                            }
                            .overlay(alignment: .topLeading) {
                                if let usedIn {
                                    Text("\(usedIn + 1)").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.onAccent)
                                        .frame(width: 22, height: 22).background(MSColor.accent, in: Circle()).padding(6)
                                } else if short {
                                    Text("Trop courte").font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 3).background(.black.opacity(0.6), in: Capsule()).padding(6)
                                }
                            }
                            .opacity(short ? 0.35 : 1)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var tray: some View {
        VStack(alignment: .leading, spacing: 12) {
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(template.shots) { s in
                            Button { current = s.index } label: { slotCell(s) }
                                .buttonStyle(.plain).id(s.index)
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .onChange(of: current) { _, c in withAnimation { proxy.scrollTo(c, anchor: .center) } }
            }
            HStack(alignment: .center, spacing: 12) {
                Text(hint).font(.system(size: 13)).foregroundStyle(.white.opacity(0.75)).lineLimit(3)
                Spacer(minLength: 8)
                Button { onDone(template.shots.compactMap { picks[$0.index] }); dismiss() } label: {
                    Text("Suivant").font(.system(size: 16, weight: .bold))
                        .foregroundStyle(allFilled ? MSColor.onAccent : .white.opacity(0.35))
                        .padding(.horizontal, 26).frame(height: 46)
                        .background(allFilled ? MSColor.accent : Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .disabled(!allFilled)
            }
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 14)
        .background(Color(white: 0.09).ignoresSafeArea(edges: .bottom))
    }

    private func slotCell(_ s: TemplateShot) -> some View {
        let picked = picks[s.index]
        return ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.white.opacity(0.07))
            if let picked {
                LibraryThumb(asset: picked, manager: library.images)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            Text("\(s.index + 1)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                .frame(width: 20, height: 20).background(Color.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 5)).padding(5)
            Text(String(format: "%.1fs", s.duration)).font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                .shadow(radius: 2)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(width: 72, height: 72)
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(current == s.index ? Color.white : .clear, lineWidth: 2.5))
    }

    private var hint: String {
        guard let s = template.shots[safe: current] else { return "" }
        let people = ["selfie", "medium"].contains(s.framing)
        let base = L(s.description)
        return people ? "\(base) · \(L("Ce plan marche mieux avec une personne à l'écran."))" : base
    }

    private func pick(_ a: PHAsset) {
        guard let slot = template.shots[safe: current] else { return }
        if a.mediaType == .video, a.duration + 0.05 < slot.duration {
            MSHaptic.warning()
            return
        }
        MSHaptic.tap()
        picks[current] = a
        if let next = template.shots.first(where: { picks[$0.index] == nil }) { current = next.index }
    }

    private func timeLabel(_ d: Double) -> String { String(format: "%02d:%02d", Int(d) / 60, Int(d) % 60) }
}

private struct LibraryThumb: View {
    let asset: PHAsset
    let manager: PHCachingImageManager
    @State private var image: UIImage?

    var body: some View {
        Color.white.opacity(0.05)
            .aspectRatio(1, contentMode: .fit)
            .overlay { if let image { Image(uiImage: image).resizable().scaledToFill() } }
            .clipped()
            .task(id: asset.localIdentifier) {
                let o = PHImageRequestOptions()
                o.isNetworkAccessAllowed = true
                o.deliveryMode = .opportunistic
                manager.requestImage(for: asset, targetSize: CGSize(width: 260, height: 260), contentMode: .aspectFill, options: o) { img, _ in
                    if let img { image = img }
                }
            }
    }
}
