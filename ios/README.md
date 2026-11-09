# QuranAlive iPhone starter

This is an isolated native SwiftUI starter. It does not call, wrap, or migrate
the existing web app yet.

## What it proves

The project can be generated and built on a cloud macOS runner, then delivered
to a real iPhone through TestFlight without a locally owned Mac.

## Before the first cloud build

1. Create the Apple App Store Connect record and reserve the bundle identifier.
2. Replace `com.quranalive.iphone` in `project.yml` and `../codemagic.yaml`
   with that exact identifier if Apple assigns a different one.
3. Connect the repository to Codemagic.
4. In Codemagic, connect the Apple Developer and App Store Connect accounts and
   create the `app_store_connect` environment-variable group expected by the
   workflow.
5. Trigger `quranalive-ios-testflight`; install the resulting build from
   TestFlight on the iPhone.

Do not add Quran text, accounts, recitation audio, or analysis features until
the TestFlight shell has been successfully installed and verified.
