# Radio Player — Setup Guide

Everything you need to go from zero to a working player. Do these steps in order.

---

## Step 1: Cloudflare Account + R2 Bucket

### 1.1 Create a Cloudflare account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up (free tier is fine — R2 has zero egress fees)

### 1.2 Create the R2 bucket

1. In the Cloudflare dashboard, click **R2 Object Storage** in the left sidebar
2. Click **Create bucket**
3. Name it `radio-tracks`
4. Choose a region (or leave as automatic)
5. Click **Create bucket**

**Do NOT enable public access** — the backend generates signed URLs for each track.

### 1.3 Create an R2 API token

1. Go to **R2** → **Overview** → **Manage R2 API Tokens** (or **R2** → **API Tokens**)
2. Click **Create API Token**
3. Permissions: **Object Read & Write**
4. Scope: Specify the `radio-tracks` bucket only
5. Click **Create API Token**
6. **Save these immediately** (they're shown only once):
   - `Access Key ID` → this becomes `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → this becomes `R2_SECRET_ACCESS_KEY`
7. Note your **Account ID** from the dashboard URL (the hex string after `/accounts/`) → this becomes `R2_ACCOUNT_ID`

### 1.4 Upload your MP3 files

1. Go to **R2** → **radio-tracks** bucket
2. Click **Upload** → select your MP3 files
3. Upload them to the bucket root — **no folders**
4. Name files with hyphens, no spaces. Examples:
   ```
   track-001-artist-title.mp3
   track-002-artist-title.mp3
   late-night-jazz-miles.mp3
   ```

### 1.5 Note your R2 endpoint

Your R2 endpoint follows this pattern:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

This becomes `R2_PUBLIC_ENDPOINT`.

---

## Step 2: Supabase Account + Project

### 2.1 Create a Supabase account

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (free tier covers MVP)

### 2.2 Create a project

1. Click **New Project**
2. Name it anything (e.g. `radio-player`)
3. Set a database password (save it somewhere — you won't need it for this setup, but don't lose it)
4. Choose a region close to your listeners
5. Click **Create new project**
6. Wait for it to finish provisioning (~2 minutes)

### 2.3 Note your project credentials

Go to **Settings** → **API** and save:

- **Project URL** — looks like `https://abcdefghijk.supabase.co`
  - This is `SUPABASE_URL` (auto-injected into Edge Functions)
- **Service Role Key** (under "Project API Keys") — the long `eyJ...` string labeled `service_role`
  - This is `SUPABASE_SERVICE_ROLE_KEY` (auto-injected into Edge Functions)
- **Project Reference** — the `abcdefghijk` part of the URL. You'll need this for the Supabase CLI.

### 2.4 Run the database schema

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_schema.sql` and paste it
4. Click **Run**
5. You should see "Success. No rows returned" — this means all tables, indexes, and the RPC function were created

### 2.5 Add your first listener(s)

Still in the SQL Editor, run:

```sql
INSERT INTO users (username, access_code) VALUES
  ('alice', 'sunflower-tide'),
  ('bob',   'hollow-mirror');
```

Replace with real usernames and access codes. Each access code must be unique. This is what listeners type to log in.

To revoke access later without deleting history:
```sql
UPDATE users SET active = FALSE WHERE username = 'bob';
```

---

## Step 3: Seed the Tracks Table

Every MP3 in your R2 bucket needs a matching row in the `tracks` table. The `filename` column must exactly match the R2 object key.

### Option A: Seed script (recommended for many tracks)

1. Create a `tracks.json` file (see `scripts/tracks.example.json` for format):
   ```json
   [
     { "filename": "track-001-artist-title.mp3", "title": "Track Title" },
     { "filename": "track-002-artist-title.mp3", "title": "Another Track" },
     { "filename": "late-night-jazz-miles.mp3", "title": "Late Night Jazz" }
   ]
   ```
   The `filename` must exactly match what you uploaded to R2. The `title` is what displays in the player.

2. Install the dependency and run:
   ```bash
   cd radio-player
   npm install @supabase/supabase-js

   SUPABASE_URL=https://abcdefghijk.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
   node scripts/seed-tracks.js tracks.json
   ```

3. You should see output like:
   ```
   Seeded 3 tracks:
     track-001-artist-title.mp3 → a1b2c3d4-...
     track-002-artist-title.mp3 → e5f6g7h8-...
     late-night-jazz-miles.mp3 → i9j0k1l2-...
   ```

### Option B: Manual SQL (fine for a few tracks)

In the Supabase SQL Editor:

```sql
INSERT INTO tracks (filename, title) VALUES
  ('track-001-artist-title.mp3', 'Track Title'),
  ('track-002-artist-title.mp3', 'Another Track'),
  ('late-night-jazz-miles.mp3', 'Late Night Jazz');
```

### Verify

In the Supabase **Table Editor**, click on the `tracks` table. You should see your tracks with auto-generated UUIDs.

---

## Step 4: Set Edge Function Environment Variables

### 4.1 Generate a JWT secret

You need a random string (min 32 characters) for signing auth tokens. Generate one:

```bash
openssl rand -base64 48
```

Or use any password generator. Save this — it becomes `JWT_SECRET`.

### 4.2 Set the variables in Supabase

1. Go to **Settings** → **Edge Functions** in the Supabase dashboard
2. Click **Add New Secret** for each of these:

| Variable Name | Value | Where to find it |
|---|---|---|
| `R2_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare dashboard URL |
| `R2_ACCESS_KEY_ID` | R2 API token access key | From Step 1.3 |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | From Step 1.3 |
| `R2_BUCKET_NAME` | `radio-tracks` | The bucket name from Step 1.2 |
| `R2_PUBLIC_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | From Step 1.5 |
| `JWT_SECRET` | Your random 32+ char string | From Step 4.1 |

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — you don't need to set them.

---

## Step 5: Deploy Edge Functions

### 5.1 Install the Supabase CLI

```bash
npm install -g supabase
```

Or on macOS:
```bash
brew install supabase/tap/supabase
```

### 5.2 Log in

```bash
npx supabase login
```

This opens a browser to authenticate. Copy the token back into the terminal.

### 5.3 Link your project

```bash
cd radio-player
npx supabase link --project-ref abcdefghijk
```

Replace `abcdefghijk` with your project reference (from Step 2.3).

### 5.4 Deploy all functions

```bash
npx supabase functions deploy auth-login --no-verify-jwt
npx supabase functions deploy tracks-list
npx supabase functions deploy tracks-url
npx supabase functions deploy tracks-report
```

`auth-login` uses `--no-verify-jwt` because it handles its own auth (users don't have a JWT yet when logging in).

### 5.5 Verify deployment

Go to **Edge Functions** in the Supabase dashboard. You should see all 4 functions listed as "Active".

Test the login endpoint:
```bash
curl -X POST https://abcdefghijk.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"code": "sunflower-tide"}'
```

You should get back:
```json
{"token":"eyJ...","username":"alice"}
```

Test the tracks list (using the token from above):
```bash
curl https://abcdefghijk.supabase.co/functions/v1/tracks-list \
  -H "Authorization: Bearer eyJ..."
```

You should get back your track list.

---

## Step 6: Configure the Frontend

### 6.1 Set the API URL

Your Edge Functions base URL is:
```
https://abcdefghijk.supabase.co/functions/v1
```

**For local development**, create a `.env` file in `radio-player/`:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=https://abcdefghijk.supabase.co/functions/v1
```

**For GitHub Pages deployment**, add this as a repository secret:
1. Go to your GitHub repo → **Settings** → **Secrets and Variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_API_BASE_URL`
4. Value: `https://abcdefghijk.supabase.co/functions/v1`

### 6.2 Run locally

```bash
cd radio-player
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173/radio-player/`).

