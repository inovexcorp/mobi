package org.matonto.etl.rest.impl;

/*-
 * #%L
 * org.matonto.etl.rest
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

import static java.nio.file.FileVisitResult.CONTINUE;
import static org.matonto.rest.util.RestUtils.getRDFFormat;
import static org.matonto.rest.util.RestUtils.modelToString;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import net.sf.json.JSONArray;
import org.apache.commons.io.FilenameUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.rest.DelimitedRest;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.CharsetUtils;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class DelimitedRestImpl implements DelimitedRest {
    private DelimitedConverter converter;
    private MappingManager mappingManager;
    private ValueFactory factory;
    private final Logger logger = LoggerFactory.getLogger(DelimitedRestImpl.class);
    private SesameTransformer transformer;

    private static final long NUM_LINE_PREVIEW = 10;

    public static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/org.matonto.etl.rest.impl.tmp";

    @Reference
    public void setDelimitedConverter(DelimitedConverter delimitedConverter) {
        this.converter = delimitedConverter;
    }

    @Reference
    public void setMappingManager(MappingManager manager) {
        this.mappingManager = manager;
    }

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Activate
    protected void start() throws IOException {
        deleteDirectory(Paths.get(TEMP_DIR));
        Files.createDirectory(Paths.get(TEMP_DIR));
    }

    @Deactivate
    protected void stop() throws IOException {
        deleteDirectory(Paths.get(TEMP_DIR));
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail) {
        ByteArrayOutputStream fileOutput;
        try {
            fileOutput = toByteArrayOutputStream(fileInputStream);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        getCharset(fileOutput.toByteArray());

        String fileName = generateUuid();
        String extension = FilenameUtils.getExtension(fileDetail.getFileName());
        Path filePath = Paths.get(TEMP_DIR + "/" + fileName + "." + extension);

        saveStreamToFile(new ByteArrayInputStream(fileOutput.toByteArray()), filePath);
        return Response.status(200).entity(filePath.getFileName().toString()).build();
    }

    @Override
    public Response upload(InputStream fileInputStream, String fileName) {
        ByteArrayOutputStream fileOutput;
        try {
            fileOutput = toByteArrayOutputStream(fileInputStream);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        getCharset(fileOutput.toByteArray());

        Path filePath = Paths.get(TEMP_DIR + "/" + fileName);
        saveStreamToFile(new ByteArrayInputStream(fileOutput.toByteArray()), filePath);
        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response etlFilePreview(String fileName, String jsonld, String format, boolean containsHeaders,
                                   String separator) {
        if (jsonld == null || jsonld.equals("")) {
            throw ErrorUtils.sendError("Must provide a JSON-LD string", Response.Status.BAD_REQUEST);
        }

        File delimitedFile = getUploadedFile(fileName).orElseThrow(() ->
                ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST));
        String extension = FilenameUtils.getExtension(delimitedFile.getName());

        // Parse JSON-LD mapping into a model
        Model mappingModel;
        try {
            InputStream in = new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8));
            mappingModel = Rio.parse(in, "", RDFFormat.JSONLD);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error converting mapping JSON-LD", Response.Status.BAD_REQUEST);
        }

        String result;
        InputStream data = getDocumentInputStream(delimitedFile);
        if (extension.equals("xls") || extension.equals("xlsx")) {
            ExcelConfig config = new ExcelConfig.Builder(data, transformer.matontoModel(mappingModel))
                    .containsHeaders(containsHeaders)
                    .limit(NUM_LINE_PREVIEW)
                    .build();
            result = etlFile(format, () -> converter.convert(config));
        } else {
            SVConfig config = new SVConfig.Builder(data, transformer.matontoModel(mappingModel))
                    .containsHeaders(containsHeaders)
                    .separator(separator.charAt(0))
                    .limit(NUM_LINE_PREVIEW)
                    .build();
            result = etlFile(format, () -> converter.convert(config));
        }

        // Write data back to Response
        logger.info("File mapped: " + delimitedFile.getPath());
        return Response.status(200).entity(result).build();
    }

    @Override
    public Response etlFile(String fileName, String mappingIRI, String format, boolean containsHeaders,
                            String separator, String downloadFileName) {
        if (mappingIRI == null || mappingIRI.equals("")) {
            throw ErrorUtils.sendError("Must provide the name of an uploaded mapping", Response.Status.BAD_REQUEST);
        }

        File delimitedFile = getUploadedFile(fileName).orElseThrow(() ->
                ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST));
        String extension = FilenameUtils.getExtension(delimitedFile.getName());

        // Collect uploaded mapping model
        Model mappingModel;
        Resource mappingId = mappingManager.createMappingId(factory.createIRI(mappingIRI)).getMappingIdentifier();
        Optional<MappingWrapper> mappingOptional = mappingManager.retrieveMapping(mappingId);
        if (mappingOptional.isPresent()) {
            mappingModel = transformer.sesameModel(mappingOptional.get().getModel());
        } else {
            throw ErrorUtils.sendError("Mapping " + mappingId + " does not exist",
                    Response.Status.BAD_REQUEST);
        }

        String result;
        InputStream data = getDocumentInputStream(delimitedFile);
        if (extension.equals("xls") || extension.equals("xlsx")) {
            ExcelConfig config = new ExcelConfig.Builder(data, transformer.matontoModel(mappingModel))
                    .containsHeaders(containsHeaders)
                    .build();
            result = etlFile(format, () -> converter.convert(config));
        } else {
            SVConfig config = new SVConfig.Builder(data, transformer.matontoModel(mappingModel))
                    .containsHeaders(containsHeaders)
                    .separator(separator.charAt(0))
                    .build();
            result = etlFile(format, () -> converter.convert(config));
        }
        logger.info("File mapped: " + delimitedFile.getPath());

        // Write data into a stream
        StreamingOutput stream = os -> {
            Writer writer = new BufferedWriter(new OutputStreamWriter(os));
            writer.write(result);
            writer.flush();
            writer.close();
        };
        String fileExtension = getRDFFormat(format).getDefaultFileExtension();
        String mimeType = getRDFFormat(format).getDefaultMIMEType();
        String dataFileName = downloadFileName == null ? fileName : downloadFileName;
        Response response = Response.ok(stream).header("Content-Disposition", "attachment;filename=" + dataFileName
                +  "." + fileExtension).header("Content-Type", mimeType).build();

        // Remove temp file
        try {
            Files.deleteIfExists(Paths.get(TEMP_DIR + "/" + fileName));
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Error deleting delimited file", Response.Status.BAD_REQUEST);
        }

        return response;
    }

    /**
     * A supplier for the result of running a conversion using a ExcelConfig or a SVConfig.
     *
     * @param <T> The type of the result of the conversion
    */
    private interface SupplierWithException<T> {
        T get() throws IOException;
    }

    /**
     * Converts delimited SV data in an InputStream into RDF and then writes the result into a string.
     *
     * @param format the RDF serialization to return the data as
     * @param supplier the supplier for getting the result of running a conversion using a Config
     * @return a string with the delimited data converted into RDF
     */
    private String etlFile(String format, SupplierWithException<org.matonto.rdf.api.Model> supplier) {
        // Convert InputStream to RDF
        Model model;
        try {
            model = transformer.sesameModel(supplier.get());
        } catch (IOException | MatOntoException e) {
            throw ErrorUtils.sendError(e, "Error converting delimited file", Response.Status.BAD_REQUEST);
        }
        return modelToString(model, format);
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
            throw ErrorUtils.sendError("Document not found", Response.Status.NOT_FOUND);
        }
    }

    /**
     * Finds the uploaded delimited file with the specified name.
     *
     * @param fileName the name of the uploaded delimited file
     * @return the uploaded file if it was found
     */
    private Optional<File> getUploadedFile(String fileName) {
        Path filePath = Paths.get(TEMP_DIR + "/" + fileName);
        if (Files.exists(filePath)) {
            return Optional.of(new File(filePath.toUri()));
        } else {
            return Optional.empty();
        }
    }

    /**
     * Saves the contents of the InputStream to the specified path.
     *
     * @param fileInputStream a file in an InputStream
     * @param filePath the location to upload the file to
     */
    private void saveStreamToFile(InputStream fileInputStream, Path filePath) {
        try {
            Files.copy(fileInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            fileInputStream.close();
        } catch (FileNotFoundException e) {
            throw ErrorUtils.sendError(e, "Error writing delimited file", Response.Status.BAD_REQUEST);
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Error parsing delimited file", Response.Status.BAD_REQUEST);
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
        Charset charset = getCharset(Files.readAllBytes(input.toPath()));
        CSVReader reader = new CSVReader(new InputStreamReader(new FileInputStream(input), charset.name()), separator);
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
     * Creates a ByteArrayOutputStream from an InputStream so it can be reused.
     *
     * @param in the InputStream to convert
     * @return a ByteArrayOutputStream with the contents of the InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    private ByteArrayOutputStream toByteArrayOutputStream(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int read = 0;
        while ((read = in.read(buffer, 0, buffer.length)) != -1) {
            baos.write(buffer, 0, read);
            baos.flush();
        }
        return baos;
    }

    /**
     * Retrieves the supported charset of a file in byte array form.
     *
     * @param bytes the bytes from a file to grab the charset of
     * @return the charset of the byte array
     */
    private Charset getCharset(byte[] bytes) {
        Charset charset;
        Optional<Charset> optCharset = CharsetUtils.getEncoding(bytes);
        if (optCharset.isPresent()) {
            charset = optCharset.get();
        } else {
            throw ErrorUtils.sendError("Delimited file is not in a supported encoding", Response.Status.BAD_REQUEST);
        }

        return charset;
    }

    /**
     * Creates a UUID string.
     *
     * @return a string with a UUID
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }

    private void deleteDirectory(Path dir) throws IOException {
        if (Files.exists(dir)) {
            Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    if (exc == null) {
                        Files.delete(dir);
                        return CONTINUE;
                    } else {
                        throw exc;
                    }
                }
            });
        }
    }

    private InputStream getDocumentInputStream(File delimited) {
        // Get InputStream for data to convert
        InputStream data;
        try {
            data = new FileInputStream(delimited);
        } catch (FileNotFoundException e) {
            throw ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST);
        }
        return data;
    }
}
