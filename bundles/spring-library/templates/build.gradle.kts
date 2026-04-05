// Dummy build.gradle.kts for Dependabot dependency scanning
// This file will be replaced during code generation with build.gradle.kts.tmpl

plugins {

}

group = "io.pexa.gap"
version = "1.0.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
    withSourcesJar()
    withJavadocJar()
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot BOM
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.5.12"))
    
    // Core Spring dependencies
    api("org.springframework.boot:spring-boot-starter-data-jdbc")
    api("org.springframework.data:spring-data-commons")
    api("com.fasterxml.jackson.module:jackson-module-kotlin")
    api("com.fasterxml.uuid:java-uuid-generator:5.2.0")
    
    implementation("org.springframework:spring-context")
    implementation("org.springframework:spring-web")
    implementation("org.springframework:spring-webmvc")
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    implementation("org.springframework.boot:spring-boot")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("jakarta.servlet:jakarta.servlet-api")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    // Database
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql:12.1.1")
    implementation("org.postgresql:postgresql:42.7.10")
    
    // Logging
    implementation("net.logstash.logback:logstash-logback-encoder:9.0")
    
    // OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-common:2.8.16")
    
    // GAP shared libraries (example versions)
    implementation("io.pexa.gap:gap-shared-exception:1.0.0")
    
    // Annotation processors
    compileOnly("org.springframework.boot:spring-boot-configuration-processor")
    compileOnly("org.springframework.boot:spring-boot-autoconfigure-processor")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
    annotationProcessor("org.springframework.boot:spring-boot-autoconfigure-processor")
    
    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.14.9")
    testImplementation("io.kotest:kotest-runner-junit5:6.1.9")
    testImplementation("io.kotest.extensions:kotest-extensions-spring:1.3.0")
    testImplementation(libs.testcontainersJunitJupiter)
    testImplementation(libs.testcontainersPostgresql)
}

tasks.withType<Test> {
    useJUnitPlatform()
}
