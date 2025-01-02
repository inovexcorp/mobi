package com.mobi.itests.etl;

/*-
 * #%L
 * itests-etl
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

import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.config.DatasetRecordCreateSettings;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import org.apache.karaf.itests.KarafTestSupport;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.Configuration;
import org.ops4j.pax.exam.CoreOptions;
import org.ops4j.pax.exam.Option;
import org.ops4j.pax.exam.OptionUtils;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.karaf.options.KarafDistributionOption;
import org.ops4j.pax.exam.options.MavenArtifactUrlReference;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class ImportIT extends KarafTestSupport {
    private static Boolean setupComplete = false;
    private static DatasetRecord record;
    private static DatasetManager datasetManager;

    private static Model data;

    @Inject
    protected static BundleContext thisBundleContext;

    @Override
    public MavenArtifactUrlReference getKarafDistribution() {
        return CoreOptions.maven().groupId("com.mobi").artifactId("mobi-distribution").versionAsInProject().type("tar.gz");
    }

    @Configuration
    @Override
    public Option[] config() {
        try {
            List<Option> options = new ArrayList<>(Arrays.asList(
                    KarafDistributionOption.replaceConfigurationFile("etc/org.ops4j.pax.logging.cfg",
                            Paths.get(Objects.requireNonNull(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg")).toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false")
            ));
            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String dataFile = "testData.trig";
        Files.copy(thisBundleContext.getBundle().getEntry("/" + dataFile).openStream(), Paths.get(dataFile), StandardCopyOption.REPLACE_EXISTING);

        waitForService("(&(objectClass=com.mobi.etl.api.delimited.RDFImportService))", 10000L);
        waitForService("(&(objectClass=com.mobi.ontology.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        data = Rio.parse(new FileInputStream(dataFile), "", RDFFormat.TRIG);

        datasetManager = getOsgiService(DatasetManager.class);
        RecordManager manager = getOsgiService(RecordManager.class);
        CatalogConfigProvider configProvider = getOsgiService(CatalogConfigProvider.class);
        UserFactory userFactory = getOsgiService(UserFactory.class);
        ValueFactory vf = new ValidatingValueFactory();
        User adminUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/admin"));
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordCreateSettings.CATALOG_ID, configProvider.getLocalCatalogIRI().stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "Test Dataset");
        config.set(DatasetRecordCreateSettings.DATASET, "http://test.com/test-dataset");
        config.set(DatasetRecordCreateSettings.REPOSITORY_ID, "system");
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Collections.singleton(adminUser));

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            record = manager.createRecord(adminUser, config, DatasetRecord.class, conn);

            executeCommand(String.format("mobi:import -d=%s %s", record.getResource().stringValue(), dataFile));

            setupComplete = true;
        }
    }

    @Test
    public void testDataAddedToDataset() throws Exception {
        try (DatasetConnection conn = datasetManager.getConnection(record.getResource())) {
            List<Resource> contexts = new ArrayList<>();
            Resource systemNG = conn.getSystemDefaultNamedGraph();
            data.forEach(statement -> {
                Resource context = statement.getContext() == null ? systemNG : statement.getContext();
                contexts.add(context);
                assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
            contexts.forEach(resource -> assertTrue(conn.containsContext(resource)));
        }
    }
}
