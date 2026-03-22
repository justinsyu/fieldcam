# FieldCam Design Spec

## Overview

FieldCam is a mobile app for pharma professionals attending conferences. It captures photos of poster sessions, slide presentations, booth materials, and business cards, then auto-uploads them to the user's cloud storage and optionally processes them with AI (OCR + custom prompts) to generate summaries, extracted data, or other deliverables.

The app is inspired by UploadCam (v4.3.5 by Bitwise SL) but adds AI-powered processing as its core differentiator.

## Technology Stack

- **Frontend:** React Native with Expo (cross-platform iOS/Android)
- **Backend:** Stateless serverless API (Node.js on AWS Lambda or Cloud Run)
- **Auth:** OAuth via cloud providers (Google, Microsoft, Dropbox) - no separate FieldCam account
- **Cloud Storage:** Google Drive, OneDrive, Dropbox (user's own accounts)
- **AI Processing:** Cloud-side OCR + LLM prompting
- **OTA Updates:** Expo OTA for prompt/AI changes without app store review

## Design Language

Inspired by cohere.com:
- **Primary palette:** Deep navy (#152455), black (#000000), white (#FFFFFF)
- **Accent:** Orange (#DA532C)
- **Aesthetic:** Dark-mode enterprise, minimalist, gradient backgrounds, card-based layouts, generous whitespace
- **Typography:** Clean sans-serif, high contrast

## Architecture

```
FieldCam App (React Native / Expo)
  |
  +--> Camera Module --> Upload Queue --> Cloud Storage (Drive/OneDrive/Dropbox)
  |                                          |
  +--> Processing Config UI                  | (if AI enabled)
  |                                          v
  |                              FieldCam Processing API (Stateless)
  |                                  OCR --> LLM Prompt
  |                                          |
  |                                          v
  |                              Delivery: Same Folder / Other Folder / Email
```

**Key principle:** The processing API is stateless for image data (never stores photos). A lightweight database (e.g., Firestore or DynamoDB) stores user accounts, team configs, processing profiles, and usage quotas.

### Data Flow

1. User takes a photo in the app
2. Photo uploads directly to the user's chosen cloud storage folder
3. If AI processing is enabled, the app sends the image to FieldCam's processing API along with the user's OAuth token and processing profile config
4. The API performs OCR (Google Cloud Vision), applies the user's prompt template via LLM (Claude API), and generates output
5. The API uses the forwarded OAuth token to upload results to the user's cloud storage, or sends via email (SendGrid)
6. The app receives a completion callback and updates the upload queue status

### Processing API

**Base URL:** `https://api.fieldcam.app/v1`

**Authentication:** The app sends a FieldCam JWT (issued at OAuth login) in the `Authorization` header. The user's cloud OAuth token is sent in `X-Cloud-Token` for cloud storage write-back.

**Endpoints:**

- `POST /process` - Submit an image for processing
  - Body: `{ image: <base64 or multipart>, profile: { prompt, delivery }, cloudToken: <oauth token>, destination: { provider, folderId, email? } }`
  - Response: `{ jobId, status: "queued" }`
  - Max image size: 20MB

- `GET /process/:jobId` - Check processing status
  - Response: `{ jobId, status: "queued|processing|completed|failed", result?: { text, deliveredTo } }`

- `GET /profiles` - List team/default profiles
- `POST /profiles` - Create a profile (admin only for team profiles)
- `PUT /profiles/:id` - Update a profile
- `DELETE /profiles/:id` - Delete a profile

**Rate limiting:** 100 requests/hour per user (free tier), configurable per plan.

### AI/OCR Providers

- **OCR:** Google Cloud Vision API (high accuracy on printed text, good with posters/slides)
- **LLM:** Claude API (Anthropic) for prompt processing
- **Email:** SendGrid for result delivery via email
- **Fallback:** If Vision API is unavailable, fall back to Tesseract OCR (lower quality but functional)

## Screens & Navigation

**Navigation:** Bottom tab bar with 4 tabs: Camera (center, prominent), Uploads, Profiles, Settings

### 1. Camera Screen (Primary)

The main screen users see after login. Based on UploadCam's camera view but with FieldCam branding.

**Elements:**
- Live camera viewfinder (full screen behind UI)
- Top bar: current folder name with cloud provider icon, location pin (GPS tagging), overflow menu (gear icon)
- Bottom controls: annotation toggle button, shutter button (large, center), camera flip button
- Resolution indicator
- Flash toggle
- Grid overlay toggle (from settings)
- QR code scan button (for quick folder/settings configuration)

**Behavior:**
- Tapping shutter captures and queues for upload
- Long-press shutter for burst mode (stretch goal)

### 2. Folder Picker Screen

Lets users browse and select upload destination folders in their connected cloud storage.

**Elements:**
- Current Upload Folder section (shows active folder with cloud provider icon)
- "Choose a Folder" button (opens cloud storage browser)
- Cloud storage browser: alphabetical folder list with icons, "New Folder" button, search
- Favorites section (starred folders)
- Team Folders section (admin-assigned folders)
- Recents section (recently used folders)
- "Take Photos Here" floating action button (sets folder and returns to camera)
**Behavior:**
- Tapping a folder shows its contents or selects it
- Long-press shows context menu (remove from recents, add to favorites)

### 3. Upload Queue Screen

Shows pending and completed uploads.

**Elements:**
- List of queued uploads with thumbnails, file names, upload progress bars
- Status indicators: pending, uploading, completed, failed
- "View Previous Uploads" button (upload history)
- Pull-to-refresh
- Empty state: illustration + "No Uploads Pending" message

**Settings affecting uploads (configured in Settings screen):**
- Upload immediately (toggle, default ON)
- Upload in background (toggle)
- Upload using cellular network (toggle)
- WiFi-only mode

### 4. Processing Profiles Screen

The core differentiator from UploadCam. Users configure AI processing rules here.

**Elements:**
- List of processing profiles, each showing:
  - Profile name (e.g., "Poster Summary", "Slide Notes", "Business Card Extract")
  - Brief description
  - Active/inactive toggle
  - Edit button
- "Add Profile" floating action button
- Profile editor (opens as a full screen or bottom sheet):
  - Name field
  - Prompt template (multi-line text editor with placeholder hints)
  - Delivery destination picker: same folder (as .txt/.pdf), different folder, email address
  - Test button (process a sample image to preview results)
  - Active toggle

**Default profiles (pre-installed):**
- "Poster Summary" - Extracts key findings, methods, conclusions from research posters
- "Slide Notes" - Converts slide content to structured notes
- "Business Card" - Extracts name, title, company, email, phone into structured format

**Admin vs. User profiles:**
- Admins can create team-wide default profiles
- Users can customize admin profiles or create their own
- Admin-locked profiles cannot be edited by regular users

### 5. Settings Screen

Scrollable settings list with sections. Based on UploadCam's settings but adapted for FieldCam.

**Sections:**

**Account**
- Account information (email, subscription status)
- Connected cloud accounts (Google, Microsoft, Dropbox) with connect/disconnect
- Team information (if part of a team)

**Upload**
- Base folder (default upload destination)
- Upload immediately (toggle)
- Upload in background (toggle)
- Upload using cellular network (toggle)
- Save to device (toggle)
- Save original image (toggle, keeps un-annotated copy)

**Camera**
- Default resolution
- Camera grid (toggle)
- Camera level (toggle)
- Prompt for file details before upload (toggle)

**Annotations**
- Annotation settings (text overlay configuration)
- Location annotation (GPS coordinates on photo)
- Timestamp annotation
- Custom text annotation

**AI Processing**
- Default processing profile
- Auto-process all photos (toggle)
- Processing notification preferences

**Maintenance**
- Clear upload history
- Clear image cache
- App permissions status
- Send diagnostics data
- Contact us / Support
- App version

### 6. QR Scanner Screen

Camera viewfinder with QR scanning overlay.

**Elements:**
- Live camera with scanning frame overlay
- "Scanning for QR Codes..." status text
- Help button (explains QR code format)

**Behavior:**
- Scans QR codes that encode folder paths or settings configurations
- Auto-applies scanned settings and navigates to camera

### 7. Login / Onboarding

**Elements:**
- FieldCam logo and tagline
- "Sign in with Google" button
- "Sign in with Microsoft" button
- "Sign in with Dropbox" button
- Brief feature highlights (3 onboarding cards)

**Behavior:**
- OAuth flow opens in-app browser
- After auth, cloud storage is connected automatically
- User lands on camera screen

### 8. Account / Subscription Screen

**Elements:**
- FieldCam branding
- Current plan info
- Subscription options (deferred, placeholder for now)
- Privacy Policy, Terms of Service links

## Authentication & Authorization

- Login via OAuth with Google, Microsoft, or Dropbox
- The cloud account IS the FieldCam identity (no separate registration)
- On first login, a FieldCam user record is created server-side (stores user ID, email, team membership, usage quota)
- A FieldCam JWT is issued for API calls; cloud OAuth tokens are stored in device keychain and forwarded per-request
- Token refresh handled automatically by the app
- Multiple cloud accounts can be connected simultaneously
- OAuth scopes requested: cloud storage read/write, user email/profile

### Team / Admin Model

- Teams are created by an admin user via the app (Settings > Team > Create Team)
- Admin generates an invite code or link; users join by entering the code
- Team data (members, roles, shared profiles, default folders) stored in FieldCam's database
- Roles: Owner (1 per team), Admin (can manage profiles/members), Member (uses team defaults)
- Admin-locked profiles: members see them and can use them but cannot edit the prompt or delivery settings
- Members can create personal profiles alongside team profiles

## AI Processing Pipeline

### Flow

```
Photo captured --> Upload to cloud storage
                   |
                   +--> (if processing enabled)
                        Send to FieldCam API
                        |
                        v
                   OCR (extract text from image)
                        |
                        v
                   Apply user's prompt template
                   (inject OCR text as context)
                        |
                        v
                   LLM generates output
                        |
                        v
                   Deliver result:
                     - Upload .txt/.pdf to same/different cloud folder
                     - Email to specified address
                     - Both
```

### Prompt Templates

Templates use simple variable substitution:
- `{{extracted_text}}` - OCR output
- `{{timestamp}}` - capture time
- `{{location}}` - GPS coordinates / address
- `{{folder_name}}` - current upload folder name

Example template (Poster Summary):
```
You are analyzing a research poster captured at a medical conference.

Extracted text from the poster:
{{extracted_text}}

Please provide:
1. Title and authors
2. Key objective/hypothesis
3. Methods summary (2-3 sentences)
4. Main findings
5. Conclusions and clinical implications
```

## Offline & Sync Behavior

- Photos are saved locally first, then queued for upload
- Upload queue persists across app restarts
- Failed uploads retry automatically with exponential backoff
- AI processing requests queue when offline, process when connectivity returns
- Upload progress is visible in the Upload Queue screen

## Permissions Required

- Camera (required)
- Fine Location (for GPS annotations)
- Coarse Location (fallback)
- Notifications (upload status, processing complete)
- Internet (upload and processing)
- Background execution (background uploads)

## Error Handling

- **OAuth token expired:** App automatically attempts token refresh. If refresh fails, user is prompted to re-authenticate.
- **Cloud storage full:** Upload fails with clear error message. Photo remains in local queue.
- **AI processing failure:** Job marked as "failed" with error reason. User can retry from Upload Queue. Original photo is already safely in cloud storage.
- **Processing API down:** Processing requests queue locally. App periodically retries. Photos still upload to cloud storage normally.
- **Network loss during upload:** Partial uploads are discarded and retried from scratch. Upload queue persists across app restarts.
- **Malformed QR code:** Validation rejects unrecognized formats. Only FieldCam-formatted QR codes (JSON with a `fieldcam` schema key) are accepted.

## QR Code Format

QR codes encode JSON with a `fieldcam` schema identifier:
```json
{
  "fieldcam": "1.0",
  "folder": { "provider": "gdrive", "id": "folder_id", "name": "Conference 2026" },
  "profile": "poster-summary"
}
```
QR codes can be generated by admins from the Team settings or from a future web dashboard.

## Local Data Storage

- **Upload queue:** SQLite via `expo-sqlite` (persists across restarts)
- **Processing profiles:** SQLite (synced from server for team profiles, local-only for personal)
- **Settings/preferences:** AsyncStorage (key-value)
- **Cached images:** File system cache, clearable from Settings
- **OAuth tokens:** Expo SecureStore (device keychain)

## Out of Scope (v1)

- Video capture and upload (PICTURE mode only for v1, no VIDEO toggle)
- Real-time collaboration features
- In-app photo editing
- Monetization/billing implementation (placeholder UI only, free tier with 100 processing requests/day)
- Admin web dashboard (admin features are in-app only for v1)
- Batch processing of existing photo libraries
- Nearby Folders geofencing (deferred; GPS is unreliable indoors at conference centers)
