# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in JsonExport, please report it responsibly:

1. **Email**: Open a [security advisory](https://github.com/theGoodB0rg/json_hub/security/advisories/new) on GitHub
2. **Response Time**: We aim to respond within 48 hours
3. **Disclosure**: We will work with you to address the issue before public disclosure

## Security Measures

JsonExport is designed with privacy and security as core principles:

### Client-Side Processing
- **No Server Upload**: All JSON parsing and conversion happens entirely in your browser
- **Zero Network Calls**: Your data never leaves your machine during conversion
- **No Backend**: There is no server storing or processing your data

### Data Privacy
- **No Tracking**: We don't collect, store, or transmit any user data
- **No Analytics on Conversion**: Your JSON content is never logged or analyzed
- **Local Storage Only**: Any temporary data is stored only in your browser's memory

### Code Security
- **Open Source**: Full transparency - review our code on GitHub
- **Dependency Audits**: Regular npm audit checks for vulnerable dependencies
- **Static Export**: Application is deployed as static HTML/JS/CSS files

## Supported Versions

We support the latest deployed version on [jsonexport.com](https://jsonexport.com).

## Best Practices for Users

1. **Use HTTPS**: Always access JsonExport via HTTPS (https://jsonexport.com)
2. **Keep Browsers Updated**: Use the latest version of modern browsers for security patches
3. **Verify Source**: Only use the official domain or clone from our official GitHub repository

## Security Features

- **Content Security Policy (CSP)**: Strict CSP headers to prevent XSS attacks
- **Subresource Integrity (SRI)**: Ensuring loaded resources haven't been tampered with
- **HTTPS-Only**: All connections are encrypted

---

**Last Updated**: January 2026
