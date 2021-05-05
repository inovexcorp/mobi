package com.mobi.explorable.dataset.rest;

/*-
 * #%L
 * com.mobi.dataset.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.jsonldToDeskolemizedModel;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.exception.MobiException;
import com.mobi.explorable.dataset.rest.jaxb.ClassDetails;
import com.mobi.explorable.dataset.rest.jaxb.InstanceDetails;
import com.mobi.explorable.dataset.rest.jaxb.PropertyDetails;
import com.mobi.explorable.dataset.rest.jaxb.RestrictionDetails;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.Statements;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.jaxb.Links;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferencePolicyOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(service = ExplorableDatasetRest.class, immediate = true)
@Path("/explorable-datasets")
public class ExplorableDatasetRest {

    private final Logger log = LoggerFactory.getLogger(ExplorableDatasetRest.class);

    private DatasetManager datasetManager;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private SesameTransformer sesameTransformer;
    private OntologyManager ontologyManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private BNodeService bNodeService;

    private static final String GET_CLASSES_TYPES;
    private static final String GET_CLASSES_DETAILS;
    private static final String GET_CLASSES_INSTANCES;
    private static final String GET_ALL_CLASS_INSTANCES;
    private static final String GET_REIFIED_STATEMENTS;
    private static final String GET_CARDINALITY_RESTRICTIONS;
    private static final String COUNT_BINDING = "c";
    private static final String TYPE_BINDING = "type";
    private static final String INSTANCE_BINDING = "inst";
    private static final String LABEL_BINDING = "label";
    private static final String COMMENT_BINDING = "comment";
    private static final String TITLE_BINDING = "title";
    private static final String DESCRIPTION_BINDING = "description";
    private static final String CLASS_BINDING = "classIRI";
    private static final String EXAMPLE_BINDING = "example";
    private static final String SUBJECT_BINDING = "subject";
    private static final String PREDICATE_BINDING = "predicate";
    private static final String OBJECT_BINDING = "object";
    private static final String CLASS_IRI_REPLACE = "%CLASSIRI%";

    static {
        try {
            GET_CLASSES_TYPES = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-classes-types.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_DETAILS = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-classes-details.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CLASSES_INSTANCES = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-classes-instances.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ALL_CLASS_INSTANCES = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-all-class-instances.rq"),
                    StandardCharsets.UTF_8
            );
            GET_REIFIED_STATEMENTS = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-reified-statements.rq"),
                    StandardCharsets.UTF_8
            );
            GET_CARDINALITY_RESTRICTIONS = IOUtils.toString(
                    ExplorableDatasetRest.class.getResourceAsStream("/get-cardinality-restrictions.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference(policyOption = ReferencePolicyOption.GREEDY)
    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    public void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

    @Reference
    public void setBNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    /**
     * Retrieves all the class details associated with ontologies linked to a {@link Dataset} in the local
     * {@link Catalog} in a JSON array.
     *
     * @param recordIRI The id of the {@link DatasetRecord} for the {@link Dataset} from which to retrieve the data.
     * @return A {@link Response} with a JSON array of ontology objects.
     */
    @GET
    @Path("{recordIRI}/class-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Retrieves all the data associated with ontology objects, from a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getClassDetails(
            @Parameter(description = "ID of the DatasetRecord for the Dataset from which to retrieve the data", required = true)
            @PathParam("recordIRI") String recordIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        try {
            DatasetRecord record = datasetManager.getDatasetRecord(datasetRecordRsr).orElseThrow(() ->
                    ErrorUtils.sendError("The Dataset Record could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_TYPES, "", null);
            List<ClassDetails> classes = getClassDetailsFromQueryResults(results, datasetRecordRsr);
            classes = addOntologyDetailsToClasses(classes, record.getOntology(), record.getModel());
            return Response.ok(classes).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves all the instance details associated with a specific class found in the ontologies linked to a
     * {@link Dataset} in the local {@link Catalog} in a JSON array. Can optionally be paged if passed limit and offset.
     * Can optionally be sorted in ascending or descending order based on the instance details title.
     *
     * @param uriInfo   The URI information of the request.
     * @param recordIRI The id of the {@link DatasetRecord} for the {@link Dataset} to summarize.
     * @param classIRI  The IRI of the class type to get
     * @param offset    The offset for a page of Dataset data
     * @param limit     The number of data to return in one page
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending.
     * @param infer     Whether or not the list should include inferred instances.
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{recordIRI}/classes/{classIRI}/instance-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Retrieves an aggregated summary of all ontology objects from a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getInstanceDetails(
            @Context UriInfo uriInfo,
            @Parameter(description = "IRI of the DatasetRecord for the Dataset to summarize", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "IRI of the class type to get", required = true)
            @PathParam("classIRI") String classIRI,
            @Parameter(description = "Offset for a page of Dataset data", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of data to return in one page", required = true)
            @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Whether or not the list should include inferred instances")
            @DefaultValue("false") @QueryParam("infer") boolean infer) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(classIRI, "The Class IRI is required.");
        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        try {
            final List<InstanceDetails> instances = new ArrayList<>();
            if (infer) {
                String classes = getInferredClasses(datasetRecordRsr, factory.createIRI(classIRI));
                String query = String.format(GET_ALL_CLASS_INSTANCES, classes);
                TupleQueryResult results = getQueryResults(datasetRecordRsr, query, "", null);
                instances.addAll(getInstanceDetailsFromQueryResults(results));
            } else {
                TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_INSTANCES, CLASS_BINDING,
                        factory.createIRI(classIRI));
                instances.addAll(getInstanceDetailsFromQueryResults(results));
            }
            Comparator<InstanceDetails> comparator = Comparator.comparing(InstanceDetails::getTitle);
            return createPagedResponse(uriInfo, instances, comparator, asc, limit, offset);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves all the property details associated with a specific class found in the ontologies linked to a
     * {@link Dataset} in the local {@link Catalog} in a JSON array.
     *
     * @param recordIRI The id of the {@link DatasetRecord} for the {@link Dataset} to summarize.
     * @param classIRI  The IRI of the class type to get property details for.
     * @return A {@link Response} with a JSON array.
     */
    @GET
    @Path("{recordIRI}/classes/{classIRI}/property-details")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Retrieves a list of all properties available for a class from a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Response with a JSON array"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getClassPropertyDetails(
            @Parameter(description = "Id of the DatasetRecord for the Dataset to summarize", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "IRI of the class type to get property details for", required = true)
            @PathParam("classIRI") String classIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(classIRI, "The Class IRI is required.");
        Resource recordId = factory.createIRI(recordIRI);
        try {
            DatasetRecord record = datasetManager.getDatasetRecord(recordId).orElseThrow(() ->
                    ErrorUtils.sendError("The Dataset Record could not be found.", Response.Status.BAD_REQUEST));
            return Response.ok(getClassProperties(record, classIRI)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates an instance owned by a {@link Dataset} in the local {@link Catalog}.
     *
     * @param recordIRI The id of the {@link DatasetRecord} for the {@link Dataset}.
     * @param  newInstanceJson New Instance JSON
     * @return A {@link Response} with the IRI string of the created Instance.
     */
    @POST
    @Path("{recordIRI}/instances")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Creates an instance of a particular class type in a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Instance"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createInstance(
            @Parameter(description = "Id of the DatasetRecord for the Dataset", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "New Instance JSON", required = true)
                    String newInstanceJson) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(newInstanceJson, "The Instance's JSON-LD is required.");
        try (DatasetConnection conn = datasetManager.getConnection(factory.createIRI(recordIRI))) {
            Model instanceModel = jsonldToModel(newInstanceJson, sesameTransformer);
            Resource instanceId = instanceModel.stream()
                    .filter(statement -> !(statement.getSubject() instanceof BNode))
                    .findAny().orElseThrow(() ->
                            ErrorUtils.sendError("The new instance's IRI could not be "
                                            + "found on any statement in the JSON-LD.",
                                    Response.Status.INTERNAL_SERVER_ERROR)).getSubject();
            if (conn.contains(instanceId, null, null)) {
                throw ErrorUtils.sendError("The new instance's IRI is already taken.",
                        Response.Status.INTERNAL_SERVER_ERROR);
            }
            conn.add(instanceModel);
            return Response.status(201).entity(instanceId.stringValue()).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves an instance owned by a {@link Dataset} in the local {@link Catalog}.
     *
     * @param recordIRI   The id of the {@link DatasetRecord} for the {@link Dataset} to summarize.
     * @param instanceIRI The IRI of the instance to get.
     * @return A {@link Response} with a JSON-LD serialization of the desired instance.
     */
    @GET
    @Path("{recordIRI}/instances/{instanceIRI}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Retrieves an instance of a particular class type from a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a JSON-LD serialization of the desired instance"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getInstance(
            @Parameter(description = "IRI of the DatasetRecord for the Dataset to summarize", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "IRI of the instance to get", required = true)
            @PathParam("instanceIRI") String instanceIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(instanceIRI, "The Instance IRI is required.");
        try (DatasetConnection conn = datasetManager.getConnection(factory.createIRI(recordIRI))) {
            Model instanceModel = getLimitedInstance(instanceIRI, conn);
            if (instanceModel.size() == 0) {
                throw ErrorUtils.sendError("The requested instance could not be found.", Response.Status.BAD_REQUEST);
            }
            String json = modelToSkolemizedJsonld(instanceModel, sesameTransformer, bNodeService);
            return Response.ok(JSONArray.fromObject(json)).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates an instance owned by a {@link Dataset} in the local {@link Catalog} using the modifications from the
     * provided JSON-LD.
     *
     * @param recordIRI   The id of the {@link DatasetRecord} for the {@link Dataset} to summarize.
     * @param instanceIRI The IRI of the instance to update.
     * @return A {@link Response} indicating whether or not the Instance was updated.
     */
    @PUT
    @Path("{recordIRI}/instances/{instanceIRI}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Updates an instance of a particular class type from a Dataset in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating whether or not the "
                            + "Instance was updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response updateInstance(
            @Parameter(description = "Id of the DatasetRecord for the Dataset to summarize.", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "IRI of the instance to update", required = true)
            @PathParam("instanceIRI") String instanceIRI,
            @Parameter(description = "Instance JSON-LD", required = true)
                    String json) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(instanceIRI, "The Instance IRI is required.");
        try (DatasetConnection conn = datasetManager.getConnection(factory.createIRI(recordIRI))) {
            Resource instanceId = factory.createIRI(instanceIRI);
            RepositoryResult<Statement> statements = conn.getStatements(instanceId, null, null);
            if (!statements.hasNext()) {
                throw ErrorUtils.sendError("The requested instance could not be found.", Response.Status.BAD_REQUEST);
            }
            RepositoryResult<Statement> reifiedDeclarations = conn.getStatements(null,
                    sesameTransformer.mobiIRI(RDF.SUBJECT), instanceId);
            conn.begin();
            conn.remove(statements);
            reifiedDeclarations.forEach(statement -> {
                RepositoryResult<Statement> reification = conn.getStatements(statement.getSubject(), null, null);
                conn.remove(reification);
            });
            conn.add(jsonldToDeskolemizedModel(json, sesameTransformer, bNodeService));
            conn.commit();
            return Response.ok().build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes an instance owned by a {@link Dataset} in the local {@link Catalog}.
     *
     * @param recordIRI   The id of the {@link DatasetRecord} for the {@link Dataset}.
     * @param instanceIRI The IRI of the instance to delete.
     * @return A Response indicating whether or not the Record was deleted.
     */
    @DELETE
    @Path("{recordIRI}/instances/{instanceIRI}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "explorable-datasets",
            summary = "Deletes an instance by its ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether or not the Record was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response deleteInstance(
            @Parameter(description = "IRI of the DatasetRecord for the Dataset", required = true)
            @PathParam("recordIRI") String recordIRI,
            @Parameter(description = "IRI of the instance to delete", required = true)
            @PathParam("instanceIRI") String instanceIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(instanceIRI, "The Instance IRI is required.");
        try (DatasetConnection conn = datasetManager.getConnection(factory.createIRI(recordIRI))) {
            Model instanceModel = getInstance(instanceIRI, conn);
            if (instanceModel.size() == 0) {
                throw ErrorUtils.sendError("The requested instance could not be found.",
                        Response.Status.BAD_REQUEST);
            }
            conn.begin();
            conn.remove(instanceModel);
            conn.remove((Resource) null, null, factory.createIRI(instanceIRI));
            conn.commit();
            return Response.ok().build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets all of the inferred classes of the type specified contained within any of the Ontologies associated with the
     * Dataset in a format needed for the VALUES input in the query.
     *
     * @param recordId The ID of the DatasetRecord.
     * @param classIRI The ID of the class to get the inferred classes of.
     * @return A Set containing the list of inferred classes.
     */
    private String getInferredClasses(Resource recordId, IRI classIRI) {
        DatasetRecord record = datasetManager.getDatasetRecord(recordId).orElseThrow(() ->
                ErrorUtils.sendError("The Dataset Record could not be found.", Response.Status.BAD_REQUEST));
        Model recordModel = record.getModel();
        StringBuilder builder = new StringBuilder();
        builder.append(" <").append(classIRI.stringValue()).append("> ");
        record.getOntology().stream()
                .map(value -> getOntology(recordModel, value))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(ontology -> ontology.getSubClassesFor(classIRI))
                .flatMap(Collection::stream)
                .collect(Collectors.toSet())
                .forEach(iri -> builder.append("<").append(iri).append("> "));
        return builder.toString();
    }

    /**
     * Gets a limited version of the instance
     *
     * @param instanceIRI The ID of the instance to retrieve.
     * @param conn        The DatasetConnection to use to find the triples.
     * @return A Model containing all triples which represent the instance.
     */
    private Model getLimitedInstance(String instanceIRI, DatasetConnection conn) {
        Model instanceModel = modelFactory.createModel();
        Resource instanceId = factory.createIRI(instanceIRI);
        RepositoryResult<Statement> statements = conn.getStatements(instanceId, null, null);
        int count = 100;
        while (statements.hasNext() && count > 0) {
            Statement statement = statements.next();
            IRI predicate = statement.getPredicate();
            Value object = statement.getObject();
            instanceModel.add(instanceId, predicate, object);
            instanceModel.addAll(getReifiedStatements(conn, instanceId, predicate, object));
            count--;
        }
        return instanceModel;
    }

    /**
     * Gets the instance and all associated reified statements
     *
     * @param instanceIRI The ID of the instance to retrieve.
     * @param conn        The DatasetConnection to use to find the triples.
     * @return A Model containing all triples which represent the instance.
     */
    private Model getInstance(String instanceIRI, DatasetConnection conn) {
        Model instanceModel = modelFactory.createModel();
        Resource instanceId = factory.createIRI(instanceIRI);
        RepositoryResult<Statement> statements = conn.getStatements(instanceId, null, null);
        statements.forEach(statement -> {
            IRI predicate = statement.getPredicate();
            Value object = statement.getObject();
            instanceModel.add(instanceId, predicate, object);
            instanceModel.addAll(getReifiedStatements(conn, instanceId, predicate, object));
        });
        return instanceModel;
    }

    /**
     * Creates a Response which contains the proper paged details.
     *
     * @param uriInfo    The URI information of the request.
     * @param items      The total list of items that need to be sorted, limited, and offset.
     * @param comparator The Comparator which will be used to sort the items.
     * @param asc        Whether the sorting should be ascending or descending.
     * @param limit      The size of the page of items to return.
     * @param offset     The number of items to skip.
     * @param <T>        A class that extends Object.
     * @return A Response with a page of items that has been filtered, sorted, and limited and headers for the total
     *         size and links to the next and previous pages if present.
     */
    private <T> Response createPagedResponse(UriInfo uriInfo, List<T> items, Comparator<T> comparator, boolean asc,
                                             int limit, int offset) {
        validatePaginationParams(limit, offset, items.size());
        Stream<T> stream = items.stream();
        if (!asc) {
            stream = stream.sorted(comparator.reversed());
        } else {
            stream = stream.sorted(comparator);
        }
        if (offset > 0) {
            stream = stream.skip(offset);
        }
        if (limit > 0) {
            stream = stream.limit(limit);
        }
        List<T> pagedItems = stream.collect(Collectors.toList());
        Response.ResponseBuilder builder = Response.ok(pagedItems).header("X-Total-Count", items.size());
        Links links = LinksUtils.buildLinks(uriInfo, pagedItems.size(), items.size(), limit, offset);
        if (links.getNext() != null) {
            builder = builder.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            builder = builder.link(links.getBase() + links.getPrev(), "prev");
        }
        return builder.build();
    }

    /**
     * Validates the limit and offset parameters for pagination. If either parameter is invalid, throws a 400 Response.
     *
     * @param limit  The limit of the paginated response.
     * @param offset The offset for the paginated response.
     * @param total  The total number of results.
     */
    private void validatePaginationParams(int limit, int offset, int total) {
        LinksUtils.validateParams(limit, offset);
        if (offset > total) {
            throw ErrorUtils.sendError("Offset exceeds total size", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Split camel case string using zero-length matching regex with lookbehind and lookforward to find where to insert
     * spaces.
     *
     * @param string Camel case string to split
     * @return human readable string
     */
    private String splitCamelCase(String string) {
        if (!string.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            return string.replaceAll("(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])|(?<=[A-Za-z])(?=[^A-Za-z])", " ");
        }
        return string;
    }

    /**
     * Retrieve entity label/title inside a given model in the following order
     * rdfs:label, dcterms:title, or beautified version of local name.
     *
     * @param model Model with pertinent data
     * @param iri   Entity to find label/title of
     * @return entity label
     */
    private String findLabelToDisplay(Model model, IRI iri) {
        return findPropertyToDisplay(model, iri, RDFS.LABEL.stringValue(), _Thing.title_IRI);
    }

    /**
     * Retrieve entity description inside a given model in the following order
     * rdfs:comment, dcterms:description, or default empty string.
     *
     * @param model Model with pertinent data
     * @param iri   Entity to find label/title of
     * @return entity label
     */
    private String findDescriptionToDisplay(Model model, IRI iri) {
        return findPropertyToDisplay(model, iri, RDFS.COMMENT.stringValue(), _Thing.description_IRI);
    }

    /**
     * Retrieve entity value inside a given model in the following order rdfsProp, dcProp, or default empty string.
     *
     * @param model    Model with pertinent data
     * @param iri      Entity to find value of
     * @param rdfsProp RDFS defined property to get the value of
     * @param dcProp   DCTERMS defined property to get the value of
     * @return entity value
     */
    private String findPropertyToDisplay(Model model, IRI iri, String rdfsProp, String dcProp) {
        if (model.size() > 0) {
            Optional<Statement> rdfs = model.filter(null, factory.createIRI(rdfsProp), null).stream().findFirst();
            if (rdfs.isPresent()) {
                return rdfs.get().getObject().stringValue();
            } else {
                Optional<Statement> dcterm = model.filter(null, factory.createIRI(dcProp), null).stream().findFirst();
                return dcterm.map(statement -> statement.getObject().stringValue()).orElseGet(() -> splitCamelCase(iri
                        .getLocalName()));
            }
        }
        return "";
    }

    /**
     * Get query results.
     *
     * @param datasetRecordRsr dataset record resource
     * @param query            query result object with instances examples
     * @param bindingStr       name of the variable that should be bound
     * @param bindingVal       value for the specified variable
     * @return variable-binding query result
     */
    private TupleQueryResult getQueryResults(Resource datasetRecordRsr, String query, String bindingStr,
                                             Value bindingVal) {
        try (DatasetConnection dsConn = datasetManager.getConnection(datasetRecordRsr)) {
            TupleQuery tq = dsConn.prepareTupleQuery(query);
            if (!bindingStr.isEmpty() && !bindingVal.stringValue().isEmpty()) {
                tq.setBinding(bindingStr, bindingVal);
            }
            return tq.evaluateAndReturn();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieve instance examples from the query results searching for associated the rdfs:label, dcterms:title, or
     * beautified version of local name.
     *
     * @param examplesResults query result object with instances examples
     * @return examples list
     */
    private List<String> parseInstanceExamples(TupleQueryResult examplesResults) {
        List<String> exList = new ArrayList<>();
        examplesResults.forEach(bindingSetEx -> {
            IRI exampleIRI = factory.createIRI(Bindings.requiredResource(bindingSetEx, EXAMPLE_BINDING).stringValue());
            String fallback = splitCamelCase(exampleIRI.getLocalName());
            exList.add(getValueFromBindingSet(bindingSetEx, LABEL_BINDING, TITLE_BINDING, fallback));
        });
        return exList;
    }

    /**
     * Gets the requested binding value from the provided bindingSet in the following order first, second, or fallback.
     *
     * @param bindingSet the BindingSet which contains the bindings you are looking for
     * @param first      the first option for the binding value
     * @param second     the second option for the binding value
     * @param fallback   the default option for the binding value
     * @return the binding value that is found
     */
    private String getValueFromBindingSet(BindingSet bindingSet, String first, String second, String fallback) {
        String firstStr = bindingSet.getValue(first).flatMap(value -> Optional.of(value.stringValue())).orElse("");
        String secondStr = bindingSet.getValue(second).flatMap(value -> Optional.of(value.stringValue()))
                .orElse(fallback);
        return !firstStr.isEmpty() ? firstStr : secondStr;
    }

    /**
     * Adds ontology details to the list of class details to provide.
     *
     * @param classes     list of all class details to add data to
     * @param ontologies  ontologies attached to the dataset record
     * @param recordModel dataset record model
     * @return list of class details with ontology record title, class title, and class description added.
     */
    private List<ClassDetails> addOntologyDetailsToClasses(List<ClassDetails> classes, Set<Value> ontologies,
                                                           Model recordModel) {
        List<ClassDetails> result = new ArrayList<>();
        List<ClassDetails> copy = new ArrayList<>(classes);
        Iterator<Value> iterator = ontologies.iterator();
        while (iterator.hasNext() && copy.size() != 0) {
            Value value = iterator.next();
            Optional<IRI> ontologyRecordIRIOpt = getObjectOf(recordModel, value, DatasetRecord.linksToRecord_IRI)
                    .flatMap(object -> Optional.of(factory.createIRI(object.stringValue())));
            Optional<Model> compiledResourceOpt = Optional.empty();
            try {
                compiledResourceOpt = getObjectOf(recordModel, value, DatasetRecord.linksToCommit_IRI)
                        .flatMap(object -> Optional.of(catalogManager.getCompiledResource(object)));
            } catch (IllegalArgumentException ex) {
                log.warn(ex.getMessage());
            }
            if (ontologyRecordIRIOpt.isPresent() && compiledResourceOpt.isPresent()) {
                Model compiledResource = compiledResourceOpt.get();
                IRI ontologyRecordIRI = ontologyRecordIRIOpt.get();
                Optional<OntologyRecord> ontologyRecordOpt = catalogManager.getRecord(
                        configProvider.getLocalCatalogIRI(), ontologyRecordIRI, ontologyRecordFactory);
                if (!ontologyRecordOpt.isPresent()) {
                    log.warn("OntologyRecord " + ontologyRecordIRI + " could not be found");
                }
                Model ontologyRecordModel = ontologyRecordOpt.map(Thing::getModel).orElseGet(() ->
                        modelFactory.createModel());
                List<ClassDetails> found = new ArrayList<>();
                copy.forEach(classDetails -> {
                    IRI classIRI = factory.createIRI(classDetails.getClassIRI());
                    Model classModel = compiledResource.filter(classIRI, null, null);
                    if (classModel.size() > 0) {
                        found.add(classDetails);
                        classDetails.setOntologyRecordTitle(findLabelToDisplay(ontologyRecordModel, ontologyRecordIRI));
                        classDetails.setClassTitle(findLabelToDisplay(classModel, classIRI));
                        classDetails.setClassDescription(findDescriptionToDisplay(classModel, classIRI));
                        classDetails.setDeprecated(isClassDeprecated(classModel, classIRI));
                        result.add(classDetails);
                    }
                });
                copy.removeAll(found);
            } else if (!ontologyRecordIRIOpt.isPresent() && !compiledResourceOpt.isPresent()) {
                log.warn("The Compiled Resource and Ontology Record IRI could not be found");
            } else {
                ontologyRecordIRIOpt.ifPresent(iri -> log.warn("The Compiled Resource for OntologyRecord " + iri
                        + " could not be found"));
            }
        }
        return result;
    }

    /**
     * Compile the basic class details associated with the dataset record.
     *
     * @param results        the query results which contain the basic class details
     * @param recordResource the dataset record IRI
     * @return list of class details with their count, IRI, and examples
     */
    private List<ClassDetails> getClassDetailsFromQueryResults(TupleQueryResult results, Resource recordResource) {
        List<ClassDetails> classes = new ArrayList<>();
        results.forEach(bindingSet -> {
            if (bindingSet.getValue(TYPE_BINDING).isPresent() && bindingSet.getValue(COUNT_BINDING).isPresent()) {
                TupleQueryResult examplesResults = getQueryResults(recordResource, GET_CLASSES_DETAILS, CLASS_BINDING,
                        bindingSet.getValue(TYPE_BINDING).get());
                ClassDetails classDetails = new ClassDetails();
                classDetails.setInstancesCount(Integer.parseInt(bindingSet.getValue(COUNT_BINDING).get()
                        .stringValue()));
                classDetails.setClassIRI(bindingSet.getValue(TYPE_BINDING).get().stringValue());
                classDetails.setClassExamples(parseInstanceExamples(examplesResults));
                classes.add(classDetails);
            }
        });
        return classes;
    }

    /**
     * Compile the instance details associated with a specific class type of instances of a dataset.
     *
     * @param results the query results which contain instance details
     * @return list of instance details with their IRI, title, and description
     */
    private List<InstanceDetails> getInstanceDetailsFromQueryResults(TupleQueryResult results) {
        List<InstanceDetails> instances = new ArrayList<>();
        results.forEach(instance -> {
            if (instance.size() > 0) {
                InstanceDetails instanceDetails = new InstanceDetails();
                String instanceIRI = instance.getValue(INSTANCE_BINDING).flatMap(value -> Optional.of(value.stringValue()))
                        .orElse("");
                instanceDetails.setInstanceIRI(instanceIRI);
                instanceDetails.setTitle(getValueFromBindingSet(instance, LABEL_BINDING, TITLE_BINDING,
                        splitCamelCase(factory.createIRI(instanceIRI).getLocalName())));
                instanceDetails.setDescription(getValueFromBindingSet(instance, COMMENT_BINDING, DESCRIPTION_BINDING, ""));
                instances.add(instanceDetails);
            }
        });
        return instances;
    }

    /**
     * Gets all of the properties from the ontologies associated with the DatasetRecord that can be set on the provided
     * class IRI.
     *
     * @param record   the DatasetRecord which contains the list of ontologies to search
     * @param classIRI the IRI of the class
     * @return list of property details with their IRI, range, and type
     */
    private List<PropertyDetails> getClassProperties(DatasetRecord record, String classIRI) {
        List<PropertyDetails> details = new ArrayList<>();
        Model recordModel = record.getModel();
        IRI classId = factory.createIRI(classIRI);
        record.getOntology().forEach(value -> getOntology(recordModel, value).ifPresent(ontology -> {
            if (ontology.containsClass(classId)) {
                Set<Restriction> restrictions = getRestrictions(classId, ontology);
                ontology.getAllClassDataProperties(classId).stream()
                        .map(dataProperty -> createPropertyDetails(dataProperty.getIRI(),
                                ontology.getDataPropertyRange(dataProperty), "Data", restrictions))
                        .forEach(detail -> updateDetails(details, detail));
                ontology.getAllClassObjectProperties(classId).stream()
                        .map(objectProperty -> createPropertyDetails(objectProperty.getIRI(),
                                ontology.getObjectPropertyRange(objectProperty), "Object", restrictions))
                        .forEach(detail -> updateDetails(details, detail));
            } else {
                ontology.getAllNoDomainDataProperties().stream()
                        .map(dataProperty -> createPropertyDetails(dataProperty.getIRI(),
                                ontology.getDataPropertyRange(dataProperty), "Data"))
                        .forEach(detail -> updateDetails(details, detail));
                ontology.getAllNoDomainObjectProperties().stream()
                        .map(objectProperty -> createPropertyDetails(objectProperty.getIRI(),
                                ontology.getObjectPropertyRange(objectProperty), "Object"))
                        .forEach(detail -> updateDetails(details, detail));
            }
        }));
        return details;
    }

    private static class Restriction {
        private Resource propertyIRI;
        private RestrictionDetails details;

        Restriction(Resource propertyIRI, RestrictionDetails details) {
            this.propertyIRI = propertyIRI;
            this.details = details;
        }

        Resource getPropertyIRI() {
            return propertyIRI;
        }

        public RestrictionDetails getDetails() {
            return details;
        }
    }

    private Set<Restriction> getRestrictions(IRI classId, Ontology ontology) {
        String queryStr = GET_CARDINALITY_RESTRICTIONS.replace(CLASS_IRI_REPLACE, classId.stringValue());
        Set<Restriction> restrictions = new HashSet<>();
        ontology.getTupleQueryResults(queryStr, true).forEach(bindings -> {
            if (bindings.hasBinding("property")) {
                RestrictionDetails detail = new RestrictionDetails();
                detail.setCardinality(Bindings.requiredLiteral(bindings, "cardinality").intValue());
                detail.setCardinalityType(Bindings.requiredResource(bindings, "cardinalityType").stringValue());
                restrictions.add(new Restriction(Bindings.requiredResource(bindings, "property"), detail));
            }
        });
        return restrictions;
    }

    /**
     * Updates the details list if the property has already been found before.
     *
     * @param details the list of details to update.
     * @param detail  the new detail that should be added to the list.
     */
    private void updateDetails(List<PropertyDetails> details, PropertyDetails detail) {
        int index = details.indexOf(detail);
        if (index != -1) {
            PropertyDetails found = details.get(index);
            Set<String> range = found.getRange();
            range.addAll(detail.getRange());
            found.setRange(range);
        } else {
            details.add(detail);
        }
    }

    /**
     * Gets the ontology based on the statements with the provided value as a subject found within the provided model.
     *
     * @param model the Model which contains the statements identifying the record, branch, and commit IRIs
     * @param value the Value which is the common subject for all of the statements containing the ontology details
     * @return an Optional containing the ontology if it was found
     */
    private Optional<Ontology> getOntology(Model model, Value value) {
        Optional<Resource> recordId = getObjectOf(model, value, DatasetRecord.linksToRecord_IRI);
        Optional<Resource> branchId = getObjectOf(model, value, DatasetRecord.linksToBranch_IRI);
        Optional<Resource> commitId = getObjectOf(model, value, DatasetRecord.linksToCommit_IRI);
        if (recordId.isPresent() && branchId.isPresent() && commitId.isPresent()) {
            return ontologyManager.retrieveOntology(recordId.get(), branchId.get(), commitId.get());
        }
        return Optional.empty();
    }

    /**
     * Gets the object of the statement contained in the model with a subject equal to the provided Value and a
     * predicate equal to the IRI created using the provided property String.
     *
     * @param model    the Model containing the desired statement
     * @param value    the Value which will be the subject of the statement
     * @param property the String which will be used to create the IRI for the predicate
     * @return an Optional containing the Resource if it was found
     */
    private Optional<Resource> getObjectOf(Model model, Value value, String property) {
        return model.filter((Resource) value, factory.createIRI(property), null).stream()
                .findFirst()
                .flatMap(Statements::objectResource);
    }

    /**
     * Creates a PropertyDetails object using the IRI, range, type, and cardinality restrictions.
     *
     * @param propertyIRI  the IRI of the property
     * @param range        the range of the property
     * @param type         the type of the property
     * @param allRestrictions list of cardinality restrictions to check for the property
     * @return a new PropertyDetails object constructed from the parameters
     */
    private PropertyDetails createPropertyDetails(IRI propertyIRI, Set<Resource> range, String type,
                                                  Set<Restriction> allRestrictions) {
        PropertyDetails details = createPropertyDetails(propertyIRI, range, type);
        Set<RestrictionDetails> allRestrictionDetails = allRestrictions.stream()
                .filter(restriction -> restriction.getPropertyIRI().equals(propertyIRI))
                .map(Restriction::getDetails)
                .collect(Collectors.toSet());
        if (allRestrictionDetails.size() > 0) {
            details.setRestrictions(allRestrictionDetails);
        }
        return details;
    }

    /**
     * Creates a PropertDetails object using the IRI, range, and type.
     *
     * @param propertyIRI  the IRI of the property
     * @param range        the range of the property
     * @param type         the type of the property
     * @return a new PropertyDetails object constructed from the parameters
     */
    private PropertyDetails createPropertyDetails(IRI propertyIRI, Set<Resource> range, String type) {
        PropertyDetails details = new PropertyDetails();
        details.setPropertyIRI(propertyIRI.toString());
        details.setRange(range.stream().map(Value::stringValue).collect(Collectors.toSet()));
        details.setType(type);
        return details;
    }

    /**
     * Gets the model for the reified statements associated with the provided subject, predicate, and object.
     *
     * @param conn      the DatasetConnection to use for the query
     * @param subject   the reified statement's subject
     * @param predicate the reified statement's predicate
     * @param object    the reified statement's object
     * @return a Model containing all reified statements associated with the provided subject, predicate, and object
     */
    private Model getReifiedStatements(DatasetConnection conn, Resource subject, IRI predicate, Value object) {
        GraphQuery query = conn.prepareGraphQuery(GET_REIFIED_STATEMENTS);
        query.setBinding(SUBJECT_BINDING, subject);
        query.setBinding(PREDICATE_BINDING, predicate);
        query.setBinding(OBJECT_BINDING, object);
        return QueryResults.asModel(query.evaluate(), modelFactory);
    }

    /**
     * Checks to see if the class represented by the provided model contains a triple identifying it as a deprecated
     * class.
     *
     * @param classModel the Model with all the class triples
     * @param classId    the class IRI
     * @return true if class is deprecated; otherwise, false
     */
    private boolean isClassDeprecated(Model classModel, Resource classId) {
        IRI deprecatedIRI = factory.createIRI(OWL.NAMESPACE + "deprecated");
        return classModel.contains(classId, deprecatedIRI, factory.createLiteral(true))
                || classModel.contains(classId, deprecatedIRI, factory.createLiteral("1"));
    }
}
