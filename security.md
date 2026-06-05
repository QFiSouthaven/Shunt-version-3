# Security Policy

## Introduction

The security of the Aether Shunt application is a top priority. We are committed to protecting our users and their data. This document outlines our security policy, including how to report vulnerabilities and the measures we take to keep the application secure.

We appreciate the efforts of security researchers and the community in helping us maintain a high standard of security.

## Supported Versions

As a web-based application under continuous development, only the most recent version deployed is considered supported. We do not provide security updates for previous states of the application.

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take all security reports seriously. If you discover a security vulnerability, we ask that you report it to us privately to allow us time to address the issue before it becomes public.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to **`security@aether-shunt-project.dev`** (this is a placeholder address) with the following information:

1.  **A clear description of the vulnerability.**
2.  **The potential impact of the vulnerability.**
3.  **Detailed, step-by-step instructions on how to reproduce the vulnerability.** This may include code snippets, screenshots, or screen recordings.
4.  **Any proposed mitigations or fixes**, if you have them.

### Our Commitment

When you report a vulnerability, you can expect us to:

- Acknowledge receipt of your report within **48 hours**.
- Provide an initial assessment of the report's validity and severity.
- Keep you informed of our progress as we investigate and fix the issue.
- Publicly credit you for your discovery (unless you prefer to remain anonymous) once the vulnerability has been patched.

## Security Best Practices

We are committed to the following security practices to ensure the integrity of our application:

### Dependency Management
- We use automated tools to scan our dependencies for known vulnerabilities and apply patches in a timely manner.

### Static Code Analysis
- Our codebase is regularly scanned for common security issues and anti-patterns before being deployed.

### Prompt Engineering Safeguards
- **Input Sanitization:** User-provided input is sanitized to strip out potentially malicious content (e.g., `<script>` tags) before being processed by the AI model. This is a configurable setting within the application.
- **Prompt Injection Protection:** We employ techniques to instruct the AI model to treat user input as data, not as executable instructions, to mitigate the risk of prompt injection attacks.

### Data Handling
- **API Keys:** The application does not store or log user API keys. Keys are handled client-side and passed directly to the AI service provider.
- **User Data:** All user-generated content (such as chat history and Weaver memory) is stored locally on the user's machine in `localStorage`.

Thank you for helping keep Aether Shunt secure.