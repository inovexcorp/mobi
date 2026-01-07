package com.mobi.shacl.form.rest;

/*-
 * #%L
 * com.mobi.shacl.form.rest
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
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.mobi.catalog.api.builder.Entity;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.ontologies.shacl.PropertyShape;
import com.mobi.ontologies.shacl.PropertyShapeFactory;
import com.mobi.ontologies.shacl.SPARQLConstraint;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.xacml.XACML;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
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

@Component(service = WebFormRest.class, immediate = true)
@JaxrsResource
@Path("/web-forms")
public class WebFormRest {
    private static final String GET_NAMES;

    static {
        try {
            GET_NAMES = IOUtils.toString(
                    Objects.requireNonNull(WebFormRest.class.getResourceAsStream("/get-names.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public PropertyShapeFactory propertyShapeFactory;

    @Reference
    public CatalogConfigProvider configProvider;

    @Reference
    public EngineManager engineManager;

    @Reference
    public PDP pdp;

    public final ValueFactory vf = new ValidatingValueFactory();

    /**
     * Handles a POST request to retrieve autocomplete options based on a given property shape and an optional focus node.
     * This method accepts JSON-LD representations of the property shape and the focus node, processes them,
     * and returns a list of autocomplete options that match the criteria defined by these shapes.
     *
     * <p>Responses:
     * <ul>
     * <li>200 - Successful retrieval of options. The response includes a JSON array of the options.</li>
     * <li>400 - Bad Request. This could occur if required parameters are missing or if the provided JSON-LD is not valid.</li>
     * <li>500 - Internal Server Error. This typically occurs if there's an error during processing within the server.</li>
     * </ul></p>
     *
     * @param servletRequest the HttpServletRequest providing request information for HTTP servlets.
     * @param propertyShape a {@link String} JSON-LD representation of the property shape required for fetching
     *                      autocomplete options. It defines constraints and characteristics of the data to be fetched.
     * @param focusNode an optional {@link String} JSON-LD representation of the focus node, which may affect the
     *                  processing of the property shape and the resulting autocomplete options.
     * @return a {@link Response} object containing the status code and the body with autocomplete options.
     * @throws IllegalArgumentException if the input parameters are invalid or insufficient for the operation.
     * @throws IllegalStateException if no property shape is found or more than one property shape exists.
     */
    @POST
    @Path("options")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response retrieveAutoCompleteOptions(@Context HttpServletRequest servletRequest,
                                  @Parameter(schema = @Schema(type = "string",
                                          description = "the json-ld representation of the property shape", required = true))
                                      @FormParam("propertyShape") String propertyShape,
                                  @Parameter(schema = @Schema(type = "string",
                                          description = "the json-ld representation of the focus node"))
                                      @FormParam("focusNode") String focusNode
                                  ) {
        checkStringParam(propertyShape, "propertyShape is required");
        Optional<Resource> focusNodeIRIOpt = Optional.empty();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.begin();
            try {
                Model propertyShapeModel = jsonldToModel(propertyShape);
                if (!StringUtils.isBlank(focusNode)) {
                    Model focusNodeModel = jsonldToModel(focusNode);
                    if (focusNodeModel.size() > 0) {
                        if (focusNodeModel.subjects().size() != 1) {
                            throw new IllegalArgumentException("There must be exactly one subject in the focus node");
                        }
                        focusNodeIRIOpt = focusNodeModel.subjects().stream().findFirst();
                        conn.remove(focusNodeIRIOpt.get(), null, null);
                        conn.add(focusNodeModel, vf.createIRI("http://mobi.com/testgraph"));
                    }
                }
                Collection<PropertyShape> propertyShapes = propertyShapeFactory.getAllExisting(propertyShapeModel);
                List<Entity> options;
                if (propertyShapes.size() == 1) {
                    PropertyShape webFormPropertyShape = propertyShapes.iterator().next();
                    if (!isAutoCompleteShape(webFormPropertyShape)) {
                        throw new IllegalArgumentException("Property Shape provided does not have Autocomplete input");
                    }
                    if (!webFormPropertyShape.getIn().isEmpty()) {
                        options = getExplicitOptions(webFormPropertyShape);
                    } else {
                        if (!hasClassPredicate(webFormPropertyShape)) {
                            throw new IllegalArgumentException("Autocomplete Property Shape must have either sh:in or sh:class predicate");
                        }

                        options = getAutoCompleteOptions(webFormPropertyShape, focusNodeIRIOpt, conn);
                        Set<String> viewableRecords = getViewableRecords((IRI) getActiveUser(servletRequest, engineManager).getResource(), options.stream().map(option -> (IRI) option.getValue()).collect(Collectors.toList()));
                        options = options.stream().filter(option -> viewableRecords.contains(option.getValue().stringValue()))
                                .collect(Collectors.toList());
                        options.sort(Comparator.comparing(Entity::getName));
                    }
                } else if (propertyShapes.isEmpty()) {
                    throw new IllegalStateException("No property shape was found.");
                } else {
                    throw new IllegalStateException("More than one property shape exists.");
                }

                return Response.status(200).entity(options.toString()).build();
            } finally {
                conn.rollback();
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    private boolean hasClassPredicate(PropertyShape webFormPropertyShape) {
        return !webFormPropertyShape.getProperties(vf.createIRI("http://www.w3.org/ns/shacl#class")).isEmpty();
    }

    private List<Entity> getExplicitOptions(PropertyShape webFormPropertyShape) {
        return webFormPropertyShape.getIn().stream().map(option -> {
            return new Entity.Builder().name(option.stringValue()).build();
        }).collect(Collectors.toList());
    }

    private boolean isAutoCompleteShape(PropertyShape webFormPropertyShape) {
        Optional<Value> formField = webFormPropertyShape
                .getProperty(vf.createIRI("https://mobi.solutions/ontologies/form#usesFormField"));
        return (formField.isPresent() && formField.get().stringValue()
                .equals("https://mobi.solutions/ontologies/form#AutocompleteInput"));
    }

    private List<Entity> getAutoCompleteOptions(PropertyShape propertyShape, Optional<Resource> focusNodeIRIOpt, RepositoryConnection conn) {
        List<Entity> shClassInstances = getAllShClassInstances(propertyShape, conn);
        if (focusNodeIRIOpt.isPresent()) {
            shClassInstances.forEach(shClassInstance -> {
                conn.add(focusNodeIRIOpt.get(), (IRI) propertyShape.getPath().stream().findFirst().get(), shClassInstance.getValue(), vf.createIRI("http://mobi.com/testgraph"));
            });
        }
        List<Resource> irisToFilterOut = getIRIsToFilter(propertyShape, focusNodeIRIOpt, conn);
        return shClassInstances.stream().filter(entity -> {
            return !irisToFilterOut.contains(entity.getValue());
        }).collect(Collectors.toList());
    }

    private Set<String> getViewableRecords(IRI subjectId, List<IRI> recordIds) {
        IRI actionId = vf.createIRI(Read.TYPE);
        Map<String, Literal> subjectAttrs = Collections.singletonMap(XACML.SUBJECT_ID,
                vf.createLiteral(subjectId.stringValue()));
        Map<String, Literal> actionAttrs = Collections.singletonMap(XACML.ACTION_ID,
                vf.createLiteral(actionId.stringValue()));
        Request request = pdp.createRequest(List.of(subjectId), subjectAttrs, recordIds, new HashMap<>(),
                List.of(actionId), actionAttrs);
        return pdp.filter(request, vf.createIRI(POLICY_PERMIT_OVERRIDES));
    }

    private List<Resource> getIRIsToFilter(PropertyShape propertyShape, Optional<Resource> focusNodeIRIOpt, RepositoryConnection conn) {
        String query = buildSparqlQuery(propertyShape, focusNodeIRIOpt);
        if (query.isBlank()) {
            return new ArrayList<>();
        }
        TupleQuery entityFilterQuery = conn.prepareTupleQuery(query);
        TupleQueryResult result = entityFilterQuery.evaluate();
        List<Resource> irisToFilter = new ArrayList<>();
        while (result.hasNext()) {
            BindingSet bindings = result.next();
            Optional<Binding> iriBinding = Optional.ofNullable(bindings.getBinding("value"));
            if (iriBinding.isPresent()) {
                IRI iri = vf.createIRI(iriBinding.get().getValue().stringValue());
                irisToFilter.add(iri);
            }
        }
        return irisToFilter;
    }

    private List<Entity> getAllShClassInstances(PropertyShape propertyShape, RepositoryConnection conn) {
        String shClass = propertyShape.getProperties(vf.createIRI("http://www.w3.org/ns/shacl#class")).stream()
                .findFirst()
                .map(Value::stringValue)
                .orElseThrow(() -> new RuntimeException("PropertyShape missing sh:class"));
        String queryString = GET_NAMES.replace("%SH_CLASS%", "<" + shClass + ">");
        TupleQuery query = conn.prepareTupleQuery(queryString);
        TupleQueryResult result = query.evaluate();
        List<Entity> shClassInstances = new ArrayList<Entity>();
        while (result.hasNext()) {
            BindingSet bindings = result.next();
            Optional<Binding> iriBinding = Optional.ofNullable(bindings.getBinding("value"));
            Optional<Binding> nameBinding = Optional.ofNullable(bindings.getBinding("name"));
            if (iriBinding.isPresent() && nameBinding.isPresent()) {
                IRI iri = vf.createIRI(iriBinding.get().getValue().stringValue());
                String name = nameBinding.get().getValue().stringValue();
                Entity entity = new Entity.Builder().value(iri).name(name).build();
                shClassInstances.add(entity);
            }
        }
        return shClassInstances;
    }

    private String buildSparqlQuery(PropertyShape propertyShape, Optional<Resource> focusNodeIRIOpt) {
        String queryString = "";
        if (!propertyShape.getSparql().isEmpty()) {
            if (focusNodeIRIOpt.isEmpty()) {
                throw new IllegalArgumentException("Focus node must be present when property shape has a " +
                        "SPARQL constraint");
            }
            String path = propertyShape.getPath().stream()
                    .findFirst()   // Assume you only expect a single sh:path
                    .map(Value::stringValue)
                    .orElseThrow(() -> new RuntimeException("PropertyShape missing sh:path")); // Error handling

            Set<SPARQLConstraint> constraints = propertyShape.getSparql();
            if (constraints != null) {
                if (constraints.size() > 1) {
                    throw new IllegalArgumentException("PropertyShape cannot have more than one SPARQL constraint");
                }

                SPARQLConstraint constraint = constraints.iterator().next();
                Set<String> selectQueries = constraint.getSelect();
                if (selectQueries == null || selectQueries.size() != 1) {
                    throw new IllegalArgumentException("SPARQL constraint must have exactly one SELECT query fragment");
                }

                String selectQuery = selectQueries.iterator().next(); // Get the single query fragment

                String processedQuery = selectQuery.replace("$PATH", "<" + path + ">")
                        .replaceFirst("\\$this", "")
                        .replace("$this", "<" + focusNodeIRIOpt.get().stringValue() + ">")
                        + " ";

                queryString += processedQuery;
            }
        }
        return queryString;
    }

}
