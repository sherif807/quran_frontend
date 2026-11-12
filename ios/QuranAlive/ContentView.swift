import Foundation
import SwiftUI

struct ContentView: View {
    @State private var selectedCorpus: Corpus = .quran

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Scripture", selection: $selectedCorpus) {
                    ForEach(Corpus.allCases) { corpus in
                        Text(corpus.shortName).tag(corpus)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 18)
                .padding(.top, 12)

                if selectedCorpus == .quran {
                    QuranReaderView()
                } else {
                    ScripturePreview(corpus: selectedCorpus)
                }
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("QuranAlive")
        }
    }
}

private struct QuranReaderView: View {
    @StateObject private var reader = QuranReaderModel()
    @State private var showsSurahPicker = false
    @State private var researchTabs: [WordResearchTab] = []
    @State private var activeResearchTabID: String?
    @State private var showsResearchResults = true

    private var activeResearchTab: WordResearchTab? {
        researchTabs.first { $0.id == activeResearchTabID }
    }

    var body: some View {
        Group {
            if reader.isLoading && reader.surah == nil {
                ProgressView("Loading Quran…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = reader.error, reader.surah == nil {
                ReaderStatusView(
                    title: "Couldn’t load the Quran",
                    icon: "wifi.exclamationmark",
                    detail: error,
                    retry: { Task { await reader.loadSurah(reader.selectedSurahID) } }
                )
            } else if let surah = reader.surah {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Button {
                            showsSurahPicker = true
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("Surah \(surah.number) · \(surah.transliteratedName)")
                                        .font(.headline)
                                    Text("\(surah.name) · \(surah.englishName) · \(surah.verseCount) verses")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.up.chevron.down")
                                    .font(.subheadline.weight(.semibold))
                            }
                            .padding(16)
                            .foregroundStyle(.primary)
                            .background(Color.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .accessibilityHint("Choose another surah")

                        Text("Tap words to open research tabs. Your open roots stay here while you compare words.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        if !researchTabs.isEmpty {
                            WordResearchWorkspace(
                                tabs: researchTabs,
                                activeID: activeResearchTabID,
                                showsResults: showsResearchResults,
                                select: { id in
                                    activeResearchTabID = id
                                    showsResearchResults = true
                                },
                                toggleResults: { showsResearchResults.toggle() },
                                close: closeResearchTab
                            )
                        }

                        ForEach(reader.verses) { verse in
                            QuranVerseCard(
                                verse: verse,
                                selectedWordLocation: activeResearchTab?.word.location
                            ) { word in
                                openResearchTab(word)
                            }
                        }
                    }
                    .padding(18)
                }
                .refreshable { await reader.loadSurah(reader.selectedSurahID) }
            }
        }
        .task { await reader.loadSurah(1) }
        .sheet(isPresented: $showsSurahPicker) {
            SurahPicker(surahs: reader.surahs, selectedID: reader.selectedSurahID) { id in
                showsSurahPicker = false
                Task { await reader.loadSurah(id) }
            }
        }
    }

    private func openResearchTab(_ word: QuranWord) {
        if let existing = researchTabs.first(where: { $0.word.location == word.location }) {
            activeResearchTabID = existing.id
        } else {
            let tab = WordResearchTab(word: word)
            researchTabs.append(tab)
            activeResearchTabID = tab.id
            Task { await loadRoot(for: tab.id, word: word) }
        }
        showsResearchResults = true
    }

    private func closeResearchTab(_ id: String) {
        guard let index = researchTabs.firstIndex(where: { $0.id == id }) else { return }
        researchTabs.remove(at: index)
        activeResearchTabID = researchTabs.last?.id
        if researchTabs.isEmpty { showsResearchResults = false }
    }

    private func loadRoot(for id: String, word: QuranWord) async {
        do {
            let result = try await QuranAPI.shared.wordRoot(for: word.location)
            guard let index = researchTabs.firstIndex(where: { $0.id == id }) else { return }
            researchTabs[index].result = result
        } catch {
            guard let index = researchTabs.firstIndex(where: { $0.id == id }) else { return }
            researchTabs[index].error = error.localizedDescription
        }
        guard let index = researchTabs.firstIndex(where: { $0.id == id }) else { return }
        researchTabs[index].isLoading = false
    }
}

private struct QuranVerseCard: View {
    let verse: QuranVerse
    let selectedWordLocation: String?
    let onWordTap: (QuranWord) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(verse.surahNumber):\(verse.verseNumber)")
                .font(.caption.weight(.bold))
                .foregroundStyle(.green)

