package com.mobi.itests.etl;

/*-
 * #%L
 * itests-etl
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

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import com.mobi.itests.support.KarafTestSupport;
import org.openrdf.model.Model;
import org.openrdf.model.util.Models;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import javax.inject.Inject;
import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.junit.Assert.assertTrue;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class EtlIT extends KarafTestSupport {

    private static Boolean setupComplete = false;
    private static File outputFile;

    @Inject
    protected static BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String delimitedFile = "testFile.xlsx";
        Files.copy(getBundleEntry(thisBundleContext, "/" + delimitedFile), Paths.get(delimitedFile));

        String mappingFile = "newestMapping.ttl";
        Files.copy(getBundleEntry(thisBundleContext, "/" + mappingFile), Paths.get(mappingFile));

        waitForService("(&(objectClass=com.mobi.etl.api.delimited.DelimitedConverter))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        String outputFilename = "test.ttl";
        executeCommand(String.format("mobi:transform -h=true -o=%s %s %s", outputFilename, delimitedFile, mappingFile));

        outputFile = new File(outputFilename);

        setupComplete = true;
    }

    @Test
    public void outputFileExists() throws Exception {
        assertTrue("Output file does not exist.", outputFile.exists());
    }

    @Test
    public void outputContentIsCorrect() throws Exception {
        Model expected = Rio.parse(getBundleEntry(thisBundleContext, "/testOutput.ttl"), "", RDFFormat.TURTLE);
        Model actual = Rio.parse(new FileInputStream(outputFile), "", RDFFormat.TURTLE);

        // TODO: I get around the UUID issue by setting the localname to values in the cells. We need to support IRI
        // isomorphism the same way bnode isomorphism is handled.
        assertTrue(Models.isomorphic(expected, actual));
    }
}
