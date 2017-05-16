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
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.*;

import java.io.IOException;
import java.util.*;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.matonto.rdf.api.Model;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.vocabulary.RDFS;
import org.matonto.query.api.TupleQuery;


/**
 * Created by Norman Vargas on 5/8/17.
 */
@Component(immediate = true)
public class ExplorableDatasetRestImpl implements ExplorableDatasetRest {


    private DatasetManager datasetManager;
    private CatalogManager catalogManager;
    private ValueFactory factory;

    private static final String GET_CLASSES_TYPES;
    private static final String GET_CLASSES_DETAILS;

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
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Override
    public Response getDatasets(UriInfo uriInfo, int offset, int limit, String sort, boolean asc, String filter) {
        return null;
    }

    @Override
    public Response getDatasetData(UriInfo uriInfo, String datasetRecordId, int offset, int limit, String sort, boolean asc, String filter) {
        return null;
    }

    @Override
    public Response getClassDetaills(UriInfo uriInfo, String recordIRI, int offset, int limit, String sort, boolean asc, String filter) {

        Resource datasetRecordRsr = factory.createIRI(recordIRI);
        Map<String, Map<String, Object>> classesFromQuery = new HashMap<>();
        Map<String, String> classesFromQueryList = new HashMap<>();

        List<Resource> classesList = new ArrayList<>();
        List<Map<String, Object>> listToJson = new ArrayList<>();
        DatasetConnection dsConn = datasetManager.getConnection(datasetRecordRsr);

        try {
            TupleQuery tq = dsConn.prepareTupleQuery(GET_CLASSES_TYPES);
            TupleQueryResult results = tq.evaluate();

            Optional<DatasetRecord> datasetRecordOpt = datasetManager.getDatasetRecord(datasetRecordRsr);
            Model result = datasetRecordOpt.get().getModel();

            while (results.hasNext()) {

                Map<String, Object> classMap = new HashMap<>();
                BindingSet bindingSet = results.next();

                Optional<Value> classType = bindingSet.getValue("type");
                Optional<Value> classCount = bindingSet.getValue("c");

                classMap.put("classType", classType.get().stringValue());
                classMap.put("instancesCount", classCount.get().stringValue());

                Value classIRI = classType.get();

                TupleQuery tqEx = dsConn.prepareTupleQuery(GET_CLASSES_DETAILS);
                tqEx.setBinding("classIRI", classIRI);
                TupleQueryResult examplesResults = tqEx.evaluate();
                List<String> exList = new ArrayList<>();
                while (examplesResults.hasNext()) {
                    BindingSet bindingSetEx = examplesResults.next();

                    String lblStr = (bindingSetEx.getValue("label").isPresent() ? bindingSetEx.getValue("label").get().stringValue() : "");
                    String titleStr = (bindingSetEx.getValue("title").isPresent() ? bindingSetEx.getValue("title").get().stringValue() : "");

                    if (!lblStr.isEmpty()) {
                        exList.add(lblStr);
                    } else {
                        if (!titleStr.isEmpty()) {
                            exList.add(titleStr);
                        } else {
                            IRI exampleIRI = factory.createIRI(bindingSetEx.getValue("example").get().stringValue());
                            exList.add(splitCamelCase(exampleIRI.getLocalName()));
                        }
                    }
                }
                classMap.put("classExamples", exList);

                classesList.add(factory.createIRI(classType.get().stringValue()));
                classesFromQuery.put(classType.get().stringValue(), classMap);
                classesFromQueryList.put(classType.get().stringValue(), classType.get().stringValue());
            }

            Set<Value> ontologies = datasetRecordOpt.get().getOntology();
            ontologies.forEach(ontBlkNode -> {

                Optional<Statement> branchStmt = result.filter(factory.createBNode(ontBlkNode.stringValue()), factory.createIRI(DatasetRecord.linksToBranch_IRI), null).stream().findFirst();
                Optional<Statement> commitStmt = result.filter(factory.createBNode(ontBlkNode.stringValue()), factory.createIRI(DatasetRecord.linksToCommit_IRI), null).stream().findFirst();
                Optional<Statement> ontologyRecordStmt = result.filter(factory.createBNode(ontBlkNode.stringValue()), factory.createIRI(DatasetRecord.linksToRecord_IRI), null).stream().findFirst();
                Optional<Model> compiledResource = catalogManager.getCompiledResource(factory.createIRI(commitStmt.get().getObject().stringValue()));

                if (compiledResource.isPresent()) {
                    for (Iterator<Map.Entry<String, String>> it = classesFromQueryList.entrySet().iterator(); it.hasNext(); ) {
                        Map.Entry<String, String> entry = it.next();
                        Map<String, Object> mapToJson = new HashMap<>();
                        Resource classRsrc = factory.createIRI(entry.getValue().toString());
                        Model classModel = compiledResource.get().filter(classRsrc, null, null);
                        if (classModel.size() > 0) {
                            it.remove();

                            mapToJson.put("ontologyRecordTitle", findLabelToDisplay(compiledResource.get(), factory.createIRI(ontologyRecordStmt.get().getObject().stringValue())));
                            mapToJson.put("classIRI", entry.getValue().toString());
                            mapToJson.put("classTitle", findLabelToDisplay(classModel, factory.createIRI(classRsrc.stringValue())));
                            mapToJson.put("classDescription", findDescriptionToDisplay(classModel, factory.createIRI(entry.getValue().toString())));
                            mapToJson.put("instancesCount", Integer.parseInt(classesFromQuery.get(entry.getValue().toString()).get("instancesCount").toString()));
                            mapToJson.put("branchIRI", branchStmt.get().getObject().stringValue());
                            mapToJson.put("branchIRI", branchStmt.get().getObject().stringValue());
                            mapToJson.put("commitIRI", commitStmt.get().getObject().stringValue());
                            mapToJson.put("ontologyRecordIRI", ontologyRecordStmt.get().getObject().stringValue());
                            mapToJson.put("dataset", datasetRecordRsr.stringValue());
                            mapToJson.put("classExamples", classesFromQuery.get(entry.getValue().toString()).get("classExamples"));

                            listToJson.add(mapToJson);
                        }
                    }
                }
            });
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        JSONArray array = JSONArray.fromObject(listToJson);
        Response.ResponseBuilder response = Response.ok(array).header("X-Total-Count", listToJson.size());
        return response.build();
    }

    @Override
    public Response getIntanceDetails(UriInfo uriInfo, String recordIRI, String classIRI, int offset, int limit, String sort, boolean asc, int numExamples) {
        return null;
    }

    @Override
    public Response getDatasetDataInstance(UriInfo uriInfo, String datasetRecordId, String instanceId, int offset, int limit, String sort, boolean asc) {
        return null;
    }

    /**
     * Split camel case string using zero-length matching regex with lookbehind and lookforward to find where to insert spaces.
     *
     * @param s Camel case string to split
     * @return human readable string
     */
    static String splitCamelCase(String s) {
        return s.replaceAll(
                String.format("%s|%s|%s",
                        "(?<=[A-Z])(?=[A-Z][a-z])",
                        "(?<=[^A-Z])(?=[A-Z])",
                        "(?<=[A-Za-z])(?=[^A-Za-z])"
                ),
                " "
        );
    }

    /**
     * Retrieve entity label/title inside a given model in the following order
     * rdfs:label, dcterms:title, beautify version of local name.
     *
     * @param m Model with pertinent data
     * @param i Entity to find label/title of
     * @return entity label
     */
    public String findLabelToDisplay(Model m, IRI i) {

        if (m.size() > 0) {
            Optional<Statement> rdfsLabel = m.filter(null, factory.createIRI(RDFS.LABEL.stringValue()), null).stream().findFirst();

            if (rdfsLabel.isPresent()) {
                return rdfsLabel.get().getObject().stringValue();
            } else {
                Optional<Statement> dcTitle = m.filter(null, factory.createIRI(_Thing.title_IRI), null).stream().findFirst();
                if (dcTitle.isPresent()) {
                    return dcTitle.get().getObject().stringValue();
                } else {
                    return splitCamelCase(i.stringValue());
                }
            }
        } else {
            return "";
        }
    }

    /**
     * Retrieve entity description inside a given model in the following order
     * rdfs:comments, dcterms:description or default empty string
     *
     * @param m Model with pertinent data
     * @param i Entity to find label/title of
     * @return entity label
     */
    public String findDescriptionToDisplay(Model m, IRI i) {

        if (m.size() > 0) {
            Optional<Statement> rdfsLabel = m.filter(null, factory.createIRI(RDFS.COMMENT.stringValue()), null).stream().findFirst();

            if (rdfsLabel.isPresent()) {
                return rdfsLabel.get().getObject().stringValue();
            } else {
                Optional<Statement> dcTitle = m.filter(null, factory.createIRI(_Thing.description_IRI), null).stream().findFirst();
                if (dcTitle.isPresent()) {
                    return dcTitle.get().getObject().stringValue();
                } else {
                    return splitCamelCase(i.stringValue());
                }
            }
        } else {
            return "";
        }
    }
}