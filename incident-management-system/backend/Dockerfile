# ============================================================
# Etapa 1: build da aplicação Spring Boot
# ============================================================
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw clean package -DskipTests -B

# ============================================================
# Etapa 2: imagem final enxuta
# ============================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S viaappia \
    && adduser -S viaappia -G viaappia

COPY --from=build \
    /app/target/incident-management-api-0.0.1-SNAPSHOT.jar \
    app.jar

RUN chown viaappia:viaappia app.jar

USER viaappia

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]