package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCatalogUtilsServiceTest extends OrmEnabledTestCase {
    private SimpleCatalogUtilsService service;
    private Repository repo;
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Version> versionFactory = getRequiredOrmFactory(Version.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);

    private final IRI typeIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI labelIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.label_IRI);
    private final IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
    private final IRI descriptionIRI = VALUE_FACTORY.createIRI(_Thing.description_IRI);
    private final IRI MISSING_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#missing");
    private final IRI EMPTY_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#empty");
    private final IRI RANDOM_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#random");
    private final IRI DIFFERENT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#different");
    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#taken");
    private final IRI CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-distributed");
    private final IRI RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record");
    private final IRI RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record-no-catalog");
    private final IRI UNVERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record");
    private final IRI UNVERSIONED_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record-no-catalog");
    private final IRI UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record-missing-distribution");
    private final IRI VERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record");
    private final IRI VERSIONED_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record-no-catalog");
    private final IRI VERSIONED_RECORD_MISSING_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record-missing-version");
    private final IRI VERSIONED_RDF_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record");
    private final IRI VERSIONED_RDF_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-no-catalog");
    private final IRI VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-missing-branch");
    private final IRI DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI LONE_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#lone-distribution");
    private final IRI VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#version");
    private final IRI LONE_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#lone-version");
    private final IRI VERSION_MISSING_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#version-missing-distribution");
    private final IRI BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI LONE_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#lone-branch");
    private final IRI COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI COMMIT_NO_ADDITIONS_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit-no-additions");
    private final IRI COMMIT_NO_DELETIONS_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit-no-deletions");
    private final IRI IN_PROGRESS_COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit");
    private final IRI IN_PROGRESS_COMMIT_NO_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit-no-record");
    private final IRI OWL_THING = VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Thing");
    private final String COMMITS = "http://mobi.com/test/commits#";
    private final String GRAPHS = "http://mobi.com/test/graphs#";
    private final String ADDITIONS = "https://mobi.com/additions#";
    private final String DELETIONS = "https://mobi.com/deletions#";

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        service = new SimpleCatalogUtilsService();
        injectOrmFactoryReferencesIntoService(service);
        service.setMf(MODEL_FACTORY);
        service.setVf(VALUE_FACTORY);
    }

    /* validateResource */

    @Test
    public void testObjectIdOfMissing() {
        testBadRecordId(MISSING_IRI);
    }

    @Test
    public void testObjectIdOfEmpty() {
        testBadRecordId(EMPTY_IRI);
    }

    @Test
    public void testObjectIdOfRandom() {
        testBadRecordId(RANDOM_IRI);
    }

    @Test
    public void testObjectIdOfDifferent() {
        testBadRecordId(DIFFERENT_IRI);
    }

    /* addObject */

    @Test
    public void addObjectTest() throws Exception {
        // Setup
        Record record = recordFactory.createNew(EMPTY_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, EMPTY_IRI).hasNext());

            service.addObject(record, conn);
            assertEquals(record.getModel().size(), RepositoryResults.asModel(conn.getStatements(null, null, null, EMPTY_IRI), MODEL_FACTORY).size());
        }
    }

    /* updateObject */

    @Test
    public void updateObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            Record newRecord = recordFactory.createNew(RECORD_IRI);

            service.updateObject(newRecord, conn);
            RepositoryResults.asModel(conn.getStatements(null, null, null, RECORD_IRI), MODEL_FACTORY).forEach(statement ->
                    assertTrue(newRecord.getModel().contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    /* optObject */

    @Test
    public void optObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.optObject(MISSING_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(EMPTY_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(RANDOM_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(DIFFERENT_IRI, recordFactory, conn).isPresent());
            assertTrue(service.optObject(RECORD_IRI, recordFactory, conn).isPresent());
        }
    }

    /* getObject */

    @Test
    public void getObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getExpectedObject(RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getMissingExpectedObjectTest() {
        getBadExpectedRecord(MISSING_IRI);
    }

    @Test
    public void getEmptyExpectedObjectTest() {
        getBadExpectedRecord(EMPTY_IRI);
    }

    @Test
    public void getRandomExpectedObjectTest() {
        getBadExpectedRecord(RANDOM_IRI);
    }

    @Test
    public void getDifferentExpectedObjectTest() {
        getBadExpectedRecord(DIFFERENT_IRI);
    }

    /* getExpectedObject */

    @Test
    public void getExpectedObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getObject(RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getMissingObjectTest() {
        getBadRecord(MISSING_IRI);
    }

    @Test
    public void getEmptyObjectTest() {
        getBadRecord(EMPTY_IRI);
    }

    @Test
    public void getRandomObjectTest() {
        getBadRecord(RANDOM_IRI);
    }

    @Test
    public void getDifferentObjectTest() {
        getBadRecord(DIFFERENT_IRI);
    }

    /* remove */

    @Test
    public void removeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            service.remove(RECORD_IRI, conn);
            assertFalse(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
        }
    }

    /* removeObject */

    @Test
    public void removeObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
            service.removeObject(recordFactory.createNew(RECORD_IRI), conn);
            assertFalse(conn.getStatements(null, null, null, RECORD_IRI).hasNext());
        }
    }

    /* validateRecord */

    @Test
    public void testRecordPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateRecord(MISSING_IRI, RECORD_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateRecord(CATALOG_IRI, MISSING_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateRecord(CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    /* getRecord */

    @Test
    public void getRecordTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getRecord(CATALOG_IRI, RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getRecordWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(MISSING_IRI, RECORD_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(CATALOG_IRI, MISSING_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory, conn);
        }
    }

    /* validateUnversionedDistribution */

    @Test
    public void testUnversionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateUnversionedDistribution(MISSING_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateUnversionedDistribution(CATALOG_IRI, MISSING_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to UnversionedRecord %s", LONE_DISTRIBUTION_IRI, UNVERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    /* getUnversionedDistribution */

    @Test
    public void getUnversionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(MISSING_IRI, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, MISSING_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to UnversionedRecord %s", LONE_DISTRIBUTION_IRI, UNVERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingUnversionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getUnversionedDistribution(CATALOG_IRI, UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI, RANDOM_IRI, conn);
        }
    }

    /* validateVersion */

    @Test
    public void testVersionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersion(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersion(CATALOG_IRI, MISSING_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersion(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersion(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, conn);
        }
    }

    /* getVersion */

    @Test
    public void getVersionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Version version = service.getVersion(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, versionFactory, conn);
            assertFalse(version.getModel().isEmpty());
            assertEquals(VERSION_IRI, version.getResource());
        }
    }

    @Test
    public void getVersionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, MISSING_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getMissingVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersion(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, versionFactory, conn);
        }
    }

    /* validateVersionedDistribution */

    @Test
    public void testVersionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(CATALOG_IRI, MISSING_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    /* getVersionedDistribution */

    @Test
    public void getVersionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getVersionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(MISSING_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, MISSING_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_NO_CATALOG_IRI, VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", LONE_VERSION_IRI, VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, LONE_VERSION_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, RANDOM_IRI, DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_IRI, VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingVersionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getVersionedDistribution(CATALOG_IRI, VERSIONED_RECORD_MISSING_VERSION_IRI, VERSION_MISSING_DISTRIBUTION_IRI, RANDOM_IRI, conn);
        }
    }

    /* validateBranch */

    @Test
    public void testBranchPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateBranch(MISSING_IRI, RECORD_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateBranch(CATALOG_IRI, MISSING_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, LONE_BRANCH_IRI, conn);
        }
    }

    /* getBranch(Resource, Resource, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Branch branch = service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(MISSING_IRI, RECORD_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, MISSING_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, RANDOM_IRI, branchFactory, conn);
        }
    }

    /* getBranch(VersionedRDFRecord, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchWithRecordTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(BRANCH_IRI)));
            Branch branch = service.getBranch(record, BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithRecordAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", LONE_BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            service.getBranch(record, LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchWithRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(RANDOM_IRI)));
            service.getBranch(record, RANDOM_IRI, branchFactory, conn);
        }
    }

    /* getHeadCommitIRI */

    @Test
    public void getHeadCommitIRITest() {
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        branch.setHead(commitFactory.createNew(COMMIT_IRI));
        Resource iri = service.getHeadCommitIRI(branch);
        assertEquals(COMMIT_IRI, iri);
    }

    @Test
    public void getHeadCommitIRINotSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Branch " + LONE_BRANCH_IRI + " does not have a head Commit set");
        Branch branch = branchFactory.createNew(LONE_BRANCH_IRI);

        service.getHeadCommitIRI(branch);
    }

    /* validateInProgressCommit */

    @Test
    public void testInProgressCommitPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(MISSING_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(CATALOG_IRI, MISSING_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testMissingInProgressCommitPath() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, MISSING_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithoutRecordSet() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("InProgressCommit %s does not belong to VersionedRDFRecord %s", IN_PROGRESS_COMMIT_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithUserTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(VERSIONED_RDF_RECORD_IRI, USER_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getMissingInProgressCommitTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit not found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(VERSIONED_RECORD_MISSING_VERSION_IRI, USER_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithPathTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(MISSING_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, MISSING_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", VERSIONED_RDF_RECORD_NO_CATALOG_IRI, CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_NO_CATALOG_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getMissingInProgressCommitWithPathTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, MISSING_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathWithoutRecordSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + IN_PROGRESS_COMMIT_IRI + " does not belong to VersionedRDFRecord " + VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getInProgressCommit(CATALOG_IRI, VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommitIRI */

    @Test
    public void getInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = service.getInProgressCommitIRI(VERSIONED_RDF_RECORD_IRI, USER_IRI, conn);
            assertTrue(iri.isPresent());
            assertEquals(IN_PROGRESS_COMMIT_IRI, iri.get());
        }
    }

    @Test
    public void getMissingInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = service.getInProgressCommitIRI(VERSIONED_RECORD_MISSING_VERSION_IRI, USER_IRI, conn);
            assertFalse(iri.isPresent());
        }
    }

    /* removeInProgressCommit */

    @Test
    public void removeInProgressCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = getThing(IN_PROGRESS_COMMIT_IRI, inProgressCommitFactory, conn);
            Resource additionsResource = getAdditionsResource(IN_PROGRESS_COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(IN_PROGRESS_COMMIT_IRI);
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            service.removeInProgressCommit(commit, conn);
            assertFalse(conn.getStatements(null, null, null, IN_PROGRESS_COMMIT_IRI).hasNext());
            assertTrue(conn.size(additionsResource) == 0);
            assertTrue(conn.size(deletionsResource) == 0);
        }
    }

    @Test
    public void removeInProgressCommitWithQuadsTest() throws Exception {
        IRI quadInProgressCommit = VALUE_FACTORY.createIRI(COMMITS + "quad-in-progress-commit");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = getThing(quadInProgressCommit, inProgressCommitFactory, conn);

            Resource additionsResource = getAdditionsResource(quadInProgressCommit);
            Resource deletionsResource = getDeletionsResource(quadInProgressCommit);
            assertTrue(conn.containsContext(additionsResource));
            assertTrue(conn.containsContext(deletionsResource));

            IRI graph1AdditionsResource = getQuadAdditionsResource(quadInProgressCommit, GRAPHS + "quad-graph1");
            IRI graph1DeletionsResource = getQuadDeletionsResource(quadInProgressCommit, GRAPHS + "quad-graph1");
            assertTrue(conn.containsContext(graph1AdditionsResource));
            assertTrue(conn.containsContext(graph1DeletionsResource));

            service.removeInProgressCommit(commit, conn);
            assertFalse(conn.containsContext(quadInProgressCommit));
            assertFalse(conn.containsContext(additionsResource));
            assertFalse(conn.containsContext(deletionsResource));
            assertFalse(conn.containsContext(graph1AdditionsResource));
            assertFalse(conn.containsContext(graph1DeletionsResource));
        }
    }

    @Test
    public void removeInProgressCommitWithReferencedChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit-referenced"));
            Resource additionsResource = getAdditionsResource(COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(COMMIT_IRI);
            commit.getModel().add(commit.getResource(), VALUE_FACTORY.createIRI(Revision.additions_IRI), additionsResource, commit.getResource());
            commit.getModel().add(commit.getResource(), VALUE_FACTORY.createIRI(Revision.deletions_IRI), deletionsResource, commit.getResource());
            assertTrue(conn.getStatements(null, null, null, commit.getResource()).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            service.removeInProgressCommit(commit, conn);
            assertFalse(conn.getStatements(null, null, null, commit.getResource()).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);
        }
    }

    /* updateCommit(Commit, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"));
            Statement statement2 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), descriptionIRI, VALUE_FACTORY.createLiteral("Description"));
            Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), labelIRI, VALUE_FACTORY.createLiteral("Label"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
            Model additions = MODEL_FACTORY.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createModel(Stream.of(statement1).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createModel(Stream.of(statement3).collect(Collectors.toSet()));

            service.updateCommit(commit, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitAndDuplicatesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            Statement triple = vf.createStatement(vf.createIRI("https://mobi.com/test"), titleIRI, vf.createLiteral("Title"));
            Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://mobi.com/test/delete"), titleIRI, vf.createLiteral("Delete"));
            Statement existingAddStatement = vf.createStatement(vf.createIRI("http://mobi.com/test/add"), titleIRI, vf.createLiteral("Add"));
            Model additions = mf.createModel(Stream.of(triple).collect(Collectors.toSet()));
            Model deletions = mf.createModel(Stream.of(triple).collect(Collectors.toSet()));
            Model expectedAdditions = mf.createModel(Stream.of(existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = mf.createModel(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

            service.updateCommit(commit, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitNullAdditionsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), labelIRI, VALUE_FACTORY.createLiteral("Label"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
            Model deletions = MODEL_FACTORY.createModel(Stream.of(statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createModel();
            Model expectedDeletions = MODEL_FACTORY.createModel(Stream.of(statement3, existingDelStatement).collect(Collectors.toSet()));

            service.updateCommit(commit, null, deletions, conn);

            List<Statement> actualAdds = RepositoryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = RepositoryResults.asList(conn.getStatements(null, null, null, deletionId));
            assertEquals(expectedDeletions.size(), actualDels.size());
            actualDels.forEach(statement -> assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitNullDeletionsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), labelIRI, VALUE_FACTORY.createLiteral("Label"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
            Model additions = MODEL_FACTORY.createModel(Stream.of(statement1, existingDelStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createModel(Stream.of(statement1, existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createModel();

            service.updateCommit(commit, additions, null, conn);

            List<Statement> actualAdds = RepositoryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = RepositoryResults.asList(conn.getStatements(null, null, null, deletionId));
            assertEquals(expectedDeletions.size(), actualDels.size());
            actualDels.forEach(statement -> assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitWithoutAdditionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_ADDITIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

            service.updateCommit(commit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitWithoutDeletionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_DELETIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

            service.updateCommit(commit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitAndQuadsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(VALUE_FACTORY.createIRI(COMMITS + "quad-test1"), commitFactory, conn);

            Resource graph1 = VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1");
            Resource graphTest = VALUE_FACTORY.createIRI(GRAPHS + "quad-graph-test");

            Statement addQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"), graphTest);
            Statement addAndDeleteQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), descriptionIRI, VALUE_FACTORY.createLiteral("Description"), graph1);
            Statement deleteQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test/object2"), labelIRI, VALUE_FACTORY.createLiteral("Label"), graph1);
            Statement existingAddQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object2"), titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), graph1);
            Model additions = MODEL_FACTORY.createModel(Stream.of(addQuad, addAndDeleteQuad).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel(Stream.of(addAndDeleteQuad, deleteQuad, existingAddQuad).collect(Collectors.toSet()));

            Resource additionsGraph = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1");
            Resource deletionsGraph = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1");
            Statement expAdd1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object1"), titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), additionsGraph);
            Statement expDel1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object1"), titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"), deletionsGraph);

            Resource additionsGraph1 = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");
            Resource deletionsGraph1 = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");
            Statement expAddGraph1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object2"), typeIRI, OWL_THING, additionsGraph1);
            Statement expDelGraph1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test/object2"), labelIRI, VALUE_FACTORY.createLiteral("Label"), deletionsGraph1);

            Resource additionsGraphTest = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph-test");
            Resource deletionsGraphTest = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph-test");
            Statement expAddGraphTest = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"), additionsGraphTest);

            service.updateCommit(commit, additions, deletions, conn);

            List<Statement> adds = RepositoryResults.asList(conn.getStatements(null, null, null, additionsGraph));
            assertEquals(1, adds.size());
            assertTrue(adds.contains(expAdd1));

            List<Statement> dels = RepositoryResults.asList(conn.getStatements(null, null, null, deletionsGraph));
            assertEquals(1, dels.size());
            assertTrue(dels.contains(expDel1));

            List<Statement> addsGraph1 = RepositoryResults.asList(conn.getStatements(null, null, null, additionsGraph1));
            assertEquals(1, addsGraph1.size());
            assertTrue(addsGraph1.contains(expAddGraph1));

            List<Statement> delsGraph1 = RepositoryResults.asList(conn.getStatements(null, null, null, deletionsGraph1));
            assertEquals(1, delsGraph1.size());
            assertTrue(delsGraph1.contains(expDelGraph1));

            List<Statement> addsGraphTest = RepositoryResults.asList(conn.getStatements(null, null, null, additionsGraphTest));
            assertEquals(1, addsGraphTest.size());
            assertTrue(addsGraphTest.contains(expAddGraphTest));

            List<Statement> delsGraphTest = RepositoryResults.asList(conn.getStatements(null, null, null, deletionsGraphTest));
            assertEquals(0, delsGraphTest.size());
        }
    }

    /* updateCommit(Resource, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithResourceTest() {
        // Setup:
        Resource additionId = getAdditionsResource(COMMIT_IRI);
        Resource deletionId = getDeletionsResource(COMMIT_IRI);
        Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"));
        Statement statement2 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), descriptionIRI, VALUE_FACTORY.createLiteral("Description"));
        Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), labelIRI, VALUE_FACTORY.createLiteral("Label"));
        Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
        Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
        Model additions = MODEL_FACTORY.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = MODEL_FACTORY.createModel(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = MODEL_FACTORY.createModel(Stream.of(statement3).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_IRI, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithResourceAndDuplicatesTest() {
        // Setup:
        Resource additionId = getAdditionsResource(COMMIT_IRI);
        Resource deletionId = getDeletionsResource(COMMIT_IRI);
        Statement triple = vf.createStatement(vf.createIRI("https://mobi.com/test"), titleIRI, vf.createLiteral("Title"));
        Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://mobi.com/test/delete"), titleIRI, vf.createLiteral("Delete"));
        Statement existingAddStatement = vf.createStatement(vf.createIRI("http://mobi.com/test/add"), titleIRI, vf.createLiteral("Add"));
        Model additions = mf.createModel(Stream.of(triple).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(triple).collect(Collectors.toSet()));
        Model expectedAdditions = mf.createModel(Stream.of(existingAddStatement).collect(Collectors.toSet()));
        Model expectedDeletions = mf.createModel(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_IRI, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithResourceWithoutAdditionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Additions not set on Commit " + COMMIT_NO_ADDITIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_NO_ADDITIONS_IRI, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);
        }
    }

    @Test
    public void updateCommitWithResourceWithoutDeletionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_NO_DELETIONS_IRI, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);
        }
    }

    /* addCommit */

    @Test
    public void addCommitTest() {
        // Setup:
        IRI newIRI = VALUE_FACTORY.createIRI("http://mobi.com/test#new");
        IRI headCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#conflict2");
        IRI headIRI = VALUE_FACTORY.createIRI(Branch.head_IRI);
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        Commit commit = commitFactory.createNew(newIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, newIRI).hasNext());
            assertTrue(conn.getStatements(BRANCH_IRI, headIRI, headCommitIRI, BRANCH_IRI).hasNext());

            service.addCommit(branch, commit, conn);
            assertTrue(branch.getHead_resource().isPresent());
            assertEquals(newIRI, branch.getHead_resource().get());
            assertTrue(conn.getStatements(null, null, null, newIRI).hasNext());
            assertTrue(conn.getStatements(BRANCH_IRI, headIRI, newIRI, BRANCH_IRI).hasNext());
        }
    }

    @Test
    public void addCommitWithTakenResourceTest() {
        // Setup:
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        Commit commit = commitFactory.createNew(COMMIT_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Commit " + COMMIT_IRI + " already exists");

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, commit, conn);
        }
    }

    /* getRevision() */

    @Test
    public void testGetRevisionWithQuads() throws Exception {
        IRI commitId = VALUE_FACTORY.createIRI(COMMITS + "quad-test1");

        RepositoryConnection conn = repo.getConnection();
        Revision actual = service.getRevision(commitId, conn);
        conn.close();

        assertEquals(VALUE_FACTORY.createIRI(ADDITIONS + "quad-test1"), actual.getAdditions().get());
        assertEquals(VALUE_FACTORY.createIRI(DELETIONS + "quad-test1"), actual.getDeletions().get());
        assertEquals(1, actual.getGraphRevision().size());
        assertEquals(VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getRevisionedGraph().get());
        assertEquals(getQuadAdditionsResource(commitId, GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getAdditions().get());
        assertEquals(getQuadDeletionsResource(commitId, GRAPHS + "quad-graph1"), actual.getGraphRevision().stream().findFirst().get().getDeletions().get());
    }

    /* getAdditions(Resource, RepositoryConnection) */

    @Test
    public void getAdditionsWithResourceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model expected = MODEL_FACTORY.createModel(Stream.of(VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"))).collect(Collectors.toList()));

            Stream<Statement> result = service.getAdditions(COMMIT_IRI, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void getAdditionsUsingResourceWithQuads() {
        IRI commit = VALUE_FACTORY.createIRI(COMMITS + "quad-test1");
        IRI object1 = VALUE_FACTORY.createIRI("http://mobi.com/test/object1");
        IRI object2 = VALUE_FACTORY.createIRI("http://mobi.com/test/object2");
        IRI revisionedGraph = VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1");

        Model expected = MODEL_FACTORY.createModel(Stream.of(
                VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title")),
                VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), revisionedGraph),
                VALUE_FACTORY.createStatement(object2, typeIRI, OWL_THING, revisionedGraph)
        ).collect(Collectors.toList()));

        try (RepositoryConnection conn = repo.getConnection()) {
            Stream<Statement> result = service.getAdditions(commit, conn);
            assertEquals(new HashSet<>(expected), result.collect(Collectors.toSet()));
        }
    }

    /* getAdditions(Resource, RepositoryConnection) */

    @Test
    public void getDeletionsWithResourceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model expected = MODEL_FACTORY.createModel(Stream.of(VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"))).collect(Collectors.toList()));

            Stream<Statement> result = service.getDeletions(COMMIT_IRI, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void getDeletionsUsingResourceWithQuads() {
        Model expected = MODEL_FACTORY.createModel(Stream.of(
                VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object1"), titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title")),
                VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object2"), titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1"))
        ).collect(Collectors.toList()));

        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commit = VALUE_FACTORY.createIRI(COMMITS + "quad-test2");
            Stream<Statement> result = service.getDeletions(commit, conn);
            assertEquals(new HashSet<>(expected), result.collect(Collectors.toSet()));
        }
    }

    /* getAdditions(Commit, RepositoryConnection) */

    @Test
    public void getAdditionsWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Model expected = MODEL_FACTORY.createModel(Stream.of(VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"))).collect(Collectors.toList()));

            Stream<Statement> result = service.getAdditions(commit, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    /* getAdditions(Commit, RepositoryConnection) */

    @Test
    public void getDeletionsWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_IRI, commitFactory, conn);
            Model expected = MODEL_FACTORY.createModel(Stream.of(VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"))).collect(Collectors.toList()));

            Stream<Statement> result = service.getDeletions(commit, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    /* addChanges */

    @Test
    public void addChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource additionId = getAdditionsResource(COMMIT_IRI);
            Resource deletionId = getDeletionsResource(COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
            Model additions = MODEL_FACTORY.createModel(Stream.of(statement1, existingDeleteStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createModel(Stream.of(existingAddStatement, statement1).collect(Collectors.toSet()));

            service.addChanges(additionId, deletionId, additions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            assertEquals(0, conn.size(deletionId));
        }
    }

    /* getCommitChain */

    @Test
    public void getCommitChainDescTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");

            List<Resource> result = service.getCommitChain(commitId, false, conn);
            assertEquals(expect, result);
        }
    }

    @Test
    public void getCommitChainAscTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");

            List<Resource> result = service.getCommitChain(commitId, true, conn);
            assertEquals(expect, result);
        }
    }

    @Test
    public void getCommitChainMissingCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#error");

            List<Resource> result = service.getCommitChain(commitId, true, conn);
            assertEquals(1, result.size());
        }
    }

    /* getModelFromCommits(List<Resource>, RepositoryConnection) */

    @Test
    public void getRevisionChangesWithListTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource subject = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            List<Resource> commits = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());

            Model expectAdd = MODEL_FACTORY.createModel();
            expectAdd.add(VALUE_FACTORY.createStatement(subject, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title")));
            Model expectDel = MODEL_FACTORY.createModel();
            expectDel.add(VALUE_FACTORY.createStatement(subject, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title")));

            Difference result = service.getCommitDifference(commits, conn);
            result.getAdditions().forEach(statement -> assertTrue(expectAdd.contains(statement)));
            result.getDeletions().forEach(statement -> assertTrue(expectDel.contains(statement)));
        }
    }

    @Test
    public void getRevisionChangesWithListWithQuadsTest() {
        IRI graph1 = VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1");

        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource object1 = VALUE_FACTORY.createIRI("http://mobi.com/test/object1");
            Resource object2 = VALUE_FACTORY.createIRI("http://mobi.com/test/object2");
            List<Resource> commits = Stream.of(
                    VALUE_FACTORY.createIRI(COMMITS + "quad-test0"),
                    VALUE_FACTORY.createIRI(COMMITS + "quad-test1"),
                    VALUE_FACTORY.createIRI(COMMITS + "quad-test2"))
                    .collect(Collectors.toList());

            Model expectAdd = MODEL_FACTORY.createModel();
            expectAdd.add(VALUE_FACTORY.createStatement(object1, typeIRI, OWL_THING));
            expectAdd.add(VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title")));
            expectAdd.add(VALUE_FACTORY.createStatement(object2, typeIRI, OWL_THING, graph1));
            expectAdd.add(VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"), graph1));
            Model expectDel = MODEL_FACTORY.createModel();

            Difference result = service.getCommitDifference(commits, conn);
            assertEquals(expectAdd.size(), result.getAdditions().size());
            result.getAdditions().forEach(statement -> assertTrue(expectAdd.contains(statement)));
            assertEquals(expectDel.size(), result.getDeletions().size());
        }
    }

    /* getCompiledResource(List<Resource>, RepositoryConnection) */

    @Test
    public void getCompiledResourceWithListTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Model expected = MODEL_FACTORY.createModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));
            expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/class0"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));

            Model result = service.getCompiledResource(commitId, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    /* getCompiledResource(Resource, RepositoryConnection) */

    @Test
    public void getCompiledResourceWithIdTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"), VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1")).collect(Collectors.toList());
            Model expected = MODEL_FACTORY.createModel(Collections.singleton(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"))));

            Model result = service.getCompiledResource(commits, conn);
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    /* getRevisionChanges */

    @Test
    public void getRevisionChangesTest() throws Exception {
        // Setup
        IRI commitId = VALUE_FACTORY.createIRI(COMMITS + "quad-test2");
        IRI object1 = VALUE_FACTORY.createIRI("http://mobi.com/test/object1");
        IRI object2 = VALUE_FACTORY.createIRI("http://mobi.com/test/object2");
        IRI defaultAdds = getAdditionsResource(commitId);
        IRI defaultDels = getDeletionsResource(commitId);
        IRI graph1Adds = getQuadAdditionsResource(commitId, GRAPHS + "quad-graph1");
        IRI graph1Dels = getQuadDeletionsResource(commitId, GRAPHS + "quad-graph1");

        // Expected Data
        Statement add1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"), defaultAdds);
        Statement add2 = VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"), graph1Adds);
        Model adds = MODEL_FACTORY.createModel(Stream.of(add1, add2).collect(Collectors.toSet()));

        Statement del1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), defaultDels);
        Statement del2 = VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), graph1Dels);
        Model dels = MODEL_FACTORY.createModel(Stream.of(del1, del2).collect(Collectors.toSet()));

        // Test
        try (RepositoryConnection conn = repo.getConnection()) {
            Difference diff = service.getRevisionChanges(commitId, conn);
            assertEquals(adds, diff.getAdditions());
            assertEquals(dels, diff.getDeletions());
        }
    }

    /* getCommitDifference */

    @Test
    public void getCommitDifferenceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Statement addStatement = VALUE_FACTORY.createStatement(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));
            Statement delStatement = VALUE_FACTORY.createStatement(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"));

            Difference diff = service.getCommitDifference(commitId, conn);
            assertTrue(diff.getAdditions().contains(addStatement));
            assertTrue(diff.getDeletions().contains(delStatement));
        }
    }

    @Test
    public void getCommitDifferenceTestWithQuads() {
        IRI graph1 = VALUE_FACTORY.createIRI(GRAPHS + "quad-graph1");
        
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "quad-test1");
            IRI object1 = VALUE_FACTORY.createIRI("http://mobi.com/test/object1");
            IRI object2 = VALUE_FACTORY.createIRI("http://mobi.com/test/object2");

            Statement add1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));
            Statement add2 = VALUE_FACTORY.createStatement(object2, typeIRI, OWL_THING, graph1);
            Statement add3 = VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), graph1);
            Model adds = MODEL_FACTORY.createModel(Stream.of(add1, add2, add3).collect(Collectors.toSet()));

            Statement del1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"));
            Model dels = MODEL_FACTORY.createModel(Stream.of(del1).collect(Collectors.toSet()));

            Difference diff = service.getCommitDifference(commitId, conn);
            assertEquals(adds, diff.getAdditions());
            assertTrue(diff.getDeletions().equals(dels));
        }
    }

    /* applyDifference */

    @Test
    public void applyDifferenceTest() {
        // Setup:
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Statement existing = VALUE_FACTORY.createStatement(sub, titleIRI, VALUE_FACTORY.createLiteral("Existing"));
        Statement toDelete = VALUE_FACTORY.createStatement(sub, titleIRI, VALUE_FACTORY.createLiteral("Delete"));
        Statement toAdd = VALUE_FACTORY.createStatement(sub, titleIRI, VALUE_FACTORY.createLiteral("Add"));
        Difference diff = new Difference.Builder()
                .additions(MODEL_FACTORY.createModel(Collections.singleton(toAdd)))
                .deletions(MODEL_FACTORY.createModel(Collections.singleton(toDelete))).build();
        Model model = MODEL_FACTORY.createModel(Stream.of(existing, toDelete).collect(Collectors.toList()));

        Model result = service.applyDifference(model, diff);
        assertTrue(result.contains(existing));
        assertTrue(result.contains(toAdd));
        assertFalse(result.contains(toDelete));
    }

    /* throwAlreadyExists */

    @Test
    public void throwAlreadyExistsTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " already exists");

        throw service.throwAlreadyExists(RECORD_IRI, recordFactory);
    }

    /* throwDoesNotBelong */

    @Test
    public void throwDoesNotBelongTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " does not belong to Catalog " + CATALOG_IRI);

        throw service.throwDoesNotBelong(RECORD_IRI, recordFactory, CATALOG_IRI, catalogFactory);
    }

    /* throwThingNotFound */

    @Test
    public void throwThingNotFoundTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " could not be found");

        throw service.throwThingNotFound(RECORD_IRI, recordFactory);
    }

    @Test
    public void isCommitBranchHeadTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#conflict2");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(service.commitInBranch(BRANCH_IRI, commitId, conn));
        }
    }

    @Test
    public void isCommitBranchNotHeadTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#conflict0");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(service.commitInBranch(BRANCH_IRI, commitId, conn));
        }
    }

    @Test
    public void isCommitBranchNotTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.commitInBranch(BRANCH_IRI, commitId, conn));
        }
    }

    private void testBadRecordId(Resource resource) {
        // Setup:
        IRI classIRI = VALUE_FACTORY.createIRI(Record.TYPE);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), resource));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateResource(resource, classIRI, conn);
        }
    }

    private void getBadRecord(Resource resource) {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", recordFactory.getTypeIRI().getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getObject(resource, recordFactory, conn);
        }
    }

    private void getBadExpectedRecord(Resource resource) {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage(String.format("%s %s could not be found", recordFactory.getTypeIRI().getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getExpectedObject(resource, recordFactory, conn);
        }
    }

    private IRI getAdditionsResource(IRI commitId) {
        return VALUE_FACTORY.createIRI(ADDITIONS + commitId.getLocalName());
    }

    private IRI getQuadAdditionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(ADDITIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, "UTF-8"));
    }

    private IRI getDeletionsResource(IRI commitId) {
        return VALUE_FACTORY.createIRI(DELETIONS + commitId.getLocalName());
    }

    private IRI getQuadDeletionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(DELETIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, "UTF-8"));
    }

    private <T extends Thing> T getThing(Resource thingId, OrmFactory<T> factory, RepositoryConnection conn) {
        Model thingModel = RepositoryResults.asModel(conn.getStatements(null, null, null, thingId), MODEL_FACTORY);
        return factory.getExisting(thingId, thingModel).get();
    }
}
