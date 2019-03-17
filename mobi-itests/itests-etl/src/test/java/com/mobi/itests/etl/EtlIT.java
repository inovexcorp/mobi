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

import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class EtlIT extends KarafTestSupport {

    private static Boolean setupComplete = false;
    private static File outputFile;
    private static SesameTransformer transformer;
    private static CatalogManager catalogManager;
    private static EngineManager engineManager;
    private static Engine rdfEngine;

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

        transformer = getOsgiService(SesameTransformer.class);
        catalogManager = getOsgiService(CatalogManager.class);
        engineManager = getOsgiService(EngineManager.class);
        rdfEngine = getOsgiService(Engine.class, "(engineName=RdfEngine)", 10000L);

        User user = engineManager.retrieveUser(rdfEngine.getEngineName(), "admin")
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Set<User> users = new HashSet<>();
        users.add(user);

        Model mappingModel = transformer.mobiModel(Rio.parse(new FileInputStream(mappingFile), "", RDFFormat.TURTLE));

        RecordOperationConfig config = new OperationConfig()
                .set(RecordCreateSettings.CATALOG_ID, catalogManager.getLocalCatalog().getResource().stringValue())
                .set(RecordCreateSettings.RECORD_TITLE, "Test Mapping")
                .set(RecordCreateSettings.RECORD_PUBLISHERS, users)
                .set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, mappingModel);

        MappingRecord record = catalogManager.createRecord(user, config, MappingRecord.class);

        String outputFilename = "test.ttl";
        executeCommand(String.format("mobi:transform -h -o=%s %s %s", outputFilename, record.getResource().stringValue(), delimitedFile));

        outputFile = new File(outputFilename);

        setupComplete = true;
    }

    @Test
    public void outputFileExists() throws Exception {
        assertTrue("Output file does not exist.", outputFile.exists());
    }

    @Test
    public void outputContentIsCorrect() throws Exception {
        org.eclipse.rdf4j.model.Model expected = Rio.parse(getBundleEntry(thisBundleContext, "/testOutput.ttl"), "", RDFFormat.TURTLE);
        org.eclipse.rdf4j.model.Model actual = Rio.parse(new FileInputStream(outputFile), "", RDFFormat.TURTLE);

        // TODO: I get around the UUID issue by setting the localname to values in the cells. We need to support IRI
        // isomorphism the same way bnode isomorphism is handled.
        assertTrue(Models.isomorphic(expected, actual));
    }
}
