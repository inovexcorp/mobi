package com.mobi.rdf.orm.generate.plugin;

/*-
 * #%L
 * RDF ORM Maven Plugin
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

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.lang.reflect.Field;

@RunWith(BlockJUnit4ClassRunner.class)
public class TestOrmGenerationMojo {

    @Test
    public void simpleTest() throws Exception {
        OrmGenerationMojo mojo = new OrmGenerationMojo();
        set("ontologyFile", "src/test/resources/foaf.rdf", mojo);
        set("ontologyIri", "http://xmlns.com/foaf/0.1/", mojo);
        set("outputLocation", "target/generated-test-sources", mojo);
        mojo.execute();
    }

    private void set(final String field, String value, OrmGenerationMojo mojo)
            throws IllegalArgumentException, IllegalAccessException, NoSuchFieldException, SecurityException {
        Field f = OrmGenerationMojo.class.getDeclaredField(field);
        f.setAccessible(true);
        f.set(mojo, value);
    }

}
