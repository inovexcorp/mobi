package com.mobi.shapes.rest;

/*-
 * #%L
 * com.mobi.shapes.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
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
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.impl.SimpleShapesGraph;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class ShapesGraphRestTest extends MobiRestTestCXF {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static ShapesGraphRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static MemoryRepositoryWrapper repo;
    private static CatalogConfigProvider configProvider;
    private static DifferenceManager differenceManager;
    private static CommitManager commitManager;
    private static BranchManager branchManager;
    private static RecordManager recordManager;
    private static CompiledResourceManager compiledResourceManager;
    private static EngineManager engineManager;
    private static SimpleBNodeService bNodeService;
    private static ShapesGraphManager shapesGraphManager;
    private static PDP pdp;
    private static Request request;
    private static com.mobi.security.policy.api.Response response;
    private static OrmFactory<ShapesGraphRecord> recordFactory;
    private static OrmFactory<Branch> branchFactory;
    private static OrmFactory<Commit> commitFactory;

    private static User user;
    private static ShapesGraphRecord record;
    private static Branch branch;
    private static Commit commit;
    private static IRI inProgressCommitId;
    private static InProgressCommit inProgressCommit;
    private static IRI branchId;
    private static IRI commitId;
    private static IRI recordId;
    private static IRI catalogId;
    private static IRI shapesGraphId;
    private static Model shaclModel;
    private static Difference difference;
    private static ShapesGraph shapesGraph;
    private static ShapesGraph shapesGraphSpy;

    @BeforeClass
    public static void startServer() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        engineManager = mock(EngineManager.class) ;
        configProvider = mock(CatalogConfigProvider.class);
        differenceManager = mock(DifferenceManager.class);
        commitManager = mock(CommitManager.class);
        branchManager = mock(BranchManager.class);
        recordManager = mock(RecordManager.class);
        compiledResourceManager = mock(CompiledResourceManager.class);
        shapesGraphManager = mock(ShapesGraphManager.class);
        pdp = mock(PDP.class);
        request = mock(Request.class);
        response = mock(com.mobi.security.policy.api.Response.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/branch> <http://mobi.com/ontologies/catalog#head> <http://mobi.com/commit> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);
            conn.add(shaclModel);
        }

        shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        shapesGraphSpy = Mockito.spy(shapesGraph);

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
        Model additions = mf.createEmptyModel();
        additions.add(catalogId, titleIRI, vf.createLiteral("Addition"));
        Model deletions = mf.createEmptyModel();
        deletions.add(catalogId, titleIRI, vf.createLiteral("Deletion"));
        difference = new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();

        record = recordFactory.createNew(recordId);
        branch = branchFactory.createNew(branchId);
        record.setMasterBranch(branch);
        record.setShapesGraphIRI(shapesGraphId);
        commit = commitFactory.createNew(commitId);
        branch.setHead(commit);

        rest = new ShapesGraphRest();
        rest.configProvider = configProvider;
        rest.differenceManager = differenceManager;
        rest.commitManager = commitManager;
        rest.branchManager = branchManager;
        rest.recordManager = recordManager;
        rest.compiledResourceManager = compiledResourceManager;
        rest.engineManager = engineManager;
        rest.shapesGraphManager = shapesGraphManager;
        rest.pdp = pdp;

        bNodeService = new SimpleBNodeService();
        rest.bNodeService = bNodeService;

        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Before
    public void setupMocks() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(ShapesGraphRecord.class), any(RepositoryConnection.class))).thenReturn(record);
        when(commitManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(branchManager.getMasterBranch(any(), any(), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);
        when(commitManager.getInProgressCommitOpt(any(Resource.class), any(Resource.class), eq(user), any(RepositoryConnection.class))).thenReturn(Optional.of(inProgressCommit));
        when(differenceManager.applyInProgressCommit(any(Resource.class), any(Model.class), any(RepositoryConnection.class))).thenAnswer(i -> i.getArgument(1, Model.class));

        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any(), any(IRI.class))).thenReturn(response);
    }

    @After
    public void resetMocks() {
        reset(engineManager, configProvider, differenceManager, commitManager, branchManager, recordManager,
                compiledResourceManager,  shapesGraphManager, shapesGraphSpy);
    }

    @Test
    public void uploadFileTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        String id = getResponse(response).get("shapesGraphId").asText();
        assertEquals(id, shapesGraphId.stringValue());
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), eq(ShapesGraphRecord.class), any(RepositoryConnection.class));
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
        Mockito.doThrow(new MobiException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadErrorRDFParseExceptionTest() {
        Mockito.doThrow(new RDFParseException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        ObjectNode responseObject = getResponse(response);
        assertEquals("RDFParseException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadErrorIllegalArgumentExceptionTest() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(), any(RepositoryConnection.class));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        ObjectNode responseObject = getResponse(response);
        assertEquals("IllegalArgumentException", responseObject.get("error").asText());
        assertEquals("I'm an exception!", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void uploadFileWithoutTitleTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("shapes-graphs").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadShapesGraphFileTest() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void downloadShapesGraphFileDontApplyCommitTest() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .queryParam("applyInProgressCommit", false)
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(commitManager, never()).getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class));
        verify(differenceManager, never()).applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class) );
    }

    @Test
    public void downloadShapesGraphFileWithCommitIdAndMissingBranchIdTest() {
        when(shapesGraphManager.retrieveShapesGraphByCommit(eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(shapesGraphManager).retrieveShapesGraphByCommit(eq(commitId));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void downloadShapesGraphFileWithBranchIdTest() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void downloadShapesGraphFileOnlyRecordIdTest() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), eq(user), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommitId), any(Model.class), any(RepositoryConnection.class));
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
        verify(recordManager).removeRecord(eq(catalogId), eq(recordId), eq(user), eq(ShapesGraphRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void deleteShapesGraphRecordIllegalArgumentExceptionTest() {
        doThrow(IllegalArgumentException.class).when(recordManager).removeRecord(any(), any(), any(), any(), any(RepositoryConnection.class));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_JSON).delete();

        assertEquals(response.getStatus(), 400);
        verify(recordManager).removeRecord(eq(catalogId), eq(recordId), eq(user), eq(ShapesGraphRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void deleteShapesGraphRecordIllegalStateExceptionTest() {
        doThrow(IllegalStateException.class).when(recordManager).removeRecord(any(), any(), any(), any(), any(RepositoryConnection.class));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_JSON).delete();

        assertEquals(response.getStatus(), 500);
        verify(recordManager).removeRecord(eq(catalogId), eq(recordId), eq(user), eq(ShapesGraphRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToShapesGraphFile() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager, times(2)).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToShapesGraphJsonld() throws Exception {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        RDFParser parser = Rio.createParser(RDFFormat.TURTLE);
        RDFWriter writer = Rio.createWriter(RDFFormat.JSONLD, out);
        parser.setRDFHandler(writer);
        parser.parse(Objects.requireNonNull(getClass().getResourceAsStream("/test-shape.ttl")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("json", out.toString());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager, times(2)).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToShapesGraphFileJsonld() throws Exception {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));
        fd.field("json", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-shape.ttl")),
                StandardCharsets.UTF_8));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphReplaceInProgressCommit() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .queryParam("replaceInProgressCommit", "true")
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.INTERNAL_SERVER_ERROR.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphWithoutBranchId() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(branchManager.getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class))).thenReturn(branch);
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphWithoutBranchIdNoPermission() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(branchManager.getMasterBranch(eq(catalogId), eq(recordId), any(RepositoryConnection.class))).thenReturn(branch);
        when(response.getDecision()).thenReturn(Decision.DENY);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.UNAUTHORIZED.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphWithoutCommitId() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(commitManager.getHeadCommit(eq(catalogId), eq(recordId), eq(branchId), any(RepositoryConnection.class))).thenReturn(commit);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager, times(2)).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesToShapesGraphWithExistingInProgressCommit() {
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.of(inProgressCommit));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "search-results.json", getClass().getResourceAsStream("/search-results.json"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
    }

    @Test
    public void testUploadChangesToShapesGraphNoDiff() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-shape.ttl", getClass().getResourceAsStream("/test-shape.ttl"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.NO_CONTENT.getStatusCode());
        assertGetUserFromContext();
        verify(compiledResourceManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class));
        verify(differenceManager).getDiff(any(Model.class), any(Model.class));
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(commitManager, never()).updateInProgressCommit(eq(catalogId), eq(recordId), any(IRI.class), any(), any(), any(RepositoryConnection.class));
    }

    @Test
    public void testUploadChangesTrigToShapesGraphNoDiff() {
        when(compiledResourceManager.getCompiledResource(eq(recordId), eq(branchId), eq(commitId), any(RepositoryConnection.class)))
                .thenReturn(shaclModel);
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        Difference difference = new Difference.Builder().additions(mf.createEmptyModel()).deletions(mf.createEmptyModel()).build();
        when(differenceManager.getDiff(any(Model.class), any(Model.class))).thenReturn(difference);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "testShapesGraphData.trig", getClass().getResourceAsStream("/testShapesGraphData.trig"));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), Response.Status.BAD_REQUEST.getStatusCode());
        ObjectNode responseObject = getResponse(response);
        assertEquals("IllegalArgumentException", responseObject.get("error").asText());
        assertEquals("TriG data is not supported for shapes graph upload changes.", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void testGetEntity() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithCommitId() {
        when(shapesGraphManager.retrieveShapesGraphByCommit(eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraphByCommit(eq(commitId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithoutBranchOrCommitId() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithoutCommitId() {
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/entities/"
                        + encode("urn:test"))
                .queryParam("branchId", branchId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetEntityWithExistingInProgressCommit() {
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
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommit.getResource()),
                eq(shaclModel), any(RepositoryConnection.class));
        verify(shapesGraphSpy).getEntity(vf.createIRI("urn:test"));
    }

    @Test
    public void testGetShapesGraphId() {
        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void testGetShapesGraphIdWithCommitId() {
        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraphByCommit(eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraphByCommit(eq(commitId));
    }

    @Test
    public void testGetShapesGraphIdWithoutBranchOrCommitId() {
        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
    }

    @Test
    public void testGetShapesGraphIdWithoutCommitId() {
        when(shapesGraphSpy.getShapesGraphId()).thenReturn(Optional.of(getValueFactory().createIRI("urn:test")));
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/id")
                .queryParam("branchId", branchId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
    }

    @Test
    public void testGetShapesGraphIdWithExistingInProgressCommit() {
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
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommit.getResource()),
                eq(shaclModel), any(RepositoryConnection.class));
    }

    @Test
    public void testGetShapesGraphContent() throws IOException {
        Model shaclModel;
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/blah> a <http://www.w3.org/2002/07/owl#Ontology> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);

            conn.add(shaclModel);
        }
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);

        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/content")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(shapesGraphSpy).serializeShapesGraph("turtle");
    }

    @Test
    public void testGetShapesGraphContentWithoutBranchId() throws IOException {
        Model shaclModel;
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/blah> a <http://www.w3.org/2002/07/owl#Ontology> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);

            conn.add(shaclModel);
        }
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);

        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraphByCommit(eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/content")
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraphByCommit(eq(commitId));
    }

    @Test
    public void testGetShapesGraphContentWithoutBranchOrCommitId() throws IOException {
        Model shaclModel;
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/blah> a <http://www.w3.org/2002/07/owl#Ontology> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);

            conn.add(shaclModel);
        }
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);

        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/content")
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId));
    }

    @Test
    public void testGetShapesGraphContentWithoutCommitId() throws IOException {
        Model shaclModel;
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/blah> a <http://www.w3.org/2002/07/owl#Ontology> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);

            conn.add(shaclModel);
        }
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);

        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);

        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId)))
                .thenReturn(Optional.of(shapesGraphSpy));
        when(commitManager.getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/content")
                .queryParam("branchId", branchId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId),
                any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId));
        verify(shapesGraphSpy).serializeShapesGraph(eq("turtle"));
    }

    @Test
    public void testGetShapesGraphContentWithExistingInProgressCommit() throws IOException {
        Model shaclModel;
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/blah> a <http://www.w3.org/2002/07/owl#Ontology> .".getBytes(StandardCharsets.UTF_8));
            shaclModel = Rio.parse(stream, "", RDFFormat.TRIG);

            conn.add(shaclModel);
        }
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(shaclModel);

        ShapesGraph shapesGraph = new SimpleShapesGraph(shaclModel, getValueFactory(), getModelFactory());
        ShapesGraph shapesGraphSpy = Mockito.spy(shapesGraph);
        when(shapesGraphManager.retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId)))
                .thenReturn(Optional.of(shapesGraphSpy));

        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()) + "/content")
                .queryParam("branchId", branchId.stringValue())
                .queryParam("commitId", commitId.stringValue())
                .request()
                .get();

        assertEquals(response.getStatus(), Response.Status.OK.getStatusCode());
        assertGetUserFromContext();
        verify(commitManager).getInProgressCommitOpt(eq(catalogId), eq(recordId), any(User.class), any(RepositoryConnection.class));
        verify(shapesGraphManager).retrieveShapesGraph(eq(recordId), eq(branchId), eq(commitId));
        verify(differenceManager).applyInProgressCommit(eq(inProgressCommit.getResource()),
                eq(shaclModel), any(RepositoryConnection.class));
        verify(shapesGraphSpy).serializeShapesGraph(eq("turtle"));
    }

    private ObjectNode getResponse(Response response) {
        try {
            return mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private void assertGetUserFromContext() {
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }
}
