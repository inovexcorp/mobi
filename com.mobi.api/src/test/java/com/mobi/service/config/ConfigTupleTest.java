package com.mobi.service.config;

/*-
 * #%L
 * com.mobi.api
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public class ConfigTupleTest {

    @Test
    public void testConfigTupleCreation() {
        // Given
        Class<?> expectedClass = String.class;
        String expectedPath = "/some/path";

        // When
        ConfigTuple configTuple = new ConfigTuple(expectedClass, expectedPath);

        // Then
        assertNotNull("ConfigTuple should not be null", configTuple);
        assertEquals("ConfigClass should match", expectedClass, configTuple.configClass());
        assertEquals("ConfigPath should match", expectedPath, configTuple.configPath());
    }

}
