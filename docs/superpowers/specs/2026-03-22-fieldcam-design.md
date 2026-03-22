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

**Key principle:** The backend never stores user data. It receives an image, processes it, delivers the result, done.

### Data Flow

1. User takes a photo in the app
2. Photo uploads directly to the user's chosen cloud storage folder
3. If AI processing is enabled, the app also sends the image to FieldCam's stateless API
4. The API performs OCR, applies the user's configured prompt (summarize, extract data, etc.)
5. Results are delivered to the user's chosen destination (same cloud folder as a text/PDF file, a different folder, or via email)

## Screens & Navigation

**Navigation:** Bottom tab bar with 4 tabs: Camera (center, prominent), Uploads, Profiles, Settings

### 1. Camera Screen (Primary)

The main screen users see after login. Based on UploadCam's camera view but with FieldCam branding.

**Elements:**
- Live camera viewfinder (full screen behind UI)
- Top bar: current folder name with cloud provider icon, location pin (GPS tagging), overflow menu (gear icon)
- Mode toggle: PICTURE / VIDEO
- Bottom controls: annotation toggle button, shutter button (large, center), camera flip button
- Resolution indicator
- Flash toggle
- Grid overlay toggle (from settings)
- QR code scan button (for quick folder/settings configuration)

**Behavior:**
- Tapping shutter captures and queues for upload
- Long-press shutter for burst mode (stretch goal)
- Swipe between PICTURE and VIDEO modes

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
- Nearby Folders section (GPS-based auto-folder selection)

**Behavior:**
- Tapping a folder shows its contents or selects it
- Long-press shows context menu (remove from recents, add to favorites)
- Nearby Folders uses geofencing to auto-select folders based on GPS location

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

**Location**
- Nearby folders (toggle)
- Manage nearby folders (geofence setup)

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
- OAuth tokens stored securely in device keychain
- Token refresh handled automatically
- Multiple cloud accounts can be connected simultaneously
- Team/admin features use the same auth with role-based permissions

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
- Microphone (for video capture)
- Fine Location (for GPS annotations and nearby folders)
- Coarse Location (fallback)
- Notifications (upload status, processing complete)
- Internet (upload and processing)
- Background execution (background uploads)

## Out of Scope (v1)

- Video AI processing (photos only for v1)
- Real-time collaboration features
- In-app photo editing
- Monetization/billing implementation (placeholder UI only)
- Admin web dashboard (admin features are in-app only for v1)
- Batch processing of existing photo libraries
