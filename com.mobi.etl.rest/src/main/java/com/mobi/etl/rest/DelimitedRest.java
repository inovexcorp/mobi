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
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static java.nio.file.FileVisitResult.CONTINUE;
import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.CharsetUtils;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.FileUpload;
import com.mobi.rest.util.RestUtils;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.dhatim.fastexcel.reader.ReadableWorkbook;
import org.dhatim.fastexcel.reader.ReadingOptions;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(service = DelimitedRest.class, immediate = true)
@JaxrsResource
@javax.ws.rs.Path("/delimited-files")
public class DelimitedRest {
    private final ValueFactory vf = new ValidatingValueFactory();

    private DelimitedConverter converter;
    private MappingManager mappingManager;
    private EngineManager engineManager;
    private RDFImportService rdfImportService;
    private OntologyImportService ontologyImportService;

    private final Logger logger = LoggerFactory.getLogger(DelimitedRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    private static final long NUM_LINE_PREVIEW = 10;

    private static final String PARSING_DELIMITED_ERROR = "Error parsing delimited file";
    private static final String PROVIDE_IRI_MAPPING = "Must provide the IRI of a mapping record";

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
     * @param servletRequest The HttpServletRequest
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
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = DelimitedRestFileUpload.class)
                            )
                    }
            )
    )
    public Response upload(@Context HttpServletRequest servletRequest) {
        try {
            Map<String, Object> formData = RestUtils.getFormData(servletRequest, new HashMap<>());
            FileUpload file = (FileUpload) formData.get("delimitedFile");
            InputStream inputStream = file.getStream();
            String filename = file.getFilename();

            String uuid = generateUuid();
            String extension = FilenameUtils.getExtension(filename);
            Path filePath = Paths.get(TEMP_DIR + "/" + uuid + "." + extension);

            saveStreamToFile(inputStream, filePath);
            try {
                getCharset(filePath.toFile(), true);
            } catch (IOException ex) {
                throw new IllegalStateException("Error occurred reading temporary file", ex);
            }
            return Response.status(201).entity(filePath.getFileName().toString()).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), BAD_REQUEST);
        }
    }

    /**
     * Replaces an uploaded delimited document in the temp directory with another
     * delimited file.
     *
     * @param servletRequest The HttpServletRequest
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
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = DelimitedRestFileUpload.class)
                            )
                    }
            )
    )
    public Response upload(@Context HttpServletRequest servletRequest,
                           @Parameter(schema = @Schema(type = "string",
                                   description = "Name of the uploaded file on the server to replace", required = true))
                           @PathParam("documentName") String fileName) {
        try {
            Map<String, Object> formData = RestUtils.getFormData(servletRequest, new HashMap<>());
            FileUpload file = (FileUpload) formData.get("delimitedFile");
            InputStream inputStream = file.getStream();

            ByteArrayOutputStream fileOutput;
            try {
                fileOutput = toByteArrayOutputStream(inputStream);
            } catch (IOException e) {
                throw ErrorUtils.sendError(PARSING_DELIMITED_ERROR, BAD_REQUEST);
            }
            getCharset(fileOutput.toByteArray());

            Path filePath = Paths.get(TEMP_DIR + "/" + fileName);
            saveStreamToFile(new ByteArrayInputStream(fileOutput.toByteArray()), filePath);
            return Response.ok(fileName).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), BAD_REQUEST);
        }
    }

    /**
     * Class used for OpenAPI documentation for upload endpoint.
     */
    private static class DelimitedRestFileUpload {
        @Schema(type = "string", format = "binary", description = "Delimited file to upload.")
        public String delimitedFile;
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
            @FormParam("jsonld") String jsonld,
            @Parameter(description = "RDF serialization to use if getting a preview")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Whether the delimited file has headers")
            @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
            @Parameter(description = "Character the columns are separated by if it is a CSV")
            @DefaultValue(",") @QueryParam("separator") String separator) {
        checkStringParam(jsonld, "Must provide a JSON-LD string");
        try {
            // Convert the data
            StopWatch watch = new StopWatch();
            watch.start();
            Model data = etlFileToModel(fileName, () -> jsonldToModel(jsonld), containsHeaders, separator, true);
            watch.stop();
            logger.trace("ETL File took {}ms", watch.getNanoTime() / 1000000);

            return Response.ok(groupedModelToString(data, format)).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), BAD_REQUEST);
        }
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
        checkStringParam(mappingRecordIRI, PROVIDE_IRI_MAPPING);

        try {
            // Convert the data
            StopWatch watch = new StopWatch();
            watch.start();
            Model data = etlFileToModel(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                    separator, false);
            watch.stop();
            logger.trace("ETL File took {}ms", watch.getNanoTime() / 1000000);
            String result = groupedModelToString(data, format);

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
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        }
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
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.QUERY, value = "datasetRecordIRI")
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
        checkStringParam(mappingRecordIRI, PROVIDE_IRI_MAPPING);
        checkStringParam(datasetRecordIRI, "Must provide the IRI of a dataset record");

        try {
            // Convert the data
            StopWatch watch = new StopWatch();
            watch.start();
            Model data = etlFileToModel(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                    separator, false);
            watch.stop();
            logger.trace("ETL File took {}ms", watch.getNanoTime() / 1000000);

            // Add data to the dataset
            ImportServiceConfig config = new ImportServiceConfig.Builder().dataset(vf.createIRI(datasetRecordIRI))
                    .logOutput(true)
                    .build();
            try {
                rdfImportService.importModel(config, data);
            } catch (RepositoryException ex) {
                throw ErrorUtils.sendError("Error in repository connection", INTERNAL_SERVER_ERROR);
            }

            // Remove temp file
            removeTempFile(fileName);

            return Response.ok().build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), BAD_REQUEST);
        }
    }

    /**
     * Maps the data in an uploaded delimited document into RDF using a MappingRecord's Mapping and
     * adds it as a commit onto the specified OntologyRecord. The file must be present in the data/tmp/ directory.
     *
     * @param servletRequest The HttpServletRequest
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
            @Context HttpServletRequest servletRequest,
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
        checkStringParam(mappingRecordIRI, PROVIDE_IRI_MAPPING);
        checkStringParam(ontologyRecordIRI, "Must provide the IRI of an ontology record");
        checkStringParam(branchIRI, "Must provide the IRI of an ontology branch");

        try {
            // Convert the data
            StopWatch watch = new StopWatch();
            watch.start();
            Model mappingData = etlFileToModel(fileName, () -> getUploadedMapping(mappingRecordIRI), containsHeaders,
                    separator, false);
            watch.stop();
            logger.trace("ETL File took {}ms", watch.getNanoTime() / 1000000);

            // Commit converted data
            IRI branchId = vf.createIRI(branchIRI);
            IRI recordIRI = vf.createIRI(ontologyRecordIRI);
            User user = getActiveUser(servletRequest, engineManager);
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
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        } catch (IllegalArgumentException e) {
            throw RestUtils.getErrorObjBadRequest(e);
        }
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
    private Model etlFileToModel(String fileName, SupplierWithException<Model> mappingSupplier,
                          boolean containsHeaders, String separator, boolean limit) {
        // Collect the delimited file and its extension
        File delimitedFile = getUploadedFile(fileName).orElseThrow(() ->
                ErrorUtils.sendError("Document not found", BAD_REQUEST));
        String extension = FilenameUtils.getExtension(delimitedFile.getName());

        // Collect the delimited file charset
        Charset charset;
        try (InputStream data = getDocumentInputStream(delimitedFile)) {
            charset = CharsetUtils.getEncoding(data).orElse(Charset.defaultCharset());
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Exception reading ETL file", BAD_REQUEST);
        }

        // Collect the mapping model
        Model mappingModel;
        try {
            mappingModel = mappingSupplier.get();
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error converting mapping JSON-LD", BAD_REQUEST);
        }

        // Run the mapping against the delimited data
        try (InputStream data = getDocumentInputStream(delimitedFile)) {
            Model result;
            if (extension.equals("xlsx")) {
                ExcelConfig.ExcelConfigBuilder config = new ExcelConfig.ExcelConfigBuilder(data, charset, mappingModel)
                        .containsHeaders(containsHeaders);
                if (limit) {
                    config.limit(NUM_LINE_PREVIEW);
                }
                result = etlFileWithSupplier(() -> converter.convert(config.build()));
            } else {
                SVConfig.SVConfigBuilder config = new SVConfig.SVConfigBuilder(data, charset, mappingModel)
                        .separator(separator.charAt(0))
                        .containsHeaders(containsHeaders);
                if (limit) {
                    config.limit(NUM_LINE_PREVIEW);
                }
                result = etlFileWithSupplier(() -> converter.convert(config.build()));
            }
            logger.info("File mapped: {}", delimitedFile.getPath());
            return result;
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Exception reading ETL file", BAD_REQUEST);
        }
    }

    /**
     * Converts delimited SV data in an InputStream into RDF.
     *
     * @param supplier the supplier for getting the result of running a conversion using a Config
     * @return a Mobi Model with the delimited data converted into RDF
     */
    private Model etlFileWithSupplier(SupplierWithException<Model> supplier) {
        try {
            return supplier.get();
        } catch (IOException | MobiException e) {
            throw ErrorUtils.sendError(e, "Error converting delimited file", BAD_REQUEST);
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
        try {
            Optional<File> optFile = getUploadedFile(fileName);
            if (optFile.isPresent()) {
                File file = optFile.get();
                String extension = FilenameUtils.getExtension(file.getName());
                int numRows = (rowEnd <= 0) ? 10 : rowEnd;

                logger.info("Getting {} rows from {}", numRows, file.getName());
                String json;
                try {
                    if (extension.equals("xlsx")) {
                        json = convertExcelRows(file, numRows);
                    } else {
                        char separatorChar = separator.charAt(0);
                        json = convertCSVRows(file, numRows, separatorChar);
                    }
                } catch (Exception e) {
                    throw ErrorUtils.sendError("Error loading document", BAD_REQUEST);
                }

                return Response.ok(json).build();
            } else {
                throw ErrorUtils.sendError("Document not found", Response.Status.NOT_FOUND);
            }
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), BAD_REQUEST);
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
            throw ErrorUtils.sendError(e, "Error writing delimited file", BAD_REQUEST);
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, PARSING_DELIMITED_ERROR, BAD_REQUEST);
        }
        logger.info("File Uploaded: {}", filePath);
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
    private String convertCSVRows(File input, int numRows, char separator) throws IOException, CsvException {
        Charset charset = getCharset(input, false);
        CSVParser parser = new CSVParserBuilder().withSeparator(separator).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(new FileInputStream(input), charset))
                .withCSVParser(parser).build()) {
            ArrayNode returnRows = mapper.createArrayNode();
            for (int i = 0; i <= numRows; i++) {
                String[] row = reader.readNext();
                if (row == null) {
                    break;
                }
                returnRows.insert(i, mapper.valueToTree(row));
            }
            return returnRows.toString();
        }
    }

    /**
     * Converts the specified number of rows of a Excel file into JSON and returns them as a String.
     *
     * @param input the Excel file to convert into JSON
     * @param numRows the number of rows from the Excel file to convert
     * @return a string with the JSON of the Excel rows
     * @throws IOException If Excel file could not be read
     */
    private String convertExcelRows(File input, int numRows) throws IOException {
        // Arguments will extract cell formatting and mark a cell as in error if it could not be parsed
        ReadingOptions readingOptions = new ReadingOptions(true, true);
        try (InputStream is = new FileInputStream(input);
                ReadableWorkbook wb = new ReadableWorkbook(is, readingOptions)) {
            org.dhatim.fastexcel.reader.Sheet sheet = wb.getFirstSheet();
            ArrayNode rows = sheet.openStream()
                    .limit(numRows + 1)
                    .map(row -> {
                        ArrayNode columns = mapper.createArrayNode();
                        for (int i = 0; i < row.getCellCount(); i++) {
                            columns.insert(i, getCellText(row.getCell(i)));
                        }
                        return columns;
                    })
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return rows.toString();
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
            throw ErrorUtils.sendError("Delimited file is not in a supported encoding", BAD_REQUEST);
        }

        return charset;
    }

    private Charset getCharset(File file, boolean delete) throws IOException {
        try (InputStream is = new FileInputStream(file)) {
            Charset charset;
            Optional<Charset> optCharset = CharsetUtils.getEncoding(is);
            if (optCharset.isPresent()) {
                charset = optCharset.get();
            } else {
                if (delete) {
                    boolean deleted = file.delete();
                    if (!deleted) {
                        logger.debug("File {} was not fully deleted", file.getAbsolutePath());
                    }
                }
                throw ErrorUtils.sendError("Delimited file is not in a supported encoding", BAD_REQUEST);
            }
            return charset;
        }
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
            throw ErrorUtils.sendError("Mapping " + mappingRecordIRI + " does not exist", BAD_REQUEST);
        }
        MappingWrapper mapping = mappingOpt.orElseThrow(() ->
                ErrorUtils.sendError("Mapping " + mappingRecordIRI + " could not be retrieved",
                        BAD_REQUEST));
        return mapping.getModel();
    }

    private void removeTempFile(String fileName) {
        try {
            Files.deleteIfExists(Paths.get(TEMP_DIR + "/" + fileName));
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, "Error deleting delimited file", BAD_REQUEST);
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
            throw ErrorUtils.sendError("Document not found", BAD_REQUEST);
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
