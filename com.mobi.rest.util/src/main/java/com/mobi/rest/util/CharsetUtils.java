package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

public class CharsetUtils {
    private static final int DEFAULT_SAMPLE_SIZE = 4096;
    private static Charset[] supportedCharsets = new Charset[] {StandardCharsets.UTF_8, StandardCharsets.ISO_8859_1};
    private static final Logger logger = LoggerFactory.getLogger(CharsetUtils.class);

    /**
     * Determines which of the supported charsets the byte array is encoded with.
     *
     * @param bytes the bytes to determine the encoding of
     * @return the supported charset the bytes are encoded with if there is one
     */
    public static Optional<Charset> getEncoding(byte[] bytes) {
        for (Charset charset : supportedCharsets) {
            CharsetDecoder decoder = charset.newDecoder();
            ByteBuffer byteBuffer = ByteBuffer.wrap(bytes);
            try {
                CharBuffer decoded = decoder.decode(byteBuffer);
                return Optional.of(charset);
            } catch (CharacterCodingException e) {
                logger.info("Issue using " + charset.displayName());
            }
        }
        return Optional.empty();
    }

    /**
     * Determines the encoding for the supplied InputStream from the supported charsets.
     * Samples the first 4096 bytes of the InputStream for analysis.
     *
     * @param inputStream The InputStream to determine the encoding of
     * @return the supported charset the bytes are encoded with if there is one. Optional.empty() otherwise.
     * @throws IOException if there is a problem reading the InputStream
     */
    public static Optional<Charset> getEncoding(InputStream inputStream) throws IOException {
        byte[] buffer = new byte[DEFAULT_SAMPLE_SIZE];
        inputStream.read(buffer);
        return getEncoding(buffer);
    }
}
