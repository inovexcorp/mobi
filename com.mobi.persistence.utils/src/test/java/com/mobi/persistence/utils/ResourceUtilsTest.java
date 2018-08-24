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

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ResourceUtilsTest {

    @Test
    public void encodeTest() throws Exception {
        String test = ":/#?=& +;\"{[}]@$%^\t";
        assertEquals("%3A%2F%23%3F%3D%26%20%2B%3B%22%7B%5B%7D%5D%40%24%25%5E%09", ResourceUtils.encode(test));
    }

    @Test
    public void decodeTest() throws Exception {
        String test = "%3A%2F%23%3F%3D%26%20%2B%3B%22%7B%5B%7D%5D%40%24%25%5E%09";
        assertEquals(":/#?=& +;\"{[}]@$%^\t", ResourceUtils.decode(test));
    }
}
