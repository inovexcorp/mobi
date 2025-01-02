package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import com.mobi.rest.test.util.MobiRestTestCXF;
import org.junit.BeforeClass;

public class ImportedOntologyRestImplTest extends MobiRestTestCXF {
    private static ImportedOntologyRest rest;

    @BeforeClass
    public static void startServer() {
        rest = new ImportedOntologyRest();
        configureServer(rest);
    }

//    @Test
//    public void testVerifyUrl() throws Exception {
//        Response response = target().path("imported-ontologies/" + encode("https://www.w3.org/TR/owl2-syntax/")).request().head();
//        assertEquals(response.getStatus(), 200);
//    }

//    @Test
//    public void testVerifyUrlWhenNotOK() throws Exception {
//        Response response = target().path("imported-ontologies/" + encode("http://www.stefan-birkner.de/system-rules/")).request().head();
//        assertEquals(response.getStatus(), 400);
//    }

//    @Test
//    public void testVerifyUrlWhenIOException() throws Exception {
//        Response response = target().path("imported-ontologies/" + encode("https://not-there.com")).request().head();
//        assertEquals(response.getStatus(), 500);
//    }

//    @Test
//    public void testVerifyUrlWhenMalformedURLException() throws Exception {
//        Response response = target().path("imported-ontologies/" + encode("malformed")).request().head();
//        assertEquals(response.getStatus(), 500);
//    }
}
