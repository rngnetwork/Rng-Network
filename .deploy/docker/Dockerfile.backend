# ==============================================================================
# Spring Boot 3.2.4 Backend Production Dockerfile (Java 21)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Executable JAR
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper & configuration for layer caching
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Grant execution permissions to Maven wrapper
RUN chmod +x ./mvnw

# Copy source code and resources
COPY src ./src

# Build production executable JAR (skipping unit tests as done in CI)
RUN ./mvnw clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production JRE Runtime Image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy executable JAR from builder stage
COPY --from=builder /app/target/rng-backend-0.0.1-SNAPSHOT.jar app.jar

# Set container permissions
RUN chown -R appuser:appgroup /app
USER appuser:appgroup

# Environment Defaults
ENV SERVER_PORT=8080 \
    JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/error || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
