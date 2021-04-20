package com.mobi.ontology.core.utils;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class MobiStringUtilsTest {

    @Test
    public void getFileExtensionTest() {
        String ext = MobiStringUtils.getFileExtension("testFile.ttl");
        assertEquals("ttl", ext);
    }

    @Test
    public void getFileExtensionGzipTest() {
        String ext = MobiStringUtils.getFileExtension("testFile.ttl.gzip");
        assertEquals("ttl.gzip", ext);
    }

    @Test
    public void getFileExtensionGzTest() {
        String ext = MobiStringUtils.getFileExtension("testFile.ttl.gz");
        assertEquals("ttl.gz", ext);
    }

    @Test
    public void getFileExtensionZipTest() {
        String ext = MobiStringUtils.getFileExtension("testFile.ttl.zip");
        assertEquals("ttl.zip", ext);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionNullTest() {
        MobiStringUtils.getFileExtension(null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionEmptyTest() {
        MobiStringUtils.getFileExtension("");
    }

    @Test(expected = IllegalArgumentException.class)
    public void getFileExtensionTarTest() {
        MobiStringUtils.getFileExtension("filename.tar.gz");
    }
}
