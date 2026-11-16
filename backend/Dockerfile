# ==== Etapa 1: compilar con Maven + Java 21 ====
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Limita la memoria del build para que quepa en instancias pequenas
ENV MAVEN_OPTS="-Xmx384m"

COPY pom.xml ./
COPY src ./src
RUN mvn -B -q -DskipTests package

# ==== Etapa 2: solo el JRE para ejecutar ====
FROM eclipse-temurin:21-jre

# Fuentes necesarias para que JasperReports genere los PDF (SansSerif)
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /build/target/secct-0.0.1-SNAPSHOT.jar app.jar

# Usa como maximo el 70% de la RAM del contenedor
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
