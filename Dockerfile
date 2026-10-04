FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
COPY src ./src
COPY frontend ./frontend

RUN mvn -B package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV STORE_DATA_DIR=/var/lib/finnyboyfab
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080

RUN groupadd --system --gid 10001 finnyboyfab \
    && useradd --system --uid 10001 --gid finnyboyfab --no-create-home finnyboyfab \
    && mkdir -p /var/lib/finnyboyfab \
    && chown -R finnyboyfab:finnyboyfab /var/lib/finnyboyfab /app

COPY --from=build --chown=finnyboyfab:finnyboyfab /workspace/target/finnyboyfab-store-0.0.1-SNAPSHOT.jar app.jar
VOLUME ["/var/lib/finnyboyfab"]
USER 10001:10001
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["bash", "-ec", "exec 3<>/dev/tcp/127.0.0.1/${PORT}; printf 'GET /healthz HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' >&3; read -r status <&3; [[ \"$status\" == *\" 200 \"* ]]"]
ENTRYPOINT ["bash", "-ec", "mkdir -p \"${STORE_DATA_DIR}/tmp\"; exec java -Djava.io.tmpdir=\"${STORE_DATA_DIR}/tmp\" -jar app.jar"]
