package com.mobi.owlapi.utils;

/*-
 * #%L
 * com.mobi.owlapi.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.apache.commons.io.FileUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.Test;
import org.semanticweb.owlapi.model.OWLRuntimeException;

import java.io.File;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;

public class OwlApiUtilsTest {

    @Test
    public void parseFunctionalTest() throws Exception {
        Path turtle = Path.of(ClassLoader.getSystemResource("functional.ttl").toURI());
        Path path = OwlApiUtils.parseFunctional(getInputStream("/functional.ofn"));
        assertEquals(FileUtils.readFileToString(turtle.toFile(), "utf-8"),
                FileUtils.readFileToString(path.toFile(), "utf-8"));
        Files.delete(path);
    }

    @Test(expected = OWLRuntimeException.class)
    public void parseFunctionalInvalidTest() throws Exception {
        OwlApiUtils.parseFunctional(getInputStream("/manchester.omn"));
    }

    @Test
    public void parseManchesterTest() throws Exception {
        Path turtle = Path.of(ClassLoader.getSystemResource("manchester.ttl").toURI());
        Path path = OwlApiUtils.parseManchester(getInputStream("/manchester.omn"));
        assertEquals(FileUtils.readFileToString(turtle.toFile(), "utf-8"),
                FileUtils.readFileToString(path.toFile(), "utf-8"));
        Files.delete(path);
    }

    @Test(expected = OWLRuntimeException.class)
    public void parseManchesterInvalidTest() throws Exception {
        OwlApiUtils.parseManchester(getInputStream("/functional.ofn"));
    }

    @Test
    public void parseOWLXMLTest() throws Exception {
        Path turtle = Path.of(ClassLoader.getSystemResource("owlxml.ttl").toURI());
        Path path = OwlApiUtils.parseOWLXML(getInputStream("/owlxml.owl"));
        assertEquals(FileUtils.readFileToString(turtle.toFile(), "utf-8"),
                FileUtils.readFileToString(path.toFile(), "utf-8"));
        Files.delete(path);
    }

    @Test(expected = OWLRuntimeException.class)
    public void parseOWLXMLInvalidTest() throws Exception {
        OwlApiUtils.parseOWLXML(getInputStream("/manchester.omn"));
    }

    @Test
    public void parseOBOTest() throws Exception {
        Path turtle = Path.of(ClassLoader.getSystemResource("obo.ttl").toURI());
        Path path = OwlApiUtils.parseOBO(getInputStream("/obo.obo"));
        assertEquals(FileUtils.readFileToString(turtle.toFile(), "utf-8"),
                FileUtils.readFileToString(path.toFile(), "utf-8"));
        Files.delete(path);
    }

    @Test(expected = OWLRuntimeException.class)
    public void parseOBOInvalidTest() throws Exception {
        OwlApiUtils.parseOBO(getInputStream("/manchester.omn"));
    }

    private InputStream getInputStream(String filename) {
        return getClass().getResourceAsStream(filename);
    }
}
