# FoodiesGoodies 🍳

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![C# 12](https://img.shields.io/badge/C%23-12.0-239120?logo=csharp&logoColor=white)](https://learn.microsoft.com/en-us/dotnet/csharp/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-Web%20API-512BD4?logo=dotnet&logoColor=white)](https://learn.microsoft.com/en-us/aspnet/core/)
[![Entity Framework Core](https://img.shields.io/badge/EF%20Core-8.0-512BD4?logo=dotnet&logoColor=white)](https://learn.microsoft.com/en-us/ef/core/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![SQLite](https://img.shields.io/badge/SQLite-In--Memory%20(Tests)-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Edamam API](https://img.shields.io/badge/Edamam-Recipe%20API%20v2-2DBA4E?logo=food&logoColor=white)](https://developer.edamam.com/)
[![FluentValidation](https://img.shields.io/badge/Validation-FluentValidation-00B4D8)](https://fluentvalidation.net/)
[![Tests](https://img.shields.io/badge/Tests-69%20Passed-brightgreen?logo=checkmarx&logoColor=white)](FoodiesGoodies.Tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A curated culinary intelligence journal, social kitchen, and recipe discovery platform powered by an enterprise-grade ASP.NET Core 8 Web API backend and an editorial, responsive multi-page web application.**

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Why the Backend Shifted from PHP to .NET 8](#-why-the-backend-shifted-from-php-to-net-8)
   - [Architectural Comparison Matrix](#architectural-comparison-matrix)
   - [Deep Dive into Legacy PHP Shortcomings](#deep-dive-into-legacy-php-shortcomings)
   - [How ASP.NET Core 8 Solved Every Vulnerability](#how-aspnet-core-8-solved-every-vulnerability)
3. [Database Architecture & Implementation](#-database-architecture--implementation)
   - [Which Database is Used?](#which-database-is-used)
   - [How the Database is Configured and Used](#how-the-database-is-configured-and-used)
   - [Entity Models & Schema Mapping](#entity-models--schema-mapping)
   - [Migrations & Connection Resilience](#migrations--connection-resilience)
4. [System Architecture & Design Patterns](#-system-architecture--design-patterns)
   - [High-Level Architectural Diagram](#high-level-architectural-diagram)
   - [Clean Separation of Concerns](#clean-separation-of-concerns)
   - [Cryptographic HMAC-SHA256 Signed Cursors](#cryptographic-hmac-sha256-signed-cursors)
   - [Hardened Authentication & Cookie Pipeline](#hardened-authentication--cookie-pipeline)
   - [Centralized Exception Handling & API Envelopes](#centralized-exception-handling--api-envelopes)
5. [Core Features & Modules](#-core-features--modules)
6. [UI/UX Design, Typography & Dual-Mode Theme Engine](#-uiux-design-typography--dual-mode-theme-engine)
   - [Desktop: Verlet Physics Hanging Cord Theme Switcher](#desktop-verlet-physics-hanging-cord-theme-switcher)
   - [Mobile: Minimal Accessible Toggle & Off-Canvas Drawer](#mobile-minimal-accessible-toggle--off-canvas-drawer)
   - [Center-Aligned Navigation with Dedicated Clearance](#center-aligned-navigation-with-dedicated-clearance)
7. [API Reference & Endpoints](#-api-reference--endpoints)
8. [Automated Testing Suite (41 Tests)](#-automated-testing-suite-41-tests)
9. [Configuration & Environment Management](#-configuration--environment-management)
10. [Local Development & Setup Guide](#-local-development--setup-guide)
11. [Project Structure](#-project-structure)
12. [Security Best Practices Implemented](#-security-best-practices-implemented)

---

## 🌟 Project Overview

**FoodiesGoodies** is an interactive culinary platform bridging artisanal cooking with modern nutrition science. Built with an editorial aesthetic, it allows culinary enthusiasts to:

- **Search over 2.3 million chef-tested recipes** in real time via a secure server-proxied Edamam Recipe Search API v2 connection.
- **Analyze dietary and macronutrient intelligence** using a dedicated AI Dietician tool.
- **Interact with a culinary community**, track chef ratings, bookmark favorites, share custom recipes, and inspect chef spotlight features.
- **Experience a dual-mode theme engine** featuring a custom HTML5 Canvas hanging cord with Verlet numerical physics on desktop, and a sleek, minimal toggle on mobile devices.
- **Enjoy full multi-device responsiveness**, from 320px ultra-compact mobile viewports up to 4K ultrawide displays.

The system is delivered as a **single unified service**: an ASP.NET Core 8 Web API serving both RESTful endpoints (`/api/*`) and the static multi-page frontend (`wwwroot/`).

---

## 🔄 Why the Backend Shifted from PHP to .NET 8

FoodiesGoodies was originally conceived as a legacy procedural PHP/LAMP application (`connect.php`, `api/recipes.php`, `api/contact.php`, `api/social.php`). While functional as an early prototype, the procedural PHP architecture proved fundamentally unsuited for production security, reliability, maintainability, and scalability. 

The decision was made to execute a complete **Stage 1 & Stage 2 migration** to **C# 12 and ASP.NET Core 8 Web API**.

### Architectural Comparison Matrix

| Aspect | Legacy PHP Architecture | Modern ASP.NET Core 8 Architecture |
| :--- | :--- | :--- |
| **Language Paradigm** | Dynamically-typed procedural scripts, runtime interpretation | Strongly-typed, object-oriented C# 12 compiled to JIT/.NET CLR |
| **API Secret Management** | Hardcoded API keys (`app_id`, `app_key`) committed in public scripts | Zero secrets in source code; managed via .NET User Secrets & Env Vars |
| **Session & Auth** | Fragile PHP sessions with client-side `localStorage` authentication bypass | Server-authoritative ASP.NET Core Identity with hardened `HttpOnly` cookies |
| **Password Security** | Inconsistent hashing or plain DB queries without lockout policies | PBKDF2 with unique cryptographic salt, 5-attempt lockout, 15-minute cooloff |
| **Upstream API Proxying** | Raw continuation URLs sent directly to client browsers (SSRF risk) | Opaque HMAC-SHA256 cryptographically signed pagination cursors |
| **Validation Layer** | Loose, manual `isset()` and `$_POST` checks with inconsistent errors | Declarative FluentValidation pipeline with automated HTTP 400 envelopes |
| **Error Handling** | Uncaught exceptions printing raw MySQL errors and stack traces | Centralized `ExceptionHandlingMiddleware` with correlation IDs |
| **Database Access** | Ad-hoc `mysqli` or manual PDO connections with raw SQL fragments | Entity Framework Core 8 with Pomelo MySQL, migrations & retry resilience |
| **Asynchronous I/O** | Synchronous blocking I/O (each HTTP call blocks worker threads) | Full `async`/`await` non-blocking I/O across database, HTTP, and SMTP |
| **Testing Capability** | Zero unit or integration tests; untestable procedural scripts | 41 automated tests using xUnit, `WebApplicationFactory`, and in-memory SQLite |
| **API Documentation** | None; manual guesswork from source code | Swagger / OpenAPI UI automatically generated in development mode |

---

### Deep Dive into Legacy PHP Shortcomings

1. **Severe Security Vulnerabilities & Credential Leakage**:
   - In the PHP codebase (`api/recipes.php`), the Edamam API `app_id` and `app_key` were hardcoded into the script file. Anyone viewing or downloading the repository gained unrestricted access to the developer credentials.
   - PHP script-level error reporting frequently printed database hostnames, usernames, and query strings on unhandled exceptions (`die(mysqli_error($conn))`).

2. **Client-Side Authentication Bypass**:
   - In the legacy frontend, `auth.js` relied on `localStorage.getItem('user')` as proof of login state. If an attacker created a mock user JSON in `localStorage`, the UI treated them as authenticated without server verification.

3. **Server-Side Request Forgery (SSRF) & Cursor Tampering**:
   - Edamam's v2 pagination returns a full external next-page URL (`_links.next.href`). The PHP backend passed this raw URL to the frontend and accepted it back on subsequent requests without cryptographic verification, allowing clients to manipulate query parameters or trick the server into fetching arbitrary URLs.

4. **Procedural Spaghetti & Lack of Dependency Injection**:
   - Each PHP file created its own database connection, read global superglobals (`$_POST`, `$_GET`), executed queries, formatted JSON, and terminated with `die()` or `exit()`. There was no dependency injection, no interface segregation, and no separation of data contracts.

5. **Thread Blocking & Poor Resource Utilization**:
   - Traditional PHP web servers (e.g., Apache with `mod_php` or PHP-FPM) block the worker thread while waiting for remote HTTP APIs (Edamam) or SMTP transactions. Under traffic spikes, connection pools rapidly exhausted.

---

### How ASP.NET Core 8 Solved Every Vulnerability

- **Compile-Time Type Safety & Nullability**: C# 12 nullable reference types (`#nullable enable`) catch potential `NullReferenceException` bugs at compile time. Strongly-typed DTOs ensure that invalid payloads never reach application logic.
- **Server-Authoritative Identity**: The backend is the sole source of truth for authentication. Sessions are governed by secure HTTP-only cookies (`FoodiesGoodies.Auth`) with `SameSite=Lax` protection against CSRF.
- **Cryptographic Cursor Tokens**: `RecipeService` encodes Edamam's continuation URLs into opaque Base64 tokens accompanied by an HMAC-SHA256 signature generated with a 256-bit secret key. Tampered or expired cursors are rejected before any outbound network call occurs.
- **High-Performance Async Pipeline**: ASP.NET Core's Kestrel server processes incoming requests asynchronously on the .NET ThreadPool. Outbound Edamam calls utilize `IHttpClientFactory` with connection pooling, DNS refresh cycles, and request timeouts.
- **Integrated Testability**: The modern backend was architected with dependency injection from day one, allowing the entire API to be tested in memory with `WebApplicationFactory<Program>` without spinning up a live MySQL server or hitting external third-party APIs.

---

## 🗄️ Database Architecture & Implementation

### Which Database is Used?

The FoodiesGoodies system employs a dual-database strategy:

1. **Production & Local Development**: **MySQL 8.x** (compatible with MySQL 8.0.36+ and MariaDB 10.5+).
   - Driven by **`Pomelo.EntityFrameworkCore.MySql`** (v8.0.2), the community-standard, high-performance MySQL provider for EF Core.
2. **Automated Integration Testing**: **SQLite (In-Memory)** via **`Microsoft.EntityFrameworkCore.Sqlite`** (v8.0.2).
   - Provides instantaneous, isolated, zero-dependency database teardown and rebuild for all 41 test runs.

---

### How the Database is Configured and Used

Database interactions are managed entirely through **Entity Framework Core 8** using the **Code-First** approach.

#### Configuration in `Program.cs`:
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured.");

builder.Services.AddDbContext<FoodiesGoodiesDbContext>(options =>
{
    options.UseMySql(
        connectionString, 
        new MySqlServerVersion(new Version(8, 0, 36)), 
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 1, 
                maxRetryDelay: TimeSpan.FromSeconds(1), 
                errorNumbersToAdd: null);
        });
});
```

#### Key Capabilities:
- **Connection Resilience (`EnableRetryOnFailure`)**: Automatically retries transient connection drops (e.g., MySQL connection reset or temporary network hiccups) without crashing active HTTP requests.
- **Version Pinning**: Specifically pins `MySqlServerVersion(8, 0, 36)` to enable schema validation, migrations, and design-time model generation without requiring an active MySQL connection during builds.
- **ASP.NET Core Identity Stores**: Integrated directly into `FoodiesGoodiesDbContext` via `IdentityDbContext<ApplicationUser>`, inheriting fully managed security tables (`AspNetUsers`, `AspNetRoles`, `AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserTokens`, etc.).

---

### Entity Models & Schema Mapping

The core domain entity is **`ApplicationUser`**, which extends `IdentityUser`:

```csharp
public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? DietaryFocus { get; set; }
    public string? Rank { get; set; } = "Home Chef";
    public string? ProfilePic { get; set; }
    public string? CoverPic { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

#### Fluent Model Configuration (`FoodiesGoodiesDbContext.cs`):
```csharp
protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);

    builder.Entity<ApplicationUser>(b =>
    {
        b.Property(u => u.DisplayName).HasMaxLength(100);
        b.Property(u => u.DietaryFocus).HasMaxLength(150);
        b.Property(u => u.Rank).HasMaxLength(50);
        b.Property(u => u.ProfilePic).HasMaxLength(500);
        b.Property(u => u.CoverPic).HasMaxLength(500);
        b.Property(u => u.Bio).HasMaxLength(2000);
        b.HasIndex(u => u.Email).IsUnique();
    });
}
```

### Database Schema Table Summary

| Table Name | Source | Purpose | Key Attributes |
| :--- | :--- | :--- | :--- |
| `AspNetUsers` | ASP.NET Identity + EF Core | User credentials, security stamps & culinary profiles | `Id`, `UserName`, `Email`, `PasswordHash`, `DisplayName`, `DietaryFocus`, `Rank`, `ProfilePic`, `Bio`, `CreatedAt`, `LockoutEnd`, `AccessFailedCount` |
| `AspNetRoles` | ASP.NET Identity | Role-based authorization groups | `Id`, `Name`, `NormalizedName`, `ConcurrencyStamp` |
| `AspNetUserRoles` | ASP.NET Identity | Many-to-many user/role mapping | `UserId`, `RoleId` |
| `AspNetUserClaims` | ASP.NET Identity | Extended claim claims | `Id`, `UserId`, `ClaimType`, `ClaimValue` |
| `AspNetUserLogins` | ASP.NET Identity | External OAuth/OIDC logins (Google, etc.) | `LoginProvider`, `ProviderKey`, `UserId` |
| `__EFMigrationsHistory` | EF Core | Tracks applied migration versions | `MigrationId`, `ProductVersion` |

---

### Migrations & Connection Resilience

Migrations are version-controlled inside `FoodiesGoodies.Api/Migrations/`. To apply migrations to your database:

```bash
cd FoodiesGoodies.Api
dotnet ef database update
```

When creating schema modifications:
```bash
dotnet ef migrations add AddNewFeatureField
```

---

## 🏗️ System Architecture & Design Patterns

### High-Level Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT WEB BROWSER                                 │
│  HTML5 MPA • Vanilla CSS3 • Vanilla ES6+ JS • Verlet Physics Theme Engine   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST (/api/*) + Static Assets
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ASP.NET CORE 8 KESTREL WEB SERVER                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. ExceptionHandlingMiddleware   ── Centralized error logging & envelopes  │
│  2. StaticFiles Middleware        ── Serves wwwroot/ (HTML, CSS, JS, Assets)│
│  3. Routing & CORS Middleware     ── Managed origin & credential validation │
│  4. Authentication Middleware     ── HttpOnly Cookie validation             │
│  5. Authorization Middleware      ── Role & policy verification             │
│  6. FluentValidation Pipeline     ── Automatic request model sanitization   │
├─────────────────────────────────────────────────────────────────────────────┤
│                             CONTROLLERS                                     │
│     AuthController       │    RecipesController    │    ContactController   │
├──────────────────────────┼─────────────────────────┼────────────────────────┤
│ • Register, Login, Me    │ • Search (Edamam proxy) │ • Validates message    │
│ • Interactive Demo Login │ • Next (HMAC cursor)    │ • Sends email via SMTP │
│ • Cookie issuance/logout │ • Error handling        │ • Prevents spam        │
├──────────────────────────┼─────────────────────────┼────────────────────────┤
│                          SERVICE & DATA LAYER                               │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│  │   ApplicationUser    │ │    RecipeService     │ │    ContactService    │ │
│  │   (Identity / Auth)  │ │ (Typed HttpClient)   │ │      (MailKit)       │ │
│  └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘ │
│             │                        │                        │             │
│             ▼                        ▼                        ▼             │
│    FoodiesGoodiesDbContext    Edamam Cloud API        External SMTP Relay   │
│   (EF Core 8 / Pomelo MySQL)  (HMAC Signed Cursors)   (Forward to Admin)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Clean Separation of Concerns

1. **Controllers Layer (`Controllers/`)**:
   - Thin, expressive HTTP endpoints returning uniform `ApiResponse<T>` objects. No direct database or external API logic lives here.
2. **Data Transfer Objects (`DTOs/`)**:
   - Immutable record types (`RegisterRequest`, `LoginRequest`, `ContactRequest`, `RecipeSearchResponse`, `ApiResponse`) separating the API contract from the internal database models.
3. **Validators Layer (`Validators/`)**:
   - Built on **FluentValidation**. Enforces strict business rules (e.g. password complexity: uppercase, lowercase, digit, special character, min 8 chars; email RFC validation; message length boundaries).
4. **Service Layer (`Services/`)**:
   - `RecipeService`: Encapsulates upstream HTTP interactions, rate-limit tolerance, and HMAC cursor signing.
   - `ContactService`: Manages MailKit SMTP delivery with HTML template generation.
   - `DemoUserService`: Seeds and provisions instant interactive demo chef sessions (`Chef Gabriella Russo`).
5. **Middleware Layer (`Middleware/`)**:
   - `ExceptionHandlingMiddleware`: Intercepts all unhandled exceptions, logs the error with a correlation ID, and returns a sanitized JSON 500 error envelope without leaking stack traces.

---

### Cryptographic HMAC-SHA256 Signed Cursors

To prevent upstream parameter tampering and eliminate SSRF, `RecipeService` employs cryptographic pagination:

```
Upstream Next URL  ──►  Base64 Payload  ──►  HMAC-SHA256(Payload, Key)  ──►  Token: "Payload.Signature"
                                                                                       │
Client Requests /api/recipes/next?cursor=Token  ◄──────────────────────────────────────┘
                               │
                       Validate Signature
                               ├─ Valid   ──► Forward request to Edamam upstream
                               └─ Invalid ──► Reject with HTTP 400 Bad Request
```

1. When Edamam returns `_links.next.href`, the server extracts the raw continuation URL.
2. The URL is Base64Url-encoded as the payload.
3. An HMAC-SHA256 signature is computed using `Edamam:CursorSigningKey`.
4. The client receives an opaque token string: `{payload}.{signature}`.
5. On the next page fetch (`GET /api/recipes/next?cursor={token}`), the server recomputes the HMAC. If even a single byte was altered, the request fails with HTTP 400.

---

### Hardened Authentication & Cookie Pipeline

Authentication is built on **ASP.NET Core Identity** configured for REST API consumers:

- **Cookie Name**: `FoodiesGoodies.Auth`
- **Security Flags**: `HttpOnly = true` (inaccessible to JavaScript `document.cookie`, preventing XSS session hijacking).
- **SameSite Policy**: `SameSiteMode.Lax` (safeguards against Cross-Site Request Forgery).
- **Sliding Expiration**: Active sessions automatically refresh up to 7 days.
- **REST Status Codes**: Overridden `OnRedirectToLogin` and `OnRedirectToAccessDenied` hooks return native `401 Unauthorized` and `403 Forbidden` JSON responses instead of redirecting API callers to an HTML login page.
- **Lockout Policy**: After 5 consecutive failed login attempts, the account is temporarily locked for 15 minutes.

---

### Centralized Exception Handling & API Envelopes

Every API response follows a consistent contract:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

Or on failure:

```json
{
  "success": false,
  "message": "Validation failed: Password must contain at least one uppercase letter.",
  "data": null
}
```

---

## 🍳 Core Features & Modules

### 1. Live Recipe Discovery Engine
- Search over 2.3 million recipes powered live by Edamam Recipe Search API v2.
- Interactive multi-parameter filtering: meal type (Breakfast, Lunch, Dinner, Snack), dish type, cuisine type, dietary preferences (Vegan, Keto, Gluten-Free, Low-Carb).
- Server-side signing of pagination cursors for tamper-proof navigation.
- Recipe detail modal presenting ingredients, yield, cook time, calories, and macros.

### 2. Server-Side Gemini AI Diet Planner Agent
FoodiesGoodies includes a server-side Gemini-powered AI nutrition planner that combines deterministic nutrition calculations, country/region/cuisine context, dietary restrictions, user preferences, structured model output, server-side validation, and graceful fallback generation to create personalized meal plans.

- **Authoritative Deterministic Nutrition**: Computes basal metabolic rate (BMR) via the Mifflin-St Jeor equation, total daily energy expenditure (TDEE), caloric targets, and macronutrient splits (protein, carbohydrates, healthy fats) on the server before invoking the AI model.
- **Tri-Partite Cultural Resolution**: Treats Country, Region, and Cuisine as separate, independent concepts (e.g. a user living in Canada selecting authentic Maharashtrian or Japanese cuisine).
- **Server-Side Security**: The client browser never receives, handles, or transmits Gemini API credentials. All model interactions occur through server-side ASP.NET Core typed clients.
- **Structured JSON & Validation Loop**: Enforces strict JSON schemas for predictable deserialization, followed by `DietPlanValidator` checks on allergen exclusions, dietary constraints, and caloric realism with automated self-correction up to `MaxAgentIterations`.
- **7-Day Schedule & Single-Meal Swapping**: Delivers a full 7-day personalized schedule, weekly consolidated grocery checklist, and single-meal regeneration (`POST /api/ai/diet-plan/swap-meal`) without altering the rest of the week.
- **Edamam Recipe Cross-Referencing**: Integrates with the existing `IRecipeService` to match AI meal concepts with authentic, tested recipes.
- **Graceful Fallback**: Automatically switches to the deterministic `FallbackDietPlanner` if upstream AI services are unavailable, transparently labeled as generated by the FoodiesGoodies Planning Engine.
- *Disclaimer: Provides lifestyle and nutritional guidance for educational purposes; not intended as medical advice, clinical diagnosis, or therapeutic prescription.*

### 3. User Authentication & 1-Click Interactive Demo
- Complete registration, validation, and login workflow.
- **1-Click Interactive Demo**: Instant access to an active chef profile (`Chef Gabriella Russo`, `@chefgabriella`) without requiring manual credential entry, designed for quick evaluation.
- Session persistence verified against `/api/auth/me`.

### 4. Chef Profile & Social Kitchen Feed
- User profile management with culinary ranks (e.g., *Executive Chef*, *Sous Chef*, *Home Cook*).
- Interactive community feed on the dashboard with flavor notes, recipe pinboard, and fork stats.
- Multi-step custom recipe creator modal.

### 5. Verified Contact & Inquiries
- Secure contact form validated with FluentValidation.
- Dual-format email delivery (HTML and PlainText) forwarded to administrators via MailKit SMTP.

---

## 🎨 UI/UX Design, Typography & Dual-Mode Theme Engine

FoodiesGoodies adheres to a high-standard editorial design system inspired by modern publications (*Bon Appétit*, *The New York Times Cooking*).

- **Typography**: 
  - **Headings**: *Playfair Display* — an elegant editorial serif conveying culinary craftsmanship.
  - **Body & Controls**: *Plus Jakarta Sans* — a high-legibility geometric sans-serif engineered for modern web screens.
- **Design Tokens**: Centralized in `variables.css` using CSS custom properties with tailored HSL palettes, smooth micro-elevations, and glassmorphism backdrops (`backdrop-filter: blur(12px)`).

---

### Desktop: Verlet Physics Hanging Cord Theme Switcher

On desktop viewports (`> 992px`), FoodiesGoodies features a custom theme toggle inspired by [Umesh Nagare's website](https://umeshnagare.com/):

- **Verlet Numerical Integration**: An 8-node physical chain rendered on an HTML5 `<canvas>` that simulates gravity, momentum, inertia, and elastic restoring forces.
- **Physical Constraints**: Relaxation algorithm enforces maximum stretch limits (`maxPullY = 96px`) to prevent visual tearing.
- **Release-Only Triggering**: Theme switching only triggers when the pull threshold is exceeded and the pointer is released, preventing accidental toggles during drag.
- **Minimalist Aesthetic**: Zero disruptive audio chirps or intrusive toast notifications. Smooth quadratic bezier curve rendering with a dynamic pill knob.

---

### Mobile: Minimal Accessible Toggle & Off-Canvas Drawer

On mobile devices (`<= 992px`), touch ergonomics take priority:

- **Hanging Cord Completely Hidden**: The canvas cord is removed (`display: none !important`) to prevent viewport clutter and touch collisions.
- **Minimal 38×38px Button**: A dedicated, touch-friendly button with clean sun/moon Ionicons (`sunny-outline` / `moon-outline`) appears in the header actions cluster and inside the off-canvas navigation drawer header.
- **Slide-Out Navigation Drawer**: An off-canvas drawer with smooth cubic-bezier transitions, backdrop blur, and integrated keyboard focus trapping (`Tab` cycle, `Escape` to close).

---

### Center-Aligned Navigation with Dedicated Clearance

The desktop navigation bar utilizes a balanced **3-section architecture**:

1. **Left**: Pinned brand logo (`Foodies Goodies`).
2. **Center**: Navigation links (`Home`, `Recipes`, `AI Dietician`, `About`, `Contact`) are **mathematically center-aligned to the viewport width** via:
   ```css
   header.header nav.navbar {
     position: absolute !important;
     left: 50% !important;
     top: 50% !important;
     transform: translate(-50%, -50%) !important;
   }
   ```
3. **Right**: The `Sign In` / user profile badge is positioned in `.header-actions-wrap` with a dedicated **96px right margin**, guaranteeing a clear **~50px separation gap** that never overlaps with the desktop hanging cord.

---

## 📡 API Reference & Endpoints

All API endpoints reside under the `/api/` prefix and accept/return JSON.

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Register a new user account | No | `{ "username", "email", "password", "displayName" }` |
| `POST` | `/api/auth/login` | Authenticate user and issue cookie | No | `{ "email", "password" }` |
| `POST` | `/api/auth/demo` | Authenticate as demo chef Gabriella | No | None |
| `POST` | `/api/auth/logout` | Clear authentication session cookie | Yes | None |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Yes | None |

### Recipe Discovery Endpoints (`/api/recipes`)

| Method | Endpoint | Description | Auth Required | Query Parameters |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/recipes` | Search recipes via Edamam | No | `q` (required), `mealType`, `dishType`, `diet` |
| `GET` | `/api/recipes/next` | Fetch next page using signed cursor | No | `cursor` (HMAC signed token) |

### Contact & Support Endpoints (`/api/contact`)

| Method | Endpoint | Description | Auth Required | Request Body |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/contact` | Submit inquiry & forward via SMTP | No | `{ "name", "email", "subject", "message" }` |

### AI Nutrition Planner Endpoints (`/api/ai`)

| Method | Endpoint | Description | Auth Required | Request / Query |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/ai/diet-plan` | Generate personalized 7-day diet plan via Gemini Agent | No (Rate-limited) | `DietPlanRequest` JSON |
| `POST` | `/api/ai/diet-plan/swap-meal` | Regenerate a single meal preserving context & targets | No (Rate-limited) | `MealSwapRequest` JSON |
| `GET` | `/api/ai/cuisines` | Fetch all supported culinary cultural profiles | No | None |
| `POST` | `/api/ai/calculate` | Compute authoritative Mifflin-St Jeor targets directly | No | `DietPlanRequest` JSON |

---

## 🧪 Automated Testing Suite (69 Tests)

The test suite in **`FoodiesGoodies.Tests/`** verifies system correctness, security policies, and validation boundaries across all modules, including the server-side AI nutrition engine.

### Test Isolation Architecture:
- Uses **`WebApplicationFactory<Program>`** to launch the entire API in memory.
- Injects an **in-memory SQLite database** (`TestWebApplicationFactory`), ensuring tests run without an external MySQL instance.
- Mocks outbound network calls (`MockHttpMessageHandler` for Edamam and Gemini, `IContactService` for SMTP).
- Zero external network dependency during unit tests.

```bash
# Run all tests
dotnet test FoodiesGoodies.sln --no-build
```

### Test Coverage Breakdown (69 Total Tests):

```
Passed!  - Failed: 0, Passed: 69, Skipped: 0, Total: 69, Duration: ~5 s
```

- **Server-Side AI Diet Planner Suite (27 tests)**:
  - **Deterministic Nutrition Targets (6 tests)**:
    - Authoritative Mifflin-St Jeor calculation for Male, Female, and Neutral profiles.
    - Accurate TDEE multipliers across all activity levels (sedentary, light, moderate, very active, extra active).
    - Goal caloric shifts (500 kcal deficit for fat loss with 1200 kcal safety floor, 350 kcal surplus for muscle gain).
    - Macronutrient splits (Protein 28%, Carbs 47%, Fats 25%) and hydration fluid volume estimates.
    - Boundary and negative input handling.
  - **Cuisine & Cultural Anthropology (5 tests)**:
    - Full profile retrieval across Indian (Maharashtrian, Punjabi, South Indian, Gujarati), Japanese, Mediterranean, Mexican, and Global fusion traditions.
    - Independent resolution of Country, Region, and Cuisine (e.g. Canadian resident requesting authentic Maharashtrian cuisine).
    - Graceful fallback for unknown or arbitrary cuisine queries.
  - **Diet Plan Validator & Safety (4 tests)**:
    - Structural integrity validation (7 days, meal categories, caloric realism).
    - Zero tolerance for allergen violations (peanuts, tree nuts, dairy, gluten, shellfish, etc.).
    - Dietary restriction enforcement (e.g., meat in a vegetarian plan triggers validation error).
    - Caloric deviation tolerance (+/- 15%).
  - **Gemini Client Transport & Security (6 tests)**:
    - Safe server-side `x-goog-api-key` header injection (never in query parameters or browser).
    - Structured content parsing and JSON schema response deserialization.
    - Error code handling (400 Bad Request, 401 Unauthorized, 429 Rate Limit, 500 Server Error).
    - HTTP timeout and CancellationToken propagation without leaking credentials.
    - Malformed and non-JSON model output resilience.
  - **DietPlannerAgent & Correction Loop (4 tests)**:
    - Complete 7-day personalized plan generation with context enrichment.
    - Self-correction loop: sends validator errors back to Gemini for correction up to `MaxAgentIterations`.
    - Graceful fallback to deterministic `FallbackDietPlanner` when Gemini is unavailable.
    - High-risk query screening (eating disorders, extreme deficits, minor weight loss).
  - **Security & Secret Leakage (2 tests)**:
    - Strict verification that `DietPlanRequest` refuses and ignores any client-supplied API key (`clientApiKey`, `apiKey`, `geminiKey`).
    - Verification that `DietPlanResponse` never contains API keys, tokens, or internal secrets.
- **Authentication & Session Tests (12 tests)**:
  - Valid user registration returns 200 and issues session cookie.
  - Duplicate email registration rejected with HTTP 409 Conflict.
  - Invalid email formatting rejected with HTTP 400.
  - Passwords failing complexity rejected with HTTP 400.
  - Correct login credentials issue `FoodiesGoodies.Auth` cookie.
  - Invalid password returns HTTP 401 Unauthorized.
  - Non-existent user returns HTTP 401 Unauthorized.
  - Authenticated user logout clears session cookie.
  - Unauthenticated access to `/api/auth/me` returns HTTP 401.
  - Authenticated access to `/api/auth/me` returns full profile.
  - Calling `/api/auth/me` after logout returns HTTP 401.
  - Interactive demo login creates session and returns 200.
- **FluentValidation & Security Unit Tests (10 tests)**:
  - Password complexity: requires uppercase, lowercase, number, special char, min 8 chars.
  - Email format validation across registration and login.
  - Empty field and whitespace injection detection.
- **Recipe Search & Signed Cursor Tests (10 tests)**:
  - Empty or missing query parameter returns HTTP 400.
  - Overly long query strings (> 100 chars) return HTTP 400.
  - Mocked upstream Edamam success parses and returns recipe hits.
  - Mocked upstream failure propagates clean HTTP error envelope.
  - Missing or empty cursor parameter returns HTTP 400.
  - Tampered HMAC cursor token is cryptographically rejected.
  - Valid HMAC cursor token is verified and forwarded successfully.
- **Contact Inquiry & SMTP Tests (9 tests)**:
  - Valid contact submission returns HTTP 200.
  - Missing Name, Email, Subject, or Message rejected with HTTP 400.
  - Invalid email formatting rejected with HTTP 400.
  - Oversized payloads (> 4000 char message or > 100 char name) rejected.
  - SMTP service failure handled gracefully with HTTP 400 error envelope.
  - Contact service verified to be invoked exactly once with matching payload.

---

## ⚙️ Configuration & Environment Management

Sensitive configuration keys must never be committed to source control.

### Required Configuration Keys

| Configuration Key | Description | Example / Format |
| :--- | :--- | :--- |
| `ConnectionStrings:DefaultConnection` | MySQL database connection string | `server=localhost;port=3306;database=foodiesgoodies;user=root;password=...` |
| `Edamam:AppId` | Edamam Developer Application ID | `8-character alphanumeric string` |
| `Edamam:AppKey` | Edamam Developer Application Key | `32-character hex string` |
| `Edamam:CursorSigningKey` | Secret key for HMAC-SHA256 cursor signing | Random cryptographic string (min 32 characters) |
| `Gemini:ApiKey` | Google Gemini API Key (server-side only) | `AIzaSy...` (stored securely in server secrets) |
| `Gemini:Model` | Gemini AI model identifier | `gemini-2.5-flash` |
| `Gemini:BaseUrl` | Gemini REST endpoint base URL | `https://generativelanguage.googleapis.com` |
| `Gemini:TimeoutSeconds` | HTTP timeout for model interactions | `45` |
| `Gemini:MaxAgentIterations` | Max planning/validation correction loop attempts | `5` |
| `Smtp:Host` | Outgoing SMTP mail server | `smtp.mailgun.org` or `smtp.gmail.com` |
| `Smtp:Port` | Outgoing SMTP mail port | `587` (STARTTLS) or `465` (SSL) |
| `Smtp:Username` | SMTP account username | `user@example.com` |
| `Smtp:Password` | SMTP account password or app password | `secret_password` |
| `Smtp:AdminEmail` | Destination email for contact submissions | `admin@foodiesgoodies.local` |

### Setting Secrets Locally (.NET User Secrets)

From the `FoodiesGoodies.Api` folder:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=foodiesgoodies;user=root;password=YOUR_PASSWORD"
dotnet user-secrets set "Edamam:AppId" "YOUR_EDAMAM_APP_ID"
dotnet user-secrets set "Edamam:AppKey" "YOUR_EDAMAM_APP_KEY"
dotnet user-secrets set "Edamam:CursorSigningKey" "a-very-secure-random-key-at-least-32-chars-long"
dotnet user-secrets set "Gemini:ApiKey" "YOUR_GEMINI_KEY"
dotnet user-secrets set "Gemini:Model" "gemini-2.5-flash"
dotnet user-secrets set "Smtp:Host" "smtp.example.com"
dotnet user-secrets set "Smtp:Port" "587"
dotnet user-secrets set "Smtp:Username" "your-smtp-user"
dotnet user-secrets set "Smtp:Password" "your-smtp-password"
dotnet user-secrets set "Smtp:AdminEmail" "admin@yourdomain.com"
```

### Production Deployment (Environment Variables)

Use double-underscore `__` notation for hierarchical settings:

```bash
export ConnectionStrings__DefaultConnection="server=db.internal;port=3306;database=foodies;user=app;password=..."
export Edamam__AppId="YOUR_APP_ID"
export Edamam__AppKey="YOUR_APP_KEY"
export Edamam__CursorSigningKey="YOUR_LONG_CRYPTO_SIGNING_KEY"
export Gemini__ApiKey="YOUR_GEMINI_KEY"
export Gemini__Model="gemini-2.5-flash"
export Gemini__BaseUrl="https://generativelanguage.googleapis.com"
export Gemini__TimeoutSeconds="45"
export Gemini__MaxAgentIterations="5"
export Smtp__Host="smtp.sendgrid.net"
export Smtp__Port="587"
export Smtp__Username="apikey"
export Smtp__Password="SENDGRID_API_KEY"
```

---

## 🚀 Local Development & Setup Guide

### Prerequisites
- **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** or newer
- **[MySQL Server 8.0+](https://dev.mysql.com/downloads/)**
- **Git**

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SubodhMuneshwar/FoodiesGoodies.git
   cd FoodiesGoodies/FoodiesGoodies
   ```

2. **Initialize MySQL Database**:
   Log in to MySQL and create the database:
   ```sql
   CREATE DATABASE foodiesgoodies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Configure User Secrets**:
   ```bash
   cd FoodiesGoodies.Api
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=foodiesgoodies;user=root;password=YOUR_PASSWORD"
   dotnet user-secrets set "Edamam:AppId" "YOUR_APP_ID"
   dotnet user-secrets set "Edamam:AppKey" "YOUR_APP_KEY"
   dotnet user-secrets set "Edamam:CursorSigningKey" "super-secret-cryptographic-cursor-signing-key-32chars"
   ```

4. **Apply EF Core Migrations**:
   ```bash
   dotnet ef database update
   ```

5. **Run the Application**:
   ```bash
   dotnet run
   ```

6. **Access in Browser**:
   - **Web Application**: `http://localhost:5258/` (or `http://localhost:5050/`)
   - **Swagger API Docs (Dev Only)**: `http://localhost:5258/swagger`

7. **Run Automated Test Suite**:
   ```bash
   cd ..
   dotnet test FoodiesGoodies.sln
   ```

---

## 📁 Project Structure

```
FoodiesGoodies/
├── FoodiesGoodies.sln                    # Visual Studio / .NET solution file
├── FoodiesGoodies.Api/                   # ASP.NET Core 8 Web API Project
│   ├── Configuration/                    # Strongly-typed configuration options
│   │   ├── EdamamOptions.cs              # Edamam API credentials and endpoints
│   │   └── SmtpOptions.cs                # SMTP relay parameters
│   ├── Controllers/                      # REST API Controllers
│   │   ├── AuthController.cs             # Registration, login, demo, me, logout
│   │   ├── ContactController.cs          # Contact form submission endpoint
│   │   └── RecipesController.cs          # Live recipe search and cursor pagination
│   ├── Data/                             # Entity Framework Core Data Context
│   │   └── FoodiesGoodiesDbContext.cs    # IdentityDbContext & model configuration
│   ├── DTOs/                             # Request and Response Data Contracts
│   │   ├── ApiResponse.cs                # Unified JSON response envelope
│   │   ├── AuthRequests.cs               # Register and login request records
│   │   ├── ContactRequest.cs             # Contact inquiry request record
│   │   ├── RecipeSearchResponse.cs       # Edamam response data models
│   │   └── UserResponse.cs               # User profile serialization DTO
│   ├── Middleware/                       # HTTP Pipeline Middlewares
│   │   └── ExceptionHandlingMiddleware.cs# Global error capture & sanitization
│   ├── Migrations/                       # Code-First EF Core database migrations
│   ├── Models/                           # Domain entities
│   │   └── ApplicationUser.cs            # IdentityUser with culinary profile fields
│   ├── Services/                         # Core business logic services
│   │   ├── ContactService.cs             # MailKit SMTP email dispatch
│   │   ├── DemoUserService.cs           # Seeded demo chef account manager
│   │   └── RecipeService.cs              # Edamam proxy with HMAC cursor signing
│   ├── Validators/                       # FluentValidation validators
│   │   ├── ContactRequestValidator.cs    # Contact inquiry validation rules
│   │   ├── LoginRequestValidator.cs      # Login parameter validation
│   │   └── RegisterRequestValidator.cs   # Password complexity and email validation
│   ├── wwwroot/                          # Canonical Static Multi-Page Web App
│   │   ├── assets/                       # Images, badges, chef portraits, videos
│   │   ├── css/                          # Modular design system stylesheets
│   │   │   ├── base.css                  # Typography, header, footer, skip links
│   │   │   ├── global.css                # Cord theme switch, mobile drawer, badges
│   │   │   ├── style.css                 # Hero, spotlight, recipe cards, carousel
│   │   │   ├── ai.css                    # AI dietician interface
│   │   │   ├── search.css                # Recipe search and filters
│   │   │   ├── dashboard.css             # Social kitchen feed, widgets, modal
│   │   │   └── variables.css             # Design tokens and color palettes
│   │   ├── js/                           # Modular ES6+ JavaScript modules
│   │   │   ├── auth.js                   # Client auth sync, badge rendering
│   │   │   ├── nav.js                    # Verlet cord physics, drawer, centering
│   │   │   ├── ai.js                     # AI nutrition calculation logic
│   │   │   ├── recipe.js                 # Search, filtering, modal details
│   │   │   └── dashboard.js              # Social feed interactions
│   │   ├── pages/                        # Multi-page application views
│   │   │   ├── search.html               # Recipe search interface
│   │   │   ├── ai.html                   # AI Dietician & macro planner
│   │   │   ├── dashboard.html            # Social kitchen dashboard
│   │   │   ├── login.html                # Sign in and register portal
│   │   │   ├── profile.html              # Chef profile and bio
│   │   │   ├── create-recipe.html        # Custom recipe creator
│   │   │   ├── about.html                # Editorial culinary story
│   │   │   ├── contact.html              # Customer inquiries and support
│   │   │   ├── notifications.html        # Kitchen alerts
│   │   │   ├── settings.html             # Account and dietary settings
│   │   │   ├── privacy.html              # Privacy policy
│   │   │   └── terms.html                # Terms of service
│   │   └── index.html                    # Homepage & signature chef spotlight
│   ├── appsettings.json                  # Non-sensitive base configuration
│   ├── FoodiesGoodies.Api.csproj         # C# project file with package references
│   └── Program.cs                        # Application composition root & DI
├── FoodiesGoodies.Tests/                 # Automated Testing Suite (xUnit)
│   ├── Auth/                             # AuthController & password validator tests
│   ├── Contact/                          # ContactController & SMTP tests
│   ├── Recipes/                          # RecipesController & signed cursor tests
│   ├── Helpers/                          # TestWebApplicationFactory (SQLite In-Memory)
│   └── FoodiesGoodies.Tests.csproj       # Test project file
└── README.md                             # Comprehensive project documentation
```

---

## 🔒 Security Best Practices Implemented

1. **Defense-in-Depth Credential Segregation**:
   - Zero API secrets committed to source control.
   - Development credentials isolated via `dotnet user-secrets`.
   - Production secrets injected via hardened environment variables.
2. **Anti-Tampering HMAC Pagination**:
   - Upstream API continuation URLs are shielded behind HMAC-SHA256 tokens signed with a 256-bit private key.
3. **Session & Cookie Hardening**:
   - `HttpOnly = true` prevents access by client-side JavaScript.
   - `SameSite = Lax` mitigates Cross-Site Request Forgery (CSRF).
   - Strict server-side verification: `localStorage` is never accepted as authentication proof.
4. **Brute-Force & Lockout Protection**:
   - 5 failed access attempts trigger a mandatory 15-minute account lockout.
   - Password hashing uses ASP.NET Identity's PBKDF2 implementation with unique cryptographic salts.
5. **Input Sanitation & Strict Validation**:
   - FluentValidation enforces strict constraints before reaching controllers.
   - HTML encoding is applied to user-generated inputs (`displayName`, `bio`) to prevent Cross-Site Scripting (XSS).
6. **Zero Information Leakage**:
   - Global exception handling intercepts uncaught exceptions, suppressing internal database logs or stack traces from API callers.
7. **CORS Governance**:
   - Explicit origin whitelisting ensures only authorized clients can initiate cross-origin requests.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute this codebase for educational and portfolio purposes.
