# SMARAK Udaipur

Offline-first, bilingual (Hindi / English) AR heritage companion for Udaipur and Nathdwara. It tells each monument's story out loud in Indian-accent voices, shows a 3D model over your camera, spreads crowds away from hotspots, and sends spend to local artisans and green stays.

Hackathon domain: **Heritage, Tourism & Sustainable Hospitality** · Author: Hardik Gupta, JECRC Foundation, Jaipur

## What works in this prototype

| Feature | How it works |
|---|---|
| **Login** | Google sign-in (official button on the web, native account picker in the APK), a 6-digit code sent by real email or SMS, and guest mode. |
| **Two traveller experiences** | First launch asks Indian traveller vs international visitor. Indian: home state, Hindi/English, yatra tips, UPI and Nathdwara pilgrimage hints. International: country, first-time-in-India, visitor essentials (etiquette, 112 and 1363 helplines), English with an Indian accent. Both get a day-by-day plan from days, group and interests. No passport or ID numbers are ever asked. |
| **Time-zone aware** | Greets in the visitor's own local time (Good morning / सुप्रभात ...). Crowd and "best time" always use Udaipur time (IST), so a visitor planning from abroad sees the right numbers. |
| **All of Mewar** | Udaipur, Eklingji, Nagda, Nathdwara (Shrinathji, Statue of Belief), Haldighati, Kumbhalgarh, Ranakpur and Chittorgarh (fort, Vijay Stambh), with a day-trip planner. |
| **Photos** | Real photos bundled offline in `public/img` (sites and hotel stays). |
| **AR / 3D view** | Two modes. 3D: model centred, drag to rotate, pinch to zoom. AR: live rear camera, gyroscope steers the view, Recenter button. No camera or gyro (laptop)? It falls back to 3D. If WebGL is unsupported it says so. |
| **VR mode** | Tap the headset button for side-by-side stereo for a Cardboard-style viewer. |
| **Multilingual narration** | Prefers device voices for the selected language and can use Google Cloud Text-to-Speech for en-IN, hi-IN, and supported regional languages. Passport > Voice includes a test for the selected language. Captions remain visible if no voice can play. |
| **Ask the guide** | Type or speak (Chrome/Android) in the selected language. Answers come from the offline heritage pack; when online and `GEMINI_API_KEY` is configured on the server, Gemini answers live and the app falls back to the offline guide if the service is unavailable. |
| **Crowd-aware routing** | Per-site hourly crowd curves + weekend factor + live anonymous check-ins give a density score, best hour, and a "try instead" nudge to the nearest quiet, equally rich site. |
| **Artisan Trail / Green Stays** | Includes illustrative sample entries and public business listings with directions and official information links. Public listings do not imply a formal partnership. |
| **Heritage Passport** | Stamps and XP (lesser-known sites earn 2.5x). GPS check-in within 500 m, or Demo mode to try from anywhere. |
| **Offline** | PWA precache + local storage. Install it once and it keeps working inside forts and palaces. |

Photos and stays: the first three stay photos and names are illustrative sample entries; one sample photo shows another hotel's signage. Website-linked stays cite public sustainability information. Site photos are still missing for Nagda Sas-Bahu, Chittorgarh Fort, Vijay Stambh, Kumbhalgarh, Ranakpur, Haldighati, and Fateh Sagar; add permission-cleared destination photos before real use. Honest limits: crowd numbers are modelled estimates (not real sensor data), the 3D models are procedural low-poly stand-ins, and offline Q&A is retrieval over the content pack (on-device Gemma is the roadmap, see below).

## Run on your laptop

Requirements: Node.js 20+ (22 recommended).

```bash
npm install
npm run dev          # open http://localhost:5173
```

Tip: use Chrome DevTools device mode (phone size). Allow the camera when asked.

### Test on your phone (camera needs HTTPS)

```bash
npm run dev:https    # then open https://<laptop-ip>:5173 on the phone (same Wi-Fi), accept the certificate warning
```

## Build the Android APK

Requirements: Node 20+, **JDK 21**, **Android Studio** (with an SDK installed; open it once so it sets up `ANDROID_HOME`).

