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

import org.apache.commons.io.IOUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.Collections;

@RunWith(BlockJUnit4ClassRunner.class)
public class TestOrmGenerationMojo {

    @Test
    public void simpleTest() throws Exception {
        OrmGenerationMojo mojo = new OrmGenerationMojo();
        Ontology ont = new Ontology();
        File loc = new File("src/test/resources/foaf.rdf");
        set("ontologyFile", loc.getAbsolutePath(), ont);
        set("outputPackage", "org.foaf", ont);

        set("outputLocation", "target/generated-test-sources", mojo);
        set("generates", Collections.singletonList(ont), mojo);

        mojo.execute();
    }

    @Test
    public void vfsSpecTest() throws Exception {
        OrmGenerationMojo mojo = new OrmGenerationMojo();
        Ontology ont = new Ontology();
        File loc = new File("src/test/resources/foaf.rdf");

        set("ontologyFile", "file://" + loc.getAbsolutePath(), ont);
        set("outputPackage", "org.foaf", ont);

        set("outputLocation", "target/generated-test-sources", mojo);
        set("generates", Collections.singletonList(ont), mojo);
        mojo.execute();
    }

    @Test
    public void testFetchVfs() throws Exception {
        final String URL = "http://xmlns.com/foaf/spec/index.rdf";
        try {
            URL val = new URL(URL);
            System.out.println(IOUtils.toString(val.openStream()));
            // Process then

            OrmGenerationMojo mojo = new OrmGenerationMojo();
            Ontology ont = new Ontology();

            set("ontologyFile", val.toString(), ont);
            set("outputPackage", "org.foaf", ont);

            set("outputLocation", "target/generated-test-sources", mojo);
            set("generates", Collections.singletonList(ont), mojo);
            mojo.execute();

            mojo.execute();

        } catch (IOException e) {
            System.err.println("Can't seem to find rdf syntax ontology...");
        }
    }

    private void set(final String field, Object value, Object mojo)
            throws IllegalArgumentException, IllegalAccessException, NoSuchFieldException, SecurityException {
        Field f = mojo.getClass().getDeclaredField(field);
        f.setAccessible(true);
        f.set(mojo, value);
    }

}
