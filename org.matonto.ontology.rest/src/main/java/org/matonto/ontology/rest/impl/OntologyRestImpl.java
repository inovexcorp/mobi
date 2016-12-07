package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.rest.OntologyRest;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.web.security.util.AuthenticationProps;

import javax.annotation.Nonnull;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.stream.Collectors;

@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    private ModelFactory modelFactory;
    private OntologyManager ontologyManager;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private InProgressCommitFactory inProgressCommitFactory;
    private EngineManager engineManager;

    private static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";
    private static final String HEAD_MESSAGE = "The initial commit.";

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    public void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    public void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public Response uploadFile(@Context ContainerRequestContext context,
                               @FormDataParam("file") @Nonnull InputStream fileInputStream,
                               @FormDataParam("title") @Nonnull String title,
                               @FormDataParam("description") String description,
                               @FormDataParam("keywords") String keywords) {
        User user = getUserFromContext(context);
        try {
            Ontology ontology = ontologyManager.createOntology(fileInputStream);
            String ontologyId = ontology.getOntologyId().getOntologyIdentifier().stringValue();
            RecordConfig.Builder builder = new RecordConfig.Builder(title, ontologyId, Collections.singleton(user));
            if (description != null) {
                builder.description(description);
            }
            if (keywords != null) {
                builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
            }
            Resource catalogId = catalogManager.getLocalCatalog().getResource();
            OntologyRecord record = catalogManager.createRecord(builder.build(), ontologyRecordFactory);
            catalogManager.addRecord(catalogId, record);
            catalogManager.addMasterBranch(record.getResource());
            record = catalogManager.getRecord(catalogId, record.getResource(), ontologyRecordFactory).get();

            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(user, record.getResource());
            catalogManager.addInProgressCommit(inProgressCommit);
            catalogManager.addAdditions(ontology.asModel(modelFactory), inProgressCommit.getResource());
            inProgressCommit = catalogManager.getCommit(inProgressCommit.getResource(), inProgressCommitFactory).get();

            Commit commit = catalogManager.createCommit(inProgressCommit, null, HEAD_MESSAGE);
            catalogManager.addCommitToBranch(commit, record.getMasterBranch().get().getResource());
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }
        return Response.status(Response.Status.OK).build();
    }

    @Override
    public Response saveChangesToOntology(@Context ContainerRequestContext context,
                                          @PathParam("ontologyId") String ontologyIdStr,
                                          @QueryParam("resourceId") String resourceIdStr,
                                          @QueryParam("resourceJson") String resourceJson) {
        /*User user = getUserFromContext(context);
        try {

            catalogManager.getCommit();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }*/

        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getIRIsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                      @QueryParam("branchId") String branchIdStr,
                                      @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getAnnotationsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                             @QueryParam("branchId") String branchIdStr,
                                             @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addAnnotationToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                            @QueryParam("annotationJson") String annotationJson,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getClassesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addClassToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("resourceJson") String resourceJson,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteClassFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                            @PathParam("classId") String classIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getDatatypesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addDatatypeToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                          @QueryParam("resourceJson") String resourceJson,
                                          @QueryParam("branchId") String branchIdStr,
                                          @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteDatatypeFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                               @PathParam("datatypeId") String datatypeIdStr,
                                               @QueryParam("branchId") String branchIdStr,
                                               @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getObjectPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                  @QueryParam("branchId") String branchIdStr,
                                                  @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addObjectPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("resourceJson") String resourceJson,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteObjectPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                     @PathParam("propertyId") String propertyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getDataPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addDataPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("resourceJson") String resourceJson,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteDataPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                   @PathParam("propertyId") String propertyIdStr,
                                                   @QueryParam("branchId") String branchIdStr,
                                                   @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getNamedIndividualsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                  @QueryParam("branchId") String branchIdStr,
                                                  @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response addIndividualToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                            @QueryParam("resourceJson") String resourceJson,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteIndividualFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                                 @PathParam("individualId") String individualIdStr,
                                                 @QueryParam("branchId") String branchIdStr,
                                                 @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getIRIsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getImportsClosure(@PathParam("ontologyId") String ontologyIdStr,
                                      @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                                      @QueryParam("branchId") String branchIdStr,
                                      @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getAnnotationsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                       @QueryParam("branchId") String branchIdStr,
                                                       @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getClassesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                   @QueryParam("branchId") String branchIdStr,
                                                   @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getDatatypesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                            @QueryParam("branchId") String branchIdStr,
                                                            @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                          @QueryParam("branchId") String branchIdStr,
                                                          @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                            @QueryParam("branchId") String branchIdStr,
                                                            @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getOntologyClassHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getOntologyObjectPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                                       @QueryParam("branchId") String branchIdStr,
                                                       @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getOntologyDataPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getClassesWithIndividuals(@PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getEntityUsages(@PathParam("ontologyId") String ontologyIdStr,
                                    @PathParam("entityIri") String entityIRIStr,
                                    @QueryParam("branchId") String branchIdStr,
                                    @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getConceptHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                        @QueryParam("branchId") String branchIdStr,
                                        @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getSearchResults(@PathParam("ontologyId") String ontologyIdStr,
                                     @QueryParam("searchText") String searchText,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    /**
     * Common method to extract the User from the ContainerRequestContext.
     *
     * @param context the ContainerRequestContext from which you want to get a User
     * @return the User associated with the ContainerRequestContext
     */
    private User getUserFromContext(ContainerRequestContext context) {
        return engineManager.retrieveUser(RDF_ENGINE, context.getProperty(AuthenticationProps.USERNAME).toString())
                .orElseThrow(() -> ErrorUtils.sendError("User not found", Response.Status.FORBIDDEN));
    }
}
