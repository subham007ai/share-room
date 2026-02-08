# Deploying ShareRoom to Supabase

You have a local database schema that needs to be pushed to your new remote Supabase project (`lcecmtgqxeyongplirfm`).

## 1. Link Your Project
Open your terminal in `d:\ShareRoom-main` and run:

```bash
npx supabase link --project-ref lcecmtgqxeyongplirfm
```
*   Enter your database password when prompted.

## 2. Push the Database Schema
This will apply all the migration files in `supabase/migrations` (including the new performance fixes) to your remote database:

```bash
npx supabase db push
```

## 3. Verify Environment Variables
Your app uses `VITE_SUPABASE_PUBLISHABLE_KEY`.
Use the **Publishable Key** from your Supabase Dashboard ([Project Settings > API](https://supabase.com/dashboard/project/lcecmtgqxeyongplirfm/settings/api)).

1.  Open `d:\ShareRoom-main\.env`.
2.  Ensure `VITE_SUPABASE_PUBLISHABLE_KEY` matches the "Publishable Key" (`sb_publishable_...`) from your dashboard.
3.  Ensure `VITE_SUPABASE_URL` is `https://lcecmtgqxeyongplirfm.supabase.co`.

## 4. Restart Development Server
After updating `.env`, restart your server to apply changes:

```bash
# In the terminal running npm run dev
Ctrl+C
npm run dev
```

## 5. (Optional) Configure MCP
The JSON snippet you shared allows me (the AI) to access your database directly in future sessions.
Add it to your generic MCP settings file (e.g., `~/.cursor/mcp.json` or `~/.windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE" 
      }
    }
  }
}
```
*Note: The JSON you shared used a URL-based config which works for some tools, but often you need to run it locally with an Access Token.*
