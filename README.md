# FoodiesGoodies 🍳

A social kitchen and recipe discovery web application, built as a multi-page static frontend served by an ASP.NET Core Web API backend. Users can search recipes via the Edamam API, register/login, submit contact inquiries, and interact with a community cooking experience.

## Features

- **Recipe Search** — Powered by the Edamam Recipe API, proxied server-side. Opaque signed pagination cursors prevent direct API exposure.
- **User Authentication** — Full registration, login, and logout using ASP.NET Core Identity with secure HTTP-only cookie sessions.
- **Contact Form** — Validated and forwarded via MailKit SMTP.
- **AI Dietician** — Client-side nutritional guidance tool using the Edamam Nutrition Analysis API.
- **Community Features** — Local/demo social interactions (taste, pin, fork, flavor notes, notifications). No social backend — localStorage only.
- **Dashboard** — User recipe creation and local community feed.
- **Profile & Settings** — User profile management pages.

---

## Architecture

```
Browser (HTML / CSS / Vanilla JS)
          ↓ /api/recipes, /api/auth/*, /api/contact
ASP.NET Core Web API  (FoodiesGoodies.Api/)
          ↓
     Services
     ├── ASP.NET Core Identity   → User registration, login, session cookies
     ├── EF Core → MySQL         → User persistence (AspNetUsers, etc.)
     ├── RecipeService           → Edamam API proxy (server-side, HMAC-signed cursors)
     └── ContactService          → MailKit SMTP email forwarding
```

The canonical static frontend is served from:

```
FoodiesGoodies.Api/wwwroot/
```

---

## Tech Stack

| Layer         | Technology                                             |
| ------------- | ------------------------------------------------------ |
| Language      | C# 12 / .NET 8                                         |
| Web Framework | ASP.NET Core Web API                                   |
| ORM           | Entity Framework Core 8                                |
| Identity      | ASP.NET Core Identity                                  |
| Database      | MySQL 8.x (Pomelo EF Core provider)                    |
| Email         | MailKit                                                |
| Recipe API    | Edamam Recipe Search API v2                            |
| Frontend      | HTML5 / CSS3 / Vanilla JavaScript                      |
| API Docs      | Swagger / OpenAPI (dev only)                           |
| Testing       | xUnit / Moq / FluentAssertions / WebApplicationFactory |

---

## Project Structure

```
FoodiesGoodies/
├── FoodiesGoodies.Api/          # ASP.NET Core Web API project
│   ├── Controllers/             # AuthController, RecipesController, ContactController
│   ├── Services/                # RecipeService, ContactService
│   ├── DTOs/                    # Request/response models
│   ├── Models/                  # ApplicationUser (Identity)
│   ├── Data/                    # FoodiesGoodiesDbContext (EF Core)
│   ├── Configuration/           # EdamamOptions, SmtpOptions
│   ├── Middleware/              # ExceptionHandlingMiddleware
│   ├── Migrations/              # EF Core database migrations
│   ├── wwwroot/                 # Canonical static frontend (HTML/CSS/JS)
│   ├── appsettings.json         # Configuration (no secrets here)
│   └── Program.cs               # App composition root
├── FoodiesGoodies.Tests/        # xUnit integration test project
│   ├── Auth/                    # AuthControllerTests
│   ├── Recipes/                 # RecipesControllerTests
│   ├── Contact/                 # ContactControllerTests
│   └── Helpers/                 # TestWebApplicationFactory (SQLite in-memory)
└── docs/                        # Architecture diagrams
```

---

## Authentication

Authentication uses **ASP.NET Core Identity** with HTTP-only cookie sessions.

- `POST /api/auth/register` — Create account, issues auth cookie
- `POST /api/auth/login` — Login, issues auth cookie
- `POST /api/auth/demo` — 1-click interactive demo login, issues auth cookie
- `POST /api/auth/logout` — Clears auth cookie
- `GET  /api/auth/me` — Returns current user profile or 401

Cookies are `HttpOnly`, `SameSite=Lax`, expire after 7 days with sliding expiration.

> **Important:** The frontend never treats `localStorage` as proof of authentication. The server is the sole authentication authority. `localStorage` is used only for non-security UI caching (display name, avatar).

---

## Recipe API

Recipe search is proxied server-side — Edamam credentials are never sent to or from the browser.

```
GET /api/recipes?q=pasta
GET /api/recipes/next?cursor=<opaque_cursor>
```

Pagination cursors are HMAC-SHA256 signed with `Edamam:CursorSigningKey`. Tampered or invalid cursors are rejected with 400.

