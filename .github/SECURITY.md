# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in **eventum**, we strongly encourage you to report it privately.

Please **do not create a public issue**. Instead, contact us directly:

- Discord: https://discord.gg/XW7whPJr

We will investigate and respond to your report as quickly as possible. Once the issue is resolved, we will publish a public disclosure if necessary.

---

## Supported Versions

We currently support the latest **major** version of eventum.

| Version      | Supported         |
| ------------ | ----------------- |
| 0.x.x        | ✅ Yes             |

---

## Security Best Practices

If you're using `eventum` in production:

- Keep your dependencies up to date
- **Use built-in masking features** to protect sensitive data:
  - `exact`: Mask specific field names (e.g., `password`, `token`, `apiKey`)
  - `partial`: Mask parts of field values (e.g., credit cards, emails)
  - `regex`: Mask using custom regex patterns (e.g., API keys, bearer tokens)

Example masking configuration:
```js
logger.setConfig({
  prod: {
    output: {
      masking: {
        keyword: '***',
        exact: ['password', 'token', 'apiKey', 'secret'],
        regex: ['(?i)bearer\\s+[a-z0-9\\._\\-]+']
      }
    }
  }
});
```

Future versions will include:
- Additional sanitization rules and presets
- Plugin support for custom encryption
- Audit logging for compliance requirements

---

## Preferred Languages

We prefer all communications to be in English.

## Thanks

We appreciate responsible disclosure.  
Security is a community effort — thank you for helping keep `eventum` safe!
