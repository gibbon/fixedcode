# @fixedcode/bundle-kotlin-spring-bff

Generates a Kotlin / Spring Boot 3.3 Backend-For-Frontend service from a YAML spec.

What you get:

- Gradle Kotlin DSL build with Spring Boot 3.3, Kotlin 2.0, JDK 17 or 21
- Spring Web + Actuator + Springdoc OpenAPI / Swagger UI
- Resilience4j circuit breakers, retry, time limiter (configured by `application.yml`)
- One typed `WebClient`-backed client per composed downstream service, wrapped in `@CircuitBreaker`
- Optional Caffeine cache (`features.cache: true`)
- Optional Spring Security baseline — JWT or OAuth2 resource server (`features.auth`)
- Optional JPA + PostgreSQL + Flyway (`features.database: true`)
- Optional Dockerfile (`features.docker: true`, default on)

## Install

```bash
npm install @fixedcode/bundle-kotlin-spring-bff
```

Or wire it locally in `.fixedcode.yaml`:

```yaml
bundles:
  kotlin-spring-bff: './bundles/kotlin-spring-bff'
```

## Spec example

```yaml
apiVersion: "1.0"
kind: kotlin-spring-bff
metadata:
  name: catalog-bff
spec:
  appName: catalog-bff
  groupId: com.example
  port: 8090
  javaVersion: 21
  services:
    - name: catalog
      baseUrl: http://catalog:8080
    - name: pricing
      baseUrl: http://pricing:8080
  features:
    auth: jwt          # jwt | oauth2 | none
    database: false
    cache: true
    docker: true
```

## Generate

```bash
fixedcode generate catalog-bff.yaml -o build
```

## Notes / known TODOs in generated output

- `SecurityConfig.kt` (when `auth: jwt`) is intentionally generic — it permits health, OpenAPI, and Swagger UI; everything else is `authenticated()`. You wire your own `JwtAuthenticationFilter`.
- The generated client (`<Name>Client.kt`) ships with a generic `get(path, type)` helper. Add typed methods for each downstream endpoint you call.
- Database migrations live in `src/main/resources/db/migration/`. The bundle does not generate Flyway scripts — pair this bundle with `spring-domain` (or write them by hand).

## Recipes

A **recipe** is a named feature that the spec opts into. Each recipe expands to a fixed set of additional files inside the generated tree (no engine changes needed — recipes are entirely a bundle concern).

```yaml
spec:
  appName: media-bff
  groupId: com.example
  recipes:
    - image-upload
```

Recipe templates live under `templates/recipes/<recipe-name>/` and are wired into `generateFiles()` behind `ctx.recipe<Name>` flags.

### Available recipes

#### `image-upload`

A complete image upload + serve capability. Defaults to **local filesystem storage** (under `app.images.dir`). The storage layer is a clean extension point — swap to S3 / GCS / Azure Blob / etc. by re-implementing `ImageService` without touching the controller.

Generates:

- `api/ImagesController.kt` — `POST /images` (multipart), `GET /images/{id}` (metadata), `GET /images/{id}/binary` (streams bytes; `?variant=thumbnail` supported), `DELETE /images/{id}`
- `service/ImageService.kt` — storage-agnostic interface
- `service/LocalImageService.kt` — **extension point** (`overwrite: false`) — default impl writing to local disk and producing a 256-px-wide thumbnail via `java.awt`
- `dto/ImageDto.kt`, `exception/ImageNotFoundException.kt`, `exception/ImageProcessingException.kt`
- `src/main/resources/application-image-upload.yml` — `app.images.dir`, `app.images.maxSizeBytes`, `app.images.allowedMimeTypes` (the main `application.yml` includes this profile automatically)

#### `users-management`

A complete users + auth capability — JWT issuance from email + password, BCrypt hashing, sign-in/up/me endpoints, plus admin-only CRUD over the users table. **Requires `features.database: true`** (it persists users via JPA + Flyway). Generation throws a clear error if the database flag is off.

`JwtService` and `PasswordHasher` are extension points (`overwrite: false`) — swap to Clerk / Auth0 / Supabase / Argon2 by re-implementing the two beans without touching the controllers.

When the recipe is enabled the bundle automatically:

- pulls in `spring-boot-starter-security` and `jjwt` regardless of `features.auth`
- emits `SecurityConfig` with the rules: `/api/auth/sign-up` and `/api/auth/sign-in` are public; `/api/auth/me` and `/api/**` require auth; `/api/users/**` requires `ROLE_ADMIN`
- includes the `users-management` Spring profile in `application.yml`

Generates:

- `api/AuthController.kt` — `POST /api/auth/sign-up`, `POST /api/auth/sign-in`, `GET /api/auth/me` (returns `{token, user}` for sign-up/sign-in)
- `api/UsersController.kt` — `GET /api/users` (paged, admin), `GET /api/users/{id}` (admin), `PUT /api/users/{id}/role` (admin), `DELETE /api/users/{id}` (admin)
- `auth/JwtService.kt` — **extension point** (`overwrite: false`) — HS256 issuer + verifier
- `auth/PasswordHasher.kt` — **extension point** (`overwrite: false`) — BCrypt strength 12
- `auth/JwtAuthenticationFilter.kt` — pulls Bearer token, populates SecurityContext
- `domain/User.kt`, `domain/UserRepository.kt` — JPA entity + repo (table: `users`)
- `dto/UserDto.kt`, `dto/SignUpRequest.kt`, `dto/SignInRequest.kt`, `dto/AuthResponse.kt`, `dto/UpdateRoleRequest.kt`
- `src/main/resources/application-users-management.yml` — `app.auth.jwtSecret` (env: `JWT_SECRET`), `app.auth.tokenTtlMinutes`, dev-profile admin seed flag
- `src/main/resources/db/migration/V001__users.sql` — initial users table + email index

Spec config (under `spec.usersManagement`):

| Field               | Default               | Description                                                  |
| ------------------- | --------------------- | ------------------------------------------------------------ |
| `tokenTtlMinutes`   | `1440` (24h)          | Lifetime of issued JWTs in minutes                           |
| `defaultAdminEmail` | `admin@example.com`   | Email seeded as the initial ADMIN (dev profile only)         |

### Adding a new recipe

1. Add the recipe name to `schema.json` under `properties.recipes.items.enum` and `KNOWN_RECIPES` in `src/enrich/spec.ts`.
2. Add a `recipe<Name>: boolean` flag to the enriched context.
3. Drop templates under `templates/recipes/<recipe-name>/` and append them to `generateFiles()` behind the new flag.
4. Add a `test/recipes/<recipe-name>.test.ts` with on/off cases.