---

## Configuration

All sensitive values must be supplied externally. **Never commit real values.**

### Required configuration keys

| Key                                   | Description                              |
| ------------------------------------- | ---------------------------------------- |
| `ConnectionStrings:DefaultConnection` | MySQL connection string                  |
| `Edamam:AppId`                        | Edamam API App ID                        |
| `Edamam:AppKey`                       | Edamam API App Key                       |
| `Edamam:CursorSigningKey`             | Random secret for cursor HMAC signing    |
| `Smtp:Host`                           | SMTP server hostname                     |
| `Smtp:Port`                           | SMTP port (default 587)                  |
| `Smtp:Username`                       | SMTP username                            |
| `Smtp:Password`                       | SMTP password                            |
| `Smtp:AdminEmail`                     | Destination for contact form submissions |

### Local development — User Secrets

```bash
cd FoodiesGoodies.Api

dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=foodiesgoodies;user=root;password=YOUR_PASSWORD"
dotnet user-secrets set "Edamam:AppId" "YOUR_APP_ID"
dotnet user-secrets set "Edamam:AppKey" "YOUR_APP_KEY"
dotnet user-secrets set "Edamam:CursorSigningKey" "any-random-long-secret-string"
dotnet user-secrets set "Smtp:Host" "smtp.example.com"
dotnet user-secrets set "Smtp:Username" "your@email.com"
dotnet user-secrets set "Smtp:Password" "your-smtp-password"
dotnet user-secrets set "Smtp:AdminEmail" "admin@yoursite.com"
```

### Production — Environment Variables

Use the `__` double-underscore notation for nested keys:

```bash
ConnectionStrings__DefaultConnection="..."
Edamam__AppId="..."
Edamam__AppKey="..."
Edamam__CursorSigningKey="..."
Smtp__Host="..."
```

---

## Database Setup

MySQL 8.x must be running locally.

1. **Create the database:**

   ```sql
   CREATE DATABASE foodiesgoodies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configure the connection string** via User Secrets (see above).

3. **Apply EF Core migrations:**

   ```bash
   cd FoodiesGoodies.Api
   dotnet ef database update
   ```

   If `dotnet-ef` is not installed globally:

   ```bash
   dotnet tool restore
   dotnet ef database update
   ```

This creates all Identity tables (`AspNetUsers`, `AspNetRoles`, etc.) plus any application-specific columns.

---

## Run Locally

```bash
cd FoodiesGoodies.Api
dotnet run
```

The application starts on `http://localhost:5050` by default (or as configured).

Static frontend is served at `http://localhost:5050/`.

---

## Swagger

Available in the **Development** environment only:

```
http://localhost:5050/swagger
```

---

## Running Tests

Tests use SQLite in-memory — no MySQL required.

```bash
dotnet test FoodiesGoodies.Tests/FoodiesGoodies.Tests.csproj --verbosity normal
```

Test coverage:

- **Auth**: registration, duplicate rejection, invalid input, login, wrong password, logout, `/api/auth/me`
- **Recipes**: query validation, mocked upstream success/failure, cursor validation (invalid, tampered, missing)
- **Contact**: all field validation, mocked SMTP success/failure

---

## Security

- Edamam credentials are **server-side only** — never exposed to the browser
- Auth cookies are `HttpOnly` — not accessible via JavaScript
- Pagination cursors are HMAC-signed — raw Edamam continuation URLs are never sent to clients
- No stack traces are returned to clients (handled by `ExceptionHandlingMiddleware`)
- Passwords are hashed by ASP.NET Core Identity (PBKDF2)

### ⚠️ Credential Rotation Required

The Edamam credentials `7aa516a5` / `dc836a223fb788b11ae390504d9e97ce` were previously hardcoded in `api/recipes.php`, which was committed to this repository's Git history.

**These credentials must be rotated immediately:**

1. Log in to [developer.edamam.com](https://developer.edamam.com)
2. Regenerate the App Key for App ID `7aa516a5`
3. Update your local User Secrets and production environment with the new key

The old credentials should be considered compromised as they are in the public Git history.

---

## Stage History

| Stage | Description                                                                   |
| ----- | ----------------------------------------------------------------------------- |
| 1     | Replaced PHP backend with ASP.NET Core Web API (Auth, Recipes, Contact)       |
| 1.5   | Removed auth localStorage bypass; purged all active PHP frontend dependencies |
| 2     | Test suite, PHP file removal, legacy frontend cleanup, README, final audit    |
