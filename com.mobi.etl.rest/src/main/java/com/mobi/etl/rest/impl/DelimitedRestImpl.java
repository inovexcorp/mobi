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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static java.nio.file.FileVisitResult.CONTINUE;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.rest.DelimitedRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.rest.util.CharsetUtils;
import com.mobi.rest.util.ErrorUtils;
import com.opencsv.CSVReader;
import net.sf.json.JSONArray;
import org.apache.commons.io.FilenameUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
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
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class DelimitedRestImpl implements DelimitedRest {
    private DelimitedConverter converter;
    private MappingManager mappingManager;
    private ValueFactory vf;
    private DatasetManager datasetManager;
    private RepositoryManager repositoryManager;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private VersioningManager versioningManager;
    private EngineManager engineManager;

    private final Logger logger = LoggerFactory.getLogger(DelimitedRestImpl.class);
    private SesameTransformer transformer;

    private static final long NUM_LINE_PREVIEW = 10;

    public static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/com.mobi.etl.rest.impl.tmp";

    @Reference
    public void setDelimitedConverter(DelimitedConverter delimitedConverter) {
        this.converter = delimitedConverter;
    }

    @Reference
    public void setMappingManager(MappingManager manager) {
        this.mappingManager = manager;
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    protected void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    protected void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
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
        return Response.status(201).entity(filePath.getFileName().toString()).build();
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
        return Response.ok(fileName).build();
    }

    @Override
    public Response etlFilePreview(String fileName, String jsonld, String format, boolean containsHeaders,
                                   String separator) {
        checkStringParam(jsonld, "Must provide a JSON-LD string");

        // Convert the data
        Model data = etlFile(fileName, () -> jsonldToModel(jsonld, transformer), containsHeaders, separator, true);

        return Response.ok(groupedModelToString(data, format, transformer)).build();
    }

    @Override
    public Response etlFile(String fileName, String mappingRecordIRI, String format, boolean containsHeaders,
                            String separator, String downloadFileName) {
        checkStringParam(mappingRecordIRI, "Must provide the IRI of a mapping record");

        // Convert the data
        Model data = etlFile(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders, separator, false);
        String result = groupedModelToString(data, format, transformer);

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
        removeTempFile(fileName);

        return response;
    }

    @Override
    public Response etlFile(String fileName, String mappingRecordIRI, String datasetRecordIRI, boolean containsHeaders,
                            String separator) {
        checkStringParam(mappingRecordIRI, "Must provide the IRI of a mapping record");
        checkStringParam(datasetRecordIRI, "Must provide the IRI of a dataset record");

        // Collect the DatasetRecord
        DatasetRecord record = datasetManager.getDatasetRecord(vf.createIRI(datasetRecordIRI)).orElseThrow(() ->
                ErrorUtils.sendError("Dataset " + datasetRecordIRI + " does not exist", Response.Status.BAD_REQUEST));

        // Convert the data
        Model data = etlFile(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                separator, false);

        // Add data to the dataset
        String repositoryId = record.getRepository().orElseThrow(() ->
                ErrorUtils.sendError("Record has no repository set", Response.Status.INTERNAL_SERVER_ERROR));
        Resource datasetIri = record.getDataset_resource().orElseThrow(() ->
                ErrorUtils.sendError("Record has no Dataset set", Response.Status.INTERNAL_SERVER_ERROR));
        Repository repository = repositoryManager.getRepository(repositoryId)
                .orElseThrow(() -> ErrorUtils.sendError("Repository is not available.", Response.Status.BAD_REQUEST));
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(datasetIri,
                    vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), null);
            if (statements.hasNext()) {
                Resource context = (Resource) statements.next().getObject();
                conn.add(data, context);
            } else {
                throw ErrorUtils.sendError("Dataset has no system default named graph",
                        Response.Status.INTERNAL_SERVER_ERROR);
            }
        } catch (RepositoryException ex) {
            throw ErrorUtils.sendError("Error in repository connection", Response.Status.INTERNAL_SERVER_ERROR);
        }

        // Remove temp file
        removeTempFile(fileName);

        return Response.ok().build();
    }

    @Override
    public Response etlFileOntology(ContainerRequestContext context, String fileName, String mappingRecordIRI,
                                    String ontologyRecordIRI, boolean containsHeaders, String separator) {
        checkStringParam(mappingRecordIRI, "Must provide the IRI of a mapping record");
        checkStringParam(ontologyRecordIRI, "Must provide the IRI of an ontology record");

        User user = getActiveUser(context, engineManager);

        OntologyRecord record = catalogManager.getRecord(configProvider.getLocalCatalogIRI(),
                vf.createIRI(ontologyRecordIRI), ontologyRecordFactory).orElseThrow(() ->
                ErrorUtils.sendError("OntologyRecord " + ontologyRecordIRI + " does not exist",
                        Response.Status.BAD_REQUEST));

        // Convert the data
        Model data = etlFile(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                separator, false);

        Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() -> ErrorUtils.sendError(
                "OntologyRecord " + ontologyRecordIRI + " master branch cannot be found.", Response.Status.BAD_REQUEST));
        versioningManager.commit(configProvider.getLocalCatalogIRI(), record.getResource(), masterBranchId, user,
                "Mapping data from " + fileName, data, null);

        // Remove temp file
        removeTempFile(fileName);

        return Response.ok().build();
    }

    /**
     * Returns the result of an ETL operation against the file with the passed name using the mapping supplied by the
     * passed function.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingSupplier the supplier for getting a mapping model
     * @param containsHeaders whether the delimited file has headers
     * @param separator the character the columns are separated by if it is a CSV
     * @return a Mobi Model with the resulting mapped RDF data
     */
    private Model etlFile(String fileName, SupplierWithException<Model> mappingSupplier,
                                              boolean containsHeaders, String separator, boolean limit) {
        // Collect the delimited file and its extension
        File delimitedFile = getUploadedFile(fileName).orElseThrow(() ->
                ErrorUtils.sendError("Document not found", Response.Status.BAD_REQUEST));
        String extension = FilenameUtils.getExtension(delimitedFile.getName());

        // Collect the mapping model
        Model mappingModel;
        try {
            mappingModel = mappingSupplier.get();
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error converting mapping JSON-LD", Response.Status.BAD_REQUEST);
        }

        // Run the mapping against the delimited data
        try (InputStream data = getDocumentInputStream(delimitedFile)) {
            Model result;
            if (extension.equals("xls") || extension.equals("xlsx")) {
                ExcelConfig.ExcelConfigBuilder config = new ExcelConfig.ExcelConfigBuilder(data, mappingModel)
                        .containsHeaders(containsHeaders);
                if (limit) {
                    config.limit(NUM_LINE_PREVIEW);
                }
                result = etlFile(() -> converter.convert(config.build()));
            } else {
                SVConfig.SVConfigBuilder config = new SVConfig.SVConfigBuilder(data, mappingModel)
                        .separator(separator.charAt(0))
                        .containsHeaders(containsHeaders);
                if (limit) {
                    config.limit(NUM_LINE_PREVIEW);
                }
                result = etlFile(() -> converter.convert(config.build()));
            }
            logger.info("File mapped: " + delimitedFile.getPath());
            return result;
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Exception reading ETL file", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Converts delimited SV data in an InputStream into RDF.
     *
     * @param supplier the supplier for getting the result of running a conversion using a Config
     * @return a Mobi Model with the delimited data converted into RDF
     */
    private Model etlFile(SupplierWithException<Model> supplier) {
        try {
            return supplier.get();
        } catch (IOException | MobiException e) {
            throw ErrorUtils.sendError(e, "Error converting delimited file", Response.Status.BAD_REQUEST);
        }
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

            return Response.ok(json).build();
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
        try (CSVReader reader = new CSVReader(new InputStreamReader(new FileInputStream(input), charset.name()),
                separator)) {
            List<String[]> csvRows = reader.readAll();
            JSONArray returnRows = new JSONArray();
            for (int i = 0; i <= numRows && i < csvRows.size(); i++) {
                returnRows.add(i, csvRows.get(i));
            }
            return returnRows.toString();
        }
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
        try (Workbook wb = WorkbookFactory.create(input)) {
            // Only support single sheet files for now
            FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            JSONArray rowList = new JSONArray();
            String[] columns;
            for (Row row : sheet) {
                if (row.getRowNum() <= numRows) {
                    //getLastCellNumber instead of getPhysicalNumberOfCells so that blank values don't shift cells
                    columns = new String[row.getLastCellNum()];
                    for (int i = 0; i < row.getLastCellNum(); i++ ) {
                        columns[i] = df.formatCellValue(row.getCell(i), evaluator);
                    }
                    rowList.add(columns);
                }
            }
            return rowList.toString();
        }
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

    /**
     * Retrieves a Sesame Model of an uploaded mapping by its IRI.
     *
     * @param mappingRecordIRI the IRI of a mapping
     * @return a Sesame Model with a mapping
     */
    private Model getUploadedMapping(String mappingRecordIRI) {
        // Collect uploaded mapping model
        MappingWrapper mapping = mappingManager.retrieveMapping(vf.createIRI(mappingRecordIRI)).orElseThrow(() ->
                ErrorUtils.sendError("Mapping " + mappingRecordIRI + " does not exist", Response.Status.BAD_REQUEST));
        return mapping.getModel();
    }

    private void removeTempFile(String fileName) {
        try {
            Files.deleteIfExists(Paths.get(TEMP_DIR + "/" + fileName));
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Error deleting delimited file", Response.Status.BAD_REQUEST);
        }
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

    /**
     * A supplier for the result of running a conversion using a ExcelConfig or a SVConfig.
     *
     * @param <T> The type of the result of the conversion
     */
    private interface SupplierWithException<T> {
        T get() throws IOException;
    }
}
