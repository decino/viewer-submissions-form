# EJS to React Migration Guide

This guide documents the migration from EJS templates to a React + Vite frontend for the viewer submissions form.

## What Was Created

### 1. React Vite Project Setup
- **Location**: `/frontend`
- **Tech Stack**: React 19 + TypeScript + Vite + SASS
- **Dependencies**:
  - `socket.io-client` for WebSocket connections
  - `react-hook-form` for form management
  - `bootstrap-icons` for icons
  - `sass` for styling

### 2. Doom-Inspired Theme
- **Files**:
  - `frontend/src/styles/theme.scss` - Color palette and CSS variables
  - `frontend/src/styles/components.scss` - Component-specific styles
  - `frontend/src/index.css` - Global styles

**Theme Features**:
- Dark red/orange color palette inspired by classic Doom
- Monospace fonts (Courier New) for retro feel
- Glowing hover effects on buttons and borders
- Custom styled form elements
- Card components with red borders and dark backgrounds

### 3. TypeScript Types
- **File**: `frontend/src/types/index.ts`
- **Includes**:
  - `SubmissionModel` - Submission entry structure
  - `SubmissionRoundModel` - Round information
  - `HomeViewModel` - Page data structure
  - `DoomEngine` & `GZAction` enums

### 4. Services Layer
- **API Service** (`frontend/src/services/api.ts`):
  - Submit entries with file upload support
  - CORS proxy for fetching WAD info from URLs
  - Uses native `fetch` API (no axios)

- **WebSocket Service** (`frontend/src/services/websocket.ts`):
  - Real-time submission updates
  - Delete notifications
  - Connection status tracking

### 5. Reusable Components

#### Card Components (`frontend/src/components/Card.tsx`)
```tsx
<Card borderPrimary>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### Alert Component (`frontend/src/components/Alert.tsx`)
```tsx
<Alert type="danger">Error message</Alert>
<Alert type="success">Success message</Alert>
```

#### Form Components (`frontend/src/components/FormField.tsx`)
- `TextInput` - Text input with label
- `Select` - Dropdown select
- `RadioGroup` - Radio button group
- `CheckboxGroup` - Checkbox group
- `TextArea` - Multi-line text input
- `FileInput` - File upload input

#### SubmissionForm (`frontend/src/components/SubmissionForm.tsx`)
Complete migration of `src/public/snippets/submitForm.ejs` with:
- Upload or URL mode toggle
- WAD name auto-fill from Doomworld links
- Engine selection with GZDoom action options
- Author/distributable fields with conditional logic
- Email validation
- Captcha placeholder support
- Loading states and error handling

#### SubmissionsList (`frontend/src/components/SubmissionsList.tsx`)
Migration of `src/public/snippets/SubmissionsTable.ejs` with:
- Live WebSocket updates
- Connection status badge
- Dynamic row updates

### 6. Main Application
- **File**: `frontend/src/App.tsx`
- **Features**:
  - Layout matching original EJS `index.ejs`
  - Two-column layout (form + submissions)
  - Paused state overlay
  - Round deadline display
  - WebSocket initialization

### 7. Configuration
- **Vite Config** (`frontend/vite.config.ts`):
  - Dev server on port 3000
  - Proxy `/api` requests to `http://localhost:8080`
  - WebSocket proxy for `/socket.io`

- **Environment Variables** (`.env`):
  - `VITE_API_BASE=/api`
  - `VITE_FILE_SIZE_LIMIT_MB=50`

## What Still Needs To Be Done

### Backend Changes Required

1. **Create API Endpoint for Home Data**
   ```typescript
   // Need to create: GET /api/home
   // Returns: HomeViewModel with current round, previous rounds, engines, etc.
   ```

2. **Update API Routes** (if needed)
   - Ensure `/api/submission/addEntry` accepts multipart form data
   - Verify `/api/utils/corsProxy` exists and works correctly

3. **WebSocket Events**
   - Ensure `entry` event is emitted with `SubmissionModel` structure
   - Ensure `delete` event is emitted with `number[]` of deleted IDs

### Frontend Enhancements

1. **WAD File Analysis**
   - Implement WAD parser to extract map names from uploaded files
   - Currently commented out in `SubmissionForm.tsx:handleFileChange`

2. **Captcha Integration**
   - Add Turnstile/reCAPTCHA/hCaptcha script loading
   - Integrate captcha validation into form submission

3. **Previous Rounds Display**
   - Create component to display previous submission rounds
   - Implement results table with download links

4. **Stats Charts**
   - Integrate chart library (e.g., Chart.js, Recharts)
   - Create stats dashboard component
   - Implement data fetching from `/api/stats/round/:id`

5. **Error Handling**
   - Add global error boundary
   - Improve error messages and validation feedback

6. **Loading States**
   - Add skeleton loaders for better UX
   - Implement proper loading indicators

7. **Responsive Design**
   - Test and refine mobile layout
   - Ensure form is usable on small screens

### Testing & Deployment

1. **Integration Testing**
   - Test with actual backend
   - Verify WebSocket connections
   - Test file uploads

2. **Build Configuration**
   - Configure build output directory
   - Set up production environment variables
   - Integrate with backend serving

3. **Performance**
   - Code splitting
   - Lazy loading components
   - Asset optimization

## Running the Frontend

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server will run on `http://localhost:3000` and proxy API calls to `http://localhost:8080`.

## Migration Checklist

- [x] Set up React Vite project
- [x] Create Doom-inspired theme
- [x] Implement TypeScript types
- [x] Create API service layer with fetch
- [x] Implement WebSocket service
- [x] Create Card and Alert components
- [x] Create form field components
- [x] Migrate submission form
- [x] Create submissions list component
- [x] Configure development proxy
- [ ] Create backend `/api/home` endpoint
- [ ] Implement WAD file parser
- [ ] Integrate captcha
- [ ] Create previous rounds table
- [ ] Add stats/charts functionality
- [ ] Implement remaining EJS pages (login, admin, etc.)
- [ ] Production deployment configuration

## Notes

- The frontend uses **custom CSS** without Bootstrap (only Bootstrap Icons)
- All form state is managed with React hooks (not react-hook-form yet, can be integrated)
- WebSocket connection is automatic on app mount
- Theme is fully customizable via CSS variables in `theme.scss`

## Comparing to WaifuVault

While the WaifuVault project uses Next.js, this project uses Vite for:
- Faster development server
- Simpler configuration
- No SSR requirements (backend handles server-side rendering if needed)
- Better suited for SPA architecture

## Questions?

Contact the development team or refer to `frontend/FRONTEND_README.md` for more details.