Enter one of your access codes (e.g. `sunflower-tide`). If everything is wired up, you should see the player and hear music.

---

## Step 7: Deploy to GitHub Pages

**Important**: This repo already deploys `foundroom.co` via GitHub Pages. A single repo can only have one Pages deployment. You have two options:

### Option A: Integrate into existing workflow (recommended)

The existing `.github/workflows/deploy.yml` builds the static site and deploys it. To include the radio player, the workflow needs to also build the radio player and place its output at `/radio-player/` in the final artifact.

This requires modifying the existing `deploy.yml` — add these steps after "Build site" and before "Upload site":

```yaml
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Build radio player
      working-directory: radio-player
      run: |
        npm ci
        npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

    - name: Stage radio player for deployment
      run: |
        cp -r radio-player/dist _radio-build
        rm -rf radio-player
        mv _radio-build radio-player
```

After deploying, the player will be live at `foundroom.co/radio-player/`.

### Option B: Deploy separately

Host the radio player somewhere else (Vercel, Netlify, Cloudflare Pages) instead of GitHub Pages. Just run `npm run build` and deploy the `dist/` folder.

---

## Step 8: Verify Everything Works

Open the player URL and walk through this checklist:

**Auth**
- [ ] Enter a valid access code → player loads, username visible
- [ ] Enter a wrong code → error message shown
- [ ] Refresh the page → still logged in (token persists)
- [ ] Set a user to `active = FALSE` in SQL → next login attempt returns error

