# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Deploying to Hostinger

This project is a React Single Page Application (SPA) and requires a few steps to deploy correctly on Hostinger's Apache-based hosting.

### Step 1: Build the project

Create a `.env` file based on `.env.example` and fill in your Supabase credentials, then run:

```sh
npm install
npm run build
```

This generates a `dist/` folder containing the production-ready files.

### Step 2: Upload to Hostinger

1. Log in to your Hostinger control panel (hPanel).
2. Open **File Manager** and navigate to the `public_html` directory (or your subdomain's root folder).
3. Upload **all files** from the `dist/` folder into that directory.
   - Make sure `.htaccess` is included — it is required for client-side routing to work.

### Step 3: Verify `.htaccess` is present

The `public/.htaccess` file (copied to `dist/.htaccess` during build) tells Apache to redirect all requests to `index.html` so React Router handles navigation. Without it, directly visiting URLs like `/dashboard` or `/marketplace` will return a 404 error.

If you don't see `.htaccess` in File Manager, enable "Show hidden files" and re-upload it.

### Step 4: Set environment variables

Because Hostinger shared hosting does not support server-side environment variables, the Supabase credentials are embedded into the build at compile time via `VITE_*` variables. Make sure your `.env` file is correctly configured **before** running `npm run build`.

You can find your Supabase credentials in the [Supabase Dashboard](https://supabase.com/dashboard) under **Project Settings → API**:

- `VITE_SUPABASE_PROJECT_ID` — your project's Reference ID
- `VITE_SUPABASE_URL` — the Project URL (e.g. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the `anon` / public API key
