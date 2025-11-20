# OAuth Providers Setup Guide

This guide explains how to configure OAuth providers (Google, Facebook, Apple, etc.) for social sign-in on your platform.

## Important: Two-Level Configuration Required

OAuth setup requires configuration in **TWO places**:

1. **Admin Settings** (`/admin/settings`) - Controls whether the button shows on signin page
2. **Supabase Dashboard** - Actual OAuth provider configuration with credentials

The error `"Unsupported provider: provider is not enabled"` means you enabled it in Admin Settings but not in Supabase.

---

## Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as app type
4. Fill in:
   - **App Name**: Your site name (e.g., "Qoqnuz Music")
   - **Contact Email**: Your email
5. Click **Create App**

### Step 2: Get Credentials

1. In Facebook App Dashboard: **Settings** → **Basic**
2. Copy:
   - **App ID** (this is your Client ID)
   - **App Secret** (this is your Client Secret)
3. Add **App Domains**: `yourdomain.com`
4. Save changes

### Step 3: Enable Facebook Login

1. In left sidebar: **Add Product**
2. Find **Facebook Login** → Click **Set Up**
3. Choose **Web** platform
4. Enter Site URL: `https://yourdomain.com`

### Step 4: Configure Redirect URI

1. **Facebook Login** → **Settings**
2. In **Valid OAuth Redirect URIs**, add:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   **Find YOUR_PROJECT_REF:**
   - Supabase Dashboard → Settings → API
   - Look at Project URL: `https://YOUR_PROJECT_REF.supabase.co`

3. Save changes

### Step 5: Configure in Supabase

1. Open Supabase Dashboard
2. Go to **Authentication** → **Providers**
3. Find **Facebook** and click it
4. Toggle **Enable Sign in with Facebook** to ON
5. Enter:
   - **Facebook Client ID**: Your App ID
   - **Facebook Client Secret**: Your App Secret
6. Click **Save**

### Step 6: Make App Live

⚠️ **IMPORTANT**: Facebook apps start in Development mode!

1. In Facebook Dashboard, click **App Mode** toggle at top
2. Switch from **Development** to **Live**
3. You may need to add:
   - Privacy Policy URL
   - Terms of Service URL
4. Complete basic App Review (usually instant for login)

### Step 7: Test

1. Go to `/auth/signin` on your site
2. Click "Continue with Facebook"
3. Should redirect to Facebook login
4. After approval, redirects back authenticated ✅

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Name: Your app name

### Step 2: Enable Google+ API

1. **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth Credentials

1. **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen if prompted:
   - User Type: **External**
   - App name: Your site name
   - Support email: Your email
   - Developer email: Your email
4. Create **OAuth client ID**:
   - Application type: **Web application**
   - Name: Your app name
   - **Authorized redirect URIs**: Add:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

### Step 4: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and enable it
3. Enter:
   - **Google Client ID**: From Google Cloud
   - **Google Client Secret**: From Google Cloud
4. Save

---

## Apple Sign-In Setup

### Step 1: Apple Developer Account

You need an **Apple Developer Account** ($99/year)

### Step 2: Create App ID

1. https://developer.apple.com/account/
2. **Certificates, IDs & Profiles**
3. **Identifiers** → Click **+**
4. Select **App IDs** → Continue
5. Select **App** → Continue
6. Fill in:
   - Description: Your app name
   - Bundle ID: com.yourcompany.yourapp
   - Enable **Sign In with Apple**
7. Click **Continue** → **Register**

### Step 3: Create Services ID

1. **Identifiers** → Click **+**
2. Select **Services IDs** → Continue
3. Fill in:
   - Description: Your app name
   - Identifier: com.yourcompany.yourapp.service
4. Click **Continue** → **Register**
5. Click on the Services ID you just created
6. Enable **Sign In with Apple**
7. Click **Configure**
8. Add:
   - **Primary App ID**: Select the App ID you created
   - **Website URLs**: Add your domain
   - **Return URLs**: Add:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
9. Save

### Step 4: Create Key

1. **Keys** → Click **+**
2. Fill in:
   - Key Name: Your app Sign In Key
   - Enable **Sign In with Apple**
   - Click **Configure** → Select your App ID
