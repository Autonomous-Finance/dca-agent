# Security Policy

## ⚠️ IMPORTANT: This Project is Archived

**This project is archived and no longer maintained.** No security updates, patches, or fixes will be provided.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| All     | :x: No longer supported |

## Reporting a Vulnerability

**This project is archived and vulnerabilities will not be addressed.** However, if you discover a security vulnerability, you may:

1. **Do not open a public issue** - this could expose users to risk
2. Consider forking the repository and fixing it yourself
3. Be aware that this codebase is provided as-is for educational purposes

## Security Best Practices

If you choose to use or fork this codebase:

1. **Never commit secrets**: Ensure `.env` files and sensitive credentials are in `.gitignore`
2. **Review all code**: Thoroughly audit the codebase before deploying
3. **Use secure wallets**: Never expose private keys or wallet files
4. **Test thoroughly**: Test in a safe environment before using with real funds
5. **Keep dependencies updated**: Regularly update npm packages for security patches
6. **Use environment variables**: Store sensitive configuration in environment variables, not in code

## Known Security Considerations

- The deployment script (`scripts/permaweb-deploy.mjs`) requires sensitive credentials
- Environment variables (`DEPLOY_KEY`, `ANT_CONTRACT`) must be kept secure
- The codebase interacts with blockchain networks and handles financial transactions
- No input validation or rate limiting is implemented in the frontend
- Console logging may expose sensitive information in production builds

## Disclaimer

**USE AT YOUR OWN RISK.** This software is provided "as is" without any warranties. The authors and contributors are not responsible for any security vulnerabilities, financial losses, or other damages resulting from the use of this software.

