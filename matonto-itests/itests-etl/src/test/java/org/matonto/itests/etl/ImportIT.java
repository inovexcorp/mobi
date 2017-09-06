package org.matonto.itests.etl;

/*-
 * #%L
 * itests-etl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.itests.support.KarafTestSupport;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class ImportIT extends KarafTestSupport {
    private static Boolean setupComplete = false;
    private static DatasetRecord record;
    private static DatasetManager manager;

    private static Model data;

    @Inject
    protected static BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String dataFile = "testData.trig";
        Files.copy(getBundleEntry(thisBundleContext, "/" + dataFile), Paths.get(dataFile));

        waitForService("(&(objectClass=org.matonto.etl.api.delimited.RDFImportService))", 10000L);
        waitForService("(&(objectClass=org.matonto.ontology.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=org.matonto.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        data = Values.matontoModel(Rio.parse(new FileInputStream(new File(dataFile)), "", RDFFormat.TRIG));

        manager = getOsgiService(DatasetManager.class);
        DatasetRecordConfig config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", Collections.EMPTY_SET, "system").build();
        record = manager.createDataset(config);

        executeCommand(String.format("mobi:import -d=%s %s", record.getResource().stringValue(), dataFile));

        setupComplete = true;
    }

    @Test
    public void testDataAddedToDataset() throws Exception {
        try (DatasetConnection conn = manager.getConnection(record.getResource())) {
            List<Resource> contexts = new ArrayList<>();
            Resource systemNG = conn.getSystemDefaultNamedGraph();
            data.forEach(statement -> {
                Resource context = statement.getContext().orElse(systemNG);
                contexts.add(context);
                assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
            contexts.forEach(resource -> assertTrue(conn.containsContext(resource)));
        }
    }
}
