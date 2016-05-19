package org.matonto.etl.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import net.sf.json.JSONArray;
import org.apache.commons.io.FilenameUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.api.csv.MappingManager;
import org.matonto.etl.rest.CSVRest;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.Model;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class CSVRestImpl implements CSVRest {

    private CSVConverter csvConverter;
    private MappingManager mappingManager;
    private final Logger logger = LoggerFactory.getLogger(CSVRestImpl.class);

    private static final int NUM_LINE_PREVIEW = 10;

    @Reference
    public void setCsvConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
    }

    @Reference
    public void setMappingManager(MappingManager manager) {
        this.mappingManager = manager;
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
        String newExtension = FilenameUtils.getExtension(fileDetail.getFileName());
        Optional<File> optDelimitedFile = getUploadedFile(fileName);
        Path filePath;
        if (optDelimitedFile.isPresent()) {
            File delimitedFile = optDelimitedFile.get();
            if (!newExtension.equals(FilenameUtils.getExtension(delimitedFile.getName()))) {
                delimitedFile.delete();
                delimitedFile = new File("data/tmp/" + fileName + "." + newExtension);
            }
            filePath = delimitedFile.toPath();
        } else {
            filePath = Paths.get("data/tmp/" + fileName + "." + newExtension);
        }
        uploadFile(fileInputStream, filePath);
        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response etlFilePreview(String fileName, String mappingRdf, String format, boolean containsHeaders,
                            String separator) {
        if (mappingRdf == null || mappingRdf.equals("")) {
            throw ErrorUtils.sendError("Must provide a JSON-LD string", Response.Status.BAD_REQUEST);
        }

        Optional<File> optDelimitedFile = getUploadedFile(fileName);
        if (optDelimitedFile.isPresent()) {
            File delimitedFile = optDelimitedFile.get();
            String extension = FilenameUtils.getExtension(delimitedFile.getName());

            // Get InputStream for data to convert
            InputStream dataToConvert = (extension.equals("xls") || extension.equals("xlsx"))
                    ? createExcelPreviewStream(delimitedFile, containsHeaders)
                    : createCSVPreviewStream(delimitedFile, containsHeaders);

            // Parse JSON-LD mapping into a model
            Model mappingModel;
            try {
                InputStream in = new ByteArrayInputStream(mappingRdf.getBytes(StandardCharsets.UTF_8));
                mappingModel = Rio.parse(in, "", RDFFormat.JSONLD);
            } catch (IOException e) {
                throw ErrorUtils.sendError("Error converting mapping JSON-LD", Response.Status.BAD_REQUEST);
            }

            // Write data back to Response
            String result = etlFile(dataToConvert, mappingModel, extension, containsHeaders, separator, format);
            logger.info("File mapped: " + delimitedFile.getPath());
            return Response.status(200).entity(result).build();
        } else {
            throw ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response etlFile(String fileName, String mappingLocalName, String format, boolean containsHeaders,
                            String separator) {
        System.out.println("Inside method with " + fileName + ", " + mappingLocalName + ", " + format
            + ", " + containsHeaders + ", and " + separator);
        if (mappingLocalName == null || mappingLocalName.equals("")) {
            throw ErrorUtils.sendError("Must provide the name of an uploaded mapping", Response.Status.BAD_REQUEST);
        }
        Optional<File> optDelimitedFile = getUploadedFile(fileName);
        if (optDelimitedFile.isPresent()) {
            File delimitedFile = optDelimitedFile.get();
            String extension = FilenameUtils.getExtension(delimitedFile.getName());

            // Get InputStream for data to convert
            InputStream dataToConvert;
            try {
                dataToConvert = new FileInputStream(delimitedFile);
            } catch (FileNotFoundException e) {
                throw ErrorUtils.sendError(e, "Error locating delimited file", Response.Status.BAD_REQUEST);
            }

            // Collect uploaded mapping model
            Model mappingModel;
            Resource mappingIRI = mappingManager.createMappingIRI(mappingLocalName);
            Optional<org.matonto.rdf.api.Model> mappingOptional = mappingManager.retrieveMapping(mappingIRI);
            if (mappingOptional.isPresent()) {
                mappingModel = Values.sesameModel(mappingOptional.get());
            } else {
                throw ErrorUtils.sendError("Mapping " + mappingIRI + " does not exist",
                        Response.Status.BAD_REQUEST);
            }

            String result = etlFile(dataToConvert, mappingModel, extension, containsHeaders, separator, format);
            logger.info("File mapped: " + delimitedFile.getPath());

            // Write data into a stream
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(result);
                writer.flush();
                writer.close();
            };
            String fileExtension = getRDFFormat(format).getDefaultFileExtension();
            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName +  "."
                    + fileExtension).build();
        } else {
            throw ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Converts delimited data in an InputStream into RDF and then writes the result into a string.
     *
     * @param delimitedData an InputStream of delimited data
     * @param mapping a mapping for delimited data in RDF
     * @param extension the file extension of the delimited data
     * @param containsHeaders whether or not the delimited data contains a header row
     * @param separator the separator of columns in the delimited data if it's a CSV
     * @param format the RDF serialization to return the data as
     * @return a string with the delimited data converted into RDF
     */
    private String etlFile(InputStream delimitedData, Model mapping, String extension, boolean containsHeaders,
                           String separator, String format) {
        char separatorChar = separator.charAt(0);

        // Convert InputStream to RDF
        Model model;
        try {
            model = Values.sesameModel(csvConverter.convert(delimitedData,
                    Values.matontoModel(mapping), containsHeaders, extension, separatorChar));
        } catch (IOException | MatOntoException e) {
            throw ErrorUtils.sendError(e, "Error converting delimited file", Response.Status.BAD_REQUEST);
        }
        StringWriter sw = new StringWriter();
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(getRDFFormat(format), sw));
        Rio.write(model, rdfWriter);
        return sw.toString();
    }

    @Override
    public Response getRows(String fileName, int rowEnd, String separator) {
        Optional<File> optFile = getUploadedFile(fileName);
        if (optFile.isPresent()) {
            File file = optFile.get();
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
        } else {
            throw ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Finds the uploaded delimited file with the specified name.
     *
     * @param fileName the name of the uploaded delimited file
     * @return the uploaded file if it was found
     */
    private Optional<File> getUploadedFile(String fileName) {
        File directory = new File("data/tmp");
        File[] files = directory.listFiles((dir, name) -> {
            return name.startsWith(fileName + ".");
        });
        if (files.length == 0) {
            return Optional.empty();
        }
        if (files.length > 1) {
            throw ErrorUtils.sendError("Multiple files exist with same name", Response.Status.BAD_REQUEST);
        }

        return Optional.of(files[0]);
    }

    /**
     * Returns the specified RDFFormat. Currently supports Turtle, RDF/XML, and JSON-LD.
     *
     * @param format the abbreviated name of a RDFFormat
     * @return a RDFFormat object with the requested format
     */
    private RDFFormat getRDFFormat(String format) {
        RDFFormat rdfformat;
        switch (format.toLowerCase()) {
            case "turtle":
                rdfformat = RDFFormat.TURTLE;
                break;
            case "rdf/xml":
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
            int index = 0;
            int numRows = (containsHeaders) ? NUM_LINE_PREVIEW + 1 : NUM_LINE_PREVIEW;
            String line;
            while ((line = br.readLine()) != null && index < numRows) {
                byteArrayOutputStream.write(line.getBytes());
                byteArrayOutputStream.write("\n".getBytes());
                index++;
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
        JSONArray returnRows = new JSONArray();
        for (int i = 0; i <= numRows && i < csvRows.size(); i ++) {
            returnRows.add(i, csvRows.get(i));
        }

        return returnRows.toString();
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
        JSONArray rowList = new JSONArray();
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

        return rowList.toString();
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
