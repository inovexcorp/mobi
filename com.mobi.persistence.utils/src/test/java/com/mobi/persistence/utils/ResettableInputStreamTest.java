package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import org.apache.commons.io.IOUtils;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Random;

import static org.junit.Assert.*;

public class ResettableInputStreamTest {

    @Test
    public void testInMemory() throws IOException {
        byte[] data = "Small amount of data".getBytes();
        try (ResettableInputStream ris = new ResettableInputStream(new ByteArrayInputStream(data))) {
            byte[] readData = IOUtils.toByteArray(ris);
            assertArrayEquals(data, readData);

            ris.reset();
            readData = IOUtils.toByteArray(ris);
            assertArrayEquals(data, readData);
        }
    }

    @Test
    public void testSpillToDisk() throws IOException {
        // Threshold is 10MB, so 11MB should spill
        int size = 11 * 1024 * 1024;
        byte[] data = new byte[size];
        new Random().nextBytes(data);

        try (ResettableInputStream ris = new ResettableInputStream(new ByteArrayInputStream(data))) {
            byte[] readData = IOUtils.toByteArray(ris);
            assertArrayEquals(data, readData);

            ris.reset();
            readData = IOUtils.toByteArray(ris);
            assertArrayEquals(data, readData);
            
            ris.reset();
            // Read in chunks
            byte[] buffer = new byte[8192];
            int totalRead = 0;
            int read;
            while ((read = ris.read(buffer)) != -1) {
                for (int i = 0; i < read; i++) {
                    assertEquals(data[totalRead + i], buffer[i]);
                }
                totalRead += read;
            }
            assertEquals(size, totalRead);
        }
    }

    @Test
    public void testMarkSupport() throws IOException {
        byte[] data = "Some test data".getBytes();
        try (ResettableInputStream ris = new ResettableInputStream(new ByteArrayInputStream(data))) {
            assertTrue(ris.markSupported());
        }
    }
}
