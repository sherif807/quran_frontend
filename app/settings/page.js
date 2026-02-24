import Header from "../components/Header";
import SpeechSettings from "../components/SpeechSettings";
import QuranTranslationSettings from "../components/QuranTranslationSettings";
import BibleTranslationSettings from "../components/BibleTranslationSettings";
import BackButton from "../components/BackButton";

export const metadata = {
  title: "Settings",
};

const normalizeSection = (raw) => {
  const value = String(raw || "").toLowerCase();
  if (value === "quran" || value === "tanakh" || value === "nt") return value;
  return "";
};

export default function SettingsPage({ searchParams }) {
  const section = normalizeSection(searchParams?.section);
  const showQuran = section === "quran";
  const showTanakh = section === "tanakh";
  const showNt = section === "nt";
  const showAll = !section;

  const fallbackHref =
    section === "tanakh" ? "/tanakh/GEN%201" : section === "nt" ? "/nt/MT%201" : "/1";

  return (
    <div className="container py-3">
      <Header section={section} />
      <div className="settings-header mb-3">
        <h3 className="mb-0">Settings</h3>
      </div>

      {(showAll || showTanakh) && (
        <div className="mb-4">
          <SpeechSettings
            inline
            storageKey="hebrew_tts_settings"
            title="Hebrew speech"
            defaultLanguage="he-IL"
            defaultPreviewText="בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
          />
        </div>
      )}
      {(showAll || showNt) && (
        <SpeechSettings
          inline
          storageKey="greek_tts_settings"
          title="Greek speech"
          defaultLanguage="el-GR"
          defaultPreviewText="Ἐν ἀρχῇ ἦν ὁ λόγος"
        />
      )}

      {(showAll || showQuran) && <QuranTranslationSettings />}
      {(showAll || showTanakh || showNt) && <BibleTranslationSettings />}

      <div className="mt-4">
        <BackButton fallbackHref={fallbackHref} />
      </div>
    </div>
  );
}
