package org.matonto.etl.rest.impl;

import net.sf.json.JSONArray;
import org.apache.commons.io.FileUtils;
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
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

public class CSVRestImplTest extends MatontoRestTestNg {
    private static File testDir;
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

    @BeforeClass
    public void start() throws IOException {
        testDir = new File("data/tmp/");
        testDir.mkdirs();
        moveResource("test.csv", "test_csv.csv");
        moveResource("test_tabs.csv", "test_tabs_csv.csv");
        moveResource("test.xls", "test_oldexcel.xls");
        moveResource("test.xlsx", "test_newexcel.xlsx");
    }

    @AfterClass
    public void finish() throws IOException {
        FileUtils.deleteDirectory(testDir.getParentFile());
    }

    @Test
    public void uploadDelimitedTest() {
        String extension, fileName;
        FormDataMultiPart fd;
        Response response;
        String[] files = {
                "test.csv", "test.xls", "test.xlsx"
        };
        for (String file : files) {
            extension = file.substring(file.indexOf(".") + 1);
            fd = getFileFormData(file);
            response = target().path("csv").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
            Assert.assertEquals(200, response.getStatus());
            fileName = response.readEntity(String.class);
            Assert.assertTrue(Files.exists(Paths.get(testDir.getPath() + "/" + fileName + "." + extension)));
        }
    }

    @Test
    public void updateDelimitedReplacesContentTest() throws IOException {
        String fileName = "test_update";
        moveResource("test.csv", fileName + ".csv");
        List<String> expectedLines = getCsvResourceLines("test_updated.csv");

        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("csv/" + fileName).request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        Assert.assertEquals(fileName, response.readEntity(String.class));
        List<String> resultLines = Files.readAllLines(Paths.get(testDir.getPath() + "/" + fileName + ".csv"));
        Assert.assertEquals(expectedLines.size(), resultLines.size());
        for (int i = 0; i < resultLines.size(); i++) {
            Assert.assertEquals(expectedLines.get(i), resultLines.get(i));
        }
    }

    @Test
    public void updateDelimitedWithDifferentFormatTest() throws IOException {
        String fileName = "test_update";
        moveResource("test.csv", fileName + ".csv");

        FormDataMultiPart fd = getFileFormData("test.xls");
        Response response = target().path("csv/" + fileName).request().put(
                Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        Assert.assertFalse(Files.exists(Paths.get(testDir.getPath() + "/" + fileName + ".csv")));
        Assert.assertTrue(Files.exists(Paths.get(testDir.getPath() + "/" + fileName + ".xls")));
    }

    @Test
    public void updateNonexistentDelimitedTest() throws IOException {
        FormDataMultiPart fd = getFileFormData("test_updated.csv");
        Response response = target().path("csv/name").request().put(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        Assert.assertTrue(Files.exists(Paths.get(testDir.getPath() + "/name.csv")));
    }

    @Test
    public void getRowsFromCsvWithDefaultsTest() {
        List<String> expectedLines = getCsvResourceLines("test.csv");
        Response response = target().path("csv/test_csv").request().get();
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromCsvWithParamsTest() throws IOException {
        List<String> expectedLines = getCsvResourceLines("test_tabs.csv");

        int rowNum = 5;
        Response response = target().path("csv/test_tabs_csv").queryParam("rowCount", rowNum).queryParam
                ("separator", "\t").request().get();
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void nonexistentRowsTest() {
        Response response = target().path("csv/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getRowsFromExcelWithDefaultsTest() {
        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("csv/test_oldexcel").request().get();
        testResultsRows(response, expectedLines, 10);

        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("csv/test_newexcel").request().get();
        testResultsRows(response, expectedLines, 10);
    }

    @Test
    public void getRowsFromExcelWithParamsTest() {
        int rowNum = 5;

        List<String> expectedLines = getExcelResourceLines("test.xls");
        Response response = target().path("csv/test_oldexcel").queryParam("rowCount", rowNum).request().get();
        testResultsRows(response, expectedLines, rowNum);

        expectedLines = getExcelResourceLines("test.xlsx");
        response = target().path("csv/test_newexcel").queryParam("rowCount", rowNum).request().get();
        testResultsRows(response, expectedLines, rowNum);
    }

    @Test
    public void mapEitherStringOrMappingTest() {
        String mapping = "";
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mapping);
        fd.field("mappingName", mapping);
        Response response = target().path("csv/test_csv/map").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("csv/test_csv/map").request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void mapCsvWithDefaultsTest() {
        String body = testMap("test_csv", "jsonld",     "[]", null);
        isJsonld(body);

        body = testMap("test_csv", "mappingName", "test", null);
        isJsonld(body);
    }

    @Test
    public void mapCsvWithParamsTest() {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("preview", true);
        params.put("containsHeaders", true);
        params.put("separator", "\t");
        String body = testMap("test_tabs_csv", "jsonld", "[]", params);
        isNotJsonld(body);

        body = testMap("test_tabs_csv", "mappingName", "test", params);
        isNotJsonld(body);
    }

    @Test
    public void mapExcelWithDefaultsTest() {
        String body = testMap("test_oldexcel", "jsonld", "[]", null);
        isJsonld(body);

        body = testMap("test_oldexcel", "mappingName", "test", null);
        isJsonld(body);
    }

    @Test
    public void mapExcelWithParamsTest() {
        Map<String, Object> params = new HashMap<>();
        params.put("format", "turtle");
        params.put("preview", true);
        params.put("containsHeaders", true);
        String body = testMap("test_oldexcel", "jsonld", "[]", params);
        isNotJsonld(body);

        body = testMap("test_oldexcel", "mappingName", "test", params);
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

    private void moveResource(String resourceName, String newName) throws IOException {
        String newFile = newName != null ? newName : resourceName;
        Files.copy(getClass().getResourceAsStream("/" + resourceName), Paths.get(testDir.getPath() + "/" + newFile), StandardCopyOption.REPLACE_EXISTING);
    }
}
