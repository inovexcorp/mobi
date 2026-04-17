package com.mobi.webhooks.rest;

/*-
 * #%L
 * com.mobi.webhooks.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = WebhookRest.class, immediate = true)
@JaxrsResource
@Path("/webhooks")
public class WebhookRest {
    private static final Logger LOG = LoggerFactory.getLogger(WebhookRest.class);
    private static final String TAG = "Webhooks";
    private static final String DESCRIPTION = "Operations for managing WebhookRecords";

    @Reference
    RecordManager recordManager;

    @Reference
    EngineManager engineManager;

    @Reference
    CatalogConfigProvider configProvider;

    @POST
    @Tag(name = TAG, description = DESCRIPTION)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON})
    @RolesAllowed("user")
    @Operation(summary = "Creates a new Webhook Record in the local Catalog")
    @RequestBody(description = "Request Payload representing A Webhook Configuration",
            content = @Content(schema = @Schema(implementation = WebhookUploadSchema.class)))
    @ApiResponses({
            @ApiResponse(responseCode = "201",
                    description = "Successful Creation. Returns IRI of the newly created WebhookRecord",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "401", description = "User is Unauthenticated"),
            @ApiResponse(responseCode = "403", description = "User Lacks Permissions to Create Webhook Records"),
            @ApiResponse(responseCode = "500", description = "Internal Server Error",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class)))
            })
    @ActionAttributes(@AttributeValue(id = RDF.NAMESPACE + "type", value = WebhookRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response createWebhookRecord(@Context HttpServletRequest servletRequest,
                                        @FormParam("title") String title,
                                        @FormParam("description") String description,
                                        @FormParam("markdown") String markdown,
                                        @FormParam("keywords") List<String> keywords) {

        User user = getActiveUser(servletRequest, engineManager);
        LOG.debug("Received POST request for WebhookRecord creation from User: {}", user);

        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            LOG.debug("Beginning parsing of request body");

            checkStringParam(title, "Title is required");
            RecordOperationConfig config = new OperationConfig();
            config.set(RecordCreateSettings.CATALOG_ID, configProvider.getLocalCatalogIRI().stringValue());
            config.set(RecordCreateSettings.RECORD_TITLE, title);
            config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
            config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
            config.set(RecordCreateSettings.RECORD_PUBLISHERS, Stream.of(user).collect(Collectors.toSet()));

            if (keywords != null && !keywords.isEmpty()) {
                config.set(RecordCreateSettings.RECORD_KEYWORDS,  new HashSet<>(keywords));
            }

            WebhookRecord record = recordManager.createRecord(user, config, WebhookRecord.class, conn);

            LOG.debug("Request processing took {}ms to create Webhook record: {}", System.currentTimeMillis() - start,
                    record.getResource().stringValue());

            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }
}
