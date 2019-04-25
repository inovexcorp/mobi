package com.mobi.etl.rest.impl;

/*-
 * #%L
 * com.mobi.etl.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.eclipse.rdf4j.model.Model;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class DelimitedRestImplTest extends MobiRestTestNg {
    private DelimitedRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private User user;
    private static final String MAPPING_RECORD_IRI = "http://test.org/mapping-record";
    private static final String DATASET_RECORD_IRI = "http://test.org/dataset-record";
    private static final String ONTOLOGY_RECORD_IRI = "http://test.org/ontology-record";
    private static final String ONTOLOGY_RECORD_BRANCH_IRI = "http://test.org/ontology-record-branch";
    private static final String MASTER_BRANCH_IRI = "http://test.org/master-branch";
    private static final String DATASET_IRI = "http://test.org/dataset";
    private static final String REPOSITORY_ID = "test";
    private static final String ERROR_IRI = "http://error.org";

    @Mock
    private DelimitedConverter converter;

    @Mock
    private MappingManager mappingManager;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private OntologyRecord ontologyRecord;

    @Mock
    private EngineManager engineManager;

    @Mock
    private DatasetRecord datasetRecord;

    @Mock
    private RDFImportService rdfImportService;

    @Mock
    private OntologyImportService ontologyImportService;

    @Mock
    private Dataset dataset;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));

        MockitoAnnotations.initMocks(this);
        rest = new DelimitedRestImpl();
        rest.setDelimitedConverter(converter);
        rest.setMappingManager(mappingManager);
        rest.setEngineManager(engineManager);
        rest.setVf(vf);
        rest.setTransformer(transformer);
        rest.setRdfImportService(rdfImportService);
        rest.setOntologyImportService(ontologyImportService);
        rest.start();

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
    public void setupMocks() throws Exception {
        when(transformer.mobiModel(any(Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        when(mappingWrapper.getModel()).thenReturn(mf.createModel());

        when(mappingManager.retrieveMapping(any(Resource.class))).thenReturn(Optional.empty());
        when(mappingManager.retrieveMapping(vf.createIRI(MAPPING_RECORD_IRI))).thenReturn(Optional.of(mappingWrapper));
        when(mappingManager.createMappingId(any(IRI.class))).thenAnswer(i -> new MappingId() {
            @Override
            public Optional<IRI> getMappingIRI() {
                return null;
            }

            @Override
            public Optional<IRI> getVersionIRI() {
                return null;
            }

            @Override
            public Resource getMappingIdentifier() {
                return vf.createIRI(i.getArguments()[0].toString());
            }
        });

        when(dataset.getResource()).thenReturn(vf.createIRI(DATASET_IRI));
        when(datasetRecord.getResource()).thenReturn(vf.createIRI(DATASET_RECORD_IRI));
        when(datasetRecord.getDataset_resource()).thenReturn(Optional.of(vf.createIRI(DATASET_IRI)));
        when(datasetRecord.getRepository()).thenReturn(Optional.of(REPOSITORY_ID));
        when(converter.convert(any(SVConfig.class))).thenReturn(mf.createModel());
        when(converter.convert(any(ExcelConfig.class))).thenReturn(mf.createModel());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(ontologyRecord.getMasterBranch_resource()).thenReturn(Optional.of(vf.createIRI(MASTER_BRANCH_IRI)));
        when(ontologyRecord.getResource()).thenReturn(vf.createIRI(ONTOLOGY_RECORD_IRI));
    }

    @AfterMethod
    public void resetMocks() {
        reset(converter, mappingManager, mappingWrapper, transformer, ontologyRecord, engineManager, datasetRecord,
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
            response = target().path("delimited-files").request().post(Entity.entity(fd,
                    MediaType.MULTIPART_FORM_DATA));
            String filename = response.readEntity(String.class);

            assertEquals(response.getStatus(), 201);
            assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + filename)));
        }
    }

    @Test
    public void updateNonexistentDelimitedTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));
    }

    @Test
    public void updateDelimitedReplacesContentTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_updated.csv");

        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("delimited-files/" + fileName).request().put(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), fileName);
        List<String> resultLines = Files.readAllLines(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName));
        assertEquals(resultLines.size(), expectedLines.size());
        for (int i = 0; i < resultLines.size(); i++) {
            assertEquals(resultLines.get(i), expectedLines.get(i));
        }
    }

    @Test
    public void getRowsFromCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test.csv");
        Response response = target().path("delimited-files/" + fileName).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromCsvWithParamsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_tabs.csv");

        int rowNum = 5;
        Response response = target().path("delimited-files/" + fileName).queryParam("rowCount", rowNum)
                .queryParam("separator", "\t").request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void nonExistentRowsTest() {
        Response response = target().path("delimited-files/error").request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getRowsFromExcelWithDefaultsTest() throws Exception {
        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("delimited-files/" + fileName1).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("delimited-files/" + fileName2).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromExcelWithFormulasTest() throws Exception {
        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("formulaData.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("formulaData.xls");
        Response response = target().path("delimited-files/" + fileName1).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 9);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("formulaData.xlsx", fileName2);
        expectedLines = getExcelResourceLines("formulaData.xlsx");
        response = target().path("delimited-files/" + fileName2).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, 9);
    }

    @Test
    public void getRowsFromExcelWithParamsTest() throws Exception {
        int rowNum = 5;

        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("delimited-files/" + fileName1).queryParam("rowCount", rowNum).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("delimited-files/" + fileName2).queryParam("rowCount", rowNum).request().get();
        assertEquals(response.getStatus(), 200);
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void mapWithoutMappingTest() {
        String mapping = "";
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingIRI", mapping)
                .request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapWithNonExistentMappingTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingIRI", ERROR_IRI)
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapWithMalformedMappingIRITest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingIRI", "error")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
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
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        Response response = testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        isNotJsonld(response.readEntity(String.class));
        String disposition = response.getStringHeaders().get("Content-Disposition").toString();
        assertTrue(disposition.contains(params.get("fileName").toString()));
    }

    @Test
    public void mapExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

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
        String fileName = UUID.randomUUID().toString() + ".xls";
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
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapDeletesFile() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        assertTrue(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));

        testMapDownload(fileName, MAPPING_RECORD_IRI, params);
        assertFalse(Files.exists(Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + fileName)));
    }

    @Test
    public void mapPreviewWithoutMappingTest() {
        String mapping = "";
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mapping);
        Response response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map-preview").request().post(Entity.entity(null,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapPreviewCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewCsvWithParamsTest() throws Exception{
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapPreview(fileName, "[]", null);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("containsHeaders", true);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = testMapPreview(fileName, "[]", params);
        isNotJsonld(response.readEntity(String.class));
    }

    @Test
    public void mapPreviewNonexistentDelimitedTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", "[]");
        Response response = target().path("delimited-files/error/map-preview").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithoutMappingTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", "")
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").queryParam("datasetRecordIRI", DATASET_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithoutDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", "").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoNonexistentDatasetTest() {
        Response response = target().path("delimited-files/test.csv/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", ERROR_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithNonexistentMappingTest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", ERROR_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithMalformedMappingIRITest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", "error")
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoDatasetWithDatasetOrRepoIssue() throws Exception {
        // Setup:
        doThrow(new IllegalArgumentException("Dataset does not exist")).when(rdfImportService).importModel(any(), any());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void mapCSVIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        com.mobi.rdf.api.Model model = mf.createModel(Collections.singleton(data));
        when(converter.convert(any(SVConfig.class))).thenReturn(model);
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void mapExcelIntoDatasetTest() throws Exception {
        // Setup:
        Statement data = vf.createStatement(vf.createIRI("http://test.org/class"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        com.mobi.rdf.api.Model model = mf.createModel(Collections.singleton(data));
        when(converter.convert(any(ExcelConfig.class))).thenReturn(model);
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("datasetRecordIRI", DATASET_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void mapIntoOntologyRecordWithoutMappingTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", "")
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI)
               .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoOntologyRecordWithoutOntologyTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", "").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);

        response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoNonexistentOntologyRecordTest() {
        Response response = target().path("delimited-files/test.csv/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ERROR_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoOntologyRecordWithNonexistentMappingTest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", ERROR_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoOntologyRecordWithMalformedMappingIRITest() throws Exception {
        // Setup:
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", "error")
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapIntoOntologyRecordThatHasNoMasterBranchSetTest() throws Exception {
        // Setup:
        when(ontologyRecord.getMasterBranch_resource()).thenReturn(Optional.empty());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void mapCSVAdditionsIntoOntologyRecordTest() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        com.mobi.rdf.api.Model model = mf.createModel(Stream.of(statement1, statement2).collect(Collectors.toList()));
        com.mobi.rdf.api.Model committedModel = mf.createModel(Collections.singleton(statement2));
        when(converter.convert(any(SVConfig.class))).thenReturn(model);
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(ONTOLOGY_RECORD_BRANCH_IRI)), eq(false), eq(model), eq(user), anyString()))
                .thenReturn(new Difference.Builder().additions(committedModel).build());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", ONTOLOGY_RECORD_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void mapCSVAdditionsIntoOntologyHandlingEmptyCommits() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        com.mobi.rdf.api.Model model = mf.createModel(Stream.of(statement1, statement2).collect(Collectors.toList()));
        com.mobi.rdf.api.Model committedModel = mf.createModel();
        when(converter.convert(any(SVConfig.class))).thenReturn(model);
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(ONTOLOGY_RECORD_BRANCH_IRI)), eq(false), eq(model), eq(user), anyString()))
                .thenReturn(new Difference.Builder().build());
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", ONTOLOGY_RECORD_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 204);
    }

    @Test
    public void mapExcelAdditionsIntoOntologyRecordTest() throws Exception {
        // Setup:
        Statement statement1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));
        Statement statement2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"), vf.createIRI("http://test.org/property"), vf.createLiteral(true));

        com.mobi.rdf.api.Model model = mf.createModel(Stream.of(statement1, statement2).collect(Collectors.toList()));
        com.mobi.rdf.api.Model committedModel = mf.createModel(Collections.singleton(statement2));
        when(converter.convert(any(ExcelConfig.class))).thenReturn(model);
        when(ontologyImportService.importOntology(eq(vf.createIRI(ONTOLOGY_RECORD_IRI)),
                eq(vf.createIRI(MASTER_BRANCH_IRI)), eq(false), eq(model), eq(user), anyString()))
                .thenReturn(new Difference.Builder().additions(committedModel).build());
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        Response response = target().path("delimited-files/" + fileName + "/map-to-ontology").queryParam("mappingRecordIRI", MAPPING_RECORD_IRI)
                .queryParam("ontologyRecordIRI", ONTOLOGY_RECORD_IRI).queryParam("branchIRI", MASTER_BRANCH_IRI)
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
    }

    private void isJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void isNotJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
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
        Response response = wt.request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 200);
        return response;
    }

    private void testResultsRows(Response response, List<String> expectedLines, int rowNum) {
        String body = response.readEntity(String.class);
        JSONArray lines = JSONArray.fromObject(body);
        assertEquals(lines.size(), rowNum + 1);
        for (int i = 0; i < lines.size(); i++) {
            JSONArray line = lines.getJSONArray(i);
            String expectedLine = expectedLines.get(i);
            for (Object item : line) {
                assertTrue(expectedLine.contains(item.toString()));
            }
        }
    }

    private List<String> getCsvResourceLines(String fileName) throws Exception {
        return IOUtils.readLines(getClass().getClassLoader().getResourceAsStream(fileName));
    }

    private List<String> getExcelResourceLines(String fileName) {
        List<String> expectedLines = new ArrayList<>();
        try {
            Workbook wb = WorkbookFactory.create(getClass().getResourceAsStream("/" + fileName));
            FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            int index = 0;
            for (Row row : sheet) {
                String rowStr = "";
                for (Cell cell : row) {
                    rowStr += df.formatCellValue(cell, evaluator);
                }
                expectedLines.add(index, rowStr);
                index++;
            }
        } catch (IOException | InvalidFormatException e) {
            e.printStackTrace();
        }
        return expectedLines;
    }

    private FormDataMultiPart getFileFormData(String resourceName) {
        FormDataMultiPart fd = new FormDataMultiPart();
        InputStream content = getClass().getResourceAsStream("/" + resourceName);
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("delimitedFile").fileName(resourceName).build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        return fd;
    }

    private void copyResourceToTemp(String resourceName, String newName) throws IOException {
        Files.copy(getClass().getResourceAsStream("/" + resourceName),
                Paths.get(DelimitedRestImpl.TEMP_DIR + "/" + newName), StandardCopyOption.REPLACE_EXISTING);
    }
}
