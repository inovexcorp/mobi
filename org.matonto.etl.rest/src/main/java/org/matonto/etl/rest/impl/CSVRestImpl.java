package org.matonto.etl.rest.impl;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import net.sf.json.JSONObject;
import org.apache.commons.io.FilenameUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.rest.CSVRest;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.Model;
import org.openrdf.model.Statement;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class CSVRestImpl implements CSVRest {

    private CSVConverter csvConverter;
    private ModelFactory modelFactory;
    private final Logger logger = LoggerFactory.getLogger(CSVRestImpl.class);

    private static final int NUM_LINE_PREVIEW = 10;

    @Reference
    public void setCsvConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail) {
        String fileName = generateUuid();
        String extension = FilenameUtils.getExtension(fileDetail.getFileName());
        Path filePath = Paths.get("data/tmp/" + fileName + "." + extension);
        uploadFile(fileInputStream, filePath);
        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail, String fileName) {
        File delimitedFile = getUploadedFile(fileName);
        String newExtension = FilenameUtils.getExtension(fileDetail.getFileName());
        if (!newExtension.equals(FilenameUtils.getExtension(delimitedFile.getName()))) {
            delimitedFile.delete();
            delimitedFile = new File("data/tmp/" + fileName + "." + newExtension);
        }
        uploadFile(fileInputStream, delimitedFile.toPath());
        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response etlFile(String fileName, String mappingRdf, String mappingFileName,
                            String format, boolean isPreview, boolean containsHeaders, String separator) {
        if ((mappingRdf == null && mappingFileName == null) || (mappingRdf != null && mappingFileName != null)) {
            throw ErrorUtils.sendError("Must provider either a JSON-LD string or a mapping file name",
                    Response.Status.BAD_REQUEST);
        }

        File delimitedFile = getUploadedFile(fileName);
        String extension = FilenameUtils.getExtension(delimitedFile.getName());
        char separatorChar = separator.charAt(0);

        // Get InputStream for data to convert
        InputStream dataToConvert;
        if (isPreview) {
            dataToConvert = (extension.equals("xls") || extension.equals("xlsx"))
                    ? createExcelPreviewStream(delimitedFile, containsHeaders)
                    : createCSVPreviewStream(delimitedFile, containsHeaders);
        } else {
            try {
                dataToConvert = new FileInputStream(delimitedFile);
            } catch (FileNotFoundException e) {
                throw ErrorUtils.sendError(e, "Error locating delimited file", Response.Status.BAD_REQUEST);
            }
        }

        // Convert InputStream to RDF based on Mapping
        Model model;
        try {
            if (mappingFileName != null) {
                File mappingFile = new File("data/tmp/" + mappingFileName + ".jsonld");
                model = sesameModel(csvConverter.convert(dataToConvert, mappingFile, containsHeaders, extension,
                        separatorChar));
            } else {
                InputStream in = new ByteArrayInputStream(mappingRdf.getBytes(StandardCharsets.UTF_8));
                Model mapping = Rio.parse(in, "", RDFFormat.JSONLD);
                model = sesameModel(csvConverter.convert(dataToConvert, matontoModel(mapping), containsHeaders,
                        extension, separatorChar));
            }
        } catch (IOException | InvalidFormatException e) {
            throw ErrorUtils.sendError(e, "Error converting delimited file", Response.Status.BAD_REQUEST);
        }

        // Write data back to Response
        logger.info("File mapped: " + delimitedFile.getPath());
        StringWriter sw = new StringWriter();
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(getRDFFormat(format), sw));
        Rio.write(model, rdfWriter);
        return Response.status(200).entity(sw.toString()).build();
    }

    @Override
    public Response getRows(String fileName, int rowEnd, String separator) {
        File file = getUploadedFile(fileName);
        String extension = FilenameUtils.getExtension(file.getName());
        int numRows = (rowEnd <= 0) ? 10 : rowEnd;

        logger.info("Getting " + numRows + " rows from " + file.getName());
        String json;
        try {
            if (extension.equals("xls") || extension.equals("xlsx")) {
                json = convertExcelRows(file, numRows);
            } else {
                char separatorChar = separator.charAt(0);
                json = convertCSVRows(file, numRows, separatorChar);
            }
        } catch (Exception e) {
            throw ErrorUtils.sendError("Error loading document", Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(json).build();
    }

    /**
     * Finds the uploaded delimited file with the specified name.
     *
     * @param fileName the name of the uploaded delimited file
     * @return the uploaded file if it was found
     */
    private File getUploadedFile(String fileName) {
        File directory = new File("data/tmp");
        File[] files = directory.listFiles((dir, name) -> {
            return name.startsWith(fileName + ".");
        });
        if (files.length == 0) {
            throw ErrorUtils.sendError("Delimited file doesn't not exist", Response.Status.BAD_REQUEST);
        }
        if (files.length > 1) {
            throw ErrorUtils.sendError("Multiple files exist with same name", Response.Status.BAD_REQUEST);
        }

        return files[0];
    }

    /**
     * Returns the specified RDFFormat. Currently supports Turtle, RDF/XML, and JSON-LD.
     *
     * @param format the abbreviated name of a RDFFormat
     * @return a RDFFormat object with the requested format
     */
    private RDFFormat getRDFFormat(String format) {
        RDFFormat rdfformat;
        switch (format) {
            case "turtle":
                rdfformat = RDFFormat.TURTLE;
                break;
            case "rdfxml":
                rdfformat = RDFFormat.RDFXML;
                break;
            case "jsonld":
            default:
                rdfformat = RDFFormat.JSONLD;
                break;
        }

        return rdfformat;
    }

    /**
     * Generates an InputStream with the first 10 lines of an uploaded CSV file.
     *
     * @param delimitedFile the uploaded CSV file
     * @param containsHeaders whether or not the uploaded CSV file has a header row
     * @return an InputStream object with the first 10 rows of the uploaded CSV file
     */
    private InputStream createCSVPreviewStream(File delimitedFile, boolean containsHeaders) {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (BufferedReader br = Files.newBufferedReader(delimitedFile.toPath())) {
            int numRows = (containsHeaders) ? NUM_LINE_PREVIEW + 1 : NUM_LINE_PREVIEW;
            for (int i = 0; i < numRows; i++) {
                byteArrayOutputStream.write(br.readLine().getBytes());
                byteArrayOutputStream.write("\n".getBytes());
            }
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error creating preview file", Response.Status.BAD_REQUEST);
        }

        return new ByteArrayInputStream(byteArrayOutputStream.toByteArray());
    }

    /**
     * Generates an InputStream with the first 10 lines of an uploaded delimited file.
     * 
     * @param delimitedFile the uploaded Excel file
     * @param containsHeaders whether or not the uploaded Excel file has a header row
     * @return an InputStream object with the first 10 rows of the uploaded Excel file
     */
    private InputStream createExcelPreviewStream(File delimitedFile, boolean containsHeaders) {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try {
            Workbook wb = WorkbookFactory.create(delimitedFile);
            // Only support single sheet files for now
            Sheet sheet = wb.getSheetAt(0);
            int numRows = (containsHeaders) ? NUM_LINE_PREVIEW + 1 : NUM_LINE_PREVIEW;
            for (int i = sheet.getPhysicalNumberOfRows() - 1; i >= numRows; i--) {
                sheet.removeRow(sheet.getRow(i));
            }
            wb.write(byteArrayOutputStream);
        } catch (IOException | InvalidFormatException e) {
            throw ErrorUtils.sendError("Error creating preview file", Response.Status.BAD_REQUEST);
        }

        return new ByteArrayInputStream(byteArrayOutputStream.toByteArray());
    }

    /**
     * Uploads the file in the InputStream to the specified path.
     *
     * @param fileInputStream a file in an InputStream
     * @param filePath the location to upload the file to
     */
    private void uploadFile(InputStream fileInputStream, Path filePath) {
        try {
            Files.copy(fileInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            fileInputStream.close();
        } catch (FileNotFoundException e) {
            throw ErrorUtils.sendError("Error writing delimited file", Response.Status.BAD_REQUEST);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        logger.info("File Uploaded: " + filePath);
    }

    /**
     * Converts the specified number rows of a CSV file into JSON and returns
     * them as a String.
     *
     * @param input the CSV file to convert into JSON
     * @param numRows the number of rows from the CSV file to convert
     * @param separator a character with the character to separate the columns by
     * @return a string with the JSON of the CSV rows
     * @throws IOException csv file could not be read
     */
    private String convertCSVRows(File input, int numRows, char separator) throws IOException {
        CSVReader reader = new CSVReader(new FileReader(input), separator);
        List<String[]> csvRows = reader.readAll();
        List<String[]> returnRows = new ArrayList<>();
        for (int i = 0; i <= numRows && i < csvRows.size(); i ++) {
            returnRows.add(i, csvRows.get(i));
        }

        Gson gson = new GsonBuilder().create();
        JSONObject json = new JSONObject();
        json.put("columnNumber", returnRows.get(0).length);
        json.put("rows", gson.toJson(returnRows));

        return json.toString();
    }

    /**
     * Converts the specified number of rows of a Excel file into JSON and returns
     * them as a String.
     *
     * @param input the Excel file to convert into JSON
     * @param numRows the number of rows from the Excel file to convert
     * @return a string with the JSON of the Excel rows
     * @throws IOException excel file could not be read
     * @throws InvalidFormatException file is not in a valid excel format
     */
    private String convertExcelRows(File input, int numRows) throws IOException, InvalidFormatException {
        Workbook wb = WorkbookFactory.create(input);
        // Only support single sheet files for now
        Sheet sheet = wb.getSheetAt(0);
        DataFormatter df = new DataFormatter();
        List<String[]> rowList = new ArrayList<>(sheet.getPhysicalNumberOfRows());
        String[] columns;
        for (Row row : sheet) {
            if (row.getRowNum() <= numRows) {
                columns = new String[row.getPhysicalNumberOfCells()];
                int index = 0;
                for (Cell cell : row) {
                    columns[index] = df.formatCellValue(cell);
                    index++;
                }
                rowList.add(columns);
            }
        }

        Gson gson = new GsonBuilder().create();
        JSONObject json = new JSONObject();
        json.put("columnNumber", rowList.size());
        json.put("rows", gson.toJson(rowList));

        return json.toString();
    }

    /**
     * Converts a MatOnto Model into a Sesame model.
     *
     * @param model a MatOnto Model for RDF data
     * @return a Sesame Model with RDF statements
    */
    private Model sesameModel(org.matonto.rdf.api.Model model) {
        Set<Statement> statements = model.stream()
                .map(Values::sesameStatement)
                .collect(Collectors.toSet());

        Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(statements);

        return sesameModel;
    }

    /**
     * Convert Sesame model to MatOnto model.
     *
     * @param model A Sesame Model
     * @return A Matonto Model
     */
    protected org.matonto.rdf.api.Model matontoModel(org.openrdf.model.Model model) {
        Set<org.matonto.rdf.api.Statement> stmts = model.stream()
                .map(Values::matontoStatement)
                .collect(Collectors.toSet());

        return modelFactory.createModel(stmts);
    }

    /**
     * Creates a UUID string.
     *
     * @return a string with a UUID
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }
}