            FlowLayout(spacing: 7) {
                ForEach(verse.words) { word in
                    Button(word.text) { onWordTap(word) }
                        .font(.custom("Geeza Pro", size: 27))
                        .foregroundStyle(word.location == selectedWordLocation ? Color.teal : .primary)
                        .padding(.horizontal, 3)
                        .padding(.vertical, 2)
                        .background(
                            word.location == selectedWordLocation ? Color.teal.opacity(0.16) : .clear,
                            in: RoundedRectangle(cornerRadius: 6, style: .continuous)
                        )
                        .accessibilityLabel("\(word.text), word \(word.position)")
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .environment(\.layoutDirection, .rightToLeft)
        }
        .padding(18)
        .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct WordResearchWorkspace: View {
    let tabs: [WordResearchTab]
    let activeID: String?
    let showsResults: Bool
    let select: (String) -> Void
    let toggleResults: () -> Void
    let close: (String) -> Void

    private var activeTab: WordResearchTab? {
        tabs.first { $0.id == activeID }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Research tabs", systemImage: "rectangle.on.rectangle")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Button(action: toggleResults) {
                    Label(showsResults ? "Hide results" : "Show results", systemImage: showsResults ? "chevron.up" : "chevron.down")
                        .font(.footnote.weight(.semibold))
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(tabs) { tab in
                        HStack(spacing: 5) {
                            Button { select(tab.id) } label: {
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(tab.word.text)
                                        .font(.custom("Geeza Pro", size: 20))
                                    Text(tab.rootLabel)
                                        .font(.caption2.weight(.semibold))
                                }
                            }
                            Button { close(tab.id) } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.caption)
                            }
                            .accessibilityLabel("Close \(tab.word.text) tab")
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .foregroundStyle(tab.id == activeID ? Color.teal : .primary)
                        .background(tab.id == activeID ? Color.teal.opacity(0.16) : Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
            }

            if showsResults, let tab = activeTab {
                WordResearchResults(tab: tab)
            }
        }
        .padding(14)
        .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct WordResearchResults: View {
    let tab: WordResearchTab

    var body: some View {
        Group {
            if tab.isLoading {
                ProgressView("Looking up \(tab.word.text)…")
                    .frame(maxWidth: .infinity, minHeight: 72)
            } else if let result = tab.result {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Root: \(tab.rootLabel)")
                            .font(.headline)
                        Spacer()
                        Text("\(result.totalMatches) occurrences")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    if let morphology = result.wordsInfo.first {
                        HStack(spacing: 12) {
                            if let lemma = morphology.lemma { Label(lemma, systemImage: "textformat") }
                            if let tag = morphology.tag { Label(tag, systemImage: "tag") }
                        }
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    }
                    ForEach(result.versesArray) { verse in
                        RootMatchVerseCard(verse: verse)
                            .padding(.horizontal, -16)
                    }
                }
            } else {
                ReaderStatusView(title: "Root unavailable", icon: "exclamationmark.triangle", detail: tab.error ?? "Try again.")
            }
        }
    }
}

private struct RootMatchVerseCard: View {
    let verse: RootMatchVerse

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(verse.suraNumber):\(verse.verseNumber)")
                .font(.caption.weight(.bold))
                .foregroundStyle(.teal)

            FlowLayout(spacing: 7) {
                ForEach(verse.words) { word in
                    Text(word.wordText)
                        .font(.custom("Geeza Pro", size: 25))
                        .foregroundStyle(word.isHighlighted ? Color.teal : .primary)
                        .padding(.horizontal, 3)
                        .padding(.vertical, 2)
                        .background(
                            word.isHighlighted ? Color.teal.opacity(0.16) : .clear,
                            in: RoundedRectangle(cornerRadius: 6, style: .continuous)
                        )
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .environment(\.layoutDirection, .rightToLeft)
        }
        .padding(16)
        .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 16)
    }
}

private struct SurahPicker: View {
    let surahs: [Surah]
    let selectedID: Int
    let choose: (Int) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    private var filtered: [Surah] {
        guard !query.isEmpty else { return surahs }
        return surahs.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
            $0.transliteratedName.localizedCaseInsensitiveContains(query) ||
            $0.englishName.localizedCaseInsensitiveContains(query) ||
            String($0.number).contains(query)
        }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { surah in
                Button {
                    choose(surah.id)
                } label: {
                    HStack {
                        Text("\(surah.number)").foregroundStyle(.secondary).frame(width: 28, alignment: .leading)
                        VStack(alignment: .leading) {
                            Text(surah.transliteratedName)
                            Text(surah.englishName).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(surah.name).font(.custom("Geeza Pro", size: 20))
                        if surah.id == selectedID { Image(systemName: "checkmark").foregroundStyle(.green) }
                    }
                }
                .foregroundStyle(.primary)
            }
            .searchable(text: $query, prompt: "Search surahs")
            .navigationTitle("Choose surah")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }
}

@MainActor
private final class QuranReaderModel: ObservableObject {
    @Published private(set) var surahs: [Surah] = []
    @Published private(set) var surah: Surah?
    @Published private(set) var verses: [QuranVerse] = []
    // Start in an explicit loading state so the reader never presents as an empty page
    // before its first API request begins.
    @Published private(set) var isLoading = true
    @Published private(set) var error: String?
    @Published private(set) var selectedSurahID = 1

