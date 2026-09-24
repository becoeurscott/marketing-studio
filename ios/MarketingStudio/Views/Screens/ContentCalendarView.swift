import SwiftUI

/// SPEC §23: week and month views of a campaign's planned content. No real publishing.
struct ContentCalendarView: View {
    let campaignId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var mode = 0 // 0 week, 1 month
    @State private var anchor = Date()
    @State private var selectedDay = Calendar.current.startOfDay(for: Date())
    @State private var editingItem: CalendarItem? = nil
    @State private var adding = false

    private let cal = Calendar.current
    private var campaign: Campaign? { store.campaign(campaignId) }
    private var items: [CalendarItem] { campaign?.calendarItems.sorted { $0.date < $1.date } ?? [] }

    var body: some View {
        Group {
            if let campaign {
                content(campaign)
            } else {
                EmptyStateView(icon: "calendar.badge.exclamationmark", title: "Campaign not found", message: "It may have been deleted.", ctaTitle: "Back") { router.pop() }
                    .msScreen()
            }
        }
        .navigationTitle("Content Calendar")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                MSIconButton(icon: "plus", size: 30) { adding = true }
            }
        }
        .msSheet(item: $editingItem, detents: [.large]) { item in
            CalendarItemEditSheet(campaignId: campaignId, item: item) { editingItem = nil }
        }
        .msSheet(isPresented: $adding, detents: [.large]) {
            CalendarItemEditSheet(campaignId: campaignId) { adding = false }
        }
    }

    private func content(_ c: Campaign) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(c.name).msTitle(24)
                    HStack(spacing: 8) {
                        legend(.draft); legend(.scheduled); legend(.published)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                SegmentedTabs(tabs: ["Week", "Month"], selection: $mode)
                    .padding(.horizontal, MSSpacing.gutter)

                periodHeader

                if mode == 0 { weekStrip } else { monthGrid }

                dayList
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
    }

    private func legend(_ s: CalendarStatus) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color(for: s)).frame(width: 6, height: 6)
            Text(s.title).msCaption()
        }
    }

    private func color(for s: CalendarStatus) -> Color {
        switch s {
        case .draft: return MSColor.muted
        case .scheduled: return Color(hex: 0x60A5FA)
        case .published: return MSColor.success
        }
    }

    // MARK: Period navigation

    private var periodHeader: some View {
        HStack {
            MSIconButton(icon: "chevron.left", size: 30) { shift(-1) }
            Spacer()
            VStack(spacing: 2) {
                Text(mode == 0 ? weekTitle : anchor.formatted(.dateTime.month(.wide).year())).msHeadline(16)
                Button("Today") {
                    withAnimation(MSAnimation.snappy) { anchor = Date(); selectedDay = cal.startOfDay(for: Date()) }
                }
                .font(MSFont.control(12)).foregroundStyle(MSColor.highlight)
            }
            Spacer()
            MSIconButton(icon: "chevron.right", size: 30) { shift(1) }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private func shift(_ n: Int) {
        withAnimation(MSAnimation.snappy) {
            anchor = cal.date(byAdding: mode == 0 ? .weekOfYear : .month, value: n, to: anchor) ?? anchor
            if mode == 0 { selectedDay = weekDays.first ?? selectedDay } else { selectedDay = cal.date(from: cal.dateComponents([.year, .month], from: anchor)) ?? selectedDay }
        }
    }

    private var weekDays: [Date] {
        guard let start = cal.dateInterval(of: .weekOfYear, for: anchor)?.start else { return [] }
        return (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: start) }
    }

    private var weekTitle: String {
        guard let f = weekDays.first, let l = weekDays.last else { return "" }
        return "\(f.shortString) – \(l.shortString)"
    }

    private func items(on day: Date) -> [CalendarItem] { items.filter { cal.isDate($0.date, inSameDayAs: day) } }

    // MARK: Week

    private var weekStrip: some View {
        HStack(spacing: 6) {
            ForEach(weekDays, id: \.self) { day in
                let dayItems = items(on: day)
                let selected = cal.isDate(day, inSameDayAs: selectedDay)
                Button {
                    MSHaptic.tap()
                    withAnimation(MSAnimation.snappy) { selectedDay = cal.startOfDay(for: day) }
                } label: {
                    VStack(spacing: 6) {
                        Text(day.formatted(.dateTime.weekday(.narrow))).msCaption()
                        Text(day.formatted(.dateTime.day()))
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundStyle(selected ? .white : MSColor.text)
                        HStack(spacing: 2) {
                            ForEach(dayItems.prefix(3)) { i in
                                Circle().fill(color(for: i.status)).frame(width: 4, height: 4)
                            }
                        }
                        .frame(height: 4)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(selected ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(cal.isDateInToday(day) ? MSColor.elevated : MSColor.card), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(selected ? .clear : MSColor.border, lineWidth: 1))
                }
                .buttonStyle(MSPressStyle())
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Month

    private var monthDays: [Date?] {
        guard let interval = cal.dateInterval(of: .month, for: anchor) else { return [] }
        let first = interval.start
        let daysInMonth = cal.range(of: .day, in: .month, for: anchor)?.count ?? 30
        let weekdayOffset = (cal.component(.weekday, from: first) - cal.firstWeekday + 7) % 7
        var cells: [Date?] = Array(repeating: nil, count: weekdayOffset)
        for d in 0..<daysInMonth { cells.append(cal.date(byAdding: .day, value: d, to: first)) }
        while cells.count % 7 != 0 { cells.append(nil) }
        return cells
    }

    private var monthGrid: some View {
        VStack(spacing: 6) {
            HStack {
                ForEach(cal.shortWeekdaySymbols.indices, id: \.self) { i in
                    let idx = (i + cal.firstWeekday - 1) % 7
                    Text(String(cal.shortWeekdaySymbols[idx].prefix(1))).msCaption().frame(maxWidth: .infinity)
                }
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(Array(monthDays.enumerated()), id: \.offset) { _, day in
                    if let day {
                        let dayItems = items(on: day)
                        let selected = cal.isDate(day, inSameDayAs: selectedDay)
                        Button {
                            MSHaptic.tap()
                            withAnimation(MSAnimation.snappy) { selectedDay = cal.startOfDay(for: day) }
                        } label: {
                            VStack(spacing: 4) {
                                Text(day.formatted(.dateTime.day()))
                                    .font(.system(size: 13, weight: cal.isDateInToday(day) ? .bold : .medium, design: .rounded))
                                    .foregroundStyle(selected ? .white : (cal.isDateInToday(day) ? MSColor.highlight : MSColor.text))
                                HStack(spacing: 2) {
                                    ForEach(dayItems.prefix(3)) { i in
                                        Circle().fill(color(for: i.status)).frame(width: 4, height: 4)
                                    }
                                }
                                .frame(height: 4)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .background(selected ? AnyShapeStyle(MSColor.accentGradient) : AnyShapeStyle(dayItems.isEmpty ? MSColor.card : MSColor.elevated), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        }
                        .buttonStyle(MSPressStyle())
                    } else {
                        Color.clear.frame(height: 44)
                    }
                }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Day list

    private var dayList: some View {
        let dayItems = items(on: selectedDay)
        return VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: selectedDay.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()), subtitle: dayItems.isEmpty ? "Nothing planned" : "\(dayItems.count) item\(dayItems.count == 1 ? "" : "s")", actionTitle: "Add") {
                adding = true
            }
            if dayItems.isEmpty {
                if items.isEmpty {
                    EmptyStateView(icon: "calendar.badge.plus", title: "Empty calendar", message: "Plan posts by day, platform and format. Nothing is published for real.", ctaTitle: "Schedule content", ctaIcon: "plus") { adding = true }
                } else {
                    MSCard(padding: 14) {
                        HStack(spacing: 10) {
                            Image(systemName: "sparkles").foregroundStyle(MSColor.muted)
                            Text("Free day. Add a story or a retargeting post here.").msBody(14)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            } else {
                VStack(spacing: 8) {
                    ForEach(dayItems) { item in
                        CalendarItemRow(item: item) { editingItem = item }
                            .contextMenu {
                                ForEach(CalendarStatus.allCases) { s in
                                    Button {
                                        var copy = item; copy.status = s
                                        store.updateCalendarItem(copy, in: campaignId)
                                    } label: { Label("Mark \(s.title.lowercased())", systemImage: item.status == s ? "checkmark" : "circle") }
                                }
                                Button(role: .destructive) { store.removeCalendarItem(item.id, from: campaignId) } label: { Label("Remove", systemImage: "trash") }
                            }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }

            if !items.isEmpty {
                SectionHeader(title: "All planned content", subtitle: "\(items.count) items")
                VStack(spacing: 8) {
                    ForEach(items) { item in
                        CalendarItemRow(item: item) { editingItem = item }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }
}
