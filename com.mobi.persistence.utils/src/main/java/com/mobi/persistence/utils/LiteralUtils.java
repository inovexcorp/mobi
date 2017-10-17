package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

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
