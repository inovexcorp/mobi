package com.mobi.itests.etl;

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

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
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
    private static UserFactory userFactory;
    private static ValueFactory vf;

    private static Model data;

    @Inject
    protected static BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String dataFile = "testData.trig";
        Files.copy(getBundleEntry(thisBundleContext, "/" + dataFile), Paths.get(dataFile));

        waitForService("(&(objectClass=com.mobi.etl.api.delimited.RDFImportService))", 10000L);
        waitForService("(&(objectClass=com.mobi.ontology.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        data = Values.mobiModel(Rio.parse(new FileInputStream(new File(dataFile)), "", RDFFormat.TRIG));

        manager = getOsgiService(DatasetManager.class);
        userFactory = getOsgiService(UserFactory.class);
        vf = getOsgiService(ValueFactory.class);
        DatasetRecordConfig config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset",
                Collections.singleton(userFactory.createNew(vf.createIRI("http://mobi.com/users/admin"))), "system").build();
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
