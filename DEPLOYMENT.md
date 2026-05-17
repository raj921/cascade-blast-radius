# Cascade Deployment Guide

## Netlify Deployment Configuration

### Quick Setup

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select `raj921/cascade-blast-radius`

2. **Configure Build Settings**

Use these exact settings in Netlify:

| Setting | Value |
|---------|-------|
| **Team** | raj921's team |
| **Branch to deploy** | `main` |
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/.next` |
| **Functions directory** | `netlify/functions` |

### Environment Variables

Add these in Netlify Dashboard → Site settings → Environment variables:

```bash
# Required for live analysis
BOBSHELL_API_KEY=bob_prod_bob-apikey_2AzbN8fRbDBx2MFECmxDpB2Zoxaf25rBEyLhEo9hXVvW5hAEBdzR4A76wL1mJ7b1YfPBQ4TEwNy48Njp4M2shxwC_3b8KJkp9HqwJGide6jNHM9KoubhrUNiy9x7Eb6fFxFzp

# Optional (default 15 minutes)
BOB_SHELL_TIMEOUT_MS=900000

# Next.js
NODE_VERSION=20
NEXT_TELEMETRY_DISABLED=1
```

### Automatic Configuration

The `netlify.toml` file in the repository root automatically configures:
- ✅ Base directory: `frontend`
- ✅ Build command: `npm run build`
- ✅ Publish directory: `.next`
- ✅ Node version: 20
- ✅ Security headers
- ✅ Client-side routing redirects

### Manual Configuration (if needed)

If you prefer to configure manually in Netlify UI:

1. **Build settings**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/.next
   ```

2. **Environment variables**
   - Click "Add variable"
   - Name: `BOBSHELL_API_KEY`
   - Value: Your Bob API key
   - Click "Save"

3. **Deploy settings**
   - Branch: `main`
   - Auto-deploy: Enabled

### Post-Deployment

After deployment:

1. **Test the site**
   - Visit your Netlify URL (e.g., `https://cascade-blast-radius.netlify.app`)
   - Test the home page loads
   - Test the `/analyze` page
   - Test the `/demos` page

2. **Verify Bob integration**
   - Go to `/analyze`
   - Paste a code diff
   - Click "Analyze Impact"
   - Verify Bob Shell analysis runs successfully

3. **Custom domain (optional)**
   - Go to Site settings → Domain management
   - Add your custom domain
   - Configure DNS records

### Troubleshooting

**Build fails with "command not found"**
- Ensure `Base directory` is set to `frontend`
- Check `package.json` has `build` script

**Environment variables not working**
- Verify `BOBSHELL_API_KEY` is set in Netlify dashboard
- Check the variable is not scoped to a specific branch
- Redeploy after adding variables

**404 errors on routes**
- The `netlify.toml` handles redirects automatically
- If issues persist, check the `[[redirects]]` section

**Bob Shell timeout**
- Increase `BOB_SHELL_TIMEOUT_MS` to 1800000 (30 min)
- Check Bob API key is valid

### Alternative: Vercel Deployment

If you prefer Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `cd frontend && vercel`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Local Development

To test locally before deploying:

```bash
# Install dependencies
cd cascade-blast-radius/frontend
npm install

# Copy environment template
cp ../.env.example ../.env
# Edit .env and add your BOBSHELL_API_KEY

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### CI/CD

Netlify automatically:
- ✅ Builds on every push to `main`
- ✅ Creates preview deployments for PRs
- ✅ Runs build checks
- ✅ Deploys on success

### Support

- **Netlify Docs**: https://docs.netlify.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Bob Shell Docs**: https://bob.ibm.com/docs/shell

---

**Ready to deploy!** 🚀

Your Cascade project is configured and ready for Netlify deployment.