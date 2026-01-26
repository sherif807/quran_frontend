"use client";

import PlayHebrew from "./PlayHebrew";

export default function PlayGreek({ text }) {
  return (
    <PlayHebrew
      text={text}
      storageKey="greek_tts_settings"
      defaultLanguage="el-GR"
    />
  );
}