    func loadSurah(_ id: Int) async {
        isLoading = true
        error = nil
        do {
            let response = try await QuranAPI.shared.surah(id: id)
            selectedSurahID = id
            surah = response.selectedSura
            verses = response.versesArray
            surahs = response.allSuras.values.sorted { $0.number < $1.number }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

private enum QuranAPI {
    static let shared = Client()

    final class Client {
        private let baseURL = URL(string: "https://zbcfhk1upe.execute-api.us-east-1.amazonaws.com/api/")!
        private let decoder = JSONDecoder()

        func surah(id: Int) async throws -> SurahResponse {
            try await load("quran/\(id)?mode=light", as: SurahResponse.self)
        }

        func wordRoot(for location: String) async throws -> WordRootResponse {
            try await load("quran/word-root/\(location)?offset=0&limit=50", as: WordRootResponse.self)
        }

        private func load<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
            guard let url = URL(string: path, relativeTo: baseURL) else { throw URLError(.badURL) }
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
                throw URLError(.badServerResponse)
            }
            return try decoder.decode(T.self, from: data)
        }
    }
}

private struct SurahResponse: Decodable {
    let allSuras: [String: Surah]
    let selectedSura: Surah
    let versesArray: [QuranVerse]
}

private struct WordRootResponse: Decodable {
    let title: String
    let totalMatches: Int
    let wordsInfo: [Morphology]
    let versesArray: [RootMatchVerse]
}

private struct RootMatchVerse: Decodable, Identifiable {
    let suraNumber: Int
    let verseNumber: Int
    let words: [RootMatchWord]
    var id: String { "\(suraNumber):\(verseNumber)" }
}

private struct RootMatchWord: Decodable, Identifiable {
    let position: Int
    let wordText: String
    let highlightWordNumber: Int?
    var id: String { "\(position)-\(wordText)" }
    var isHighlighted: Bool { highlightWordNumber == position }
}

private struct Surah: Decodable, Identifiable {
    let id: Int
    let name: String
    let number: Int
    let verseCount: Int
    let transliteratedName: String
    let englishName: String
}

private struct QuranVerse: Decodable, Identifiable {
    let id: Int
    let surahNumber: Int
    let verseNumber: Int
    let words: [QuranWord]

    // The production API calls this `suraNumber`, while the native model uses the
    // clearer `surahNumber`. Keeping this mapping explicit prevents a silent reader
    // decode failure.
    private enum CodingKeys: String, CodingKey {
        case id, surahNumber = "suraNumber", verseNumber, words
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let decodedID = try c.decode(Int.self, forKey: .id)
        let decodedSurahNumber = try c.decode(Int.self, forKey: .surahNumber)
        let decodedVerseNumber = try c.decode(Int.self, forKey: .verseNumber)
        let decodedWords = try c.decode([RawQuranWord].self, forKey: .words)

        id = decodedID
        surahNumber = decodedSurahNumber
        verseNumber = decodedVerseNumber
        words = decodedWords.map {
            QuranWord(position: $0.position, text: $0.wordText, surahNumber: decodedSurahNumber, verseNumber: decodedVerseNumber)
        }
    }
}

private struct RawQuranWord: Decodable { let position: Int; let wordText: String }

private struct QuranWord: Identifiable {
    let position: Int
    let text: String
    let surahNumber: Int
    let verseNumber: Int
    var id: String { location }
    var location: String { "\(surahNumber):\(verseNumber):\(position)" }
}

private struct WordResearchTab: Identifiable {
    let id: String
    let word: QuranWord
    var result: WordRootResponse?
    var isLoading = true
    var error: String?

    init(word: QuranWord) {
        self.id = word.location
        self.word = word
    }

    var rootLabel: String {
        result?.wordsInfo.first?.root ?? "Root…"
    }
}

private struct Morphology: Decodable {
    let tag: String?
    let lemma: String?
    let root: String?
    let features: String?
    let newFeatures: String?
}

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 { x = 0; y += lineHeight + spacing; lineHeight = 0 }
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
        return CGSize(width: width, height: y + lineHeight)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, lineHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX { x = bounds.minX; y += lineHeight + spacing; lineHeight = 0 }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}

private struct ScripturePreview: View {
    let corpus: Corpus
    var body: some View {
        ReaderStatusView(title: "\(corpus.displayName) reader is next", icon: corpus.icon, detail: "The Quran reader is the first native conversion layer.")
    }
}

private struct ReaderStatusView: View {
    let title: String
    let icon: String
    let detail: String
    var retry: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon).font(.largeTitle).foregroundStyle(.secondary)
            Text(title).font(.headline)
            Text(detail).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            if let retry {
                Button("Try again", action: retry)
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private enum Corpus: String, CaseIterable, Identifiable {
    case quran, gospel, tanakh
    var id: String { rawValue }
    var shortName: String { displayName }
    var displayName: String { rawValue.capitalized }
    var icon: String { self == .gospel ? "cross.fill" : self == .tanakh ? "menorah.fill" : "book.closed.fill" }
}

#Preview { ContentView() }
