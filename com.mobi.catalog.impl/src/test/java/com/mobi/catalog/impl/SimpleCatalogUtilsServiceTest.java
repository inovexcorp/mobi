package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Models;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCatalogUtilsServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleCatalogUtilsService service;
    private MemoryRepositoryWrapper repo;
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Version> versionFactory = getRequiredOrmFactory(Version.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);

    private final IRI typeIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI labelIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.label_IRI);
    private final IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
    private final IRI descriptionIRI = VALUE_FACTORY.createIRI(_Thing.description_IRI);
    private final IRI MISSING_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#missing");
    private final IRI EMPTY_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#empty");
    private final IRI RANDOM_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#random");
    private final IRI DIFFERENT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#different");
    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#taken");
    private final IRI USER2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/users#user2");
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
    private final IRI SIMPLE_VERSIONED_RDF_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#simple-versioned-rdf-record");
    private final IRI VERSIONED_RDF_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-no-catalog");
    private final IRI VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record-missing-branch");
    private final IRI LATEST_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#latest-version");
    private final IRI LATEST_TAG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#latest-tag");
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

    private static final String COMMITS = "http://mobi.com/test/commits#";
    private static final String GRAPHS = "http://mobi.com/test/graphs#";
    private static final String ADDITIONS = "https://mobi.com/additions#";
    private static final String DELETIONS = "https://mobi.com/deletions#";
    private static final String BRANCHES = "http://mobi.com/test/branches#";
    private static final String RECORDS = "http://mobi.com/test/records#";
    private static final String REVISIONS = "http://mobi.com/test/revisions#";

    private static final IRI VERSION_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRecord.version_IRI);
    private static final IRI BRANCH_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRDFRecord.branch_IRI);
    private static final IRI HEAD_CATALOG_IRI = VALUE_FACTORY.createIRI(Branch.head_IRI);
    private static final IRI COMMIT_CATALOG_IRI = VALUE_FACTORY.createIRI(Commit.TYPE);
    private static final IRI ADDITIONS_CATALOG_IRI = VALUE_FACTORY.createIRI(Revision.additions_IRI);
    private static final IRI DELETIONS_CATALOG_IRI = VALUE_FACTORY.createIRI(Revision.deletions_IRI);
    private static final IRI LATEST_VERSION_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRecord.latestVersion_IRI);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        service = new SimpleCatalogUtilsService();
        injectOrmFactoryReferencesIntoService(service);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    private String getModifiedIriValue(IRI entity, RepositoryConnection conn) {
        RepositoryResult<Statement> statements = conn.getStatements(entity,
                getValueFactory().createIRI(_Thing.modified_IRI), null);

        String modifiedIri = statements.next().toString();
        statements.close();
        return modifiedIri;
    }

    private List<Resource> buildResources(String... resources) {
        return Stream.of(resources).map((r) -> VALUE_FACTORY.createIRI(r)).collect(Collectors.toList());
    }

    private String modelAssertHelper(Model model){
        Set<String> statements = new TreeSet<>();
        model.forEach(statement -> statements.add("(" + statement.getSubject().stringValue() + ", " + statement.getPredicate().stringValue() + ", " + statement.getObject().toString()));
        return String.join("\n", statements);
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
            assertFalse(ConnectionUtils.contains(conn, null, null, null, EMPTY_IRI));

            service.addObject(record, conn);
            assertEquals(record.getModel().size(), QueryResults.asModel(conn.getStatements(null, null, null, EMPTY_IRI), MODEL_FACTORY).size());
        }
    }

    /* updateObject */

    @Test
    public void updateObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            assertTrue(ConnectionUtils.contains(conn, null, null, null, RECORD_IRI));
            Record newRecord = recordFactory.createNew(RECORD_IRI);

            service.updateObject(newRecord, conn);
            QueryResults.asModel(conn.getStatements(null, null, null, RECORD_IRI), MODEL_FACTORY).forEach(statement ->
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
            assertTrue(ConnectionUtils.contains(conn, null, null, null, RECORD_IRI));
            service.remove(RECORD_IRI, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, RECORD_IRI));
        }
    }

    /* removeObject */

    @Test
    public void removeObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, RECORD_IRI));
            service.removeObject(recordFactory.createNew(RECORD_IRI), conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, RECORD_IRI));
        }
    }

    /* removeObjectWithRelationship */

    @Test
    public void removeObjectWithRelationshipTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, BRANCH_IRI));
            service.removeObjectWithRelationship(BRANCH_IRI, VERSIONED_RDF_RECORD_IRI, VersionedRDFRecord.branch_IRI, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, VALUE_FACTORY.createIRI(VersionedRDFRecord.branch_IRI), BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
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

    /* removeVersion */

    @Test
    public void removeVersionWithObjectTest() throws Exception {
        // Setup:

        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(DISTRIBUTION_IRI)));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));

            service.removeVersion(VERSIONED_RECORD_IRI, version, conn);

            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
        }
    }

    @Test
    public void removeVersionWithResourceTest() throws Exception {
        // Setup:

        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(DISTRIBUTION_IRI)));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));

            service.removeVersion(VERSIONED_RECORD_IRI, version.getResource(), conn);

            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, VERSION_IRI, VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI));
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

    /* removeBranch */

    @Test
    public void removeBranchTest() throws Exception {
        // Setup:
        Resource commitIdToRemove = VALUE_FACTORY.createIRI(COMMITS + "commitA1");
        IRI additionsToRemove = VALUE_FACTORY.createIRI(ADDITIONS + "commitA1");
        IRI deletionsToRemove = VALUE_FACTORY.createIRI(DELETIONS + "commitA1");
        IRI revisionToRemove = VALUE_FACTORY.createIRI(REVISIONS + "commitA1");

        Resource commitIdToKeep = VALUE_FACTORY.createIRI(COMMITS + "commitA0");
        IRI additionsToKeep = VALUE_FACTORY.createIRI(ADDITIONS + "commitA0");
        IRI deletionsToKeep = VALUE_FACTORY.createIRI(DELETIONS + "commitA0");
        IRI revisionToKeep = VALUE_FACTORY.createIRI(REVISIONS + "commitA0");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, BRANCH_IRI));
            assertTrue(ConnectionUtils.contains(conn, commitIdToRemove, typeIRI, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, typeIRI, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));

            List<Resource> deletedCommits = service.removeBranch(VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, conn);

            assertEquals(1, deletedCommits.size());
            assertEquals(commitIdToRemove, deletedCommits.get(0));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, commitIdToRemove, typeIRI, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, typeIRI, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));
        }
    }

    @Test
    public void removeBranchWithDeletedCommitListTest() throws Exception {
        // Setup:
        Resource commitIdToRemove = VALUE_FACTORY.createIRI(COMMITS + "commitA1");
        IRI additionsToRemove = VALUE_FACTORY.createIRI(ADDITIONS + "commitA1");
        IRI deletionsToRemove = VALUE_FACTORY.createIRI(DELETIONS + "commitA1");
        IRI revisionToRemove = VALUE_FACTORY.createIRI(REVISIONS + "commitA1");

        Resource commitIdToKeep = VALUE_FACTORY.createIRI(COMMITS + "commitA0");
        IRI additionsToKeep = VALUE_FACTORY.createIRI(ADDITIONS + "commitA0");
        IRI deletionsToKeep = VALUE_FACTORY.createIRI(DELETIONS + "commitA0");
        IRI revisionToKeep = VALUE_FACTORY.createIRI(REVISIONS + "commitA0");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, BRANCH_IRI));
            assertTrue(ConnectionUtils.contains(conn, commitIdToRemove, typeIRI, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, typeIRI, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));

            List<Resource> deletedCommits = new ArrayList<>();
            service.removeBranch(VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, deletedCommits, conn);

            assertEquals(1, deletedCommits.size());
            assertEquals(commitIdToRemove, deletedCommits.get(0));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_TAG_IRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, BRANCH_IRI, HEAD_CATALOG_IRI, commitIdToRemove, BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, commitIdToRemove, typeIRI, COMMIT_CATALOG_IRI, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commitIdToRemove));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commitIdToRemove));
            assertTrue(ConnectionUtils.contains(conn, commitIdToKeep, typeIRI, COMMIT_CATALOG_IRI, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, ADDITIONS_CATALOG_IRI, additionsToKeep, commitIdToKeep));
            assertTrue(ConnectionUtils.contains(conn, revisionToKeep, DELETIONS_CATALOG_IRI, deletionsToKeep, commitIdToKeep));
        }
    }

    @Test
    public void removeBranchCompleteTest() {
        // Setup:
        Resource complexRecordIRI = VALUE_FACTORY.createIRI(RECORDS + "complex-record");
        Resource complexBranchIRI = VALUE_FACTORY.createIRI(BRANCHES + "complex-branch");
        Resource commitA = VALUE_FACTORY.createIRI(COMMITS + "complex-a");
        IRI commitARevision = VALUE_FACTORY.createIRI(REVISIONS + "complex-a");
        IRI commitAAdditions = VALUE_FACTORY.createIRI(ADDITIONS + "complex-a");
        IRI commitADeletions = VALUE_FACTORY.createIRI(DELETIONS + "complex-a");
        Resource commitB = VALUE_FACTORY.createIRI(COMMITS + "complex-b");
        Resource commitC = VALUE_FACTORY.createIRI(COMMITS + "complex-c");
        IRI commitCRevision = VALUE_FACTORY.createIRI(REVISIONS + "complex-c");
        IRI commitCAdditions = VALUE_FACTORY.createIRI(ADDITIONS + "complex-c");
        IRI commitCDeletions = VALUE_FACTORY.createIRI(DELETIONS + "complex-c");
        Resource commitD = VALUE_FACTORY.createIRI(COMMITS + "complex-d");

        try (RepositoryConnection conn = repo.getConnection()) {

            assertTrue(ConnectionUtils.contains(conn, complexRecordIRI, BRANCH_CATALOG_IRI, complexBranchIRI, complexRecordIRI));
            assertTrue(ConnectionUtils.contains(conn, commitA, typeIRI, COMMIT_CATALOG_IRI, commitA));
            assertTrue(ConnectionUtils.contains(conn, commitARevision, ADDITIONS_CATALOG_IRI, commitAAdditions, commitA));
            assertTrue(ConnectionUtils.contains(conn, commitARevision, DELETIONS_CATALOG_IRI, commitADeletions, commitA));

            assertTrue(ConnectionUtils.contains(conn, commitC, typeIRI, COMMIT_CATALOG_IRI, commitC));
            assertTrue(ConnectionUtils.contains(conn, commitCRevision, ADDITIONS_CATALOG_IRI, commitCAdditions, commitC));
            assertTrue(ConnectionUtils.contains(conn, commitCRevision, DELETIONS_CATALOG_IRI, commitCDeletions, commitC));

            assertTrue(ConnectionUtils.contains(conn, commitB, typeIRI, COMMIT_CATALOG_IRI, commitB));
            assertTrue(ConnectionUtils.contains(conn, commitD, typeIRI, COMMIT_CATALOG_IRI, commitD));

            List<Resource> deletedCommits = service.removeBranch(complexRecordIRI, complexBranchIRI, conn);

            assertEquals(2, deletedCommits.size());
            assertTrue(deletedCommits.contains(commitA));
            assertTrue(deletedCommits.contains(commitC));
            assertFalse(ConnectionUtils.contains(conn, complexRecordIRI, BRANCH_CATALOG_IRI, complexBranchIRI, complexRecordIRI));
            assertFalse(ConnectionUtils.contains(conn, commitA, typeIRI, COMMIT_CATALOG_IRI, commitA));
            assertFalse(ConnectionUtils.contains(conn, commitARevision, ADDITIONS_CATALOG_IRI, commitAAdditions, commitA));
            assertFalse(ConnectionUtils.contains(conn, commitARevision, DELETIONS_CATALOG_IRI, commitADeletions, commitA));

            assertFalse(ConnectionUtils.contains(conn, commitC, typeIRI, COMMIT_CATALOG_IRI, commitC));
            assertFalse(ConnectionUtils.contains(conn, commitCRevision, ADDITIONS_CATALOG_IRI, commitCAdditions, commitC));
            assertFalse(ConnectionUtils.contains(conn, commitCRevision, DELETIONS_CATALOG_IRI, commitCDeletions, commitC));

            assertTrue(ConnectionUtils.contains(conn, commitB, typeIRI, COMMIT_CATALOG_IRI, commitB));
            assertTrue(ConnectionUtils.contains(conn, commitD, typeIRI, COMMIT_CATALOG_IRI, commitD));
        }
    }

    @Test
    public void removeBranchWithQuadsTest() throws Exception {
        // Setup:
        Resource quadVersionedRecordId = VALUE_FACTORY.createIRI(RECORDS + "quad-versioned-rdf-record");
        IRI branchToRemove = VALUE_FACTORY.createIRI(BRANCHES + "quad-branch");
        Resource commit2 = VALUE_FACTORY.createIRI(COMMITS + "quad-test2");
        Resource revisionToRemove = VALUE_FACTORY.createIRI(REVISIONS + "revision2");
        IRI additionsToRemove = VALUE_FACTORY.createIRI(ADDITIONS + "quad-test2");
        IRI deletionsToRemove = VALUE_FACTORY.createIRI(DELETIONS + "quad-test2");
        IRI graphAdditionsToRemove = VALUE_FACTORY.createIRI(ADDITIONS + "quad-test2%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");
        IRI graphDeletionsToRemove = VALUE_FACTORY.createIRI(DELETIONS + "quad-test2%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");

        Branch branch = branchFactory.createNew(branchToRemove);
        branch.setHead(commitFactory.createNew(commit2));

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, quadVersionedRecordId, BRANCH_CATALOG_IRI, branchToRemove, quadVersionedRecordId));
            assertTrue(ConnectionUtils.contains(conn, commit2, typeIRI, COMMIT_CATALOG_IRI, commit2));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commit2));
            assertTrue(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commit2));
            assertTrue(ConnectionUtils.contains(conn, null, null, null, graphAdditionsToRemove));
            assertTrue(ConnectionUtils.contains(conn, null, null, null, graphDeletionsToRemove));

            List<Resource> deletedCommits = service.removeBranch(quadVersionedRecordId, branchToRemove, conn);

            assertEquals(1, deletedCommits.size());
            assertEquals(commit2, deletedCommits.get(0));
            assertFalse(ConnectionUtils.contains(conn, quadVersionedRecordId, BRANCH_CATALOG_IRI, branchToRemove, quadVersionedRecordId));
            assertFalse(ConnectionUtils.contains(conn, commit2, typeIRI, COMMIT_CATALOG_IRI, commit2));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, ADDITIONS_CATALOG_IRI, additionsToRemove, commit2));
            assertFalse(ConnectionUtils.contains(conn, revisionToRemove, DELETIONS_CATALOG_IRI, deletionsToRemove, commit2));
            assertFalse(ConnectionUtils.contains(conn, null, null, null, graphAdditionsToRemove));
            assertFalse(ConnectionUtils.contains(conn, null, null, null, graphDeletionsToRemove));
        }
    }

    @Test
    public void removeBranchWithNoHeadTest() {
        // Setup:
        IRI noHeadBranchIRI = VALUE_FACTORY.createIRI(BRANCHES + "no-head-branch");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, noHeadBranchIRI, VERSIONED_RDF_RECORD_IRI));

            List<Resource> deletedCommits = service.removeBranch(VERSIONED_RDF_RECORD_IRI, noHeadBranchIRI, conn);
            assertEquals(0, deletedCommits.size());
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, noHeadBranchIRI, VERSIONED_RDF_RECORD_IRI));
        }
    }

    @Test
    public void testRemoveBranchWhenUserBranchExists() {
        // Setup:
        IRI userBranchIRI = VALUE_FACTORY.createIRI(BRANCHES + "user-branch");
        IRI createdFromIRI = VALUE_FACTORY.createIRI(UserBranch.createdFrom_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, userBranchIRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, userBranchIRI, createdFromIRI, BRANCH_IRI, userBranchIRI));

            service.removeBranch(VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, conn);

            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, userBranchIRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, userBranchIRI, createdFromIRI, BRANCH_IRI, userBranchIRI));
            RepositoryResult<Statement> results = conn.getStatements(userBranchIRI, createdFromIRI, BRANCH_IRI, userBranchIRI);
            assertTrue(results.next().getObject().equals(BRANCH_IRI));
            results.close();
        }
    }

    @Test
    public void testRemoveBranchUserBranch() {
        // Setup:
        IRI userBranchIRI = VALUE_FACTORY.createIRI(BRANCHES + "user-branch");
        IRI createdFromIRI = VALUE_FACTORY.createIRI(UserBranch.createdFrom_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, null, null));
            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, userBranchIRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, userBranchIRI, createdFromIRI, BRANCH_IRI, userBranchIRI));

            service.removeBranch(VERSIONED_RDF_RECORD_IRI, userBranchIRI, conn);

            assertTrue(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, BRANCH_IRI, VERSIONED_RDF_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, null, null));
            assertFalse(ConnectionUtils.contains(conn, VERSIONED_RDF_RECORD_IRI, BRANCH_CATALOG_IRI, userBranchIRI, VERSIONED_RDF_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, userBranchIRI, createdFromIRI, BRANCH_IRI, userBranchIRI));
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
            InProgressCommit commit = service.getInProgressCommit(VERSIONED_RDF_RECORD_IRI, USER2_IRI, conn);
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

    /* getInProgressCommit(Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitByResourceTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(IN_PROGRESS_COMMIT_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void getInProgressCommitByResourceDoesNotExistTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = service.getInProgressCommit(VALUE_FACTORY.createIRI("<urn:test>"), conn);
        }
    }

    /* getInProgressCommitIRI */

    @Test
    public void getInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = service.getInProgressCommitIRI(VERSIONED_RDF_RECORD_IRI, USER2_IRI, conn);
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

    /* getInProgressCommitIRIs(Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitIRIsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> iris = service.getInProgressCommitIRIs(USER_IRI, conn);
            assertEquals(3, iris.size());
            assertTrue(iris.contains(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit-referenced")));
            assertTrue(iris.contains(IN_PROGRESS_COMMIT_NO_RECORD_IRI));
            assertTrue(iris.contains(VALUE_FACTORY.createIRI(COMMITS + "quad-in-progress-commit")));
        }
    }

    @Test
    public void getInProgressCommitIRIsNoUserTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> iris = service.getInProgressCommitIRIs(VALUE_FACTORY.createIRI("urn:test"), conn);
            assertEquals(0, iris.size());
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
            assertFalse(ConnectionUtils.contains(conn, null, null, null, IN_PROGRESS_COMMIT_IRI));
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
            assertTrue(ConnectionUtils.containsContext(conn, additionsResource));
            assertTrue(ConnectionUtils.containsContext(conn, deletionsResource));

            IRI graph1AdditionsResource = getQuadAdditionsResource(quadInProgressCommit, GRAPHS + "quad-graph1");
            IRI graph1DeletionsResource = getQuadDeletionsResource(quadInProgressCommit, GRAPHS + "quad-graph1");
            assertTrue(ConnectionUtils.containsContext(conn, graph1AdditionsResource));
            assertTrue(ConnectionUtils.containsContext(conn, graph1DeletionsResource));

            service.removeInProgressCommit(commit, conn);
            assertFalse(ConnectionUtils.containsContext(conn, quadInProgressCommit));
            assertFalse(ConnectionUtils.containsContext(conn, additionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, deletionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, graph1AdditionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, graph1DeletionsResource));
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
            assertTrue(ConnectionUtils.contains(conn, null, null, null, commit.getResource()));
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            service.removeInProgressCommit(commit, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, commit.getResource()));
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
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(statement1).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(statement3).collect(Collectors.toSet()));

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
            Statement triple = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(triple).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(triple).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

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
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(statement3, existingDelStatement).collect(Collectors.toSet()));

            service.updateCommit(commit, null, deletions, conn);

            List<Statement> actualAdds = QueryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = QueryResults.asList(conn.getStatements(null, null, null, deletionId));
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
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, existingDelStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(statement1, existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();

            service.updateCommit(commit, additions, null, conn);

            List<Statement> actualAdds = QueryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = QueryResults.asList(conn.getStatements(null, null, null, deletionId));
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

            service.updateCommit(commit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitWithoutDeletionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(COMMIT_NO_DELETIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

            service.updateCommit(commit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
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
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(addQuad, addAndDeleteQuad).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(addAndDeleteQuad, deleteQuad, existingAddQuad).collect(Collectors.toSet()));

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

            List<Statement> adds = QueryResults.asList(conn.getStatements(null, null, null, additionsGraph));
            assertEquals(1, adds.size());
            assertTrue(adds.contains(expAdd1));

            List<Statement> dels = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraph));
            assertEquals(1, dels.size());
            assertTrue(dels.contains(expDel1));

            List<Statement> addsGraph1 = QueryResults.asList(conn.getStatements(null, null, null, additionsGraph1));
            assertEquals(1, addsGraph1.size());
            assertTrue(addsGraph1.contains(expAddGraph1));

            List<Statement> delsGraph1 = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraph1));
            assertEquals(1, delsGraph1.size());
            assertTrue(delsGraph1.contains(expDelGraph1));

            List<Statement> addsGraphTest = QueryResults.asList(conn.getStatements(null, null, null, additionsGraphTest));
            assertEquals(1, addsGraphTest.size());
            assertTrue(addsGraphTest.contains(expAddGraphTest));

            List<Statement> delsGraphTest = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraphTest));
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
        Model additions = MODEL_FACTORY.createEmptyModel();
        additions.addAll(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createEmptyModel();
        deletions.addAll(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
        expectedAdditions.addAll(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
        expectedDeletions.addAll(Stream.of(statement3).collect(Collectors.toSet()));

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
        Statement triple = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), titleIRI, VALUE_FACTORY.createLiteral("Title"));
        Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"));
        Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"));
        Model additions = MODEL_FACTORY.createEmptyModel();
        additions.addAll(Stream.of(triple).collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createEmptyModel();
        deletions.addAll(Stream.of(triple).collect(Collectors.toSet()));
        Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
        expectedAdditions.addAll(Stream.of(existingAddStatement).collect(Collectors.toSet()));
        Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
        expectedDeletions.addAll(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

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
            service.updateCommit(COMMIT_NO_ADDITIONS_IRI, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    @Test
    public void updateCommitWithResourceWithoutDeletionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Deletions not set on Commit " + COMMIT_NO_DELETIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateCommit(COMMIT_NO_DELETIONS_IRI, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    /* addCommit */

    @Test
    public void addCommitTest() {
        // Setup:
        IRI newIRI = VALUE_FACTORY.createIRI("http://mobi.com/test#new");
        IRI headCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA1");
        IRI headIRI = VALUE_FACTORY.createIRI(Branch.head_IRI);

        Commit commit = commitFactory.createNew(newIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getRecord(CATALOG_IRI, SIMPLE_VERSIONED_RDF_RECORD_IRI, recordFactory, conn);
            String previousRecordModDate = getModifiedIriValue(SIMPLE_VERSIONED_RDF_RECORD_IRI, conn);

            Branch branch = service.getBranch(CATALOG_IRI, SIMPLE_VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, branchFactory, conn);
            String previousBranchModDate = getModifiedIriValue(BRANCH_IRI, conn);

            assertFalse(ConnectionUtils.contains(conn, null, null, null, newIRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, headIRI, headCommitIRI, BRANCH_IRI));

            service.addCommit(branch, commit, conn);

            assertTrue(branch.getHead_resource().isPresent());
            assertEquals(newIRI, branch.getHead_resource().get());
            assertTrue(ConnectionUtils.contains(conn, null, null, null, newIRI));
            assertTrue(ConnectionUtils.contains(conn, BRANCH_IRI, headIRI, newIRI, BRANCH_IRI));
            assertNotSame(getModifiedIriValue(BRANCH_IRI, conn), previousBranchModDate);
            assertNotSame(getModifiedIriValue(SIMPLE_VERSIONED_RDF_RECORD_IRI, conn), previousRecordModDate);
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
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, existingDeleteStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(existingAddStatement, statement1).collect(Collectors.toSet()));

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
    public void getCommitChainEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
            Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class");

            List<Resource> result = service.getCommitChain(commitId, entityId, false, conn);
            assertEquals(expect, result);
        }
    }

    @Test
    public void getEmptyCommitChainEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test5a");
            Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/noClass");

            List<Resource> result = service.getCommitChain(commitId, entityId, false, conn);
            assertEquals(0, result.size());
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
            Resource ontologySub = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            List<Resource> commits = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());

            Statement ontologyAddStmt = VALUE_FACTORY.createStatement(ontologySub, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"));
            Statement classAddStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            Statement ontologyDelStmt = VALUE_FACTORY.createStatement(ontologySub, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"));
            Statement classDelStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 1"));

            Difference result = service.getCommitDifference(commits, conn);
            assertTrue(result.getAdditions().contains(ontologyAddStmt));
            assertTrue(result.getAdditions().contains(classAddStmt));

            assertTrue(result.getDeletions().contains(ontologyDelStmt));
            assertTrue(result.getDeletions().contains(classDelStmt));
        }
    }

    /* getCommitDifferencePaged(List<Resource>, RepositoryConnection) */

    @Test
    public void getPagedRevisionChangesWithListTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource ontologySub = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            List<Resource> commits = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());

            Statement ontologyAddStmt = VALUE_FACTORY.createStatement(ontologySub, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"));
            Statement classAddStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            Statement ontologyDelStmt = VALUE_FACTORY.createStatement(ontologySub, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"));
            Statement classDelStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 1"));

            PagedDifference firstPage = service.getCommitDifferencePaged(commits, conn, 1, 0);
            assertTrue(firstPage.getDifference().getAdditions().contains(classAddStmt));
            assertTrue(firstPage.getDifference().getDeletions().contains(classDelStmt));
            assertFalse(firstPage.getDifference().getAdditions().contains(ontologyAddStmt));
            assertFalse(firstPage.getDifference().getDeletions().contains(ontologyDelStmt));
            assertTrue(firstPage.hasMoreResults());

            PagedDifference secondPage = service.getCommitDifferencePaged(commits, conn, 1, 1);
            assertFalse(secondPage.getDifference().getAdditions().contains(classAddStmt));
            assertFalse(secondPage.getDifference().getDeletions().contains(classDelStmt));
            assertTrue(secondPage.getDifference().getAdditions().contains(ontologyAddStmt));
            assertTrue(secondPage.getDifference().getDeletions().contains(ontologyDelStmt));
            assertFalse(secondPage.hasMoreResults());

        }
    }

    /* getCompiledResource(Resource, RepositoryConnection) */

    @Test
    public void getCompiledResourceWithIdTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));
            expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/class0"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));

            Model result = service.getCompiledResource(commitId, conn);
            expected.forEach(statement -> assertTrue(result.contains(statement)));
        }
    }

    @Test
    public void getCompiledResourceWithIdChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testRename1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            Model result = service.getCompiledResource(commitId, conn);
            expected.forEach(statement -> assertTrue(result.contains(statement)));
            assertEquals(expected.size(), result.size());
        }
    }

    @Test
    public void getCompiledResourceWithIdBlankNodeTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testBlank1");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, titleIRI, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            Model model = service.getCompiledResource(commitId, conn);
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getCompiledResourceFile(Resource, RepositoryConnection) */

    @Test
    public void getCompiledResourceFileWithIdTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));
            expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/class0"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));

            File file = service.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            assertEquals(expected.size(), model.size());
            expected.forEach(statement -> assertTrue(model.contains(statement)));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithIdChangeEntityTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testRename1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            File file = service.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            assertEquals(expected.size(), model.size());
            expected.forEach(statement -> assertTrue(model.contains(statement)));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithIdBlankNodeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testBlank1");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, titleIRI, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            File file = service.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getCompiledResource(List<Resource>, RepositoryConnection, Resource... subjectIds) */

    @Test
    public void getCompiledResourceWithListTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.addAll(Collections.singleton(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"))));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            Model result = service.getCompiledResource(commits, conn);
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListSubjectIdTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.addAll(Collections.singleton(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"))));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            Model result = service.getCompiledResource(commits, conn, VALUE_FACTORY.createIRI("http://mobi.com/test/class"));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            Model result = service.getCompiledResource(commits, conn);
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListBlankNodeTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testBlank1", "http://mobi.com/test/commits#testBlank0");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, titleIRI, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            Model model = service.getCompiledResource(commits, conn);
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getCompiledResourceFile(List<Resource>, RepositoryConnection, Resource... subjectIds) */

    @Test
    public void getCompiledResourceFileWithListTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.addAll(Collections.singleton(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"))));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            File file = service.getCompiledResourceFile(commits, RDFFormat.TURTLE, conn);
            Model result = Models.createModel(new FileInputStream(file));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithListSubjectIdTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.addAll(Collections.singleton(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"))));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            File file = service.getCompiledResourceFile(commits, RDFFormat.TURTLE, conn, VALUE_FACTORY.createIRI("http://mobi.com/test/class"));
            Model result = Models.createModel(new FileInputStream(file));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithListChangeEntityTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            File file = service.getCompiledResourceFile(commits, RDFFormat.TURTLE, conn);
            Model result = Models.createModel(new FileInputStream(file));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithListChangeEntitySubjectIdTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            File file = service.getCompiledResourceFile(commits, RDFFormat.TURTLE, conn, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1"));
            Model result = Models.createModel(new FileInputStream(file));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithListBlankNodeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testBlank1", "http://mobi.com/test/commits#testBlank0");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, titleIRI, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            File file = service.getCompiledResourceFile(commits, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getDeletionSubjects */

    @Test
    public void getDeletionSubjectsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology", "http://mobi.com/test/class")),
                    service.getDeletionSubjects(commits, conn));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/ontology", "http://mobi.com/test/class")),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
        }
    }

    @Test
    public void getDeletionSubjectsWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    service.getDeletionSubjects(commits, conn));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    service.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
        }
    }

    /* getCommitWithSubjects */

    @Test
    public void getCommitWithSubjectsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {

            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Set<Resource> deletionSubjects = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/tests")).collect(Collectors.toSet());

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    service.getCommitWithSubjects(commits, conn,  deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectIds Non-exist", Collections.emptySet(),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist2")));
        }
    }

    @Test
    public void getCommitWithSubjectsWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");

            Set<Resource> deletionSubjects = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/tests")).collect(Collectors.toSet());

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    service.getCommitWithSubjects(commits, conn,  deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectIds Non-exist", Collections.emptySet(),
                    service.getCommitWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist2")));
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
        Model adds = MODEL_FACTORY.createEmptyModel();
        adds.addAll(Stream.of(add1, add2).collect(Collectors.toSet()));

        Statement del1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), defaultDels);
        Statement del2 = VALUE_FACTORY.createStatement(object2, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"), graph1Dels);
        Model dels = MODEL_FACTORY.createEmptyModel();
        dels.addAll(Stream.of(del1, del2).collect(Collectors.toSet()));

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
            Model adds = MODEL_FACTORY.createEmptyModel();
            adds.addAll(Stream.of(add1, add2, add3).collect(Collectors.toSet()));

            Statement del1 = VALUE_FACTORY.createStatement(object1, titleIRI, VALUE_FACTORY.createLiteral("Test 0 Title"));
            Model dels = MODEL_FACTORY.createEmptyModel();
            dels.addAll(Stream.of(del1).collect(Collectors.toSet()));

            Difference diff = service.getCommitDifference(commitId, conn);
            assertEquals(adds, diff.getAdditions());
            assertTrue(diff.getDeletions().equals(dels));
        }
    }

    /* getCommitDifferencePaged */
    @Test
    public void getCommitDifferencePagedTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Statement firstAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            Statement firstDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), titleIRI,
                    VALUE_FACTORY.createLiteral("Class Title 1"));
            Statement secondAddStatement = VALUE_FACTORY.createStatement(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 2 Title"));
            Statement secondDelStatement = VALUE_FACTORY.createStatement(ontologyId, titleIRI, VALUE_FACTORY.createLiteral("Test 1 Title"));

            PagedDifference firstPageDiff = service.getCommitDifferencePaged(commitId, conn, 1, 0);
            assertTrue(firstPageDiff.getDifference().getAdditions().contains(firstAddStatement));
            assertTrue(firstPageDiff.getDifference().getDeletions().contains(firstDelStatement));
            assertFalse(firstPageDiff.getDifference().getAdditions().contains(secondAddStatement));
            assertFalse(firstPageDiff.getDifference().getDeletions().contains(secondDelStatement));
            assertTrue(firstPageDiff.hasMoreResults());

            PagedDifference secondPageDiff = service.getCommitDifferencePaged(commitId, conn, 1, 1);
            assertTrue(secondPageDiff.getDifference().getAdditions().contains(secondAddStatement));
            assertTrue(secondPageDiff.getDifference().getDeletions().contains(secondDelStatement));
            assertFalse(secondPageDiff.getDifference().getAdditions().contains(firstAddStatement));
            assertFalse(secondPageDiff.getDifference().getDeletions().contains(firstDelStatement));
            assertFalse(secondPageDiff.hasMoreResults());
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
        Model adds = MODEL_FACTORY.createEmptyModel();
        adds.addAll(Collections.singleton(toAdd));
        Model dels = MODEL_FACTORY.createEmptyModel();
        dels.addAll(Collections.singleton(toDelete));
        Difference diff = new Difference.Builder()
                .additions(adds)
                .deletions(dels).build();
        Model model = MODEL_FACTORY.createEmptyModel();
        model.addAll(Stream.of(existing, toDelete).collect(Collectors.toList()));

        Model result = service.applyDifference(model, diff);
        assertTrue(result.contains(existing));
        assertTrue(result.contains(toAdd));
        assertFalse(result.contains(toDelete));
    }

    /* getConflicts */

    @Test
    public void testGetConflictsFullDeletionWithAddition() throws Exception {
        // Setup:
        // Scenario 1: One branch fully deletes a subject while the other adds to it
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict1-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict1-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());

            List<Resource> validIRIs = Arrays.asList(typeIRI, descriptionIRI);
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(0, left.getAdditions().size());
                assertEquals(1, right.getAdditions().size());
                assertEquals(0, right.getDeletions().size());
                assertEquals(1, left.getDeletions().size());
                Stream.of(left.getDeletions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertTrue(validIRIs.contains(statement.getPredicate()));
                }));
            });
        }
    }

    @Test
    public void testGetConflictsFullDeletionWithModification() throws Exception {
        // Setup:
        // Scenario 2: One branch fully deletes a subject while the other modifies something on it
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict2-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict2-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(1, left.getAdditions().size());
                assertEquals(0, right.getAdditions().size());
                assertEquals(1, left.getDeletions().size());
                assertEquals(2, right.getDeletions().size());

                Stream.of(left.getAdditions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertEquals(titleIRI, statement.getPredicate());
                }));
            });
        }
    }

    @Test
    public void testGetConflictsSamePropertyAltered() throws Exception {
        // Setup:
        // Scenario 3: Both branches change the same property
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict3-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict3-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(1, left.getAdditions().size());
                assertEquals(1, right.getAdditions().size());
                assertEquals(1, right.getDeletions().size());
                assertEquals(1, left.getDeletions().size());

                Stream.of(left.getAdditions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertEquals(titleIRI, statement.getPredicate());
                }));
            });
        }
    }

    @Test
    public void testGetConflictsChainAddsAndRemovesStatement() throws Exception {
        // Setup:
        // Scenario 4: Second chain has two commits which adds then removes something
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict4-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict4-3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> results = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, results.size());
        }
    }

    @Test
    public void testGetConflictsPropertyChangeOnSingleBranch() throws Exception {
        // Setup:
        // Scenario 5: Change a property on one branch
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict5-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict5-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsOneRemovesOtherAddsToProperty() throws Exception {
        // Setup:
        // Scenario 6: One branch removes property while other adds another to it
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict6-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict6-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsWithOnlyOneCommit() throws Exception {
        // Setup:
        // Scenario 7: The right is the base commit of the left
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict7-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict7-0");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsDisconnectedNodes() throws Exception {
        // Setup:
        // Scenario 8: Two nodes with no common parents
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict8-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict8-0");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsDisconnectedNodesSamePropertyAltered() throws Exception {
        // Setup:
        // Scenario 9: Both altered same property, no common parents
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict9-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict9-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            // TODO: This should be a conflict scenario
            assertEquals(0, result.size());
            /*assertEquals(1, result.size());
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(1, left.getAdditions().size());
                assertEquals(1, right.getAdditions().size());
                assertEquals(1, right.getDeletions().size());
                assertEquals(1, left.getDeletions().size());

                Stream.of(left.getAdditions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertEquals(titleIRI, statement.getPredicate());
                }));
            });*/
        }
    }

    @Test
    public void testGetConflictsDisconnectedNodesFullDeletionWithAddition() throws Exception {
        // Setup:
        // Scenario 10: Disconnected nodes where one side fully deletes a subject while the other adds to it
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict10-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict10-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsDisconnectedNodesPropertyChangeOnSingleBranch() throws Exception {
        // Setup:
        // Scenario 11: Change a property on one branch
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict11-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict11-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsDisconnectedNodesOneRemovesOtherAddsToProperty() throws Exception {
        // Setup:
        // Scenario 12: One branch removes property while other adds another to it
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict12-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict12-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictDisconnectedNodesFullDeletionWithModification() throws Exception {
        // Setup:
        // Scenario 13: One branch fully removes a subject while the other modifies something on it
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(COMMITS + "conflict13-1");
        Resource rightId = VALUE_FACTORY.createIRI(COMMITS + "conflict13-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = service.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    /* throwAlreadyExists */

    @Test
    public void throwAlreadyExistsTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + RECORD_IRI + " already exists");

        throw service.throwAlreadyExists(RECORD_IRI, recordFactory);
    }

    @Test
    public void testGetDifferenceChain() {
        // Setup:
        List<Resource> commitChain = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");

        // Expected list should have the first commit removed
        List<Resource> expected = commitChain.subList(1, commitChain.size());
        Collections.reverse(expected);

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, conn);

            assertEquals(expected, actual);
        }
    }

    @Test
    public void testGetDifferenceEntityChain() {
        // Setup:
        List<Resource> expected = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");
        Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class");

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, entityId, conn);

            assertEquals(expected, actual);
        }
    }

    @Test
    public void testGetDifferenceEntityChainEmpty() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");
        Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class5");

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, entityId, conn);

            assertEquals(0, actual.size());
        }
    }

    @Test
    public void testGetDifferenceChainCommonParent() {
        // Setup:
        List<Resource> commitChain = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testLoner");

        // Expected should contain all commits from the source chain
        Collections.reverse(commitChain);

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, conn);

            assertEquals(actual, commitChain);
        }
    }

    @Test
    public void doesDifferenceChainSourceCommitExist() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#fake");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testLoner");
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Commit %s could not be found", sourceId.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, conn);
        }
    }

    @Test
    public void doesDifferenceChainTargetCommitExist() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#fake");
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Commit %s could not be found", targetId.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = service.getDifferenceChain(sourceId, targetId, conn);
        }
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
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA1");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(service.commitInBranch(BRANCH_IRI, commitId, conn));
        }
    }

    @Test
    public void isCommitBranchNotHeadTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA0");
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
        Model thingModel = QueryResults.asModel(conn.getStatements(null, null, null, thingId), MODEL_FACTORY);
        return factory.getExisting(thingId, thingModel).get();
    }
}