3. Click **Continue** → **Register**
4. **Download** the key file (.p8)
5. Note the **Key ID**

### Step 5: Get Team ID

1. Apple Developer Account
2. **Membership** tab
3. Copy your **Team ID**

### Step 6: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and enable it
3. Enter:
   - **Services ID**: com.yourcompany.yourapp.service
   - **Team ID**: From Membership page
   - **Key ID**: From the key you created
   - **Private Key**: Contents of the .p8 file
4. Save

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: https://yourdomain.com
   - **Authorization callback URL**:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
4. Click **Register application**

### Step 2: Get Credentials

1. Note the **Client ID**
2. Click **Generate a new client secret**
3. Copy the **Client Secret** (shown once!)

### Step 3: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **GitHub** and enable it
3. Enter:
   - **GitHub Client ID**: From GitHub
   - **GitHub Client Secret**: From GitHub
4. Save

---

## Twitter/X OAuth Setup

### Step 1: Create Twitter App

1. Go to https://developer.twitter.com/
2. Apply for Developer Account if needed
3. Create Project → Create App
4. Fill in app details

### Step 2: Get Credentials

1. In App Settings → **Keys and tokens**
2. Generate:
   - **API Key** (Client ID)
   - **API Secret Key** (Client Secret)
3. In **User authentication settings**:
   - Type: **Web App**
   - Callback URI:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```

### Step 3: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Twitter** and enable it
3. Enter credentials
4. Save

---

## Discord OAuth Setup

### Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application**
3. Name your application
4. Click **Create**

### Step 2: Configure OAuth2

1. Go to **OAuth2** tab
2. Click **Add Redirect**
3. Add:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Save changes

### Step 3: Get Credentials

1. In **OAuth2** → **General**
2. Copy:
   - **CLIENT ID**
   - **CLIENT SECRET**

### Step 4: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Discord** and enable it
3. Enter credentials
4. Save

---

## Microsoft OAuth Setup

### Step 1: Register App in Azure

1. Go to https://portal.azure.com/
2. **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: Your app name
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Add:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
5. Click **Register**

### Step 2: Get Credentials

1. Note the **Application (client) ID**
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add description and expiry
5. Copy the **Value** (shown once!)

### Step 3: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Microsoft** and enable it
3. Enter:
   - **Microsoft Client ID**: Application ID
   - **Microsoft Client Secret**: Secret value
4. Save

---

## Spotify OAuth Setup

### Step 1: Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Log in with Spotify account
3. Click **Create app**
4. Fill in:
   - **App name**: Your app name
   - **App description**: Description
   - **Redirect URIs**: Add:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
5. Accept terms and create

### Step 2: Get Credentials

1. Click on your app
2. Click **Settings**
3. Copy:
   - **Client ID**
   - **Client Secret** (click Show)

### Step 3: Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Spotify** and enable it
3. Enter credentials
4. Save

---

## Testing OAuth Providers

### Test Checklist:

For each provider you configure:

- [ ] Provider enabled in Supabase Dashboard
- [ ] Provider enabled in Admin Settings (`/admin/settings`)
- [ ] Button appears on signin page (`/auth/signin`)
- [ ] Clicking button redirects to provider
- [ ] After authentication, redirects back to app
- [ ] User is logged in successfully
- [ ] User profile is created

### Common Issues:

**"Unsupported provider"**
- Provider not enabled in Supabase Dashboard
- Enable it in Authentication → Providers

**"Redirect URI mismatch"**
- Wrong callback URL in provider settings
- Must be: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

**"Invalid client"**
- Wrong Client ID or Secret in Supabase
- Copy credentials carefully

**"App not approved"**
- Provider app still in development mode
- Switch to production/live mode

---

## Security Best Practices

1. **Never commit OAuth secrets** to git
2. **Use environment variables** for credentials
3. **Rotate secrets** regularly
4. **Monitor OAuth usage** in provider dashboards
5. **Set up proper scopes** (only request what you need)
6. **Test in development** before enabling in production

---

## Need Help?

1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify callback URLs match exactly
4. Ensure provider apps are in live/production mode
5. Test with provider's testing tools

---

**Remember**: The admin settings (`/admin/settings`) only control the UI. The actual OAuth configuration happens in Supabase Dashboard!
