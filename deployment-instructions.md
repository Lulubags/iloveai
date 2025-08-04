# Netlify Direct Deployment Instructions

## Files to Upload
Upload these files/folders to Netlify:

### Required Files:
- `dist/` folder (contains your built React app)
- `netlify/` folder (contains serverless functions)
- `netlify.toml` (deployment configuration)
- `_redirects` (routing rules)
- `package.json` and `package-lock.json` (dependencies)
- `shared/` folder (database schemas)
- `drizzle.config.ts` (database configuration)

## Netlify Deployment Steps:

1. **Go to Netlify Dashboard** → Sites → "Add new site" → "Deploy manually"

2. **Drag and drop** the `netlify-deployment.zip` file or upload the folders above

3. **Add Environment Variables** in Site Settings → Environment Variables:
   ```
   OPENAI_API_KEY = your_openai_api_key_here
   DATABASE_URL = your_postgresql_connection_string_here
   ```

4. **Test the deployment**:
   - Visit: `https://your-site-name.netlify.app/`
   - Test environment: `https://your-site-name.netlify.app/.netlify/functions/test-env`
   - Try the chatbot

## Troubleshooting:
- Check function logs in Netlify Dashboard → Functions → chat → View logs
- The test endpoint will show if environment variables are configured correctly
- Enhanced error messages will tell you exactly what's wrong

Your files are ready for direct upload!