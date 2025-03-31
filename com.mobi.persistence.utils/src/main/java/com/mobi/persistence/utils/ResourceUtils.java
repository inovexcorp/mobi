package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class ResourceUtils {

    /**
     * Encodes the passed string using percent encoding for use in a URL.
     *
     * @param str The string to be encoded.
     * @return The URL encoded version of the passed string.
     */
    public static String encode(String str) {
        return URLEncoder.encode(str, StandardCharsets.UTF_8).replaceAll("%28", "(")
                .replaceAll("%29", ")")
                .replaceAll("\\+", "%20")
                .replaceAll("%27", "'")
                .replaceAll("%21", "!")
                .replaceAll("%7E", "~");
    }

    /**
     * Encodes the passed {@link Resource} using percent encoding for use in a URL and returns a string.
     *
     * @param resource The {@link Resource} to be encoded.
     * @return A string of the URL encoded version of the passed Resource.
     */
    public static String encode(Resource resource) {
        return encode(resource.stringValue());
    }

    /**
     * Decodes the passed string that is encoded using percent encoding.
     *
     * @param str The string to be decoded.
     * @return The decoded version of the passed URL encoded string.
     */
    public static String decode(String str) {
        return URLDecoder.decode(str, StandardCharsets.UTF_8);
    }

    /**
     * Decodes the passed string that is encoded using percent encoding and returns a Resource.
     *
     * @param str The string to be decoded.
     * @param vf The {@link ValueFactory} used to create a Resource.
     * @return The a {@link Resource} decoded version of the passed URL encoded string.
     */
    public static Resource decode(String str, ValueFactory vf) {
        String decoded = URLDecoder.decode(str, StandardCharsets.UTF_8);
        return vf.createIRI(decoded);
    }
}
