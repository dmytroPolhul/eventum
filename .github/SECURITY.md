# 🔒 Security Policy

## 📬 Reporting a Vulnerability

If you discover a security vulnerability in **hyper-logger**, we strongly encourage you to report it privately.

Please **do not create a public issue**. Instead, contact us directly:

- Discord: https://discord.gg/TxgXNV4B

We will investigate and respond to your report as quickly as possible. Once the issue is resolved, we will publish a public disclosure if necessary.

---

## ✅ Supported Versions

We currently support the latest **major** version of hyper-logger.

| Version      | Supported         |
| ------------ | ----------------- |
| 0.x.x        | ✅ Yes             |

---

## 📦 Security Best Practices

If you're using `hyper-logger` in production:

- Keep your dependencies up to date
- Use `OutputTarget.Null` to disable logs in sensitive environments
- Avoid logging unmasked secrets, tokens, or personal data

Future versions will include:
- 🔐 Secret masking (e.g. tokens, passwords)
- 🛡 Configurable sanitization rules
- 🧩 Plugin support for encryption

---

## Preferred Languages

We prefer all communications to be in English.

## 🙏 Thanks

We appreciate responsible disclosure.  
Security is a community effort — thank you for helping keep `hyper-logger` safe!
