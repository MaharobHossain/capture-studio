# Capture Studio - Deployment Guide

## 1. Web Deployment (Vercel)

Capture Studio is optimized for single-command static deployment on Vercel or any modern static hosting platform (Cloudflare Pages, Netlify).

### Steps:
1. Connect your Git repository to Vercel.
2. Ensure the build configuration is set:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variables in Vercel Project Settings (Optional):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The included `vercel.json` automatically configures client-side SPA route rewrites and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).

---

## 2. Progressive Web App (PWA) Deployment

- An auto-updating Service Worker is generated using `vite-plugin-pwa` and Workbox.
- Secure context (`https://`) is mandatory for PWA installation and MediaStream APIs (`getDisplayMedia` / `getUserMedia`).
- Desktop Chrome, Edge, and Android Chrome will automatically surface the install icon in the address bar.

---

## 3. Android APK & AAB Production Build

### Generate Release APK / AAB
1. In Android Studio, open the `android/` project:
   ```bash
   npx cap open android
   ```
2. Navigate to **Build > Generate Signed Bundle / APK**.
3. Choose **Android App Bundle** (for Google Play Store) or **APK** (for direct distribution).
4. Provide your signing keystore credentials.
5. Select **release** build variant and click **Finish**.

