ARG JMX_EXPORTER_VERSION=0.20.0

FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -q -DskipTests clean package

FROM eclipse-temurin:17-jre

ARG JMX_EXPORTER_VERSION

WORKDIR /app

ENV JAVA_OPTS=""
ENV JMX_EXPORTER_JAR=/opt/jmx/jmx_prometheus_javaagent.jar
ENV JMX_EXPORTER_CONFIG=/opt/jmx/config.yaml

RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/jmx \
    && curl -sSL -o ${JMX_EXPORTER_JAR} https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/${JMX_EXPORTER_VERSION}/jmx_prometheus_javaagent-${JMX_EXPORTER_VERSION}.jar

COPY jmx-exporter-config.yaml ${JMX_EXPORTER_CONFIG}

COPY --from=build /app/target/rest-benchmark-restcontroller-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081 9404

ENTRYPOINT ["sh", "-c", "java -javaagent:${JMX_EXPORTER_JAR}=9404:${JMX_EXPORTER_CONFIG} $JAVA_OPTS -jar app.jar"]

