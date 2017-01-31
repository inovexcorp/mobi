package org.matonto.catalog.rest.impl;

/*-
 * #%L
 * org.matonto.catalog.rest
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.DatasetRecord;
import org.matonto.catalog.api.ontologies.mcat.DatasetRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.MappingRecord;
import org.matonto.catalog.api.ontologies.mcat.MappingRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Tag;
import org.matonto.catalog.api.ontologies.mcat.TagFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.UserBranch;
import org.matonto.catalog.api.ontologies.mcat.UserBranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anySetOf;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

public class CatalogRestImplTest extends MatontoRestTestNg {
    private CatalogRestImpl rest;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private OntologyRecordFactory ontologyRecordFactory;
    private MappingRecordFactory mappingRecordFactory;
    private DatasetRecordFactory datasetRecordFactory;
    private DistributionFactory distributionFactory;
    private VersionFactory versionFactory;
    private TagFactory tagFactory;
    private CommitFactory commitFactory;
    private InProgressCommitFactory inProgressCommitFactory;
    private BranchFactory branchFactory;
    private UserBranchFactory userBranchFactory;
    private UserFactory userFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private Catalog localCatalog;
    private Catalog distributedCatalog;
    private Record testRecord;
    private UnversionedRecord testUnversionedRecord;
    private VersionedRecord testVersionedRecord;
    private VersionedRDFRecord testVersionedRDFRecord;
    private OntologyRecord testOntologyRecord;
    private MappingRecord testMappingRecord;
    private DatasetRecord testDatasetRecord;
    private Distribution testDistribution;
    private Version testVersion;
    private Tag testTag;
    private List<Commit> testCommits;
    private InProgressCommit testInProgressCommit;
    private Branch testBranch;
    private UserBranch testUserBranch;
    private User user;
    private Model compiledResource;
    private Model compiledResourceWithChanges;
    private static final String ERROR_IRI = "http://matonto.org/error";
    private static final String LOCAL_IRI = "http://matonto.org/catalogs/local";
    private static final String DISTRIBUTED_IRI = "http://matonto.org/catalogs/distributed";
    private static final String RECORD_IRI = "http://matonto.org/records/test";
    private static final String DISTRIBUTION_IRI = "http://matonto.org/distributions/test";
    private static final String VERSION_IRI = "http://matonto.org/versions/test";
    private static final String[] COMMIT_IRIS = new String[] {
            "http://matonto.org/commits/0",
            "http://matonto.org/commits/1"
    };
    private static final String BRANCH_IRI = "http://matonto.org/branches/test";
    private static final String USER_IRI = "http://matonto.org/users/tester";

    @Mock
    CatalogManager catalogManager;

    @Mock
    EngineManager engineManager;

    @Mock
    SesameTransformer transformer;

    @Mock
    PaginatedSearchResults<Record> results;

    @Mock
    Conflict conflict;

    @Mock
    Difference difference;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        catalogFactory = new CatalogFactory();
        recordFactory = new RecordFactory();
        unversionedRecordFactory = new UnversionedRecordFactory();
        versionedRecordFactory = new VersionedRecordFactory();
        versionedRDFRecordFactory = new VersionedRDFRecordFactory();
        ontologyRecordFactory = new OntologyRecordFactory();
        mappingRecordFactory = new MappingRecordFactory();
        datasetRecordFactory = new DatasetRecordFactory();
        distributionFactory = new DistributionFactory();
        versionFactory = new VersionFactory();
        tagFactory = new TagFactory();
        commitFactory = new CommitFactory();
        inProgressCommitFactory = new InProgressCommitFactory();
        branchFactory = new BranchFactory();
        userBranchFactory = new UserBranchFactory();
        userFactory = new UserFactory();
        catalogFactory.setModelFactory(mf);
        catalogFactory.setValueFactory(vf);
        catalogFactory.setValueConverterRegistry(vcr);
        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);
        unversionedRecordFactory.setModelFactory(mf);
        unversionedRecordFactory.setValueFactory(vf);
        unversionedRecordFactory.setValueConverterRegistry(vcr);
        versionedRecordFactory.setModelFactory(mf);
        versionedRecordFactory.setValueFactory(vf);
        versionedRecordFactory.setValueConverterRegistry(vcr);
        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        mappingRecordFactory.setModelFactory(mf);
        mappingRecordFactory.setValueFactory(vf);
        mappingRecordFactory.setValueConverterRegistry(vcr);
        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        distributionFactory.setModelFactory(mf);
        distributionFactory.setValueFactory(vf);
        distributionFactory.setValueConverterRegistry(vcr);
        versionFactory.setModelFactory(mf);
        versionFactory.setValueFactory(vf);
        versionFactory.setValueConverterRegistry(vcr);
        tagFactory.setModelFactory(mf);
        tagFactory.setValueFactory(vf);
        tagFactory.setValueConverterRegistry(vcr);
        commitFactory.setModelFactory(mf);
        commitFactory.setValueFactory(vf);
        commitFactory.setValueConverterRegistry(vcr);
        inProgressCommitFactory.setModelFactory(mf);
        inProgressCommitFactory.setValueFactory(vf);
        inProgressCommitFactory.setValueConverterRegistry(vcr);
        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        userBranchFactory.setModelFactory(mf);
        userBranchFactory.setValueFactory(vf);
        userBranchFactory.setValueConverterRegistry(vcr);
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(recordFactory);
        vcr.registerValueConverter(unversionedRecordFactory);
        vcr.registerValueConverter(versionedRecordFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(mappingRecordFactory);
        vcr.registerValueConverter(datasetRecordFactory);
        vcr.registerValueConverter(distributionFactory);
        vcr.registerValueConverter(versionFactory);
        vcr.registerValueConverter(tagFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(inProgressCommitFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(userBranchFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        localCatalog = catalogFactory.createNew(vf.createIRI(LOCAL_IRI));
        distributedCatalog = catalogFactory.createNew(vf.createIRI(DISTRIBUTED_IRI));
        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());
        testInProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(COMMIT_IRIS[0]));
        testBranch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        testBranch.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testBranch.setHead(testCommits.get(0));
        testUserBranch = userBranchFactory.createNew(vf.createIRI(BRANCH_IRI));
        testDistribution = distributionFactory.createNew(vf.createIRI(DISTRIBUTION_IRI));
        testDistribution.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        testVersion.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion.setVersionedDistribution(Collections.singleton(testDistribution));
        testTag = tagFactory.createNew(vf.createIRI(VERSION_IRI));
        testTag.setCommit(testCommits.get(0));
        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        testRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testRecord.setProperty(vf.createLiteral("ID"), vf.createIRI(DCTERMS.IDENTIFIER.stringValue()));
        testUnversionedRecord = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testUnversionedRecord.setUnversionedDistribution(Collections.singleton(testDistribution));
        testVersionedRecord = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testVersionedRecord.setLatestVersion(testVersion);
        testVersionedRecord.setVersion(Collections.singleton(testVersion));
        testVersionedRDFRecord = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testVersionedRDFRecord.setMasterBranch(testBranch);
        testVersionedRDFRecord.setBranch(Collections.singleton(testBranch));
        testOntologyRecord = ontologyRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testMappingRecord = mappingRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testDatasetRecord = datasetRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        user = userFactory.createNew(vf.createIRI(USER_IRI));
        compiledResource = mf.createModel();
        compiledResourceWithChanges = mf.createModel(compiledResource);
        compiledResourceWithChanges.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()),
                vf.createLiteral("Title"));

        MockitoAnnotations.initMocks(this);
        rest = new CatalogRestImpl();
        rest.setFactory(vf);
        rest.setEngineManager(engineManager);
        rest.setTransformer(transformer);
        rest.setCatalogManager(catalogManager);
        rest.setDistributionFactory(distributionFactory);
        rest.setCommitFactory(commitFactory);
        rest.setInProgressCommitFactory(inProgressCommitFactory);
        rest.addBranchFactory(branchFactory);
        rest.addBranchFactory(userBranchFactory);
        rest.addVersionFactory(versionFactory);
        rest.addVersionFactory(tagFactory);
        rest.addRecordFactory(recordFactory);
        rest.addRecordFactory(unversionedRecordFactory);
        rest.addRecordFactory(versionedRecordFactory);
        rest.addRecordFactory(versionedRDFRecordFactory);
        rest.addRecordFactory(ontologyRecordFactory);
        rest.addRecordFactory(mappingRecordFactory);
        rest.addRecordFactory(datasetRecordFactory);


        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(catalogManager, engineManager, transformer, conflict, difference, results);

        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.matontoModel(any(org.openrdf.model.Model.class)))
                .thenAnswer(i -> Values.matontoModel(i.getArgumentAt(0, org.openrdf.model.Model.class)));

        when(results.getPage()).thenReturn(Collections.singletonList(testRecord));
        when(results.getPageNumber()).thenReturn(0);
        when(results.getPageSize()).thenReturn(10);

        when(results.getTotalSize()).thenReturn(50);
        when(catalogManager.getLocalCatalog()).thenReturn(localCatalog);
        when(catalogManager.getDistributedCatalog()).thenReturn(distributedCatalog);
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(testRecord.getResource()));
        when(catalogManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory)))
                .thenReturn(Optional.of(testRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory)))
                .thenReturn(Optional.of(testUnversionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRecordFactory)))
                .thenReturn(Optional.of(testVersionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRDFRecordFactory)))
                .thenReturn(Optional.of(testVersionedRDFRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(ontologyRecordFactory)))
                .thenReturn(Optional.of(testOntologyRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(mappingRecordFactory)))
                .thenReturn(Optional.of(testMappingRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(datasetRecordFactory)))
                .thenReturn(Optional.of(testDatasetRecord));
        when(catalogManager.createRecord(any(RecordConfig.class), eq(recordFactory))).thenReturn(testRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(unversionedRecordFactory)))
                .thenReturn(testUnversionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRecordFactory)))
                .thenReturn(testVersionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRDFRecordFactory)))
                .thenReturn(testVersionedRDFRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(ontologyRecordFactory)))
                .thenReturn(testOntologyRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(mappingRecordFactory)))
                .thenReturn(testMappingRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(datasetRecordFactory)))
                .thenReturn(testDatasetRecord);
        when(catalogManager.getDistribution(any(Resource.class))).thenReturn(Optional.of(testDistribution));
        when(catalogManager.createDistribution(any(DistributionConfig.class))).thenReturn(testDistribution);
        when(catalogManager.getVersion(any(Resource.class), eq(versionFactory))).thenReturn(Optional.of(testVersion));
        when(catalogManager.getVersion(any(Resource.class), eq(tagFactory))).thenReturn(Optional.of(testTag));
        when(catalogManager.createVersion(anyString(), anyString(), eq(versionFactory))).thenReturn(testVersion);
        when(catalogManager.createVersion(anyString(), anyString(), eq(tagFactory))).thenReturn(testTag);
        when(catalogManager.getBranch(any(Resource.class), eq(branchFactory))).thenReturn(Optional.of(testBranch));
        when(catalogManager.getBranch(any(Resource.class), eq(userBranchFactory))).thenReturn(Optional.of(testUserBranch));
        when(catalogManager.createBranch(anyString(), anyString(), eq(branchFactory))).thenReturn(testBranch);
        when(catalogManager.createBranch(anyString(), anyString(), eq(userBranchFactory))).thenReturn(testUserBranch);
        when(catalogManager.getCommit(any(Resource.class), eq(commitFactory))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(0, Resource.class);
            Commit found = null;
            for (Commit commit : testCommits) {
                if (iri.equals(commit.getResource())) {
                    found = commit;
                }
            }
            return Optional.ofNullable(found);
        });
        when(catalogManager.getCommit(any(Resource.class), eq(inProgressCommitFactory)))
                .thenReturn(Optional.of(testInProgressCommit));
        when(catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.of(testInProgressCommit.getResource()));
        when(catalogManager.getConflicts(any(Resource.class), any(Resource.class))).thenReturn(Collections.singleton(conflict));
        when(catalogManager.getCommitChain(any(Resource.class)))
                .thenReturn(Arrays.stream(COMMIT_IRIS).map(vf::createIRI).collect(Collectors.toList()));
        when(catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))
                .thenReturn(Optional.of(testInProgressCommit.getResource()));
        when(catalogManager.createCommit(any(InProgressCommit.class), anySetOf(Commit.class), anyString())).thenReturn(testCommits.get(0));
        when(catalogManager.getCompiledResource(any(Resource.class))).thenReturn(Optional.of(compiledResource));
        when(catalogManager.applyInProgressCommit(any(Resource.class), any(Model.class))).thenReturn(compiledResourceWithChanges);
        when(catalogManager.createInProgressCommit(any(User.class), any(Resource.class))).thenReturn(testInProgressCommit);
        when(catalogManager.getCommitDifference(any(Resource.class))).thenReturn(difference);

        when(conflict.getOriginal()).thenReturn(mf.createModel());
        when(conflict.getLeftDifference()).thenReturn(difference);
        when(conflict.getRightDifference()).thenReturn(difference);

        when(difference.getAdditions()).thenReturn(mf.createModel());
        when(difference.getDeletions()).thenReturn(mf.createModel());

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
    }

    // GET catalogs

    @Test
    public void getCatalogsWithoutTypeTest() {
        Response response = target().path("catalogs").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getLocalCatalog();
        verify(catalogManager).getDistributedCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 2);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "local").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager, atLeastOnce()).getLocalCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), LOCAL_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("catalogs").queryParam("type", "distributed").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager, atLeastOnce()).getDistributedCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), DISTRIBUTED_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithBadTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "error").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 0);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getLocalCatalog();

        Response response = target().path("catalogs").request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}

    @Test
    public void getCatalogTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI)).request().get();
        assertEquals(response.getStatus(), 200);
        assertResponseIsObjectWithId(response, LOCAL_IRI);

        response = target().path("catalogs/" + encode(DISTRIBUTED_IRI)).request().get();
        assertEquals(response.getStatus(), 200);
        assertResponseIsObjectWithId(response, DISTRIBUTED_IRI);
    }

    @Test
    public void getCatalogThatDoesNotExistTest() {
        Response response = target().path("catalogs/" + encode(ERROR_IRI)).request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getCatalogWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getLocalCatalog();

        Response response = target().path("catalogs/" + encode(LOCAL_IRI)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records

    @Test
    public void getRecordsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("type", Record.TYPE)
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("searchText", "test").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + results.getTotalSize());
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), results.getPage().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithLinksTest() {
        // Setup:
        when(results.getPageNumber()).thenReturn(1);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
                assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records"));
                assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
            });
    }

    @Test
    public void getRecordsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getRecordsWithNegativeOffsetTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "-1").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getRecordsWithNonPositiveLimitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "-1").request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "0").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getRecordsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records

    @Test
    public void createRecordTest() {
        testCreateRecordByType(recordFactory);
    }

    @Test
    public void createUnversionedRecordTest() {
        testCreateRecordByType(unversionedRecordFactory);
    }

    @Test
    public void createVersionedRecordTest() {
        testCreateRecordByType(versionedRecordFactory);
    }

    @Test
    public void createVersionedRDFRecordTest() {
        testCreateRecordByType(versionedRDFRecordFactory);
        verify(catalogManager).addMasterBranch(any(Resource.class));
    }

    @Test
    public void createOntologyRecordTest() {
        testCreateRecordByType(ontologyRecordFactory);
        verify(catalogManager).addMasterBranch(any(Resource.class));
    }

    @Test
    public void createMappingRecordTest() {
        testCreateRecordByType(mappingRecordFactory);
        verify(catalogManager).addMasterBranch(any(Resource.class));
    }

    @Test
    public void createDatasetRecordTest() {
        testCreateRecordByType(datasetRecordFactory);
        verify(catalogManager).addMasterBranch(any(Resource.class));
    }

    @Test
    public void createRecordWithoutTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Record.TYPE);
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithoutIdentifierTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Record.TYPE);
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithInvalidTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Record.TYPE);
        fd.field("title", "Title");
        fd.field("identifier", "Id");
        doThrow(new MatOntoException()).when(catalogManager).addRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}

    @Test
    public void getRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory);
        assertResponseIsObjectWithId(response, RECORD_IRI);
    }

    @Test
    public void getRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), any(OrmFactory.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getRecord(any(Resource.class), any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}

    @Test
    public void removeRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeRecord(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}

    @Test
    public void updateRecordTest() {
        //Setup:
        JSONObject record = new JSONObject().element("@id", RECORD_IRI)
                .element("@type", new JSONArray().element(Record.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class));
    }

    @Test
    public void updateRecordWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordThatDoesNotMatchTest() {
        //Setup:
        JSONObject record = new JSONObject().element("@id", ERROR_IRI)
                .element("@type", new JSONArray().element(Record.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordWithErrorTest() {
        // Setup:
        JSONObject record = new JSONObject().element("@id", RECORD_IRI)
                .element("@type", new JSONArray().element(Record.TYPE));
        doThrow(new MatOntoException()).when(catalogManager).updateRecord(any(Resource.class), any(Record.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/distributions

    @Test
    public void getUnversionedDistributionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        verify(catalogManager, atLeastOnce()).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUnversionedDistributionsWithLinksTest() {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        record.setUnversionedDistribution(distributions);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory)))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        distributions.forEach(distribution -> verify(catalogManager).getDistribution(distribution.getResource()));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/"
                    + encode(RECORD_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getUnversionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedRecordsWithNegativeOffsetTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "-1").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedRecordsWithNonPositiveLimitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "-1").request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "0").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedRecordsWithOffsetThatIsTooLargeTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "100").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionsFromRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getDistribution(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/distributions

    @Test
    public void createUnversionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), DISTRIBUTION_IRI);
        verify(catalogManager).createDistribution(any(DistributionConfig.class));
        verify(catalogManager).addDistributionToUnversionedRecord(any(Distribution.class), eq(vf.createIRI(RECORD_IRI)));
    }

    @Test
    public void createUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory))
                .thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUnversionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUnversionedDistributionWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        doThrow(new MatOntoException()).when(catalogManager).createDistribution(any(DistributionConfig.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void getUnversionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        verify(catalogManager).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        assertResponseIsObjectWithId(response, DISTRIBUTION_IRI);
    }

    @Test
    public void getUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionForIncorrectRecordTest() {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getDistribution(vf.createIRI(DISTRIBUTION_IRI))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getUnversionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getDistribution(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTED_IRI)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void removeUnversionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeDistributionFromUnversionedRecord(vf.createIRI(DISTRIBUTION_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeUnversionedDistributionFromIncorrectCatalogTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeUnversionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager)
                .removeDistributionFromUnversionedRecord(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void updateUnversionedDistributionTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI)
                .element("@type", new JSONArray().element(Distribution.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateDistribution(any(Distribution.class));
    }

    @Test
    public void updateUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionForIncorrectRecordTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionThatDoesNotMatchTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionWithErrorTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        doThrow(new MatOntoException()).when(catalogManager).updateDistribution(any(Distribution.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI)).request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions

    @Test
    public void getVersionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager, atLeastOnce()).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionsWithLinksTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        Set<Version> versions = IntStream.range(1, 6)
                .mapToObj(i -> VERSION_IRI + i)
                .map(s -> versionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        record.setVersion(versions);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRecordFactory)))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        versions.forEach(version -> verify(catalogManager).getVersion(version.getResource(), versionFactory));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/"
                    + encode(RECORD_IRI) + "/versions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsWithNegativeOffsetTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "-1").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsWithNonPositiveLimitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "-1").request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "0").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsWithOffsetThatIsTooLargeTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "100").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsFromRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getVersion(any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/versions

    @Test
    public void createVersionTest() {
        testCreateVersionByType(versionFactory);
    }

    @Test
    public void createTagTest() {
        testCreateVersionByType(tagFactory);
    }

    @Test
    public void createVersionWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionWithInvalidTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionWithErrorTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);
        fd.field("title", "Title");
        doThrow(new MatOntoException()).when(catalogManager).createVersion(anyString(), anyString(), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/latest

    @Test
    public void getLatestVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        assertResponseIsObjectWithId(response, VERSION_IRI);
    }

    @Test
    public void getLatestVersionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getLatestVersionForRecordWithoutOneTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getLatestVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(any(Resource.class), eq(versionFactory))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getLatestVersionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getVersion(any(Resource.class), eq(versionFactory));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void getVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        assertResponseIsObjectWithId(response, VERSION_IRI);
    }

    @Test
    public void getVersionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(VERSION_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getVersionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void removeVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeVersion(vf.createIRI(VERSION_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeVersionFromIncorrectCatalogTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeVersion(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void updateVersionTest() {
        //Setup:
        JSONObject version = new JSONObject().element("@id", VERSION_IRI)
                .element("@type", new JSONArray().element(Version.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateVersion(any(Version.class));
    }

    @Test
    public void updateVersionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionThatDoesNotMatchTest() {
        //Setup:
        JSONObject version = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionWithErrorTest() {
        //Setup:
        JSONObject version = new JSONObject().element("@id", VERSION_IRI);
        doThrow(new MatOntoException()).when(catalogManager).updateVersion(any(Version.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions

    @Test
    public void getVersionedDistributionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        verify(catalogManager, atLeastOnce()).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionedDistributionsWithLinksTest() {
        // Setup:
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        Version version = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        version.setVersionedDistribution(distributions);
        when(catalogManager.getVersion(vf.createIRI(VERSION_IRI), versionFactory)).thenReturn(Optional.of(version));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        distributions.forEach(distribution -> verify(catalogManager).getDistribution(distribution.getResource()));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/"
                    + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsWithNegativeOffsetTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "-1").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsWithNonPositiveLimitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "-1").request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "0").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsWithOffsetThatIsTooLargeTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "100").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsFromRecordThatDoesNotExist() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsFromVersionThatDoesNotExist() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(LOCAL_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getDistribution(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions

    @Test
    public void createVersionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), DISTRIBUTION_IRI);
        verify(catalogManager).createDistribution(any(DistributionConfig.class));
        verify(catalogManager).addDistributionToVersion(any(Distribution.class), eq(vf.createIRI(VERSION_IRI)));
    }

    @Test
    public void createVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "Description");
        doThrow(new MatOntoException()).when(catalogManager).createDistribution(any(DistributionConfig.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void getVersionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        verify(catalogManager).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        assertResponseIsObjectWithId(response, DISTRIBUTION_IRI);
    }

    @Test
    public void getVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(ERROR_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForIncorrectVersionTest() {
        // Setup:
        Version version = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        when(catalogManager.getVersion(vf.createIRI(VERSION_IRI), versionFactory)).thenReturn(Optional.of(version));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getDistribution(vf.createIRI(DISTRIBUTION_IRI))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getVersionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getDistribution(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTED_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void removeVersionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeDistributionFromVersion(vf.createIRI(DISTRIBUTION_IRI), vf.createIRI(VERSION_IRI));
    }

    @Test
    public void removeVersionedDistributionFromRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionedDistributionFromIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager)
                .removeDistributionFromVersion(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void updateVersionedDistributionTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI)
                .element("@type", new JSONArray().element(Distribution.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateDistribution(any(Distribution.class));
    }

    @Test
    public void updateVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionThatDoesNotMatchTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionWithErrorTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        doThrow(new MatOntoException()).when(catalogManager).updateDistribution(any(Distribution.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/commit

    @Test
    public void getVersionCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), tagFactory);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("commit"));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            JSONObject commit = result.getJSONObject("commit");
            assertTrue(commit.containsKey("@id"));
            assertEquals(commit.getString("@id"), COMMIT_IRIS[0]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionCommitForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionCommitForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionCommitForVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(ERROR_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionCommitForIncorrectVersionTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionCommitThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getCommit(any(Resource.class), eq(commitFactory))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getVersionCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getVersion(any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches

    @Test
    public void getBranchesTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory);
        verify(catalogManager, atLeastOnce()).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getBranchesWithLinksTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        Set<Branch> branches = IntStream.range(1, 6)
                .mapToObj(i -> BRANCH_IRI + i)
                .map(s -> branchFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        record.setBranch(branches);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRDFRecordFactory)))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory);
        branches.forEach(branch -> verify(catalogManager).getBranch(branch.getResource(), branchFactory));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/"
                    + encode(RECORD_IRI) + "/branches"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getBranchesWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchesWithNegativeOffsetTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "-1").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchesWithNonPositiveLimitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "-1").request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", "0").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchesWithOffsetThatIsTooLargeTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", "100").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchesFromRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchesWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getBranch(any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches

    @Test
    public void createBranchTest() {
        testCreateBranchByType(branchFactory);
    }

    @Test
    public void createUserBranchTest() {
        testCreateBranchByType(userBranchFactory);
    }

    @Test
    public void createBranchWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchWithInvalidTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchWithErrorTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);
        fd.field("title", "Title");
        doThrow(new MatOntoException()).when(catalogManager).createBranch(anyString(), anyString(), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/master

    @Test
    public void getMasterBranchTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory);
        verify(catalogManager).getBranch(any(Resource.class), eq(branchFactory));
        assertResponseIsObjectWithId(response, BRANCH_IRI);
    }

    @Test
    public void getMasterBranchForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/branches/master")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getMasterBranchForRecordWithoutOneTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getMasterBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(any(Resource.class), eq(branchFactory))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getMasterBranchWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getBranch(any(Resource.class), eq(branchFactory));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void getBranchTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory);
        verify(catalogManager).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);
        assertResponseIsObjectWithId(response, BRANCH_IRI);
    }

    @Test
    public void getBranchForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getBranchWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void removeBranchTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeBranch(vf.createIRI(BRANCH_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeBranchFromIncorrectCatalogTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeBranchWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeBranch(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void updateBranchTest() {
        //Setup:
        JSONObject branch = new JSONObject().element("@id", BRANCH_IRI)
                .element("@type", new JSONArray().element(Branch.TYPE));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateBranch(any(Branch.class));
    }

    @Test
    public void updateBranchWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateBranchThatDoesNotMatchTest() {
        //Setup:
        JSONObject branch = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateBranchWithErrorTest() {
        //Setup:
        JSONObject branch = new JSONObject().element("@id", BRANCH_IRI);
        doThrow(new MatOntoException()).when(catalogManager).updateBranch(any(Branch.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits

    @Test
    public void getCommitChainTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);
        verify(catalogManager).getCommitChain(any(Resource.class));
        Arrays.stream(COMMIT_IRIS).forEach(commitIRI -> verify(catalogManager).getCommit(vf.createIRI(commitIRI), commitFactory));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), COMMIT_IRIS.length);
            for (Object aResult : result) {
                JSONArray.fromObject(aResult).forEach(o -> {
                        boolean matchingCommit = false;
                        for (Object object : JSONArray.fromObject(aResult)) {
                            JSONObject commitObj = JSONObject.fromObject(object);
                            if (commitObj.containsKey("@id") && Arrays.asList(COMMIT_IRIS).contains(commitObj.getString("@id"))) {
                                matchingCommit = true;
                            }
                        }
                        assertTrue(matchingCommit);
                    });
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitChainForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitChainForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitChainForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitChainForHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitChainWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getCommitChain(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits

    @Test
    public void createBranchCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), COMMIT_IRIS[0]);
        verify(catalogManager).getInProgressCommitIRI(vf.createIRI(USER_IRI), vf.createIRI(RECORD_IRI));
        verify(catalogManager).getCommit(testInProgressCommit.getResource(), inProgressCommitFactory);
        verify(catalogManager).removeInProgressCommit(testInProgressCommit.getResource());
        verify(catalogManager).createCommit(eq(testInProgressCommit), anySetOf(Commit.class), eq("Message"));
        verify(catalogManager).addCommitToBranch(any(Commit.class), eq(vf.createIRI(BRANCH_IRI)));
    }

    @Test
    public void createBranchCommitForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchCommitForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchCommitForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void createBranchCommitForUserWithNoInProgressCommitTest() {
        // Setup:
        when(catalogManager.getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI))))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchCommitWithInProgressCommitThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getCommit(testInProgressCommit.getResource(), inProgressCommitFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createBranchCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeInProgressCommit(testInProgressCommit.getResource());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/head

    @Test
    public void getHeadTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);
        verify(catalogManager).getCommit(any(Resource.class), eq(commitFactory));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("commit"));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            JSONObject commit = result.getJSONObject("commit");
            assertTrue(commit.containsKey("@id"));
            assertEquals(commit.getString("@id"), COMMIT_IRIS[0]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getHeadForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getHeadForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getHeadForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getHeadForBranchWithNoHeadTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getHeadThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getCommit(any(Resource.class), eq(commitFactory))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getHeadWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getCommit(any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}

    @Test
    public void getBranchCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getBranch(vf.createIRI(BRANCH_IRI), branchFactory);
        verify(catalogManager).getCommitChain(any(Resource.class));
        verify(catalogManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), commitFactory);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("commit"));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            JSONObject commit = result.getJSONObject("commit");
            assertTrue(commit.containsKey("@id"));
            assertEquals(commit.getString("@id"), COMMIT_IRIS[1]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getBranchCommitForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchCommitForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchCommitForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchCommitForHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchCommitNotInBranchTest() {
        // Setup
        when(catalogManager.getCommitChain(any(Resource.class))).thenReturn(Collections.emptyList());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getBranchCommitThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getCommit(vf.createIRI(COMMIT_IRIS[1]), commitFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getBranchCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getCommit(any(Resource.class), any(OrmFactory.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts

    @Test
    public void getConflictsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getConflicts(vf.createIRI(COMMIT_IRIS[0]), vf.createIRI(COMMIT_IRIS[0]));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject outcome = JSONObject.fromObject(result.get(0));
            assertTrue(outcome.containsKey("original"));
            assertTrue(outcome.containsKey("left"));
            assertTrue(outcome.containsKey("right"));
            JSONObject left = JSONObject.fromObject(outcome.get("left"));
            JSONObject right = JSONObject.fromObject(outcome.get("right"));
            assertTrue(left.containsKey("additions"));
            assertTrue(left.containsKey("deletions"));
            assertTrue(right.containsKey("additions"));
            assertTrue(right.containsKey("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getConflictsForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsForSourceBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsForTargetBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", ERROR_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsForSourceHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(ERROR_IRI));
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsForTargetHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(ERROR_IRI));
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", ERROR_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getConflictsWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).getConflicts(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts/resolution

    @Test
    public void mergeTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        JSONArray deletes = new JSONArray();
        deletes.add(new JSONObject().element("@id", "http://example.com/delete").element("@type", new JSONArray().element("http://example.com/Delete")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        fd.field("deletions", deletes.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), COMMIT_IRIS[0]);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).createInProgressCommit(any(User.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).addInProgressCommit(testInProgressCommit);
        verify(catalogManager).addAdditions(any(Model.class), any(Resource.class));
        verify(catalogManager).addDeletions(any(Model.class), any(Resource.class));
        verify(catalogManager).removeInProgressCommit(any(Resource.class));
        verify(catalogManager).createCommit(eq(testInProgressCommit), anySetOf(Commit.class), anyString());
        verify(catalogManager).addCommitToBranch(any(Commit.class), eq(vf.createIRI(BRANCH_IRI)));
    }

    @Test
    public void mergeForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForSourceBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForTargetBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", ERROR_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForSourceHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(ERROR_IRI));
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.of(branch));
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForTargetHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(ERROR_IRI));
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.of(branch));
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", ERROR_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void mergeForUserWithAnInProgressCommitTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mergeWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeInProgressCommit(any(Resource.class));
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource

    @Test
    public void getCompiledResourceAsJsonldTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "jsonld").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceAsTurtleTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "turtle").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceAsRdfxmlTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "rdf/xml").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceApplyInProgressCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        verify(catalogManager).applyInProgressCommit(any(Resource.class), any(Model.class));
    }

    @Test
    public void getCompiledResourceForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCompiledResourceForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCompiledResourceForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCompiledResourceForHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCompiledResourceForCommitNotInBranchTest() {
        // Setup:
        when(catalogManager.getCommitChain(any(Resource.class))).thenReturn(Collections.emptyList());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCompiledResourceWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getCompiledResource(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // GET (download) catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource

    @Test
    public void downloadCompiledResourceAsJsonldTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "jsonld").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        assertTrue(response.getHeaderString("Content-Disposition").contains(RECORD_IRI));
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceAsTurtleTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "turtle").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        assertTrue(response.getHeaderString("Content-Disposition").contains(RECORD_IRI));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceAsRdfxmlTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "rdf/xml").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 200);
        assertTrue(response.getHeaderString("Content-Disposition").contains(RECORD_IRI));
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceApplyInProgressCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]));
        verify(catalogManager).applyInProgressCommit(any(Resource.class), any(Model.class));
    }

    @Test
    public void downloadCompiledResourceForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadCompiledResourceForIncorrectRecordTest() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadCompiledResourceForBranchThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getBranch(vf.createIRI(ERROR_IRI), branchFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadCompiledResourceForHeadThatDoesNotExistTest() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        when(catalogManager.getBranch(vf.createIRI(BRANCH_IRI), branchFactory)).thenReturn(Optional.of(branch));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadCompiledResourceForCommitNotInBranchTest() {
        // Setup:
        when(catalogManager.getCommitChain(any(Resource.class))).thenReturn(Collections.emptyList());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadCompiledResourceWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).getCompiledResource(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(response.getStatus(), 400);
    }

    // POST catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void createInProgressCommitTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).createInProgressCommit(any(User.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).addInProgressCommit(testInProgressCommit);
    }

    @Test
    public void createInProgressCommitForRecordThatDoesNotExistTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRDFRecordFactory))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void createInProgressCommitThatAlreadyExistsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(catalogManager).createInProgressCommit(any(User.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    // GET catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void getInProgressCommitInJsonldTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "jsonld").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).getCommitDifference(any(Resource.class));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            isJsonld(result.getString("additions"));
            isJsonld(result.getString("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getInProgressCommitInTurtleTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "turtle").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).getCommitDifference(any(Resource.class));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            notJsonld(result.getString("additions"));
            notJsonld(result.getString("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getInProgressCommitInRdfxmlTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "rdf/xml").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).getCommitDifference(any(Resource.class));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            notJsonld(result.getString("additions"));
            notJsonld(result.getString("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getInProgressCommitForCatalogThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void getInProgressCommitThatDoesNotExistTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).getCommitDifference(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void removeInProgressCommitTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).removeInProgressCommit(any(Resource.class));
    }

    @Test
    public void removeInProgressCommitForCatalogThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void removeInProgressCommitThatDoesNotExistTest() {
        // Setup:
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeInProgressCommit(any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    // PUT catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void updateInProgressCommitTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        JSONArray deletes = new JSONArray();
        deletes.add(new JSONObject().element("@id", "http://example.com/delete").element("@type", new JSONArray().element("http://example.com/Delete")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        fd.field("deletions", deletes.toString());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getInProgressCommitIRI(any(Resource.class), eq(vf.createIRI(RECORD_IRI)));
        verify(catalogManager).addAdditions(any(Model.class), any(Resource.class));
        verify(catalogManager).addDeletions(any(Model.class), any(Resource.class));
    }

    @Test
    public void updateInProgressCommitForCatalogThatDoesNotExistTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void updateInProgressCommitThatDoesNotExistTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        when((catalogManager.getInProgressCommitIRI(any(Resource.class), any(Resource.class)))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInProgressCommitWithErrorTest() {
        // Setup:
        JSONArray adds = new JSONArray();
        adds.add(new JSONObject().element("@id", "http://example.com/add").element("@type", new JSONArray().element("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        doThrow(new MatOntoException()).when(catalogManager).addAdditions(any(Model.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getRecordTypesTest() {
        Response response = target().path("catalogs/record-types").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray array = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(array.size(), 7);
            assertTrue(array.contains(recordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(unversionedRecordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(versionedRecordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(versionedRDFRecordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(ontologyRecordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(mappingRecordFactory.getTypeIRI().stringValue()));
            assertTrue(array.contains(datasetRecordFactory.getTypeIRI().stringValue()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getSortOptionsTest() {
        Response response = target().path("catalogs/sort-options").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray array = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(array.size(), 3);
            assertTrue(array.contains(DCTERMS.TITLE.stringValue()));
            assertTrue(array.contains(DCTERMS.MODIFIED.stringValue()));
            assertTrue(array.contains(DCTERMS.ISSUED.stringValue()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private <T extends Record> void testCreateRecordByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("identifier", "Id");
        fd.field("description", "Description");
        fd.field("keywords", "keyword");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), RECORD_IRI);
        verify(catalogManager).createRecord(any(RecordConfig.class), eq(ormFactory));
        verify(catalogManager).addRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class));
    }

    private <T extends Version> void testCreateVersionByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), VERSION_IRI);
        verify(catalogManager).createVersion(anyString(), anyString(), eq(ormFactory));
        verify(catalogManager).addVersion(any(Version.class), eq(vf.createIRI(RECORD_IRI)));
    }

    private <T extends Branch> void testCreateBranchByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), BRANCH_IRI);
        verify(catalogManager).createBranch(anyString(), anyString(), eq(ormFactory));
        verify(catalogManager).addBranch(any(Branch.class), eq(vf.createIRI(RECORD_IRI)));
    }

    private void isJsonld(String body) {
        try {
            JSONArray result = JSONArray.fromObject(body);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void notJsonld(String body) {
        try {
            JSONArray result = JSONArray.fromObject(body);
            fail();
        } catch (Exception e) {
            System.out.println("Format is not JSON-LD, as expected");
        }
    }

    private void assertResponseIsObjectWithId(Response response, String id) {
        try {
            JSONObject record = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(record.containsKey("@id"));
            assertEquals(record.getString("@id"), id);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }
}