```bash
npm install
npm run build
npm run android:add      # first time only: creates ./android and adds camera/GPS/mic permissions
npm run android:sync     # every time you change the web code
npm run android:open     # opens Android Studio: Build > Build APK(s)
```

Or from the command line: `npm run apk` (debug APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`). Copy it to your phone and install (allow "unknown sources").

App icon: `npx @capacitor/assets generate --android` (uses `assets/icon.png`).

Release/signed APK for sharing: Android Studio > Build > Generate Signed Bundle / APK.

No Android Studio? The same code installs as a PWA: deploy to Vercel, open in Chrome on Android, menu > Install app.

## What you need to set up (one time)

Put values in a `.env` file for `npm run dev`, and in Vercel > Settings > Environment Variables for the deployed site. Provider usage may incur charges. A template is in `.env.example`.

**1. Email verification codes (real emails, no demo mode).** In Vercel > Project Settings > Environment Variables, set `AUTH_SECRET` and either `SMTP_USER` plus `SMTP_PASS`, or `RESEND_API_KEY`. For Gmail SMTP:
1. Turn on 2-step verification for the Gmail account, then create an *App password* (Google Account > Security > App passwords).
2. Set `SMTP_USER=yourname@gmail.com`, `SMTP_PASS=<the 16-character app password>` and `AUTH_SECRET=<any long random text>`.

Alternative: Resend (`RESEND_API_KEY`, `AUTH_SECRET`, and a verified domain in `MAIL_FROM`, because Resend's default sender only delivers to your own address). Without these, the email button shows "not set up on this server yet" instead of a fake code.

**2. Google sign-in.** Google Cloud Console > APIs & Services > Credentials.
- Web / PWA: *Create credentials > OAuth client ID > Web application*. Under *Authorized JavaScript origins* add `http://localhost:5173` and your Vercel production domain (Google does not accept IP addresses). Put the client ID in `VITE_GOOGLE_CLIENT_ID` in Vercel. This is a build-time variable: redeploy after adding or changing it. First time only, configure the OAuth consent screen and add your test users.
- Android APK: create a second client of type *Android* with package name `in.agnibytes.smarak` and your debug SHA-1 (`cd android && ./gradlew signingReport`). Keep the *Web* client ID in `VITE_GOOGLE_CLIENT_ID`, then `npm run android:sync`. The APK uses the native account picker (`@capgo/capacitor-social-login`); if it errors on the phone, apply the `MainActivity` step in that plugin's README for your installed version.

**3. Phone verification codes.** Create a Twilio Verify service and set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in your local `.env` and Vercel's Environment Variables. Phone numbers must include their country calling code in E.164 format (for example, `+919876543210`). Twilio sends and verifies the code; SMARAK does not store the code. SMS charges and country delivery rules depend on your Twilio account.

**4. Translation into regional languages + live AI answers.** Create a Gemini API key at aistudio.google.com and set `GEMINI_API_KEY` in Vercel's Environment Variables. This key is required to translate the app and site content into non-English/Hindi languages; the first translation is cached on the device for offline use. Redeploy after adding the variable.

The default model is `gemini-3.8-flash`. If you override `GEMINI_MODEL` in Vercel, use a model ID enabled for your Gemini API project.

**5. Cloud narration in regional languages.** Enable *Cloud Text-to-Speech API* in Google Cloud, create an API key, and set `GOOGLE_TTS_API_KEY` in Vercel. This lets the app speak in the selected language when the device has no matching voice. Redeploy after adding the variable. Without it, speech depends on voices installed on the traveller's device.

**6. Deploy.** `npm i -g vercel`, then `vercel` in this folder. For the APK also set `VITE_API_URL=https://<your-project>.vercel.app` in `.env` before `npm run android:sync`, because the APK has no server of its own. `npm run dev` already serves the same `/api` routes locally using your `.env`.

After deployment, open `/api/health` on your site. It returns only true/false readiness flags for Google, email, SMS, Gemini, and cloud speech; it never returns secret values. Set Vercel variables for Production (and Preview if you use preview deployments), then redeploy.

## Languages

- English and Hindi are built in and work offline.
- Indian travellers: choosing a home state offers its language (including Gujarati, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Konkani, Nepali, and Maithili where mapped).
- International visitors: choosing a country offers its language (French, German, Spanish, Italian, Japanese, Korean, Chinese, Arabic, Hebrew, Russian and more, see `src/lib/langs.ts`).
- The language button (globe, top right) always lists English, Hindi and the traveller's regional language(s). Right-to-left languages flip the layout.
- Narration uses the phone's voice for that language if one is installed. Free-form Q&A in other languages needs the Gemini key; the offline guide understands English and Hindi questions.
- `/api/health` shows which Vercel integrations have their required environment variables set. It returns readiness flags only, never credentials.

## 3D models: what is real and what is not

Each monument now has its own hand-built model following its real silhouette (City Palace lake facade with octagonal domed towers, Jagdish Temple's stair with elephants and tall shikhara, Lake Palace island, Vijay Stambh's nine storeys, Kumbhalgarh's winding wall, Ranakpur's marble domes and spires, and so on). They are **approximations, not scans**. For photoreal results, download or capture a model and save it as `public/models/<site-id>.glb` (for example `public/models/city-palace.glb`). The app detects the file and uses it instead, no code change. Site ids are in `src/data/sites.ts`. Sources: your own phone scans (Polycam or Luma), or downloadable models on Sketchfab where the license allows. Keep each file under about 15 MB.

## Photos

Photos live in `public/img/<site-id>.jpg` and are picked up automatically by setting `img` on the site in `src/data/sites.ts`. The new Mewar sites (Eklingji, Nagda, Chittorgarh, Vijay Stambh, Kumbhalgarh, Ranakpur, Haldighati, Fateh Sagar) have a drawn cover until you add photos.

## Logo and app icon

Your logo is used as the app icon, adaptive icon, splash and login screen. After `npm run android:add`, run `npm run assets` once to generate all Android icon and splash sizes from `assets/`.

## Optional: turn on Gemini (online deep Q&A)

```bash
npm i -g vercel && vercel          # deploys the site and api/ask.ts
# In the Vercel dashboard add env var GEMINI_API_KEY (and optionally GEMINI_MODEL).
# For cloud Indian voices also add GOOGLE_TTS_API_KEY (Cloud Text-to-Speech API enabled).
# Then set VITE_API_URL=https://<your-project>.vercel.app in .env and rebuild
```

The key never ships inside the app.

## Put it on GitHub

```bash
git init && git add . && git commit -m "SMARAK Udaipur prototype"
git branch -M main && git remote add origin https://github.com/<you>/smarak-udaipur.git && git push -u origin main
```

## Project layout

```
src/data/sites.ts      Content pack: 17 sites across Mewar (Udaipur, Nathdwara corridor, Kumbhalgarh, Chittorgarh) (EN + HI), artisans, stays. Add a monument = add one object.
src/lib/crowd.ts       Crowd engine: density, best hour, nudge, check-ins
src/lib/guide.ts       Offline Q&A + Gemini escalation
src/lib/voice.ts       Regional TTS with captions, voice input, installed-voice fallback
src/ar/models.ts       Procedural 3D models (swap for glTF scans later)
src/screens/*          Home, Explore, Site, Trail, Passport, ARView
api/ask.ts             Optional Gemini proxy (Vercel)
api/tts.ts             Optional cloud Indian voices
api/send-code.ts, verify-code.ts   Email verification codes (stateless, signed)
api/send-phone-code.ts, verify-phone-code.ts   Twilio Verify SMS codes
api/health.ts          Safe Vercel integration readiness check (`/api/health`)
scripts/patch-android.mjs   Adds Android permissions
```

## Roadmap (matches the deck)

1. On-device Gemma via MediaPipe LLM Inference in the Android build, for free-form offline Q&A.
2. Firebase Auth + Firestore: real anonymous check-ins feeding the crowd engine; BigQuery/Looker dashboard for curators.
3. Photoreal glTF models and pre-generated multilingual audio packs from Cloud TTS.
4. Verified artisan and stay onboarding; more cities via content packs.

Voice note: on Android install Google Text-to-speech and download the *English (India)* and *Hindi* voices (Settings > Text-to-speech). Windows/Chrome desktop usually ships en-IN voices; Hindi may need the Google Hindi voice online. Camera permission note: if you built the APK before running `npm run android:prep`, rebuild so the camera permission is present.