**Playback**
- [ ] Player starts → music plays
- [ ] Skip → next track plays, no silence gap
- [ ] Let a track end naturally → next track plays automatically
- [ ] Play through all tracks → queue reshuffles and continues
- [ ] First track of new cycle is not the same as last track of previous cycle

**Reporting**
- [ ] Click Report → "Reported — skipping" flash appears for 2 seconds
- [ ] Reported track skips to next track
- [ ] Check `tracks` table → reported track has `flagged = TRUE`
- [ ] Check `reports` table → report row exists with correct user
- [ ] Refresh and play again → reported track never appears

**Data**
- [ ] Check `play_events` table → rows exist for tracks you played

---

## Quick Reference: All Environment Variables

### Supabase Edge Functions (set in Supabase Dashboard)

| Variable | Example | Notes |
|---|---|---|
| `R2_ACCOUNT_ID` | `a1b2c3d4e5f6` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | `abc123...` | R2 API token |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` | R2 API secret |
| `R2_BUCKET_NAME` | `radio-tracks` | Your bucket name |
| `R2_PUBLIC_ENDPOINT` | `https://a1b2c3d4e5f6.r2.cloudflarestorage.com` | R2 S3 endpoint |
| `JWT_SECRET` | `your-random-32-char-string` | For signing tokens |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

### GitHub Repo Secret (for CI deployment)

| Secret | Example |
|---|---|
| `VITE_API_BASE_URL` | `https://abcdefghijk.supabase.co/functions/v1` |

### Local `.env` (for local dev)

| Variable | Example |
|---|---|
| `VITE_API_BASE_URL` | `https://abcdefghijk.supabase.co/functions/v1` |

---

## Troubleshooting

**"Invalid access code" when logging in**
- Check the `users` table — does the access code match exactly? (case-sensitive)
- Is the user's `active` column `TRUE`?

**Tracks list returns empty**
- Did you seed the tracks table? Check in the Supabase Table Editor
- Are all tracks `flagged = FALSE`?

**Audio doesn't play / signed URL errors**
- Verify R2 env vars are set correctly in Supabase Edge Functions
- Make sure `R2_PUBLIC_ENDPOINT` follows the format `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (no trailing slash, no bucket name)
- Make sure the `filename` in the tracks table exactly matches the R2 object key
- Check the browser console for CORS errors

**CORS errors in browser**
- Edge Functions include `Access-Control-Allow-Origin: *` — if you still see CORS errors, check that the function deployed successfully
- Run `npx supabase functions deploy <function-name>` again

**401 Unauthorized on tracks endpoints**
- Your JWT may have expired or been malformed
- Clear `radio_token` from localStorage (DevTools → Application → Local Storage) and log in again
