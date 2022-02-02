package com.mobi.shapes.rest;

/*-
 * #%L
 * com.mobi.shapes.rest
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotEquals;
import static org.testng.Assert.assertNotNull;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.impl.SimpleShapesGraph;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class ShapesGraphRestTest extends MobiRestTestNg {
    private ShapesGraphRest rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private Repository repo;
    private OrmFactory<ShapesGraphRecord> recordFactory;
    private OrmFactory<Branch> branchFactory;
    private OrmFactory<Commit> commitFactory;
    private User user;
    private ShapesGraphRecord record;
    private Branch branch;
    private Commit commit;
    private IRI inProgressCommitId;
    private InProgressCommit inProgressCommit;
    private SimpleBNodeService bNodeService;
    private IRI branchId;
    private IRI commitId;
    private IRI recordId;
    private IRI catalogId;
    private IRI shapesGraphId;
    private Model shaclModel;
    private Difference difference;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    CatalogManager catalogManager;

    @Mock
    EngineManager engineManager;

    @Mock
    ShapesGraphManager shapesGraphManager;

    @Mock
    SesameTransformer transformer;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/branch> <http://mobi.com/ontologies/catalog#head> <http://mobi.com/commit> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Values.mobiModel(Rio.parse(stream, "", RDFFormat.TRIG));
            conn.add(shaclModel);
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));

        recordFactory = getRequiredOrmFactory(ShapesGraphRecord.class);
        branchFactory = getRequiredOrmFactory(Branch.class);
        commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);

        catalogId = vf.createIRI("http://mobi.com/catalog");
        recordId = vf.createIRI("http://mobi.com/shaclRecord1");
        shapesGraphId = vf.createIRI("http://mobi.com/shapes-graph-id");
        branchId = vf.createIRI("http://mobi.com/branch");
        commitId = vf.createIRI("http://mobi.com/commit");
        inProgressCommitId = vf.createIRI("http://mobi.com/in-progress-commit");
        inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);

        IRI titleIRI = vf.createIRI(DCTERMS.TITLE.stringValue());
        Model additions = mf.createModel();
        additions.add(catalogId, titleIRI, vf.createLiteral("Addition"));
        Model deletions = mf.createModel();
        deletions.add(catalogId, titleIRI, vf.createLiteral("Deletion"));
        difference = new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();

        record = recordFactory.createNew(recordId);
        branch = branchFactory.createNew(branchId);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));
        record.setMasterBranch(branch);
        record.setShapesGraphIRI(shapesGraphId);
        commit = commitFactory.createNew(commitId);
        branch.setHead(commit);

        MockitoAnnotations.initMocks(this);

        rest = new ShapesGraphRest();
        rest.configProvider = configProvider;
        rest.catalogManager = catalogManager;
        rest.engineManager = engineManager;
        rest.shapesGraphManager = shapesGraphManager;
        rest.transformer = transformer;
        rest.vf = vf;
        rest.mf = mf;

        bNodeService = new SimpleBNodeService();
        bNodeService.setModelFactory(mf);
        bNodeService.setValueFactory(vf);

        rest.bNodeService = bNodeService;

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UsernameTestFilter.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(catalogManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(ShapesGraphRecord.class))).thenReturn(record);
        when(catalogManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId))).thenReturn(commit);
        when(catalogManager.getCompiledResource(any(Resource.class))).thenReturn(shaclModel);
        when(catalogManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(shaclModel);
        when(catalogManager.getMasterBranch(any(), any())).thenReturn(branch);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), eq(user))).thenReturn(Optional.of(inProgressCommit));
        when(catalogManager.applyInProgressCommit(any(Resource.class), any(Model.class))).thenAnswer(i -> {
            return i.getArgumentAt(1, Model.class);
        });
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiStatement(any(org.eclipse.rdf4j.model.Statement.class))).thenAnswer(i -> {
                return Values.mobiStatement(i.getArgumentAt(0, org.eclipse.rdf4j.model.Statement.class));
        });
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> {
            return Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class));
        });
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);
    }

    @AfterMethod
    public void resetMocks() {
        reset(engineManager, configProvider, catalogManager, transformer, shapesGraphManager);
    }

    @Test
    public void uploadFileTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-shape.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        String id = getResponse(response).optString("shapesGraphId");
        assertEquals(id, shapesGraphId.stringValue());
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(catalogManager).createRecord(any(User.class), config.capture(), eq(ShapesGraphRecord.class));
        assertEquals(catalogId.stringValue(), config.getValue().get(RecordCreateSettings.CATALOG_ID));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("keyword1", "keyword2").collect(Collectors.toSet()), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(VersionedRDFRecordCreateSettings.INPUT_STREAM));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    @Test
    public void uploadErrorMobiExceptionTest() {
        Mockito.doThrow(new MobiException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-shape.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "MobiException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadErrorRDFParseExceptionTest() {
        Mockito.doThrow(new RDFParseException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-shape.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "RDFParseException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadErrorIllegalArgumentExceptionTest() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(catalogManager).createRecord(any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-shape.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadFileWithoutTitleTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-shape.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadShapesGraphFileTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileDontApplyCommitTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("applyInProgressCommit", false)
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileWithCommitIdAndMissingBranchIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(eq(commitId));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileWithBranchIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileWithBranchIdCantGetHeadCommitTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getHeadCommit(any(), any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));

        resetMocks();
        setupMocks();        
        doThrow(IllegalArgumentException.class).when(catalogManager).getHeadCommit(any(), any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileWithBranchIdCantGetCompiledResourceTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));

        resetMocks();
        setupMocks();
        doThrow(IllegalArgumentException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileOnlyRecordIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileOnlyRecordIdCantGetBranchTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getMasterBranch(any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));

        resetMocks();
        setupMocks();
        doThrow(IllegalArgumentException.class).when(catalogManager).getMasterBranch(any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileOnlyRecordIdCantGetCompiledResourceTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));

        resetMocks();
        setupMocks();
        doThrow(IllegalArgumentException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, never()).getInProgressCommit(eq(catalogId), eq(recordId), eq(user));
        verify(catalogManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class));
    }

    @Test
    public void downloadShapesGraphFileNoRecordIdTest() {
        Response response = target().path("shapes-graphs/").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 405);
    }

    @Test
    public void deleteShapesGraphRecordTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_JSON).delete();

        assertEquals(response.getStatus(), 204);
        verify(catalogManager).deleteRecord(user, recordId, ShapesGraphRecord.class);
    }

    @Test
    public void deleteShapesGraphRecordIllegalArgumentExceptionTest() {
        doThrow(IllegalArgumentException.class).when(catalogManager).deleteRecord(any(), any(), any());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_JSON).delete();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).deleteRecord(user, recordId, ShapesGraphRecord.class);
    }

    @Test
    public void deleteShapesGraphRecordIllegalStateExceptionTest() {
        doThrow(IllegalStateException.class).when(catalogManager).deleteRecord(any(), any(), any());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_JSON).delete();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).deleteRecord(user, recordId, ShapesGraphRecord.class);
    }

    @Test
    public void testUploadChangesToShapesGraph() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(shaclModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("test-shape.ttl")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/test-shape.ttl"), MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager, times(2)).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToShapesGraphWithoutBranchId() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(shaclModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        when(catalogManager.getMasterBranch(eq(catalogId), eq(recordId))).thenReturn(branch);
        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("test-shape.ttl")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/test-shape.ttl"), MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        verify(catalogManager, times(0)).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager, times(0)).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager, times(0)).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager, times(0)).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToShapesGraphWithoutCommitId() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(shaclModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        when(catalogManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId))).thenReturn(commit);
        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("test-shape.ttl")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/test-shape.ttl"), MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager, times(2)).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesToShapesGraphWithExistingInProgressCommit() {
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId), any(User.class))).thenReturn(Optional.of(inProgressCommit));

        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("search-results.json")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/search-results.json"), MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphNoDiff() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(shaclModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createModel()).deletions(mf.createModel()).build();
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("test-shape.ttl")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/test-shape.ttl"), MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.NO_CONTENT.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).getDiff(any(Model.class), any(Model.class));
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(catalogManager, never()).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any());
    }

    @Test
    public void testUploadChangesTrigToShapesGraphNoDiff() {
        when(catalogManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(shaclModel);
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createModel()).deletions(mf.createModel()).build();
        when(catalogManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        FormDataContentDisposition dispo = FormDataContentDisposition
                .name("file")
                .fileName("testShapesGraphData.trig")
                .build();
        FormDataBodyPart bodyPart = new FormDataBodyPart(dispo, getClass().getResourceAsStream("/testShapesGraphData.trig"),
                MediaType.MULTIPART_FORM_DATA_TYPE);
        fd.bodyPart(bodyPart);

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        JSONObject responseObject = getResponse(response);
        assertEquals(responseObject.get("error"), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage"), "TriG data is not supported for shapes graph upload changes.");
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testGetEntity() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithoutBranchId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        verify(catalogManager, times(0)).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager, times(0)).retrieveShapesGraph(eq(recordId), eq(branchId),
                eq(commitId));
        verify(shapesGraphSpy, times(0)).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithoutBranchOrCommitId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithoutCommitId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithExistingInProgressCommit() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommit.getResource()),
                eq(shaclModel));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetShapesGraphId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void testGetShapesGraphIdWithoutBranchId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        verify(catalogManager, times(0)).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager, times(0)).retrieveShapesGraph(eq(recordId), eq(branchId),
                eq(commitId));
    }

    @Test
    public void testGetShapesGraphIdWithoutBranchOrCommitId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
    }

    @Test
    public void testGetShapesGraphIdWithoutCommitId() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(catalogManager.getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("branchId", branchId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId),
                any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
    }

    @Test
    public void testGetShapesGraphIdWithExistingInProgressCommit() {
        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(catalogManager).getInProgressCommit(eq(catalogId), eq(recordId), any(User.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(catalogManager).applyInProgressCommit(eq(inProgressCommit.getResource()),
                eq(shaclModel));
    }

    private JSONObject getResponse(Response response) {
        return JSONObject.fromObject(response.readEntity(String.class));
    }

    private void assertGetUserFromContext() {
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }
}
