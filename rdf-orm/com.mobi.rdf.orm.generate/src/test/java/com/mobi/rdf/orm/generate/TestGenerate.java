package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * rdf.orm.generate
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
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.UnsupportedRDFormatException;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;

public class TestGenerate {

    @Test
    public void testSourceGenerate() throws RDFParseException, RDFHandlerException, UnsupportedRDFormatException, OntologyToJavaException, IOException {
        SourceGenerator.toSource(
                GraphReadingUtility.readOntology(new File("src/test/resources/mapping.trig"),
                        "http://mobi.com/ontologies/delimited"),
                "test", "target/generated-sources", new ArrayList<>());
    }

}
