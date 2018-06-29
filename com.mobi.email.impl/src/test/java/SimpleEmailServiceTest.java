package com.mobi.email.impl;

import junit.framework.TestCase;
import org.junit.BeforeClass;
import org.junit.Test;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/*-
 * #%L
 * com.mobi.email.impl
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
public class SimpleEmailServiceTest {

    private static SimpleEmailService es;

    @BeforeClass
    public void setUp() throws Exception {
        Map<String, Object> config = new HashMap<>();
        config.put("maxNumberOfTempFiles", 10000);
        config.put("secondsBetweenTempCleanup", 60000);

        Method m = es.getClass().getDeclaredMethod("activate", Map.class);
        m.setAccessible(true);
        m.invoke(es, config);
//        assertNotNull(es);

    }
    @Test
    public void sendSimpleEmailTest() {
        SimpleEmailService es = new SimpleEmailService();

        es.sendSimpleEmail("Subject", "Hello")
    }


}
