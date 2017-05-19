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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
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
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.vocabulary.RDFS;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class ExplorableDatasetRestImpl implements ExplorableDatasetRest {

    private DatasetManager datasetManager;
    private CatalogManager catalogManager;
    private ValueFactory factory;

    private static final String GET_CLASSES_TYPES;
    private static final String GET_CLASSES_DETAILS;
    private static final String GET_CLASSES_INSTANCES;

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


    @Override
    public Response getClassDetails(String recordIRI, int offset, int limit, String sort, boolean asc, String filter) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        DatasetRecord record = datasetManager.getDatasetRecord(datasetRecordRsr).orElseThrow(() ->
                ErrorUtils.sendError("The Dataset Record could not be found.", Response.Status.BAD_REQUEST));
        try {
            TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_TYPES, "", null);
            List<ClassDetails> classes = getClassDetailsFromQueryResults(results, datasetRecordRsr);
            classes = addOntologyDetailsToClasses(classes, record.getOntology(), record.getModel());
            return Response.ok(classes).header("X-Total-Count", classes.size()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getInstanceDetails(String recordIRI, String classIRI, int offset, int limit, String sort,
                                       boolean asc, int numExamples) {
        checkStringParam(recordIRI, "The Dataset Record IRI is required.");
        checkStringParam(classIRI, "The Class IRI is required.");
        try {
            Resource datasetRecordRsr = factory.createIRI(recordIRI);
            TupleQueryResult results = getQueryResults(datasetRecordRsr, GET_CLASSES_INSTANCES, "classIRI",
                    factory.createIRI(classIRI));
            List<InstanceDetails> instances = getInstanceDetailsFromQueryResults(results);
            return Response.ok(instances).header("X-Total-Count", instances.size()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
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
        return string.replaceAll(String.format("%s|%s|%s", "(?<=[A-Z])(?=[A-Z][a-z])", "(?<=[^A-Z])(?=[A-Z])",
                "(?<=[A-Za-z])(?=[^A-Za-z])"), " ");
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
                if (dcterm.isPresent()) {
                    return dcterm.get().getObject().stringValue();
                } else {
                    return splitCamelCase(iri.stringValue());
                }
            }
        }
        return "";
    }

    /**
     * Parse query results.
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
        }
    }

    /**
     * Retrieve instances examples from query result object
     * rdfs:comment, dcterms:description, or default empty string.
     *
     * @param examplesResults query result object with instances examples
     * @return examples list
     */
    private List<String> parseInstanceExamples(TupleQueryResult examplesResults) {
        List<String> exList = new ArrayList<>();
        examplesResults.forEach(bindingSetEx -> {
            IRI exampleIRI = factory.createIRI(Bindings.requiredResource(bindingSetEx, "example").stringValue());
            String fallback = splitCamelCase(exampleIRI.getLocalName());
            exList.add(getValueFromBindingSet(bindingSetEx, "label", "title", fallback));
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
        String firstStr = (bindingSet.getValue(first).isPresent() ? bindingSet.getValue(first).get().stringValue()
                : "");
        String secondStr = (bindingSet.getValue(second).isPresent() ? bindingSet.getValue(second).get().stringValue()
                : fallback);
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
                    .flatMap(statement -> catalogManager.getCompiledResource(factory.createIRI(statement.getObject()
                            .stringValue())));
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
            if (bindingSet.getValue("type").isPresent() && bindingSet.getValue("c").isPresent()) {
                TupleQueryResult examplesResults = getQueryResults(recordResource, GET_CLASSES_DETAILS, "classIRI",
                        bindingSet.getValue("type").get());
                ClassDetails classDetails = new ClassDetails();
                classDetails.setInstancesCount(Integer.parseInt(bindingSet.getValue("c").get().stringValue()));
                classDetails.setClassIRI(bindingSet.getValue("type").get().stringValue());
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
            String instanceIRI = (instance.getValue("inst").isPresent() ? instance.getValue("inst").get()
                    .stringValue() : "");
            instanceDetails.setInstanceIRI(instanceIRI);
            instanceDetails.setTitle(getValueFromBindingSet(instance, "label", "title",
                    splitCamelCase(factory.createIRI(instanceIRI).getLocalName())));
            instanceDetails.setDescription(getValueFromBindingSet(instance, "comment", "description", ""));
            instances.add(instanceDetails);
        });
        return instances;
    }
}