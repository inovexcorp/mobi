package org.matonto.etl.rest.impl;

import net.sf.json.JSONArray;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.api.csv.MappingManager;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.core.impl.sesame.LinkedHashModel;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.mockito.Matchers.*;
import static org.mockito.Mockito.when;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

public class CSVRestImplTest extends MatontoRestTestNg {
    private CSVRestImpl rest;

    @Mock
    CSVConverter converter;

    @Mock
    MappingManager manager;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        rest = new CSVRestImpl();
        rest.setCsvConverter(converter);
        rest.setMappingManager(manager);

        when(converter.convert(any(InputStream.class), any(Model.class), anyBoolean(), anyString(), anyChar())).thenReturn(new LinkedHashModel());
        when(manager.createMappingIRI(anyString())).thenReturn(String::new);
        when(manager.retrieveMapping(any(Resource.class))).thenReturn(Optional.of(new LinkedHashModel()));

        return new ResourceConfig()
            .register(rest)
            .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
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
            response = target().path("csv").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
            Assert.assertEquals(200, response.getStatus());
        }
    }

    @Test
    public void updateNonexistentDelimitedTest() throws IOException {
        String fileName = UUID.randomUUID().toString() + ".csv";
        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("csv/" + fileName).request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        Assert.assertTrue(Files.exists(Paths.get(System.getProperty("java.io.tmpdir") + "/" + fileName)));
    }

    @Test
    public void updateDelimitedReplacesContentTest() throws IOException {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_updated.csv");

        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("csv/" + fileName).request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        Assert.assertEquals(fileName, response.readEntity(String.class));
        List<String> resultLines = Files.readAllLines(Paths.get(System.getProperty("java.io.tmpdir") + "/" + fileName));
        Assert.assertEquals(expectedLines.size(), resultLines.size());
        for (int i = 0; i < resultLines.size(); i++) {
            Assert.assertEquals(expectedLines.get(i), resultLines.get(i));
        }
    }

    @Test
    public void getRowsFromCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test.csv");
        Response response = target().path("csv/" + fileName).request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromCsvWithParamsTest() throws IOException {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);
        List<String> expectedLines = getCsvResourceLines("test_tabs.csv");

        int rowNum = 5;
        Response response = target().path("csv/" + fileName).queryParam("rowCount", rowNum).queryParam("separator", "\t").request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void nonExistentRowsTest() {
        Response response = target().path("csv/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getRowsFromExcelWithDefaultsTest() throws Exception {
        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("csv/" + fileName1).request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 10);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("csv/" + fileName2).request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromExcelWithParamsTest() throws Exception {
        int rowNum = 5;

        String fileName1 = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName1);
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("csv/" + fileName1).queryParam("rowCount", rowNum).request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, rowNum);

        String fileName2 = UUID.randomUUID().toString() + ".xlsx";
        copyResourceToTemp("test.xlsx", fileName2);
        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("csv/" + fileName2).queryParam("rowCount", rowNum).request().get();
        Assert.assertEquals(200, response.getStatus());
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void mapEitherStringOrMappingTest() {
        String mapping = "";
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mapping);
        fd.field("mappingName", mapping);

        Response response = target().path("csv/test.csv/map").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("csv/test.csv/map").request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void mapCsvWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test.csv", fileName);

        String body = testMap(fileName, "jsonld", "[]", null);
        isJsonld(body);

        body = testMap(fileName, "mappingName", "test", null);
        isJsonld(body);
    }

    @Test
    public void mapCsvWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("preview", true);
        params.put("containsHeaders", true);
        params.put("separator", "\t");

        String fileName = UUID.randomUUID().toString() + ".csv";
        copyResourceToTemp("test_tabs.csv", fileName);

        String body = testMap(fileName, "jsonld", "[]", params);
        isNotJsonld(body);

        body = testMap(fileName, "mappingName", "test", params);
        isNotJsonld(body);
    }

    @Test
    public void mapExcelWithDefaultsTest() throws Exception {
        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        String body = testMap(fileName, "jsonld", "[]", null);
        isJsonld(body);

        body = testMap(fileName, "mappingName", "test", null);
        isJsonld(body);
    }

    @Test
    public void mapExcelWithParamsTest() throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("preview", true);
        params.put("containsHeaders", true);

        String fileName = UUID.randomUUID().toString() + ".xls";
        copyResourceToTemp("test.xls", fileName);

        String body = testMap(fileName, "jsonld", "[]", params);
        isNotJsonld(body);

        body = testMap(fileName, "mappingName", "test", params);
        isNotJsonld(body);
    }

    @Test
    public void mapNonexistentDelimitedTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", "[]");
        Response response = target().path("csv/error/map").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    private void isJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void isNotJsonld(String str) {
        try {
            JSONArray result = JSONArray.fromObject(str);
            Assert.fail();
        } catch (Exception e) {
            System.out.println("Format is not JSON-LD, as expected");
        }
    }

    private String testMap(String fileName, String key, String value, Map<String, Object> params) {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field(key, value);
        WebTarget wt = target().path("csv/" + fileName + "/map");
        if (params != null) {
            for (String k : params.keySet()) {
                wt = wt.queryParam(k, params.get(k));
            }
        }
        Response response = wt.request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        return response.readEntity(String.class);
    }

    private void testResultsRows(Response response, List<String> expectedLines, int rowNum) {
        String body = response.readEntity(String.class);
        System.out.println(body);
        JSONArray lines = JSONArray.fromObject(body);
        Assert.assertEquals(rowNum + 1, lines.size());
        for (int i = 0; i < lines.size(); i++) {
            JSONArray line = lines.getJSONArray(i);
            String expectedLine = expectedLines.get(i);
            for (Object item : line) {
                Assert.assertTrue(expectedLine.contains(item.toString()));
            }
        }
    }

    private List<String> getCsvResourceLines(String fileName) {
        List<String> expectedLines = new ArrayList<>();
        try {
            expectedLines = Files.readAllLines(Paths.get(getClass().getResource("/" + fileName).getPath()));
        } catch (IOException e) {
            e.printStackTrace();
        }
        return expectedLines;
    }

    private List<String> getExcelResourceLines(String fileName) {
        List<String> expectedLines = new ArrayList<>();
        try {
            Workbook wb = WorkbookFactory.create(getClass().getResourceAsStream("/" + fileName));
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            int index = 0;
            for (Row row : sheet) {
                String rowStr = "";
                for (Cell cell : row) {
                    rowStr += df.formatCellValue(cell);
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
        Files.copy(getClass().getResourceAsStream("/" + resourceName), Paths.get(System.getProperty("java.io.tmpdir") + "/" + newName), StandardCopyOption.REPLACE_EXISTING);
    }
}
