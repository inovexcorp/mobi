package org.matonto.rest.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

public class CharsetUtils {
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
}
