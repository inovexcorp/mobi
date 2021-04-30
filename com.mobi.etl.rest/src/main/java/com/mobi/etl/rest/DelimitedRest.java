package com.mobi.etl.rest;

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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.CharsetUtils;
import com.mobi.rest.util.ErrorUtils;
import com.opencsv.CSVReader;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
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
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(service = DelimitedRest.class, immediate = true)
@javax.ws.rs.Path("/delimited-files")
public class DelimitedRest {
    private DelimitedConverter converter;
    private MappingManager mappingManager;
    private ValueFactory vf;
    private EngineManager engineManager;
    private RDFImportService rdfImportService;
    private OntologyImportService ontologyImportService;

    private final Logger logger = LoggerFactory.getLogger(DelimitedRest.class);
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
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setRdfImportService(RDFImportService rdfImportService) {
        this.rdfImportService = rdfImportService;
    }

    @Reference
    void setOntologyImportService(OntologyImportService ontologyImportService) {
        this.ontologyImportService = ontologyImportService;
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

    /**
     * Uploads a delimited document to the temp directory.
     *
     * @param fileInputStream an InputStream of a delimited document passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @return Response with the name of the file created on the server
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "Upload delimited file sent as form data",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the name of the file created on the server"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
            }
    )
    public Response upload(
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "InputStream of a delimited document passed as form data", required = true))
            @FormDataParam("delimitedFile") InputStream fileInputStream,
            @Parameter(schema = @Schema(type = "string",
                    description = "Information about the file being uploaded, including the name"), hidden = true)
            @FormDataParam("delimitedFile") FormDataContentDisposition fileDetail) {
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

    /**
     * Replaces an uploaded delimited document in the temp directory with another
     * delimited file.
     *
     * @param fileInputStream an InputStream of a delimited document passed as form data
     * @param fileName Name of the uploaded file on the server to replace
     * @return Response with the name of the file replaced on the server
     */
    @PUT
    @javax.ws.rs.Path("{documentName}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "Replace an uploaded delimited file with another",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the name of the file replaced on the server"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
            }
    )
    public Response upload(
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "InputStream of a delimited document passed as form data", required = true))
            @FormDataParam("delimitedFile") InputStream fileInputStream,
            @Parameter(schema = @Schema(type = "string",
                    description = "Name of the uploaded file on the server to replace", required = true))
            @PathParam("documentName") String fileName) {
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

    /**
     * Maps the data in an uploaded delimited document into RDF in the requested format
     * using a JSON-LD mapping string. The file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param jsonld a mapping in JSON-LD
     * @param format the RDF serialization to use if getting a preview
     * @param containsHeaders whether the delimited file has headers
     * @param separator Character the columns are separated by if it is a CSV
     * @return a Response with a JSON object containing the mapping file name and a
     *      string containing the converted data in the requested format
     */
    @POST
    @javax.ws.rs.Path("{documentName}/map-preview")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "ETL an uploaded delimited document using mapping JSON-LD",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with a JSON object containing the mapping "
                            + "file name and a string containing the converted data in the requested format"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
            }
    )
    public Response etlFilePreview(
            @Parameter(description = "Name of the delimited document in the data/tmp/ directory", required = true)
            @PathParam("documentName") String fileName,
            @Parameter(schema = @Schema(type = "string",
                    description = "Mapping in JSON-LD", required = true))
            @FormDataParam("jsonld") String jsonld,
            @Parameter(description = "RDF serialization to use if getting a preview")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Whether the delimited file has headers")
            @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
            @Parameter(description = "Character the columns are separated by if it is a CSV")
            @DefaultValue(",") @QueryParam("separator") String separator) {
        checkStringParam(jsonld, "Must provide a JSON-LD string");

        // Convert the data
        Model data = etlFile(fileName, () -> jsonldToModel(jsonld, transformer), containsHeaders, separator, true);

        return Response.ok(groupedModelToString(data, format, transformer)).build();
    }

    /**
     * Maps the data in an uploaded delimited document into RDF in the requested format
     * using a MappingRecord's Mapping and downloads the result in a file with the requested
     * name. The file must be present in the data/tmp/ directory.
     *
     * @param fileName Name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI ID of  the MappingRecord
     * @param format RDF serialization to use
     * @param containsHeaders Whether the delimited file has headers
     * @param separator Character the columns are separated by if it is a CSV
     * @param downloadFileName Name for the downloaded file
     * @return Response with the converted data in the requested format to download
     */
    @GET
    @javax.ws.rs.Path("{documentName}/map")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "ETL an uploaded delimited document using an uploaded Mapping file and download the data",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the converted data in the requested format to download"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
            }
    )
    public Response etlFile(
            @Parameter(description = "Name of the delimited document in the data/tmp/ directory", required = true)
            @PathParam("documentName") String fileName,
            @Parameter(description = "ID of the MappingRecord", required = true)
            @QueryParam("mappingRecordIRI") String mappingRecordIRI,
            @Parameter(description = "RDF serialization to use")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Whether the delimited file has headers")
            @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
            @Parameter(description = "Character the columns are separated by if it is a CSV")
            @DefaultValue(",") @QueryParam("separator") String separator,
            @Parameter(description = "Name for the downloaded file", required = true)
            @QueryParam("fileName") String downloadFileName) {
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

    /**
     * Maps the data in an uploaded delimited document into RDF using a MappingRecord's Mapping and
     * adds it to the system default named graph of the requested DatasetRecord's Dataset. The
     * file must be present in the data/tmp/ directory.
     *
     * @param fileName Name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI ID of  the MappingRecord
     * @param datasetRecordIRI ID of  the DatasetRecord
     * @param containsHeaders Whether the delimited file has headers
     * @param separator Character the columns are separated by if it is a CSV
     * @return a Response indicating the success of the request
     */
    @POST
    @javax.ws.rs.Path("{documentName}/map")
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "ETL an uploaded delimited document using an uploaded Mapping file and load data into a Dataset",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response etlFile(
            @Parameter(description = "Name of the delimited document in the data/tmp/ directory", required = true)
            @PathParam("documentName") String fileName,
            @Parameter(description = "ID (IRI) of the MappingRecord", required = true)
            @QueryParam("mappingRecordIRI") String mappingRecordIRI,
            @Parameter(description = "ID (IRI) of the DatasetRecord", required = true)
            @QueryParam("datasetRecordIRI") String datasetRecordIRI,
            @Parameter(description = "Whether the delimited file has headers")
            @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
            @Parameter(description = "Character the columns are separated by if it is a CSV")
            @DefaultValue(",") @QueryParam("separator") String separator) {
        checkStringParam(mappingRecordIRI, "Must provide the IRI of a mapping record");
        checkStringParam(datasetRecordIRI, "Must provide the IRI of a dataset record");

        // Convert the data
        Model data = etlFile(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                separator, false);

        // Add data to the dataset
        ImportServiceConfig config = new ImportServiceConfig.Builder().dataset(vf.createIRI(datasetRecordIRI))
                .logOutput(true)
                .build();
        try {
            rdfImportService.importModel(config, data);
        } catch (RepositoryException ex) {
            throw ErrorUtils.sendError("Error in repository connection", Response.Status.INTERNAL_SERVER_ERROR);
        }

        // Remove temp file
        removeTempFile(fileName);

        return Response.ok().build();
    }

    /**
     * Maps the data in an uploaded delimited document into RDF using a MappingRecord's Mapping and
     * adds it as a commit onto the specified OntologyRecord. The file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI ID of the MappingRecord
     * @param ontologyRecordIRI ID of the DatasetRecord
     * @param branchIRI ID of the BranchRecord
     * @param update whether to treat the mapped data as an update or new additions
     * @param containsHeaders Whether the delimited file has headers
     * @param separator Character the columns are separated by if it is a CSV
     * @return a Response indicating the success of the request
     */
    @POST
    @javax.ws.rs.Path("{documentName}/map-to-ontology")
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "ETL an uploaded delimited document using an uploaded Mapping file "
                    + "and commit it to an OntologyRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "204",
                            description = "No data committed. Possible duplicate data."),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(type = ValueType.QUERY, id = OntologyRecord.branch_IRI, value = "branchIRI")
    )
    @ResourceId(type = ValueType.QUERY, value = "ontologyRecordIRI")
    public Response etlFileOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "Name of the delimited document in the data/tmp/ directory", required = true)
            @PathParam("documentName") String fileName,
            @Parameter(description = "ID of  the MappingRecord", required = true)
            @QueryParam("mappingRecordIRI") String mappingRecordIRI,
            @Parameter(description = "ID of the DatasetRecord", required = true)
            @QueryParam("ontologyRecordIRI") String ontologyRecordIRI,
            @Parameter(description = "ID of the BranchRecord", required = true)
            @QueryParam("branchIRI") String branchIRI,
            @Parameter(description = "Whether to treat the mapped data as an update or new additions")
            @DefaultValue("false") @QueryParam("update") boolean update,
            @Parameter(description = "Whether the delimited file has headers")
            @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
            @Parameter(description = "Character the columns are separated by if it is a CSV")
            @DefaultValue(",") @QueryParam("separator") String separator) {
        checkStringParam(mappingRecordIRI, "Must provide the IRI of a mapping record");
        checkStringParam(ontologyRecordIRI, "Must provide the IRI of an ontology record");
        checkStringParam(branchIRI, "Must provide the IRI of an ontology branch");

        // Convert the data
        Model mappingData = etlFile(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                separator, false);

        // Commit converted data
        IRI branchId = vf.createIRI(branchIRI);
        IRI recordIRI = vf.createIRI(ontologyRecordIRI);
        User user = getActiveUser(context, engineManager);
        String commitMsg = "Mapping data from " + mappingRecordIRI;
        Difference committedData = ontologyImportService.importOntology(recordIRI,
                branchId, update, mappingData, user, commitMsg);

        Response response;
        if (committedData.getAdditions().isEmpty() && committedData.getDeletions().isEmpty()) {
            response = Response.status(204).entity("No data committed. Possible duplicate data.").build();
        } else {
            response = Response.ok().build();
        }

        // Remove temp file
        removeTempFile(fileName);

        return response;
    }

    /**
     * Returns the result of an ETL operation against the file with the passed name using the mapping supplied by the
     * passed function.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingSupplier the supplier for getting a mapping model
     * @param containsHeaders whether the delimited file has headers
     * @param separator Character the columns are separated by if it is a CSV
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

    /**
     * Retrieves a preview of the first specified number of rows of an uploaded
     * delimited document using the specified separator. The file must be present
     * in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param rowEnd the number of rows to retrieve from the delimited document. NOTE:
     *               the default number of rows is 10
     * @param separator Character the columns are separated by
     * @return a Response with a JSON array. Each element in the array is a row in the
     *         document. The row is an array of strings which are the cells in the row
     *         in the document.
     */
    @GET
    @javax.ws.rs.Path("{documentName}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "delimited-files",
            summary = "Gather rows from an uploaded delimited document",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
            }
    )
    public Response getRows(
            @Parameter(description = "Name of the delimited document in the data/tmp/ directory", required = true)
            @PathParam("documentName") String fileName,
            @Parameter(description = "Number of rows to retrieve from the delimited document")
            @DefaultValue("10") @QueryParam("rowCount") int rowEnd,
            @Parameter(description = "Character the columns are separated by")
            @DefaultValue(",") @QueryParam("separator") String separator) {
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
     * @param separator a character with Character to separate the columns by
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
        Optional<MappingWrapper> mappingOpt = Optional.empty();
        try {
            mappingOpt = mappingManager.retrieveMapping(vf.createIRI(mappingRecordIRI));
        } catch (IllegalArgumentException e) {
            ErrorUtils.sendError("Mapping " + mappingRecordIRI + " does not exist", Response.Status.BAD_REQUEST);
        }
        MappingWrapper mapping = mappingOpt.orElseThrow(() ->
                ErrorUtils.sendError("Mapping " + mappingRecordIRI + " could not be retrieved",
                        Response.Status.BAD_REQUEST));
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
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return CONTINUE;
                }

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
