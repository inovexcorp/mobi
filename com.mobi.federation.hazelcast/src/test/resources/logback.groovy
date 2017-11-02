// always a good idea to add an on console status listener
statusListener(OnConsoleStatusListener)

appender("STDOUT", ConsoleAppender) {
    encoder(PatternLayoutEncoder) {
        pattern = "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    }
}

logger("com.mobi.federation.hazelcast", DEBUG)
logger("com.hazelcast.core", INFO)
logger("com.hazelcast.internal.cluster", INFO)

root(WARN, ["STDOUT"])