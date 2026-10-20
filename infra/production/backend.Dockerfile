# ==============================================================================
# Spring Boot 4.1.1 / Java 25 LTS Backend Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Executable JAR
# ------------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk AS builder
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
FROM eclipse-temurin:25-jre AS runner
WORKDIR /app

# Install curl for container healthcheck and diagnostic telemetry
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root system user for security (supports Debian/Ubuntu or Alpine base)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser || (addgroup -S appgroup && adduser -S appuser -G appgroup)

# Copy executable JAR from builder stage
COPY --from=builder /app/target/rednecksgaming-backend-*.jar app.jar

# Set container permissions
RUN chown -R appuser:appgroup /app
USER appuser:appgroup

# Environment Defaults with Compact Object Headers enabled
ENV SERVER_PORT=8080 \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UnlockExperimentalVMOptions -XX:+UseCompactObjectHeaders"

EXPOSE 8080

# Health check endpoint: verifies Tomcat is accepting HTTP connections
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/auth/logout | grep -qE "^[2-4][0-9]{2}$" || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
