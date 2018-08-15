package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;

public class ResourceUtils {

    /**
     * Encodes the passed string using percent encoding for use in a URL.
     *
     * @param str The string to be encoded.
     * @return The URL encoded version of the passed string.
     */
    public static String encode(String str) {
        String encoded;
        try {
            encoded = URLEncoder.encode(str, "UTF-8").replaceAll("%28", "(")
                    .replaceAll("%29", ")")
                    .replaceAll("\\+", "%20")
                    .replaceAll("%27", "'")
                    .replaceAll("%21", "!")
                    .replaceAll("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            throw new MobiException(e);
        }
        return encoded;
    }

    /**
     * Encodes the passed {@link Resource} using percent encoding for use in a URL.
     *
     * @param resource The {@link Resource} to be encoded.
     * @param vf The {@link ValueFactory} used to create a Resource.
     * @return The URL encoded version of the passed Resource.
     */
    public static Resource encode(Resource resource, ValueFactory vf) {
        String encoded;
        try {
            encoded = URLEncoder.encode(resource.stringValue(), "UTF-8").replaceAll("%28", "(")
                    .replaceAll("%29", ")")
                    .replaceAll("\\+", "%20")
                    .replaceAll("%27", "'")
                    .replaceAll("%21", "!")
                    .replaceAll("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            throw new MobiException(e);
        }
        return vf.createIRI(encoded);
    }

    /**
     * Decodes the passed string that is encoded using percent encoding.
     *
     * @param str The string to be decoded.
     * @return The decoded version of the passed URL encoded string.
     */
    public static String decode(String str) {
        String decoded;
        try {
            decoded = URLDecoder.decode(str, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            throw new MobiException(e);
        }
        return decoded;
    }

    /**
     * Decodes the passed {@link Resource} that is encoded using percent encoding.
     *
     * @param resource The {@link Resource} to be decoded.
     * @param vf The {@link ValueFactory} used to create a Resource.
     * @return The decoded version of the passed URL encoded Resource.
     */
    public static Resource decode(Resource resource, ValueFactory vf) {
        String decoded;
        try {
            decoded = URLDecoder.decode(resource.stringValue(), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            throw new MobiException(e);
        }
        return vf.createIRI(decoded);
    }
}
