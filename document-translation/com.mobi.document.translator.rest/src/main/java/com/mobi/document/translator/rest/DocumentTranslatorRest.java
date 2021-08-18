package com.mobi.document.translator.rest;
/*-
 * #%L
 * com.mobi.document.translator.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.FilenameUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
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
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Path("/translate")
@Component(service = DocumentTranslatorRest.class, immediate = true)
public class DocumentTranslatorRest {

    /**
     * Logging utility.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentTranslatorRest.class);

    @Reference
    private volatile List<SemanticTranslator> translators = new ArrayList<>();

    @Reference
    private OrmFactoryRegistry ormFactoryRegistry;

    @Reference
    private ValueFactory valueFactory;

    @Reference
    private ModelFactory modelFactory;

    @Reference
    private SesameTransformer sesameTransformer;

    /**
     * Ingests an uploaded data file in the form of json, csv, or xml/xsd and converts it into an ontology and instance
     * data based on the structure and contents of the file. Once transformed a zip file is created and downloaded to
     * the user's system for exporting/importing.
     *
     * @param file              Data file to transform.
     * @param type              Optional type to determine needed translator.
     * @param ontologyIriString Optional namespace to use for the created ontology and instance data.
     * @param desiredRows       Optional number of rows to parse to determine property ranges if file is tabular.
     * @param filename          Optional filename given to the output file.
     * @return SUCCESS code and a zip file containing the newly created ontology and instance data, BAD REQUEST if
     *      file can't be found or a translator for the file cannot be found, INTERNAL SERVER ERROR if there is a
     *      problem transforming the uploaded file.
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
            }
    )
    public Response translateDocument(
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "Data file to transform.", required = true))
            @FormDataParam("file") InputStream file,
            @Parameter(description = "file metadata", hidden = true)
            @FormDataParam("file") FormDataContentDisposition fileDetail,
            @Parameter(schema = @Schema(type = "string", description = "Optional type to determine needed translator."))
            @FormDataParam("type") String type,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional namespace to use for the created ontology and instance data."))
            @FormDataParam("ontologyIRI") String ontologyIriString,
            @Parameter(schema = @Schema(type = "string", description = "Optional filename given to the output file. "
                    + "Requires zip extension."))
            @FormDataParam("outputName") String filename,
            @Parameter(schema = @Schema(type = "integer",
                    description = "Optional number of rows to parse to determine property ranges if file is tabular."))
            @FormDataParam("desiredRows") @DefaultValue("10") int desiredRows ) {

        if (file == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }

        if (filename == null) {
            filename = FilenameUtils.removeExtension(fileDetail.getFileName())
                    + new SimpleDateFormat("-yyyyMMddhhmmss").format(new Date()) + ".zip";
        }

        java.nio.file.Path tempFolder = null;

        try {
            String ext = FilenameUtils.getExtension(fileDetail.getFileName());

            tempFolder = Files.createTempDirectory(String.valueOf(UUID.randomUUID()));
            java.nio.file.Path documentFile = Files.createFile(tempFolder.resolve(Paths.get(fileDetail.getFileName())));

            Files.copy(file, documentFile, StandardCopyOption.REPLACE_EXISTING);

            final SemanticTranslator translator = getTranslatorForType(type != null ? type : ext, desiredRows);
            ontologyIriString = ontologyIriString != null ? ontologyIriString
                    : String.format("urn://mobi.inovexcorp.com/extractedOntology/%s", UUID.randomUUID());

            final IRI ontologyIri = valueFactory.createIRI(ontologyIriString);
            final ExtractedOntology ontology = ormFactoryRegistry.createNew(ontologyIri,
                    modelFactory.createModel(), ExtractedOntology.class);

            final Model results = translator.translate(documentFile, ontology);

            StreamingOutput stream = outputStream -> {
                try (ZipOutputStream os = new ZipOutputStream(new BufferedOutputStream(outputStream))) {
                    final ZipEntry ontologyEntry = new ZipEntry("ontology.ttl");
                    os.putNextEntry(ontologyEntry);
                    RestUtils.groupedModelToOutputStream(ontology.getModel(), RDFFormat.TURTLE, sesameTransformer, os);
                    ZipEntry dataEntry = new ZipEntry("data.ttl");
                    os.putNextEntry(dataEntry);
                    RestUtils.groupedModelToOutputStream(results, RDFFormat.TURTLE, sesameTransformer, os);
                }
            };

            return Response.ok(stream)
                    .header("Content-Disposition", "attachment;filename=" + filename)
                    .header("Content-Type", "application/zip")
                    .build();

        } catch (MobiException | SemanticTranslationException | IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IOException | UnsupportedOperationException | IllegalArgumentException userError) {
            throw ErrorUtils.sendError(userError, userError.getMessage(), Response.Status.BAD_REQUEST);
        } finally {
            cleanupFiles(tempFolder);
        }
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
