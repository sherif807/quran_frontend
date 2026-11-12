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
    @State private var activeResearch: ResearchSession?
    @State private var minimizedResearch: [ResearchSession] = []

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
                                Image(systemName: "chevron.up.chevron.down")
                                    .font(.subheadline.weight(.semibold))
                                Spacer()
                                VStack(alignment: .trailing, spacing: 3) {
                                    Text("\(surah.name) · \(surah.transliteratedName) · \(surah.number)")
                                        .font(.custom("Geeza Pro", size: 22))
                                        .frame(maxWidth: .infinity, alignment: .trailing)
                                    Text("\(surah.englishName) · \(surah.verseCount) verses")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .frame(maxWidth: .infinity, alignment: .trailing)
                                }
                            }
                            .padding(16)
                            .foregroundStyle(.primary)
                            .background(Color.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .accessibilityHint("Choose another surah")

                        ForEach(reader.verses) { verse in
                            QuranVerseCard(
                                verse: verse,
                                selectedWordLocation: activeResearch?.activeWord.location
                            ) { word in
                                activeResearch = ResearchSession(word: word)
                            }
                        }
                    }
                    .padding(18)
                }
                .refreshable { await reader.loadSurah(reader.selectedSurahID) }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    ResearchTabDock(
                        surahTitle: surah.name,
                        sessions: minimizedResearch,
                        open: { activeResearch = $0 },
                        dismissStep: { index in
                            guard var session = minimizedResearch.last else { return }
                            session.history.removeSubrange(index...)
                            if session.history.isEmpty {
                                minimizedResearch.removeAll { $0.id == session.id }
                            } else {
                                session.historyIndex = min(session.historyIndex, session.history.count - 1)
                                minimizedResearch.removeAll { $0.id == session.id }
                                minimizedResearch.append(session)
                            }
                        }
                    )
                }
            }
        }
        .task { await reader.loadSurah(1) }
        .sheet(isPresented: $showsSurahPicker) {
            SurahPicker(surahs: reader.surahs, selectedID: reader.selectedSurahID) { id in
                showsSurahPicker = false
                Task { await reader.loadSurah(id) }
            }
        }
        .fullScreenCover(item: $activeResearch) { session in
            WordRootOverlay(
                session: session,
                surahTitle: reader.surah?.name ?? "Quran"
            ) { session in
                minimizedResearch.removeAll { $0.id == session.id }
                minimizedResearch.append(session)
            }
        }
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

private struct WordRootOverlay: View {
    let onDismiss: (ResearchSession) -> Void
    let surahTitle: String
    @Environment(\.dismiss) private var dismiss
    @State private var session: ResearchSession
    @State private var history: [QuranWord]
    @State private var historyIndex: Int
    @State private var result: WordRootResponse?
    @State private var isLoading = true
    @State private var error: String?

    init(session: ResearchSession, surahTitle: String, onDismiss: @escaping (ResearchSession) -> Void) {
        self.onDismiss = onDismiss
        self.surahTitle = surahTitle
        _session = State(initialValue: session)
        _history = State(initialValue: session.history)
        _historyIndex = State(initialValue: session.historyIndex)
    }

