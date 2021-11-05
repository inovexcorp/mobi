package com.mobi.shapes.rest;

/*-
 * #%L
 * com.mobi.shapes.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotEquals;
import static org.testng.Assert.assertNotNull;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
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
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.glassfish.jersey.client.ClientConfig;
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
    private Repository repo;
    private OrmFactory<ShapesGraphRecord> recordFactory;
    private OrmFactory<Branch> branchFactory;
    private OrmFactory<Commit> commitFactory;
    private User user;
    private ShapesGraphRecord record;
    private Branch branch;
    private Commit commit;
    private IRI branchId;
    private IRI commitId;
    private IRI recordId;
    private IRI catalogId;
    private IRI shapesGraphId;
    private Model shaclModel;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    CatalogManager catalogManager;

    @Mock
    EngineManager engineManager;

    @Mock
    SesameTransformer transformer;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();

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

        catalogId = vf.createIRI("http://mobi.com/catalog");
        recordId = vf.createIRI("http://mobi.com/shaclRecord1");
        shapesGraphId = vf.createIRI("http://mobi.com/shapes-graph-id");
        branchId = vf.createIRI("http://mobi.com/branch");
        commitId = vf.createIRI("http://mobi.com/commit");

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
        rest.transformer = transformer;
        rest.vf = vf;

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
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
    }

    @AfterMethod
    public void resetMocks() {
        reset(engineManager, configProvider, catalogManager, transformer);
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
        String ontologyId = getResponse(response).optString("shapesGraphId");
        assertEquals(ontologyId, shapesGraphId.stringValue());
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
    public void downloadOntologyFileTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).queryParam("commitId", commitId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void downloadOntologyFileWithCommitIdAndMissingBranchIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("commitId", commitId.stringValue()).queryParam("entityId", catalogId.stringValue())
                .request().accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCompiledResource(eq(commitId));
    }

    @Test
    public void downloadOntologyFileWithBranchIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void downloadOntologyFileWithBranchIdCantGetHeadCommitTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getHeadCommit(any(), any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));

        resetMocks();
        setupMocks();        
        doThrow(IllegalArgumentException.class).when(catalogManager).getHeadCommit(any(), any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue()))
                .queryParam("branchId", branchId.stringValue()).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getHeadCommit(eq(catalogId), eq(recordId), eq(branchId));
    }

    @Test
    public void downloadOntologyFileWithBranchIdCantGetCompiledResourceTest() {
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
    }

    @Test
    public void downloadOntologyFileOnlyRecordIdTest() {
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void downloadOntologyFileOnlyRecordIdCantGetBranchTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getMasterBranch(any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));

        resetMocks();
        setupMocks();
        doThrow(IllegalArgumentException.class).when(catalogManager).getMasterBranch(any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getMasterBranch(eq(catalogId), eq(recordId));
    }

    @Test
    public void downloadOntologyFileOnlyRecordIdCantGetCompiledResourceTest() {
        doThrow(IllegalStateException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        Response response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 500);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));

        resetMocks();
        setupMocks();
        doThrow(IllegalArgumentException.class).when(catalogManager).getCompiledResource(any(), any(), any());
        response = target().path("shapes-graphs/" + encode(recordId.stringValue())).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 400);
        verify(catalogManager).getCompiledResource(eq(recordId), eq(branchId), eq(commitId));
    }

    @Test
    public void downloadOntologyFileNoRecordIdTest() {
        Response response = target().path("shapes-graphs/").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();

        assertEquals(response.getStatus(), 405);
    }

    private JSONObject getResponse(Response response) {
        return JSONObject.fromObject(response.readEntity(String.class));
    }
}
