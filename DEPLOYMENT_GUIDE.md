# 🚀 Deploy Qoqnuz Music to Your VPS Server - Step by Step

Complete beginner-friendly guide to deploy your Qoqnuz Music platform to your Ubuntu VPS server.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ VPS server running Ubuntu (you have this)
- ✅ Domain: app.qoqnuz.com (you mentioned this)
- ✅ SSH access to your server
- ✅ Supabase project created
- ✅ Cloudflare R2 bucket created

---

## 🎯 Overview

Here's what we'll do:
1. Push code to GitHub (✅ Already done!)
2. Connect to your VPS server via SSH
3. Clone the code from GitHub to your server
4. Install required software (Node.js, pnpm)
5. Set up environment variables
6. Install project dependencies
7. Run the application
8. Set up PM2 for production (keeps app running)
9. Configure Nginx (web server)
10. Set up SSL certificate (HTTPS)
11. Follow Admin Portal Guide to assign admin role

**Estimated Time:** 30-45 minutes

---

## Step 1: Connect to Your VPS Server

Open your terminal (or PuTTY on Windows) and connect to your server:

```bash
ssh root@app.qoqnuz.com
```

**Or if you have a different user:**
```bash
ssh yourusername@app.qoqnuz.com
```

**First time connecting?**
- You'll see a message like "The authenticity of host... can't be established"
- Type `yes` and press Enter
- Enter your password when prompted

✅ **You're in!** You should see a command prompt like: `root@yourserver:~#`

---

## Step 2: Install Required Software

### 2.1 Update System Packages

```bash
apt update && apt upgrade -y
```

**What this does:** Updates your server's package list and upgrades installed packages.

**Wait for it to complete** (may take 2-5 minutes)

### 2.2 Install Node.js 20

```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version
npm --version
```

**You should see:**
```
v20.x.x
10.x.x
```

### 2.3 Install pnpm

```bash
npm install -g pnpm

# Verify installation
pnpm --version
```

**You should see:** `8.x.x` or higher

### 2.4 Install Git

```bash
apt install -y git

# Verify installation
git --version
```

### 2.5 Install PM2 (Process Manager)

```bash
npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 3: Clone Your Project from GitHub

### 3.1 Navigate to web root directory

```bash
cd /home/user
```

**If the directory doesn't exist:**
```bash
mkdir -p /home/user
cd /home/user
```

### 3.2 Clone the repository

```bash
git clone https://github.com/waqarahm3d/qoqnuzmedia.git
```

**What this does:** Downloads your entire project from GitHub to the server.

**You should see:**
```
Cloning into 'qoqnuzmedia'...
...
Resolving deltas: 100% (xxx/xxx), done.
```

### 3.3 Navigate to the project

```bash
cd qoqnuzmedia
```

### 3.4 Checkout the correct branch

```bash
git checkout claude/qoqnuz-music-app-milestone-a-01FsBbWkEomLV135pmo8aE1w
```

**Verify you're on the right branch:**
```bash
git branch
```

**You should see:**
```
* claude/qoqnuz-music-app-milestone-a-01FsBbWkEomLV135pmo8aE1w
```

---

## Step 4: Set Up Environment Variables

### 4.1 Navigate to the web directory

```bash
cd web
```

**Check you're in the right place:**
```bash
pwd
```

**Should show:** `/home/user/qoqnuzmedia/web`

### 4.2 Create environment file

```bash
nano .env.local
```

**This opens a text editor.** Copy and paste this content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=qoqnuz-media
R2_ACCOUNT_ID=your_cloudflare_account_id
```

### 4.3 Fill in your actual values

**Where to find these values:**

**Supabase URL and Anon Key:**
1. Go to https://app.supabase.com
2. Select your project
3. Click "Settings" (gear icon) in sidebar
4. Click "API"
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Cloudflare R2 Credentials:**
1. Go to https://dash.cloudflare.com
2. Click "R2" in sidebar
3. Click "Manage R2 API Tokens"
4. Find your API token or create new one
5. Copy:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
6. For Account ID:
   - Click on your R2 bucket
   - Look at the URL: `https://dash.cloudflare.com/ACCOUNT_ID_HERE/r2/...`
   - Copy the account ID from URL