    private var activeWord: QuranWord { history[historyIndex] }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Looking up \(activeWord.text)…")
                } else if let result {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 14) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Root: \(result.wordsInfo.first?.root ?? result.title)")
                                    .font(.headline)
                                Text("\(result.totalMatches) Quran occurrences")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 20)

                            ForEach(result.versesArray) { verse in
                                RootMatchVerseCard(verse: verse, onWordTap: open)
                            }
                        }
                        .padding(.vertical, 12)
                    }
                } else {
                    ReaderStatusView(title: "Root unavailable", icon: "exclamationmark.triangle", detail: error ?? "Try again.")
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                ResearchPath(
                    surahTitle: surahTitle,
                    words: history,
                    currentIndex: historyIndex,
                    select: { historyIndex = $0 },
                    dismissStep: dismissStep,
                    selectSurah: finishResearch
                )
                .padding(.vertical, 7)
                .background(.bar)
            }
            .navigationTitle("QuranAlive")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button { historyIndex -= 1 } label: { Image(systemName: "chevron.backward") }
                        .disabled(historyIndex == 0)
                        .accessibilityLabel("Back")
                    Button { historyIndex += 1 } label: { Image(systemName: "chevron.forward") }
                        .disabled(historyIndex >= history.count - 1)
                        .accessibilityLabel("Forward")
                }
            }
        }
        .task(id: activeWord.location) { await loadRoot(for: activeWord) }
    }

    private func open(_ word: QuranWord) {
        guard word.location != activeWord.location else { return }
        history = Array(history.prefix(historyIndex + 1)) + [word]
        historyIndex = history.count - 1
    }

    private func dismissStep(_ index: Int) {
        history.removeSubrange(index...)
        if history.isEmpty {
            finishResearch()
        } else {
            historyIndex = min(historyIndex, history.count - 1)
        }
    }

    private func loadRoot(for word: QuranWord) async {
        isLoading = true
        result = nil
        error = nil
        do {
            let loaded = try await QuranAPI.shared.wordRoot(for: word.location)
            guard activeWord.location == word.location else { return }
            result = loaded
        } catch {
            guard activeWord.location == word.location else { return }
            self.error = error.localizedDescription
        }
        guard activeWord.location == word.location else { return }
        isLoading = false
    }

    private func finishResearch() {
        session.history = history
        session.historyIndex = historyIndex
        onDismiss(session)
        dismiss()
    }
}

private struct ResearchTabDock: View {
    let surahTitle: String
    let sessions: [ResearchSession]
    let open: (ResearchSession) -> Void
    let dismissStep: (Int) -> Void

    var body: some View {
        ResearchPath(
            surahTitle: surahTitle,
            words: sessions.last?.history ?? [],
            currentIndex: sessions.last?.historyIndex ?? -1,
            select: { index in
                guard var reopened = sessions.last else { return }
                reopened.historyIndex = index
                open(reopened)
            },
            dismissStep: dismissStep,
            selectSurah: {}
        )
        .padding(.vertical, 7)
        .background(.bar)
    }
}

private struct ResearchPath: View {
    let surahTitle: String
    let words: [QuranWord]
    let currentIndex: Int
    let select: (Int) -> Void
    let dismissStep: (Int) -> Void
    let selectSurah: () -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                Button(action: selectSurah) {
                    Label(surahTitle, systemImage: "book.closed.fill")
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .foregroundStyle(.white)
                        .background(Color.green, in: Capsule())
                }

                ForEach(Array(words.enumerated()), id: \.offset) { index, word in
                    Image(systemName: "arrow.right")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                    HStack(spacing: 2) {
                        Button { select(index) } label: {
                            Text(word.text)
                                .font(.custom("Geeza Pro", size: 17))
                        }
                        Button { dismissStep(index) } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.caption)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .foregroundStyle(index == currentIndex ? .white : Color.teal)
                    .background(
                        index == currentIndex ? Color.teal : Color.teal.opacity(0.12),
                        in: Capsule()
                    )
                    .accessibilityLabel("Research step \(index + 1): \(word.text)")
                }
            }
            .padding(.horizontal, 20)
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}

private struct RootMatchVerseCard: View {
    let verse: RootMatchVerse
    let onWordTap: (QuranWord) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(verse.suraNumber):\(verse.verseNumber)")
                .font(.caption.weight(.bold))
                .foregroundStyle(.teal)

            FlowLayout(spacing: 7) {
                ForEach(verse.words) { word in
                    Button(word.wordText) {
                        onWordTap(QuranWord(position: word.position, text: word.wordText, surahNumber: verse.suraNumber, verseNumber: verse.verseNumber))
                    }
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

private struct ResearchSession: Identifiable {
    let id: UUID
    var history: [QuranWord]
    var historyIndex: Int

    init(word: QuranWord) {
        id = UUID()
        history = [word]
        historyIndex = 0
    }

    var activeWord: QuranWord { history[historyIndex] }
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
