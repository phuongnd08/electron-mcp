# Security Guidelines

## Environment Variables

### ❌ **DO NOT DO THIS:**
- Never commit `.env` files containing secrets to the repository
- Never hardcode tokens or passwords in source code
- Never share tokens in public channels

### ✅ **RECOMMENDED APPROACH:**

#### For Local Development:
1. Copy `.env.example` to `.env`
2. Fill in your personal tokens in `.env` (this file is gitignored)
3. Use environment variables:
   ```bash
   export GH_TOKEN=your_actual_token
   npm run build:win
   ```

#### For GitHub Actions:
1. Go to your repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Add repository secrets:
   - `ELECTRON_GITHUB_TOKEN`: Your GitHub Personal Access Token
   
   > Note: Secret names cannot start with `GITHUB_` due to GitHub restrictions.

#### For Team Development:
- Use your organization's secret management system
- Each developer should have their own tokens
- Use different tokens for development and production

## GitHub Personal Access Token

### Required Scopes:
- `repo` (if repository is private)
- `write:packages` (if publishing packages)

### How to Create:
1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select required scopes
4. Copy the token (you won't see it again!)

## Best Practices

1. **Rotate tokens regularly** (every 90 days recommended)
2. **Use minimal required permissions**
3. **Monitor token usage** in GitHub settings
4. **Revoke unused tokens immediately**
5. **Never share tokens between team members**

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers rather than opening a public issue.