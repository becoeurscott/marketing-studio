import SwiftUI

/// Selectable pill. Selected state uses a soft accent tint rather than a solid fill.
struct MSChip: View {
    var title: String
    var icon: String? = nil
    var selected: Bool = false
    var action: () -> Void

    var body: some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            HStack(spacing: 6) {
                if let icon { Image(systemName: icon).font(.system(size: 12, weight: .semibold)) }
                Text(title).font(MSFont.control())
            }
            .foregroundStyle(selected ? MSColor.highlight : MSColor.text2)
            .padding(.horizontal, 14)
            .frame(height: 36)
            .background(selected ? MSColor.accent.opacity(0.14) : MSColor.elevated, in: Capsule())
            .overlay(Capsule().strokeBorder(selected ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
        .animation(MSAnimation.gentle, value: selected)
    }
}

enum ChipSelectionMode { case single, multi }

/// Wrapping group of chips bound to a `Set<String>`.
struct ChipGroup: View {
    var options: [String]
    @Binding var selection: Set<String>
    var mode: ChipSelectionMode = .single
    var icons: [String: String] = [:]
    var allowDeselect: Bool = true

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(options, id: \.self) { option in
                MSChip(title: option, icon: icons[option], selected: selection.contains(option)) {
                    toggle(option)
                }
            }
        }
    }

    private func toggle(_ option: String) {
        withAnimation(MSAnimation.snappy) {
            switch mode {
            case .single:
                if selection.contains(option) {
                    if allowDeselect { selection.remove(option) }
                } else {
                    selection = [option]
                }
            case .multi:
                if selection.contains(option) { selection.remove(option) } else { selection.insert(option) }
            }
        }
    }
}

/// Horizontal scrolling chip row for filters.
struct ChipRow: View {
    var options: [String]
    @Binding var selection: String

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    MSChip(title: option, selected: selection == option) {
                        withAnimation(MSAnimation.snappy) { selection = option }
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }
}

/// Simple wrapping layout.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, usedWidth: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
            usedWidth = max(usedWidth, x - spacing)
        }
        return CGSize(width: maxWidth == .infinity ? usedWidth : maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x > bounds.minX, x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            sub.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
