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
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.ontology.dataset.Dataset;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams;
import org.matonto.exception.MatOntoException;
import org.matonto.explorable.dataset.rest.ExplorableDatasetRest;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.*;

import java.util.*;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.openrdf.model.vocabulary.RDFS;
import org.openrdf.query.Operation;
import org.matonto.query.api.TupleQuery;

import java.util.function.Predicate;
import java.util.stream.Collectors;

import static org.matonto.rest.util.RestUtils.modelToJsonld;

/**
 * Created by normanvargas on 5/8/17.
 */
@Component(immediate = true)
public class ExplorableDatasetRestImpl implements ExplorableDatasetRest {


    private DatasetManager datasetManager;
    private EngineManager engineManager;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private ValueFactory factory;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private BranchFactory branchFactory;
    private OntologyManager ontologyMngr;


    private DatasetRecordFactory datasetRecordFactory;

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }


    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
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
    public void setDatasetRecordFactory(DatasetRecordFactory datasetRecordFactory) {
        this.datasetRecordFactory = datasetRecordFactory;
    }

    @Reference
    public void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.factory = factory;
    }

    @Reference
    public void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    public void setOntologyMngr(OntologyManager ontologyMngr) {
        this.ontologyMngr = ontologyMngr;
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
    public Response getDatasetDataInstances(UriInfo uriInfo, String datasetRecordId, int offset, int limit, String sort, boolean asc, String filter) {

        Resource datasetRecordRsr = factory.createIRI(datasetRecordId);
        Map<String,Map<String,Object>> classesFromQuery = new HashMap<>();
        Map<String,String> classesFromQueryList = new HashMap<>();

        List<Resource> classesList = new ArrayList<>();
        List<Map<String,Object>> listToJson = new ArrayList<>();
        DatasetConnection dsConn = datasetManager.getConnection(datasetRecordRsr);

        String instanceQry = " PREFIX dcterms: <http://purl:org/dc/terms/>" +
                             " SELECT ?type ?title  (COUNT(distinct ?thing) as ?c) " +
                             "     WHERE {" +
                             "         ?thing a ?type. " +
                             "     OPTIONAL { ?type <http://purl.org/dc/terms/title> ?title. } " +
                             "     { " +
                             "          select ?type" +
                             "              where { " +
                             "                  ?thing a ?type. " +
                             "              } " +
                             "      } " +
                             "  } GROUP BY ?type ?title ";
        TupleQuery tq = dsConn.prepareTupleQuery(instanceQry);
        TupleQueryResult results = tq.evaluate();

        Optional<DatasetRecord> datasetRecordOpt = datasetManager.getDatasetRecord(datasetRecordRsr);
        Model result = datasetRecordOpt.get().getModel();

        while (results.hasNext()) {
            Map<String,Object> classMap = new HashMap<>();
            BindingSet bindingSet = results.next();
            Optional<Value> classType = bindingSet.getValue("type");
            Optional<Value> classCount = bindingSet.getValue("c");
            Optional<Value> thing = bindingSet.getValue("thing");
            classMap.put("classType",classType.get().stringValue());
            classMap.put("InstancesCount",classCount.get().stringValue());

            classesList.add(factory.createIRI(classType.get().stringValue()));
            classesFromQuery.put(classType.get().stringValue(),classMap);
            classesFromQueryList.put(classType.get().stringValue(),classType.get().stringValue());
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

                        Optional<Statement> classDesc = classModel.filter(classRsrc, factory.createIRI(_Thing.description_IRI), null).stream().findFirst();

                        mapToJson.put("ontologyRecordTitle",findLabelToDisplay(compiledResource.get(), factory.createIRI(ontologyRecordStmt.get().getObject().stringValue())));
                        mapToJson.put("classIRI", entry.getValue().toString());
                        mapToJson.put("classTitle", findLabelToDisplay(classModel, factory.createIRI(classRsrc.stringValue())));
                        mapToJson.put("classDescription", (classDesc.isPresent()) ? classDesc.get().getObject().stringValue() : "");
                        mapToJson.put("instancesCount", Integer.parseInt(classesFromQuery.get(entry.getValue().toString()).get("InstancesCount").toString()));
                        mapToJson.put("branchIRI", branchStmt.get().getObject().stringValue());
                        mapToJson.put("branchIRI", branchStmt.get().getObject().stringValue());
                        mapToJson.put("commitIRI", commitStmt.get().getObject().stringValue());
                        mapToJson.put("ontologyRecordIRI", ontologyRecordStmt.get().getObject().stringValue());
                        mapToJson.put("dataset", datasetRecordRsr.stringValue());

                        listToJson.add(mapToJson);
                    }
                }
            }
        });

        JSONArray array = JSONArray.fromObject(listToJson);
        Response.ResponseBuilder response = Response.ok(array).header("X-Total-Count", listToJson.size());
        return response.build();
    }

    @Override
    public Response getDatasetDataInstancesSummary(UriInfo uriInfo, String datasetRecordId, int offset, int limit, String sort, boolean asc, int numExamples) {
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
    }
}
































