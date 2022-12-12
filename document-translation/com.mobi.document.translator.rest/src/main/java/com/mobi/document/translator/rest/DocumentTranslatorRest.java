package com.mobi.document.translator.rest;
/*-
 * #%L
 * com.mobi.document.translator.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.impl.csv.CsvSemanticTranslator;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.FilenameUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Path("/translate")
@Component(service = DocumentTranslatorRest.class, immediate = true)
@JaxrsResource
public class DocumentTranslatorRest {

    /**
     * Logging utility.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentTranslatorRest.class);

    private final ValueFactory valueFactory = new ValidatingValueFactory();
    private final ModelFactory modelFactory = new DynamicModelFactory();
    
    @Reference
    private volatile List<SemanticTranslator> translators = new ArrayList<>();

    @Reference
    private OrmFactoryRegistry ormFactoryRegistry;

    /**
     * Ingests an uploaded data file in the form of json, csv, or xml/xsd and converts it into an ontology and instance
     * data based on the structure and contents of the file. Once transformed a zip file is created and downloaded to
     * the user's system for exporting/importing.
     */
    @POST
    @RolesAllowed("user")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @Operation(
            tags = "translate",
            summary = "Accepts an input File of either csv, json, or xml and transforms it to an ontology and data "
                    + "file",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Successful Translation of Document"),
                    @ApiResponse(responseCode = "400", description = "Invalid File or BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = TranslateUpload.class)
                            )
                    }
            )
    )
    public Response translateDocument(@Context HttpServletRequest servletRequest) {
        java.nio.file.Path tempFolder = null;
        try {
            Map<String, List<Class>> fields = new HashMap<>();
            fields.put("type", Stream.of(String.class).collect(Collectors.toList()));
            fields.put("ontologyIriString", Stream.of(String.class).collect(Collectors.toList()));
            fields.put("outputName", Stream.of(String.class).collect(Collectors.toList()));
            fields.put("desiredRows", Stream.of(Integer.class).collect(Collectors.toList()));

            Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);
            String type = (String) formData.get("type");
            String ontologyIriString = (String) formData.get("ontologyIriString");
            String outputName = (String) formData.get("outputName");
            int desiredRows = (Integer) formData.getOrDefault("desiredRows", 10);
            InputStream inputStream = (InputStream) formData.get("stream");
            String filename = (String) formData.get("filename");

            if (inputStream == null) {
                throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
            }

            if (outputName == null) {
                outputName = FilenameUtils.removeExtension(filename)
                        + new SimpleDateFormat("-yyyyMMddhhmmss").format(new Date()) + ".zip";
            }

            String ext = FilenameUtils.getExtension(filename);

            tempFolder = Files.createTempDirectory(String.valueOf(UUID.randomUUID()));
            java.nio.file.Path documentFile = Files.createFile(tempFolder.resolve(Paths.get(filename)));

            Files.copy(inputStream, documentFile, StandardCopyOption.REPLACE_EXISTING);

            final SemanticTranslator translator = getTranslatorForType(type != null ? type : ext, desiredRows);
            ontologyIriString = ontologyIriString != null ? ontologyIriString
                    : String.format("urn://mobi.inovexcorp.com/extractedOntology/%s", UUID.randomUUID());

            final IRI ontologyIri = valueFactory.createIRI(ontologyIriString);
            final ExtractedOntology ontology = ormFactoryRegistry.createNew(ontologyIri,
                    modelFactory.createEmptyModel(), ExtractedOntology.class);

            final Model results = translator.translate(documentFile, ontology);

            StreamingOutput stream = outputStream -> {
                try (ZipOutputStream os = new ZipOutputStream(new BufferedOutputStream(outputStream))) {
                    final ZipEntry ontologyEntry = new ZipEntry("ontology.ttl");
                    os.putNextEntry(ontologyEntry);
                    RestUtils.groupedModelToOutputStream(ontology.getModel(), RDFFormat.TURTLE, os);
                    ZipEntry dataEntry = new ZipEntry("data.ttl");
                    os.putNextEntry(dataEntry);
                    RestUtils.groupedModelToOutputStream(results, RDFFormat.TURTLE, os);
                }
            };

            return Response.ok(stream)
                    .header("Content-Disposition", "attachment;filename=" + outputName)
                    .header("Content-Type", "application/zip")
                    .build();

        } catch (MobiException | SemanticTranslationException | IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IOException | UnsupportedOperationException | IllegalArgumentException userError) {
            throw ErrorUtils.sendError(userError, userError.getMessage(), Response.Status.BAD_REQUEST);
        } finally {
            if (tempFolder != null) {
                cleanupFiles(tempFolder);
            }
        }
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private class TranslateUpload {
        @Schema(type = "string", format = "binary", description = "Data file to transform.")
        public String file;

        @Schema(type = "string", description = "Optional type to determine needed translator.")
        public String type;

        @Schema(type = "string",
                description = "Optional namespace to use for the created ontology and instance data.")
        public String ontologyIriString;

        @Schema(type = "string", description = "Optional filename given to the output file. Requires zip extension.")
        public String outputName;

        @Schema(type = "integer",
                description = "Optional number of rows to parse to determine property ranges if file is tabular.")
        public int desiredRows;
    }

    private SemanticTranslator getTranslatorForType(String type, int rowCount) {
        LOGGER.info("Translating for type '{}' -- We have {} translators registered", type, this.translators.size());
        SemanticTranslator derivedTranslator = translators.stream()
                // If any of the supported types contains the type extensions.
                .filter(translator -> Arrays.asList(translator.getSupportedTypes()).contains(type))
                // Find the first matching the above filter predicate.
                .findFirst()
                // Or else throw an exception.
                .orElseThrow(() ->
                        new UnsupportedOperationException("No translator was found in the system for that file type"));

        if (derivedTranslator instanceof CsvSemanticTranslator) {
                ((CsvSemanticTranslator) derivedTranslator).setDesiredRows(rowCount);
        }

        return derivedTranslator;
    }

    private void cleanupFiles(java.nio.file.Path tempDirectory) {
        if (tempDirectory != null) {
            try {
                Files.walk(tempDirectory)
                        .sorted(Comparator.reverseOrder())
                        .map(java.nio.file.Path::toFile)
                        .forEach(File::delete);
            } catch (IOException fileException) {
                throw new MobiException(fileException);
            }
        }
    }
}
