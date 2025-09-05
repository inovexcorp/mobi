package com.mobi.etl.rest;

/*-
 * #%L
 * com.mobi.etl.rest
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

import static com.mobi.etl.api.delimited.ExcelUtils.getCellText;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.delimited.MappingId;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.apache.commons.io.IOUtils;
import org.dhatim.fastexcel.reader.ReadableWorkbook;
import org.dhatim.fastexcel.reader.ReadingOptions;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class DelimitedRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private User user;
    private File file;
    private static final String MAPPING_RECORD_IRI = "http://test.org/mapping-record";
    private static final String DATASET_RECORD_IRI = "http://test.org/dataset-record";
    private static final String ONTOLOGY_RECORD_IRI = "http://test.org/ontology-record";
    private static final String ONTOLOGY_RECORD_BRANCH_IRI = "http://test.org/ontology-record-branch";
    private static final String MASTER_BRANCH_IRI = "http://test.org/master-branch";
    private static final String DATASET_IRI = "http://test.org/dataset";
    private static final String REPOSITORY_ID = "test";
    private static final String ERROR_IRI = "http://error.org";

    // Mock services used in server
    private static DelimitedRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static DelimitedConverter converter;
    private static MappingManager mappingManager;
    private static EngineManager engineManager;
    private static RDFImportService rdfImportService;
    private static OntologyImportService ontologyImportService;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private OntologyRecord ontologyRecord;

    @Mock
    private DatasetRecord datasetRecord;

    @Mock
    private Dataset dataset;

    @Mock
    private Path path;

    @BeforeClass
    public static void startServer() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

        converter = Mockito.mock(DelimitedConverter.class);
        mappingManager = Mockito.mock(MappingManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        
        rdfImportService = Mockito.mock(RDFImportService.class);
        ontologyImportService = Mockito.mock(OntologyImportService.class);

        rest = new DelimitedRest();
        rest.setDelimitedConverter(converter);
        rest.setMappingManager(mappingManager);
        rest.setEngineManager(engineManager);
        rest.setRdfImportService(rdfImportService);
        rest.setOntologyImportService(ontologyImportService);
        rest.start();

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));

        when(mappingWrapper.getModel()).thenReturn(mf.createEmptyModel());

        when(mappingManager.retrieveMapping(any(Resource.class))).thenReturn(Optional.empty());
        when(mappingManager.retrieveMapping(vf.createIRI(MAPPING_RECORD_IRI))).thenReturn(Optional.of(mappingWrapper));
        when(mappingManager.createMappingId(any(IRI.class))).thenAnswer(i -> new MappingId() {
            @Override
            public Optional<IRI> getMappingIRI() {
                return Optional.empty();
            }

            @Override
            public Optional<IRI> getVersionIRI() {
                return Optional.empty();
            }

            @Override
            public Resource getMappingIdentifier() {
                return vf.createIRI(i.getArguments()[0].toString());
            }
        });

        file = File.createTempFile(UUID.randomUUID().toString(), ".tmp");

        when(dataset.getResource()).thenReturn(vf.createIRI(DATASET_IRI));
        when(datasetRecord.getResource()).thenReturn(vf.createIRI(DATASET_RECORD_IRI));
        when(datasetRecord.getDataset_resource()).thenReturn(Optional.of(vf.createIRI(DATASET_IRI)));
        when(datasetRecord.getRepository()).thenReturn(Optional.of(REPOSITORY_ID));
        when(converter.convert(any(SVConfig.class))).thenReturn(path);
        when(converter.convert(any(ExcelConfig.class))).thenReturn(path);
        when(path.toFile()).thenReturn(file);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(ontologyRecord.getMasterBranch_resource()).thenReturn(Optional.of(vf.createIRI(MASTER_BRANCH_IRI)));
        when(ontologyRecord.getResource()).thenReturn(vf.createIRI(ONTOLOGY_RECORD_IRI));
    }

    @After
    public void resetMocks() throws Exception {
        file.delete();
        closeable.close();
        reset(converter, mappingManager, mappingWrapper, ontologyRecord, engineManager, datasetRecord,
                dataset, rdfImportService, ontologyImportService);
    }

    @Test
    public void uploadDelimitedTest() {
        FormDataMultiPart fd;
        Response response;
        String[] files = {
                "test.csv", "test.xls", "test.xlsx"
        };
        for (String file : files) {
            fd = getFileFormData(file);
            Entity ent = Entity.entity(fd.body(),
                    MediaType.MULTIPART_FORM_DATA);
            response = target().path("delimited-files").request().post(ent);
            String filename = response.readEntity(String.class);

            assertEquals(201, response.getStatus());
            assertTrue(Files.exists(Paths.get(DelimitedRest.TEMP_DIR + "/" + filename)));
        }
    }

    @Test
    public void updateNonexistentDelimitedTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        assertTrue(Files.exists(Paths.get(DelimitedRest.TEMP_DIR + "/" + fileName)));
    }

    @Test
    public void updateDelimitedReplacesContentTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_updated.csv");

        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        assertEquals(response.readEntity(String.class), fileName);
        List<String> resultLines = Files.readAllLines(Paths.get(DelimitedRest.TEMP_DIR + "/" + fileName));
        assertEquals(resultLines.size(), expectedLines.size());
        for (int i = 0; i < resultLines.size(); i++) {
            assertEquals(resultLines.get(i), expectedLines.get(i));
        }
    }

    @Test
    public void getRowsFromCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test.csv");
        Response response = target().path("delimited-files/" + fileName).request().get();
        assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromCsvWithParamsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_tabs.csv");

        int rowNum = 5;
        Response response = target().path("delimited-files/" + fileName).queryParam("rowCount", rowNum)
                .queryParam("separator", "\t").request().get();
        assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void nonExistentRowsTest() {
        Response response = target().path("delimited-files/error").request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getRowsFromExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName);
        List<String> expectedLines = getExcelResourceLines("test.xlsx");
        Response response = target().path("delimited-files/" + fileName).request().get();
        assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromExcelWithFormulasTest() throws Exception {
        String fileName = UUID.randomUUID() + ".xlsx";
        copyResourceToTemp("formulaData.xlsx", fileName);
        List<String> expectedLines = getExcelResourceLines("formulaData.xlsx");
        Response response = target().path("delimited-files/" + fileName).request().get();
        assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 9);
    }

    @Test
    public void getRowsFromExcelWithParamsTest() throws Exception {
        int rowNum = 5;

        String fileName = UUID.randomUUID() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName);
        List<String> expectedLines = getExcelResourceLines("test.xlsx");
        Response response = target().path("delimited-files/" + fileName).queryParam("rowCount", rowNum).request().get();
        assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void mapWithoutMappingTest() {
        String mapping = "";
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingIRI", mapping)
                .request().get();
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapWithNonExistentMappingTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingIRI", ERROR_IRI)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapWithMalformedMappingIRITest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingIRI", "error")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.JSONLD);
        }

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, null);
        isJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(fileName));
    }

    @Test
    public void mapCsvWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        params.put("fileName", "test");
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.TURTLE);
        }

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        isNotJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(params.get("fileName").toString()));
    }

    @Test
    public void mapExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.JSONLD);
        }

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, null);
        isJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(fileName));
    }

    @Test
    public void mapExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("fileName", "test");
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        isNotJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(params.get("fileName").toString()));
    }

    @Test
    public void mapNonexistentDelimitedTest() {
        Response response = target().path("delimited-files/error/map").queryParam("mappingIRI", MAPPING_RECORD_IRI)
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapDeletesFile() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Path path = Paths.get(DelimitedRest.TEMP_DIR + "/" + fileName);
        assertTrue(Files.exists(path));

        testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        assertFalse(Files.exists(path));
    }

    @Test
    public void mapPreviewWithoutMappingTest() {
        String mapping = "";
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mapping);
        Response response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(FormDataMultiPart.emptyBody(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapPreviewCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.JSONLD);
        }

        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewCsvWithParamsTest() throws Exception{
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.JSONLD);
        }

        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            Rio.write(mf.createEmptyModel(), fos, RDFFormat.TURTLE);
        }

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewNonexistentDelimitedTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", "[]");
        Response response = target().path("delimited-files/error/map-preview").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoDatasetWithoutMappingTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", "")
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map").queryParam("datasetRecordIRI", DATASET_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoDatasetWithoutDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", "").request().post(Entity.json(""));
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoNonexistentDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", ERROR_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoDatasetWithNonexistentMappingTest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", ERROR_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoDatasetWithMalformedMappingIRITest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", "error")
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoDatasetWithDatasetOrRepoIssue() throws Exception {
        // Setup:
        doThrow(new IllegalArgumentException("Dataset does not exist")).when(rdfImportService).importFile(any(), any());
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapCSVIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Model model = mf.createEmptyModel();
        model.add(data);
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(200, response.getStatus());
    }

    @Test
    public void mapExcelIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Model model = mf.createEmptyModel();
        model.add(data);
        String fileName = UUID.randomUUID() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(200, response.getStatus());
    }

    @Test
    public void mapIntoOntologyRecordWithoutMappingTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", "")
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI)
               .request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoOntologyRecordWithoutOntologyTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", "").request().post(Entity.json(""));
        assertEquals(400, response.getStatus());

        response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoNonexistentOntologyRecordTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ERROR_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoOntologyRecordWithNonexistentMappingTest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", ERROR_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoOntologyRecordWithMalformedMappingIRITest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", "error")
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapIntoOntologyRecordThatHasNoMasterBranchSetTest() throws Exception {
        // Setup:
        when(ontologyRecord.getMasterBranch_resource()).thenReturn(Optional.empty());
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mapCSVAdditionsIntoOntologyRecordTest() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        Model model = mf.createEmptyModel();
        model.addAll(Stream.of(statement1, statement2).toList());
        Model committedModel = mf.createEmptyModel();
        committedModel.add(statement2);
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(ONTOLOGY_RECORD_BRANCH_IRI)), eq(false), any(File.class), eq(user), anyString()))
                .thenReturn(new Difference.Builder().additions(committedModel).build());
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", ONTOLOGY_RECORD_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(200, response.getStatus());
    }

    @Test
    public void mapCSVAdditionsIntoOntologyHandlingEmptyCommits() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        Model model = mf.createEmptyModel();
        model.addAll(Stream.of(statement1, statement2).toList());
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(ONTOLOGY_RECORD_BRANCH_IRI)), eq(false), any(File.class), eq(user), anyString()))
                .thenReturn(new Difference.Builder()
                        .additions(mf.createEmptyModel())
                        .deletions(mf.createEmptyModel())
                        .build());
        String fileName = UUID.randomUUID() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", ONTOLOGY_RECORD_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(204, response.getStatus());
    }

    @Test
    public void mapExcelAdditionsIntoOntologyRecordTest() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        Model model = mf.createEmptyModel();
        model.addAll(Stream.of(statement1, statement2).toList());
        Model committedModel = mf.createEmptyModel();
        committedModel.add(statement2);
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(MASTER_BRANCH_IRI)), eq(false), any(File.class), eq(user), anyString()))
                .thenReturn(new Difference.Builder().additions(committedModel).build());
        String fileName = UUID.randomUUID() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", MASTER_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(200, response.getStatus());
    }

    private void isJsonld(String str) {
        try {
            ArrayNode result = mapper.readValue(str, ArrayNode.class);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void isNotJsonld(String str) {
        try {
            ArrayNode result = mapper.readValue(str, ArrayNode.class);
            fail();
        } catch (Exception e) {
            System.out.println("Format is not JSON-LD, as expected");
        }
    }

    private Response testMapPreview(String fileName, String jsonld, Map<String, Object> params) {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);
        WebTarget wt = target().path("delimited-files/" + fileName + "/map-preview");
        if (params != null) {
            for (String k : params.keySet()) {
                wt = wt.queryParam(k, params.get(k));
            }
        }
        Response response = wt.request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        return response;
    }

    private Response testMapDownload(String fileName, String mappingName, Map<String, Object> params) {
        WebTarget wt = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", mappingName);
        if (params != null) {
            for (String k : params.keySet()) {
                wt = wt.queryParam(k, params.get(k));
            }
        }
        Response response = wt.request().get();
        assertEquals(200, response.getStatus());
        return response;
    }

    private void testResultsRows(Response response, List<String> expectedLines, int rowNum) throws Exception {
        String body = response.readEntity(String.class);
        ArrayNode lines = mapper.readValue(body, ArrayNode.class);
        assertEquals(rowNum + 1, lines.size());
        for (int i = 0; i < lines.size(); i++) {
            JsonNode line = lines.get(i);
            String expectedLine = expectedLines.get(i);
            for (JsonNode item : line) {
                assertTrue(expectedLine.contains(item.asText()));
            }
        }
    }

    private List<String> getCsvResourceLines(String fileName) throws Exception {
        return IOUtils.readLines(Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(fileName)), StandardCharsets.UTF_8);
    }

    private List<String> getExcelResourceLines(String fileName) {
        // Arguments will extract cell formatting and mark a cell as in error if it could not be parsed
        ReadingOptions readingOptions = new ReadingOptions(true, true);
        List<String> expectedLines = new ArrayList<>();
        try (InputStream is = Objects.requireNonNull(getClass().getResourceAsStream("/" + fileName)); ReadableWorkbook wb = new ReadableWorkbook(is, readingOptions)) {
            org.dhatim.fastexcel.reader.Sheet sheet = wb.getFirstSheet();
            sheet.openStream()
                    .forEach(row -> {
                        StringBuilder rowStr = new StringBuilder();
                        for (int i = 0; i < row.getCellCount(); i++) {
                            rowStr.append(getCellText(row.getCell(i)));
                        }
                        expectedLines.add(rowStr.toString());
                    });
        } catch (IOException e) {
            e.printStackTrace();
        }
        return expectedLines;
    }

    private FormDataMultiPart getFileFormData(String resourceName) {
        FormDataMultiPart fd = new FormDataMultiPart();
        InputStream content = getClass().getResourceAsStream("/" + resourceName);
        fd.bodyPart("delimitedFile", resourceName, content);
        return fd;
    }

    private void copyResourceToTemp(String resourceName, String newName) throws IOException {
        Files.copy(Objects.requireNonNull(getClass().getResourceAsStream("/" + resourceName)),
                Paths.get(DelimitedRest.TEMP_DIR + "/" + newName), StandardCopyOption.REPLACE_EXISTING);
    }
}
