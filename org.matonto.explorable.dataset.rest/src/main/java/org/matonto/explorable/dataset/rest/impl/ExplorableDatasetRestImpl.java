package org.matonto.explorable.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.dataset.rest
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

import static org.matonto.rest.util.RestUtils.checkStringParam;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.exception.MatOntoException;
import org.matonto.explorable.dataset.rest.ExplorableDatasetRest;
import org.matonto.explorable.dataset.rest.jaxb.ClassDetails;
import org.matonto.explorable.dataset.rest.jaxb.InstanceDetails;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.LinksUtils;
import org.matonto.rest.util.jaxb.Links;
import org.openrdf.model.vocabulary.RDFS;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class ExplorableDatasetRestImpl implements ExplorableDatasetRest {

    private DatasetManager datasetManager;
    private CatalogManager catalogManager;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private SesameTransformer sesameTransformer;

    private static final String GET_CLASSES_TYPES;
    private static final String GET_CLASSES_DETAILS;
    private static final String GET_CLASSES_INSTANCES;
    private static final String COUNT_BINDING = "c";
    private static final String TYPE_BINDING = "type";
    private static final String INSTANCE_BINDING = "inst";
    private static final String LABEL_BINDING = "label";
    private static final String COMMENT_BINDING = "comment";
    private static final String TITLE_BINDING = "title";
    private static final String DESCRIPTION_BINDING = "description";
    private static final String CLASS_BINDING = "classIRI";
    private static final String EXAMPLE_BINDING = "example";

    static {
        try {
            GET_CLASSES_TYPES = IOUtils.toString(
                    ExplorableDatasetRestImpl.class.getResourceAsStream("/get-classes-types.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CLASSES_DETAILS = IOUtils.toString(
                    ExplorableDatasetRestImpl.class.getResourceAsStream("/get-classes-details.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CLASSES_INSTANCES = IOUtils.toString(
                    ExplorableDatasetRestImpl.class.getResourceAsStream("/get-classes-instances.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
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

    @Override
    public Response getClassDetails(UriInfo uriInfo, String recordIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        try {
            DatasetRecord record = datasetManager.getDatasetRecord(datasetRecordRsr).orElseThrow(() ->
                    ErrorUtils.sendError("The Dataset Record could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_TYPES, "", null);
            List<ClassDetails> classes = getClassDetailsFromQueryResults(results, datasetRecordRsr);
            classes = addOntologyDetailsToClasses(classes, record.getOntology(), record.getModel());
            return Response.ok(classes).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getInstanceDetails(UriInfo uriInfo, String recordIRI, String classIRI, int offset, int limit,
                                       boolean asc) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(classIRI, "The Class IRI is required.");
        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        try {
            TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_INSTANCES, CLASS_BINDING,
                    factory.createIRI(classIRI));
            List<InstanceDetails> instances = getInstanceDetailsFromQueryResults(results);
            Comparator<InstanceDetails> comparator = Comparator.comparing(InstanceDetails::getTitle);
            return createPagedResponse(uriInfo, instances, comparator, asc, limit, offset);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getInstance(UriInfo uriInfo, String recordIRI, String instanceIRI) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(instanceIRI, "The Instance IRI is required.");
        try (DatasetConnection conn = datasetManager.getConnection(factory.createIRI(recordIRI))) {
            Model instanceModel = modelFactory.createModel();
            Resource instanceId = factory.createIRI(instanceIRI);
            RepositoryResult<Statement> statements = conn.getStatements(instanceId, null, null);
            int count = 100;
            while (statements.hasNext() && count != 0) {
                Statement statement = statements.next();
                instanceModel.add(instanceId, statement.getPredicate(), statement.getObject());
                count--;
            }
            if (instanceModel.size() == 0) {
                throw ErrorUtils.sendError("The requested instance could not be found.", Response.Status.BAD_REQUEST);
            } else {
                String json = modelToJsonld(sesameTransformer.sesameModel(instanceModel));
                return Response.ok(JSONArray.fromObject(json).get(0)).build();
            }
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
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
        return string.replaceAll("(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])|(?<=[A-Za-z])(?=[^A-Za-z])", " ");
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
            BNode blankNode = factory.createBNode(iterator.next().stringValue());
            Optional<IRI> ontologyRecordIRIOpt = recordModel.filter(blankNode, factory.createIRI(DatasetRecord
                    .linksToRecord_IRI), null).stream()
                    .findFirst()
                    .flatMap(statement -> Optional.of(factory.createIRI(statement.getObject().stringValue())));
            Optional<Model> compiledResourceOpt = recordModel.filter(blankNode, factory.createIRI(DatasetRecord
                    .linksToCommit_IRI), null).stream()
                    .findFirst()
                    .flatMap(statement -> Optional.of(catalogManager.getCompiledResource(factory.createIRI(statement
                            .getObject().stringValue()))));
            if (ontologyRecordIRIOpt.isPresent() && compiledResourceOpt.isPresent()) {
                Model compiledResource = compiledResourceOpt.get();
                IRI ontologyRecordIRI = ontologyRecordIRIOpt.get();
                List<ClassDetails> found = new ArrayList<>();
                copy.forEach(classDetails -> {
                    IRI classIRI = factory.createIRI(classDetails.getClassIRI());
                    Model classModel = compiledResource.filter(classIRI, null, null);
                    if (classModel.size() > 0) {
                        found.add(classDetails);
                        classDetails.setOntologyRecordTitle(findLabelToDisplay(compiledResource, ontologyRecordIRI));
                        classDetails.setClassTitle(findLabelToDisplay(classModel, classIRI));
                        classDetails.setClassDescription(findDescriptionToDisplay(classModel, classIRI));
                        result.add(classDetails);
                    }
                });
                copy.removeAll(found);
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
            InstanceDetails instanceDetails = new InstanceDetails();
            String instanceIRI = instance.getValue(INSTANCE_BINDING).flatMap(value -> Optional.of(value.stringValue()))
                    .orElse("");
            instanceDetails.setInstanceIRI(instanceIRI);
            instanceDetails.setTitle(getValueFromBindingSet(instance, LABEL_BINDING, TITLE_BINDING,
                    splitCamelCase(factory.createIRI(instanceIRI).getLocalName())));
            instanceDetails.setDescription(getValueFromBindingSet(instance, COMMENT_BINDING, DESCRIPTION_BINDING, ""));
            instances.add(instanceDetails);
        });
        return instances;
    }
}