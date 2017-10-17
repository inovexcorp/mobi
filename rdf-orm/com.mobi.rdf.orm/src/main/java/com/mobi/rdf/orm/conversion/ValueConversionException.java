package com.mobi.rdf.orm.conversion;

/*-
 * #%L
 * RDF ORM
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

import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.OrmException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * This exception indicates there was an issue performing the conversion from a
 * {@link Value} into a specific type using the {@link ValueConverter}
 * infrastructure.
 *
 * @author bdgould
 */
public class ValueConversionException extends OrmException {

    /**
     * Serial version UID.
     */
    private static final long serialVersionUID = 1853010493451281919L;

    /**
     * Construct a new {@link ValueConversionException}.
     *
     * @param msg The message to associate with this
     *            {@link ValueConversionException}
     */
    public ValueConversionException(final String msg) {
        super(msg);
    }

    /**
     * Construct a new {@link ValueConversionException} with the given message
     * and cause.
     *
     * @param msg   The message to associate with this
     *              {@link ValueConversionException}
     * @param cause The underlying cause of this {@link ValueConversionException}
     */
    public ValueConversionException(final String msg, final Throwable cause) {
        super(msg, cause);
    }

    /**
     * Construct a new {@link ValueConversionException}.
     *
     * @param msg    The message to associate with this
     *               {@link ValueConversionException}
     * @param causes A {@link List} of {@link Throwable} causes
     */
    public ValueConversionException(final String msg, final List<Exception> causes) {
        super(msg + "\n\t" + join(causes.stream().map(e -> {
            return e.getMessage();
        }).collect(Collectors.toList()), "\n\t"));
    }

    /**
     * Join a {@link Iterable} list of messages into a new {@link String}.
     *
     * @param target    The target {@link Iterable} of {@link String}s
     * @param separator A separator for each item in the {@link Iterable}
     * @return The new message {@link String}
     */
    public static String join(final Iterable<String> target, final String separator) {
        final StringBuilder sb = new StringBuilder();
        target.forEach(val -> {
            if (sb.length() > 0) {
                sb.append(separator);
            }
            sb.append(val);
        });
        return sb.toString();
    }

}
