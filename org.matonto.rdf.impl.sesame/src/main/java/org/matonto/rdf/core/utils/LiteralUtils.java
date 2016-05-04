package org.matonto.rdf.core.utils;

import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

public class LiteralUtils {

    public static final DateTimeFormatter LOCAL_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss");

    public static final DateTimeFormatter OFFSET_TIME_FORMATTER;

    public static final DateTimeFormatter READ_TIME_FORMATTER;

    static {
        DateTimeFormatterBuilder readBuilder = new DateTimeFormatterBuilder();
        readBuilder.append(DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss[.SSS]"));
        readBuilder.appendOffset("+HH:MM", "Z");
        READ_TIME_FORMATTER = readBuilder.toFormatter();

        DateTimeFormatterBuilder offsetBuilder = new DateTimeFormatterBuilder();
        offsetBuilder.append(LOCAL_TIME_FORMATTER);
        offsetBuilder.appendOffset("+HH:MM", "Z");
        OFFSET_TIME_FORMATTER = offsetBuilder.toFormatter();
    }
}
