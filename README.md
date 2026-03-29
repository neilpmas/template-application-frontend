# Template Application — Frontend & BFF

React frontend and Cloudflare Workers BFF (Backend for Frontend) for the template application stack.

## Overview

This repo contains two tightly coupled layers:

- **React app** — the browser UI, hosted on Cloudflare Pages
- **BFF (Cloudflare Workers)** — sits between the frontend and the Spring Boot backend, owns the OAuth flow, and proxies API requests via gRPC-Web

These live together because the BFF exists solely to serve the frontend. They share a Cloudflare deployment and are deployed together.

## Architecture

```
Browser (React)
    │
    │  HTTP/3 (handled automatically by Cloudflare)
    ▼
Cloudflare Workers — BFF (Bezzie)
    │
    │  gRPC-Web over HTTP/2 + Bearer token
    ▼
Spring Boot backend (Fly.io)
```

## Auth

Auth is handled by **[Bezzie](https://github.com/neilpmas/bezzie)** — a BFF OAuth 2.0 library for Cloudflare Workers.

The BFF owns the full OAuth flow. JWTs never touch the browser.

### Login flow
1. React redirects to BFF `/auth/login`
2. BFF redirects to Auth0 (Authorization Code + PKCE)
3. Auth0 redirects back to BFF `/auth/callback`
4. BFF exchanges code for tokens, stores them in Cloudflare KV
5. BFF issues an `HttpOnly; Secure; SameSite=Strict` session cookie to the browser

### Per-request flow
1. React sends requests to the BFF with the session cookie
2. BFF validates the session, refreshes the token if expired
3. BFF forwards the request to Spring Boot via gRPC-Web with `Authorization: Bearer <token>`

The frontend never holds a token. It just uses the session cookie.

## Stack

| Layer | Technology |
|---|---|
| UI | React + Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix UI primitives) |
| BFF | Cloudflare Workers + Hono |
| Auth library | Bezzie (`bezzie`) |
| Session storage | Cloudflare KV |
| BFF → Backend protocol | gRPC-Web over HTTP/2 |
| Hosting | Cloudflare Pages + Workers |

## Auth0 Config

The BFF needs the following Auth0 values (set as Workers secrets):

| Variable | Description |
|---|---|
| `AUTH0_DOMAIN` | e.g. `your-tenant.auth0.com` |
| `AUTH0_CLIENT_ID` | Web application client ID |
| `AUTH0_CLIENT_SECRET` | Web application client secret |
| `AUTH0_AUDIENCE` | API identifier, e.g. `https://api.yourproject.com` |
| `APP_BASE_URL` | e.g. `https://app.yourproject.com` |

## Setup

> Setup instructions to be added when the scaffold is built.

## Part of

See [template-application-planning](https://github.com/neilpmas/template-application-planning) for the full stack overview, architecture decisions, and project workflow.
