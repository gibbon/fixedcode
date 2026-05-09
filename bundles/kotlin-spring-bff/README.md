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