### 4.4 Save the file

**Using nano editor:**
- Press `Ctrl + X` (to exit)
- Press `Y` (to confirm save)
- Press `Enter` (to confirm filename)

**Verify the file was created:**
```bash
cat .env.local
```

**You should see your environment variables** (values will show)

---

## Step 5: Install Project Dependencies

**Still in `/home/user/qoqnuzmedia/web` directory:**

```bash
pnpm install
```

**What this does:** Downloads all required packages for the project.

**This will take 3-5 minutes.** You'll see lots of packages being downloaded.

**Wait until you see:**
```
dependencies: +xxx
devDependencies: +xxx

Done in Xs
```

---

## Step 6: Build the Application

```bash
pnpm build
```

**What this does:** Compiles your Next.js application for production.

**This will take 2-3 minutes.** You'll see:
```
Creating an optimized production build...
Compiled successfully
...
```

**Wait until you see:**
```
Route (app)                               Size     First Load JS
...
Build completed successfully
```

---

## Step 7: Test the Application

### 7.1 Start the app manually (test)

```bash
pnpm start
```

**You should see:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000

✓ Ready in Xms
```

### 7.2 Test from your computer

Open your web browser and visit:
```
http://app.qoqnuz.com:3000
```

**You should see the Qoqnuz Music homepage!**

### 7.3 Stop the test server

Go back to your SSH terminal and press:
```
Ctrl + C
```

**The app will stop.** This is expected - we'll use PM2 next to keep it running permanently.

---

## Step 8: Set Up PM2 (Production Process Manager)

PM2 will keep your app running even if you close the SSH connection or the server restarts.

### 8.1 Start app with PM2

```bash
pm2 start pnpm --name "qoqnuz-web" -- start
```

**What this does:** Starts your app in the background with PM2.

**You should see:**
```
[PM2][DONE] App [qoqnuz-web] launched
┌─────┬────────────────┬─────────────┬─────────┐
│ id  │ name           │ mode        │ status  │
├─────┼────────────────┼─────────────┼─────────┤
│ 0   │ qoqnuz-web     │ fork        │ online  │
└─────┴────────────────┴─────────────┴─────────┘
```

### 8.2 Save PM2 configuration

```bash
pm2 save
```

### 8.3 Set PM2 to start on server boot

```bash
pm2 startup
```

**This will show you a command to run.** Copy and run that command.

**Example (yours will be different):**
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

### 8.4 Verify app is running

```bash
pm2 status
```

**You should see:**
```
┌─────┬────────────────┬─────────────┬─────────┐
│ id  │ name           │ mode        │ status  │
├─────┼────────────────┼─────────────┼─────────┤
│ 0   │ qoqnuz-web     │ fork        │ online  │
└─────┴────────────────┴─────────────┴─────────┘
```

**Status should be "online" ✅**

### 8.5 View app logs (optional)

```bash
pm2 logs qoqnuz-web
```

**Press `Ctrl + C` to exit logs**

---

## Step 9: Configure Nginx (Reverse Proxy)

Nginx will allow your app to run on port 80 (HTTP) and 443 (HTTPS) instead of 3000.

### 9.1 Install Nginx

```bash
apt install -y nginx
```

### 9.2 Create Nginx configuration

```bash
nano /etc/nginx/sites-available/qoqnuz
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name app.qoqnuz.com;

    # Increase upload size limit for music files
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### 9.3 Enable the site

```bash
ln -s /etc/nginx/sites-available/qoqnuz /etc/nginx/sites-enabled/
```

### 9.4 Remove default site

```bash
rm /etc/nginx/sites-enabled/default
```

### 9.5 Test Nginx configuration

```bash
nginx -t
```

