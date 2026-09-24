import SwiftUI

/// Pill-style segmented control with a sliding selection.
struct SegmentedTabs: View {
    var tabs: [String]
    @Binding var selection: Int
    @Namespace private var ns

    var body: some View {
        HStack(spacing: 2) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { i, tab in
                Button {
                    MSHaptic.tap()
                    withAnimation(MSAnimation.snappy) { selection = i }
                } label: {
                    Text(tab)
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .foregroundStyle(selection == i ? MSColor.text : MSColor.muted)
                        .padding(.horizontal, 4)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background {
                            if selection == i {
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .fill(MSColor.elevated)
                                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
                                    .matchedGeometryEffect(id: "seg", in: ns)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(MSColor.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }
}

/// Underline tabs for wide tab sets (scrolls horizontally).
struct UnderlineTabs: View {
    var tabs: [String]
    @Binding var selection: Int
    @Namespace private var ns

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 18) {
                ForEach(Array(tabs.enumerated()), id: \.offset) { i, tab in
                    Button {
                        withAnimation(MSAnimation.snappy) { selection = i }
                    } label: {
                        VStack(spacing: 8) {
                            Text(tab)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(selection == i ? MSColor.text : MSColor.muted)
                            ZStack {
                                Capsule().fill(Color.clear).frame(height: 2)
                                if selection == i {
                                    Capsule().fill(MSColor.accent).frame(height: 2)
                                        .matchedGeometryEffect(id: "underline", in: ns)
                                }
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .overlay(alignment: .bottom) { Rectangle().fill(MSColor.border).frame(height: 1) }
    }
}
