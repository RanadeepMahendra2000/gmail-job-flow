# Gmail Job Tracker

A smart job application tracker that automatically syncs with your Gmail inbox to detect and organize job applications using AI-powered email parsing.

## ✅ Implementation Status

**COMPLETED:**
- ✅ Database foundation (profiles, applications, sync_logs tables with RLS)
- ✅ Real Supabase authentication with Google OAuth 
- ✅ Gmail API integration via Edge Functions
- ✅ Frontend data connection with real-time updates
- ✅ AI-powered email parsing and job detection
- ✅ Dashboard with analytics, timeline, and deadline management

**SETUP REQUIRED:**
- 🔧 Google OAuth configuration in Supabase Dashboard
- 🔧 Edge Function secrets configuration

## Features

- 🤖 **Automatic Gmail Sync**: AI-powered email parsing to detect job applications
- 📊 **Smart Analytics**: Track application progress with detailed insights  
- 🔔 **Deadline Management**: Never miss important deadlines
- 🔒 **Secure Authentication**: Google OAuth with Gmail read-only access
- ⚡ **Real-time Updates**: Live dashboard updates

## Setup Instructions

### 1. Configure Google OAuth in Supabase

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API

2. **Create OAuth Credentials**:
   - Go to Credentials → Create credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `http://localhost:5173` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173/`
     - `https://your-domain.com/`

3. **Configure Supabase Auth Provider**:
   - Go to Authentication → Providers → Google
   - Enable the provider
   - Add your Google Client ID and Secret
   - **Additional scopes**: `openid email profile https://www.googleapis.com/auth/gmail.readonly`
   - ✅ Enable "Save refresh tokens"

4. **Set URL Configuration**:
   - Site URL: `https://your-domain.com` (or preview URL)
   - Redirect URLs: Add your preview URL and any custom domains

### 2. Configure Edge Function Secrets

Set these secrets in your Supabase project settings:

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPABASE_URL=https://nfvedsxsqyciemqmtzam.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Test the Application

1. **Sign in with Google**: Use the "Continue with Google" button
2. **Sync Gmail**: Click "Sync Gmail" button in the dashboard
3. **View Applications**: See automatically detected job applications

## How It Works

### Email Processing Pipeline

1. **Gmail API Fetch**: Retrieves messages with job-related keywords
2. **AI Classification**: Extracts company, role, status from email content
3. **Database Storage**: Stores applications with metadata and real-time sync
4. **Dashboard Display**: Shows analytics, timelines, and deadline alerts

### Security Architecture

- **Row Level Security (RLS)**: All data isolated per user
- **OAuth Tokens**: Refresh tokens stored securely in Supabase
- **Edge Functions**: Server-side Gmail API calls only
- **Minimal Scopes**: Read-only Gmail access

## Database Schema

```sql
-- Core tables
profiles (id, email, full_name, avatar_url, google_provider_id)
applications (id, user_id, company, role, status, email_id, metadata)
sync_logs (id, user_id, status, stats, error)

-- Enums
application_status: applied | assessment | interview | offer | rejected | ghosted | withdrawn | other
```

## API Endpoints

### Gmail Sync
```
POST /functions/v1/gmail-sync
Authorization: Bearer <supabase-jwt>
Returns: { stats: { scanned, created, updated, skipped } }
```

### Gmail Classify
```
POST /functions/v1/gmail-classify  
Authorization: Bearer <supabase-jwt>
Body: { emailId: "gmail-message-id" }
Returns: { company, role, status, applied_at, confidence }
```

## Parsing Heuristics

The AI classification uses these patterns:

**Status Detection:**
- `interview|onsite|screen` → 'interview'
- `assessment|coding test|hackerrank` → 'assessment'  
- `offer|congratulations` → 'offer'
- `rejected|unfortunately` → 'rejected'

**Company Extraction:**
- Email domain (excluding generic providers)
- Sender name parsing
- Subject line analysis

**Role Extraction:**
- Pattern matching: "for Software Engineer", "as Product Manager"
- Common title patterns with modifiers

## Troubleshooting

### Authentication Issues
- **Error: "requested path is invalid"**
  - Check Site URL and Redirect URLs in Supabase Auth settings
  - Ensure exact URL matches (including trailing slashes)

### Gmail Sync Issues
- **"No refresh token found"**
  - Ensure "Save refresh tokens" is enabled in Google provider settings
  - Re-authenticate to get fresh tokens
- **Rate limiting**
  - Gmail API limited to 50 messages per sync by default
  - Sync frequency automatically managed

### Type Errors
- Database migration creates proper type definitions
- Restart TypeScript language server if types don't update

## Technical Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **APIs**: Gmail API v1 + Google OAuth 2.0
- **Deployment**: Automatic via Lovable platform

## Future Enhancements

- Gmail labeling for processed emails (requires modify scope)
- Webhook integration for real-time email processing
- Enhanced AI classification with machine learning
- Multiple email provider support (Outlook, Yahoo)
- Job board integrations (LinkedIn, Indeed)

## Security Notice

⚠️ The application uses read-only Gmail access. It never modifies or deletes your emails. All data is encrypted and isolated per user with Row Level Security policies.

---

**Ready to track your job applications automatically? Configure the OAuth settings above and start syncing!**