**You should see:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.6 Restart Nginx

```bash
systemctl restart nginx
```

### 9.7 Enable Nginx to start on boot

```bash
systemctl enable nginx
```

---

## Step 10: Set Up SSL Certificate (HTTPS)

Let's Encrypt provides free SSL certificates for HTTPS.

### 10.1 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 10.2 Get SSL certificate

```bash
certbot --nginx -d app.qoqnuz.com
```

**You'll be asked:**

1. **Enter email address:** Your email for renewal notifications
   ```
   you@example.com
   ```

2. **Terms of Service:** Type `Y` and press Enter

3. **Share email with EFF:** Type `N` or `Y` (your choice)

4. **Redirect HTTP to HTTPS:** Type `2` and press Enter
   ```
   Please choose whether or not to redirect HTTP traffic to HTTPS
   1: No redirect
   2: Redirect
   Select: 2
   ```

**You should see:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/app.qoqnuz.com/fullchain.pem
...
Congratulations! You have successfully enabled HTTPS
```

### 10.3 Test SSL renewal

```bash
certbot renew --dry-run
```

**You should see:**
```
Congratulations, all simulated renewals succeeded
```

---

## Step 11: Configure Firewall

### 11.1 Install UFW (if not installed)

```bash
apt install -y ufw
```

### 11.2 Allow necessary ports

```bash
# Allow SSH (IMPORTANT - don't lock yourself out!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp
```

### 11.3 Enable firewall

```bash
ufw enable
```

**Type `y` and press Enter** when asked to confirm.

### 11.4 Check firewall status

```bash
ufw status
```

**You should see:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## Step 12: Verify Everything is Working

### 12.1 Check if app is running

```bash
pm2 status
```

**Status should be "online"**

### 12.2 Check Nginx is running

```bash
systemctl status nginx
```

**Should show "active (running)"**

**Press `q` to exit**

### 12.3 Test your website

Open your web browser and visit:
```
https://app.qoqnuz.com
```

**You should see:**
- ✅ Secure HTTPS connection (lock icon in browser)
- ✅ Qoqnuz Music homepage
- ✅ No errors

### 12.4 Test specific pages

Try these URLs:
- **Sign Up:** https://app.qoqnuz.com/auth/signup
- **Sign In:** https://app.qoqnuz.com/auth/signin
- **Test Page:** https://app.qoqnuz.com/test

---

## Step 13: Follow Admin Portal Setup

Now that your app is running on the server, **assign yourself admin role:**

### 13.1 Sign up for an account

1. Go to https://app.qoqnuz.com/auth/signup
2. Enter your email and password
3. Click "Sign Up"
4. Check your email for verification link
5. Click the verification link

### 13.2 Get your user ID

1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor"
4. Run this query:

```sql
SELECT id, email FROM auth.users;
```

**Copy your user ID** (the long string under "id" column)

### 13.3 Assign admin role

**In the same SQL Editor**, run:

```sql
-- Create Super Admin role
INSERT INTO admin_roles (name, permissions)
VALUES ('Super Admin', '["*"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Assign to yourself (replace YOUR_USER_ID)
INSERT INTO admin_users (user_id, role_id)
VALUES (
  'YOUR_USER_ID_HERE',
  (SELECT id FROM admin_roles WHERE name = 'Super Admin')
);
```

**Replace `YOUR_USER_ID_HERE` with your actual user ID from Step 13.2**

### 13.4 Access Admin Portal

Visit: **https://app.qoqnuz.com/admin**

**You should now see the admin dashboard!** 🎉

---

## 🔄 Future Updates: How to Deploy New Code

When you make changes and want to update the server:

### On your local machine:

```bash
# Commit changes
git add .
git commit -m "Your update message"
git push
```

### On your VPS server:

```bash
# Navigate to project
cd /home/user/qoqnuzmedia/web

# Pull latest changes
git pull origin claude/qoqnuz-music-app-milestone-a-01FsBbWkEomLV135pmo8aE1w

# Install new dependencies (if any)
pnpm install

# Rebuild
pnpm build

# Restart PM2
pm2 restart qoqnuz-web

# Check status
pm2 status
```

**That's it!** Your updates are live.

---

## 🛠️ Useful PM2 Commands

```bash
# View app status
pm2 status

# View app logs (live)
pm2 logs qoqnuz-web

# View last 100 log lines
pm2 logs qoqnuz-web --lines 100

# Restart app
pm2 restart qoqnuz-web

# Stop app
pm2 stop qoqnuz-web

# Start app
pm2 start qoqnuz-web

# Delete app from PM2
pm2 delete qoqnuz-web

# Monitor app (CPU, memory usage)
pm2 monit
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" when accessing website

**Check if app is running:**
```bash
pm2 status
```

**If status is "errored" or "stopped":**
```bash
pm2 logs qoqnuz-web
```

**Look for errors and fix them.**

### Issue: "502 Bad Gateway" error

**Check if app is running:**
```bash
pm2 status
```

**Check Nginx is running:**
```bash
systemctl status nginx
```

**Restart both:**
```bash
pm2 restart qoqnuz-web
systemctl restart nginx
```

### Issue: "Cannot find module" errors

**Reinstall dependencies:**
```bash
cd /home/user/qoqnuzmedia/web
pnpm install
pm2 restart qoqnuz-web
```

### Issue: Environment variables not working

**Check .env.local file exists:**
```bash
cat /home/user/qoqnuzmedia/web/.env.local
```

**If empty or missing, recreate it** (see Step 4)

**Then rebuild and restart:**
```bash
pnpm build
pm2 restart qoqnuz-web
```

### Issue: Port 3000 already in use

**Find what's using port 3000:**
```bash
lsof -i :3000
```

**Kill the process:**
```bash
kill -9 PROCESS_ID_HERE
```

**Or use PM2:**
```bash
pm2 delete all
pm2 start pnpm --name "qoqnuz-web" -- start
```

### Issue: SSL certificate not working

**Renew certificate:**
```bash
certbot renew
systemctl restart nginx
```

---

## ✅ Deployment Checklist

Use this to verify everything is set up correctly:

- [ ] Node.js 20 installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] PM2 installed (`pm2 --version`)
- [ ] Git installed (`git --version`)
- [ ] Code cloned to `/home/user/qoqnuzmedia`
- [ ] Environment variables in `web/.env.local`
- [ ] Dependencies installed (`pnpm install`)
- [ ] App built (`pnpm build`)
- [ ] PM2 running app (`pm2 status` shows "online")
- [ ] Nginx installed and running
- [ ] Nginx configuration created
- [ ] SSL certificate installed
- [ ] Firewall configured (UFW)
- [ ] Website accessible via HTTPS
- [ ] Admin role assigned in Supabase
- [ ] Admin portal accessible at /admin

---

## 🎯 Next Steps

Now that your app is deployed:

1. **Create content** using the admin portal
   - Add artists
   - Upload music to R2
   - Create albums

2. **Customize branding** in Theme section
   - Change colors
   - Add logo
   - Update site name

3. **Invite team members** and assign admin roles

4. **Monitor your app**
   ```bash
   pm2 monit
   ```

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Connect to server | `ssh root@app.qoqnuz.com` |
| Go to project | `cd /home/user/qoqnuzmedia/web` |
| Pull updates | `git pull` |
| Restart app | `pm2 restart qoqnuz-web` |
| View logs | `pm2 logs qoqnuz-web` |
| Check status | `pm2 status` |
| Restart Nginx | `systemctl restart nginx` |
| Edit env | `nano .env.local` |

---

**🎉 Congratulations! Your Qoqnuz Music platform is now live!**

Visit: **https://app.qoqnuz.com/admin**

---

**Need help?** Check:
- `pm2 logs qoqnuz-web` for app errors
- `/var/log/nginx/error.log` for Nginx errors
- Supabase dashboard for database issues
