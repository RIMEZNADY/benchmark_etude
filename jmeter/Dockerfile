FROM alpine:3.19

ARG JMETER_VERSION=5.6.3
ENV JMETER_HOME=/opt/apache-jmeter-${JMETER_VERSION}
ENV JMETER_BIN=${JMETER_HOME}/bin
ENV PATH="${JMETER_BIN}:${PATH}"

RUN apk add --no-cache openjdk17-jre bash curl unzip && \
    curl -fsSL https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz | tar -xz -C /opt && \
    rm -rf ${JMETER_HOME}/docs ${JMETER_HOME}/printable_docs

# Plugin Manager
RUN curl -fsSL https://repo1.maven.org/maven2/kg/apc/jmeter-plugins-manager/1.9/jmeter-plugins-manager-1.9.jar \
      -o ${JMETER_HOME}/lib/ext/jmeter-plugins-manager.jar && \
    java -cp ${JMETER_HOME}/lib/ext/jmeter-plugins-manager.jar org.jmeterplugins.repository.PluginManagerCMDInstaller

# CMDRunner (requis par PluginsManagerCMD.sh)
RUN curl -fsSL https://repo1.maven.org/maven2/kg/apc/cmdrunner/2.3/cmdrunner-2.3.jar \
      -o ${JMETER_HOME}/lib/cmdrunner-2.3.jar

# Plugins nécessaires (standard + Concurrency/Ultimate thread groups)
RUN ${JMETER_BIN}/PluginsManagerCMD.sh install jpgc-standard jpgc-casutg jpgc-graphs-basic

# Backend Listener InfluxDB v2 (depuis Maven Central)
# Backend Listener InfluxDB v2 (maintained by mderevyankoaqa)
ARG INFLUX_LISTENER_VERSION=2.8
RUN curl -fsSL https://github.com/mderevyankoaqa/jmeter-influxdb2-listener-plugin/releases/download/v${INFLUX_LISTENER_VERSION}/jmeter-plugins-influxdb2-listener-${INFLUX_LISTENER_VERSION}.jar \
      -o ${JMETER_HOME}/lib/ext/jmeter-influxdb2-listener.jar

WORKDIR /test

COPY run.sh /test/run.sh
RUN chmod +x /test/run.sh

ENTRYPOINT ["/test/run.sh"]

