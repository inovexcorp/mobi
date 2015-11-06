package org.matonto.rdf.core.utils;

import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

public class LiteralUtils {

    public static final DateTimeFormatter LOCAL_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss");
    public static final DateTimeFormatter OFFSET_TIME_FORMATTER;

    static {
        DateTimeFormatterBuilder builder = new DateTimeFormatterBuilder();
        builder.append(LOCAL_TIME_FORMATTER);
        builder.appendOffset("+HH:MM", "Z");
        OFFSET_TIME_FORMATTER = builder.toFormatter();
    }
}
