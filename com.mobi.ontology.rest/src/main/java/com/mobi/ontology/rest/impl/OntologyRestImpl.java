package com.mobi.ontology.rest.impl;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import aQute.libg.generics.Create;
import com.google.common.collect.Iterables;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.Entity;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.builder.OntologyRecordConfig;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.propertyexpression.AnnotationProperty;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.rest.OntologyRest;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.util.ErrorUtils;
import net.sf.json.JSON;
import net.sf.json.JSONArray;
import net.sf.json.JSONException;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.cache.Cache;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    private ModelFactory modelFactory;
    private ValueFactory valueFactory;
    private OntologyManager ontologyManager;
    private CatalogManager catalogManager;
    private EngineManager engineManager;
    private SesameTransformer sesameTransformer;
    private OntologyCache ontologyCache;
    private VersioningManager versioningManager;
    private CatalogProvUtils provUtils;
    private RepositoryManager repositoryManager;

    private static final Logger log = LoggerFactory.getLogger(OntologyRestImpl.class);

    /**
     * Semaphore for protecting ontology IRI uniqueness checks.
     */
    private Semaphore semaphore = new Semaphore(1, true);

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    void setOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Override
    @ActionAttributes(
            @AttributeValue(id = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                    value = "http://mobi.com/ontologies/ontology-editor#OntologyRecord"))
    @ResourceId(id = "http://mobi.com/catalog-local")
    public Response uploadFile(ContainerRequestContext context, InputStream fileInputStream, String title,
                               String description, List<FormDataBodyPart> keywords) {
        checkStringParam(title, "The title is missing.");
        if (fileInputStream == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }
        User user = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(user);
            Ontology ontology = ontologyManager.createOntology(fileInputStream, false);
            Set<String> keywordSet = Collections.emptySet();
            if (keywords != null) {
                keywordSet = keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet());
            }
            return uploadOntology(user, createActivity, ontology, title, description, keywordSet);
        } catch (MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }
    }

    @Override
    @ActionAttributes(
            @AttributeValue(id = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                    value = "http://mobi.com/ontologies/ontology-editor#OntologyRecord"))
    @ResourceId(id = "http://mobi.com/catalog-local")
    public Response uploadOntologyJson(ContainerRequestContext context, String title, String description,
                                       List<String> keywords, String ontologyJson) {
        checkStringParam(title, "The title is missing.");
        checkStringParam(ontologyJson, "The ontologyJson is missing.");
        User user = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(user);
            Ontology ontology = ontologyManager.createOntology(ontologyJson, false);
            return uploadOntology(user, createActivity, ontology, title, description, new HashSet<>(keywords));
        } catch (MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
        }
    }

    @Override
    public Response getOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                String commitIdStr, String rdfFormat, boolean clearCache, boolean skolemize,
                                boolean applyInProgressCommit) {
        try {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, branchIdStr, commitIdStr);
            }
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            String ontologyAsRdf = getOntologyAsRdf(ontology, rdfFormat, skolemize);
            Response.ResponseBuilder ok = Response.ok(ontologyAsRdf);
            return ok.build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr){
        IRI recordId = valueFactory.createIRI(recordIdStr);
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try{
            if(StringUtils.isBlank(branchIdStr)){
                ontologyManager.createOntology(recordId);
                provUtils.endCreateActivity((CreateActivity) activeUser,recordId);
            }else{

            }
        }catch (MobiException e){
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }catch (IllegalArgumentException e) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return null;
    }

    @Override
    public Response deleteOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr) {
        IRI recordId = valueFactory.createIRI(recordIdStr);
        User activeUser = getActiveUser(context, engineManager);
        DeleteActivity deleteActivity = null;
        try {
            if (StringUtils.isBlank(branchIdStr)) {
                deleteActivity = provUtils.startDeleteActivity(activeUser, recordId);
                OntologyRecord record = ontologyManager.deleteOntology(recordId);
                provUtils.endDeleteActivity(deleteActivity, record);
            } else {
                ontologyManager.deleteOntologyBranch(recordId, valueFactory.createIRI(branchIdStr));
            }
        } catch (MobiException e) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response downloadOntologyFile(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                         String commitIdStr, String rdfFormat, String fileName) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(getOntologyAsRdf(ontology, rdfFormat, false));
                writer.flush();
                writer.close();
            };
            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type",
                    getRDFFormatMimeType(rdfFormat)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response saveChangesToOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                          String commitIdStr, String entityIdStr, String entityJson) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Model entityModel = getModelForEntityInOntology(ontology, entityIdStr);
            Difference diff = catalogManager.getDiff(entityModel, getModelFromJson(entityJson));
            Resource recordId = valueFactory.createIRI(recordIdStr);
            User user = getActiveUser(context, engineManager);
            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
            catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                    diff.getAdditions(), diff.getDeletions());
            return Response.ok().build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response uploadChangesToOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                            String commitIdStr, InputStream fileInputStream) {
        if (fileInputStream == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }
        try {
            Resource catalogIRI = catalogManager.getLocalCatalogIRI();
            Resource recordId = valueFactory.createIRI(recordIdStr);

            User user = getActiveUser(context, engineManager);
            Optional<InProgressCommit> commit = catalogManager.getInProgressCommit(catalogIRI, recordId, user);

            if (commit.isPresent()) {
                throw ErrorUtils.sendError("User has an in progress commit already.", Response.Status.BAD_REQUEST);
            }

            Resource branchId;
            Resource commitId;
            {
                if (StringUtils.isNotBlank(commitIdStr)) {
                    checkStringParam(branchIdStr, "The branchIdStr is missing.");
                    commitId = valueFactory.createIRI(commitIdStr);
                    branchId = valueFactory.createIRI(branchIdStr);
                } else if (StringUtils.isNotBlank(branchIdStr)) {
                    branchId = valueFactory.createIRI(branchIdStr);
                    commitId = catalogManager.getHeadCommit(catalogIRI, recordId, branchId).getResource();
                } else {
                    Branch branch = catalogManager.getMasterBranch(catalogIRI, recordId);
                    branchId = branch.getResource();
                    commitId = branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch "
                            + branchIdStr + " has no head Commit set"));
                }
            }

            Model changedOnt = ontologyManager.createOntology(fileInputStream, false).asModel(modelFactory);
            Model currentOnt = catalogManager.getCompiledResource(recordId, branchId, commitId);

            Difference diff = catalogManager.getDiff(currentOnt, changedOnt);

            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
            catalogManager.updateInProgressCommit(catalogIRI, recordId, inProgressCommitIRI,
                    diff.getAdditions(), diff.getDeletions());
            return Response.ok().build();

        } catch (IllegalArgumentException | MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }
    }

    @Override
    public Response getVocabularyStuff(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                       String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getVocabularyStuff, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private JSONObject getVocabularyStuff(Ontology ontology) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Ontology> importedOntologies = ontology.getImportsClosure();
            conn.begin();
            importedOntologies.forEach(ont -> conn.add(ont.asModel(modelFactory)));
            conn.commit();
            return getVocabularyStuff(conn);
        } finally {
            repo.shutDown();
        }
    }

    private JSONObject getVocabularyStuff(RepositoryConnection conn) {
        JSONObject result = getDerivedConceptTypeArray(conn);
        result.putAll(getDerivedConceptSchemeTypeArray(conn));
        result.putAll(getDerivedSemanticRelationArray(conn));
        TupleQueryResult conceptRelationships = ontologyManager.getConceptRelationships(conn);
        result.put("concepts", getHierarchy(conceptRelationships));
        TupleQueryResult conceptSchemeRelationships = ontologyManager.getConceptSchemeRelationships(conn);
        result.put("conceptSchemes", getHierarchy(conceptSchemeRelationships));
        return result;
    }

    @Override
    public Response getOntologyStuff(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                     String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getOntologyStuff, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private JSONObject getOntologyStuff(Ontology ontology) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            // Populate repository
            Set<Ontology> importedOntologies = ontology.getImportsClosure();
            conn.begin();
            importedOntologies.forEach(ont -> conn.add(ont.asModel(modelFactory)));
            conn.commit();
            // Get stuff
            Set<Ontology> onlyImports = getImportedOntologies(importedOntologies, ontology.getOntologyId());
            JSONObject result = new JSONObject();
            result.put("iriList", getAllIRIs(ontology, conn));
            result.put("importedIRIs", doWithOntologies(onlyImports, ont -> getAllIRIs(ont, conn)));
            result.put("importedOntologies", onlyImports.stream()
                    .map(ont -> getOntologyAsJsonObject(ont, "jsonld"))
                    .collect(JSONArray::new, JSONArray::add, JSONArray::add));
            result.put("failedImports", getUnloadableImportIRIs(ontology));
            result.put("classHierarchy", getHierarchy(ontologyManager.getSubClassesOf(conn)));
            result.put("individuals", getClassIndividuals(ontologyManager.getClassesWithIndividuals(conn)));
            result.put("dataPropertyHierarchy", getHierarchy(ontologyManager.getSubDatatypePropertiesOf(conn)));
            result.put("objectPropertyHierarchy", getHierarchy(ontologyManager.getSubObjectPropertiesOf(conn)));
            result.put("annotationHierarchy", getHierarchy(ontologyManager.getSubAnnotationPropertiesOf(conn)));
            result.put("conceptHierarchy", getHierarchy(ontologyManager.getConceptRelationships(conn)));
            result.put("conceptSchemeHierarchy", getHierarchy(ontologyManager.getConceptSchemeRelationships(conn)));
            return result;
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public Response getIRIsInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                      String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getAnnotationsInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                             String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationArray, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addAnnotationToOntology(ContainerRequestContext context, String recordIdStr,
                                            String annotationJson) {
        verifyJsonldType(annotationJson, OWL.ANNOTATIONPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(annotationJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteAnnotationFromOntology(ContainerRequestContext context, String recordIdStr,
                                                 String annotationIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, annotationIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                         String commitIdStr, boolean applyInProgressCommit) {
        try {
            JSONArray result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getClassArray, applyInProgressCommit);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addClassToOntology(ContainerRequestContext context, String recordIdStr, String classJson) {
        verifyJsonldType(classJson, OWL.CLASS.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(classJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteClassFromOntology(ContainerRequestContext context, String recordIdStr, String classIdStr,
                                            String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, classIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDatatypesInOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDatatypeArray, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addDatatypeToOntology(ContainerRequestContext context, String recordIdStr, String datatypeJson) {
        verifyJsonldType(datatypeJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(datatypeJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDatatypeFromOntology(ContainerRequestContext context, String recordIdStr,
                                               String datatypeIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, datatypeIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getObjectPropertiesInOntology(ContainerRequestContext context, String recordIdStr,
                                                  String branchIdStr, String commitIdStr) {
        try {
            JSONArray result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyArray, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addObjectPropertyToOntology(ContainerRequestContext context, String recordIdStr,
                                                String objectPropertyJson) {
        verifyJsonldType(objectPropertyJson, OWL.OBJECTPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(objectPropertyJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteObjectPropertyFromOntology(ContainerRequestContext context, String recordIdStr,
                                                     String objectPropertyIdStr, String branchIdStr,
                                                     String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, objectPropertyIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDataPropertiesInOntology(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        try {
            JSONArray result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyArray, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addDataPropertyToOntology(ContainerRequestContext context, String recordIdStr,
                                              String dataPropertyJson) {
        verifyJsonldType(dataPropertyJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(dataPropertyJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDataPropertyFromOntology(ContainerRequestContext context, String recordIdStr,
                                                   String dataPropertyIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, dataPropertyIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getNamedIndividualsInOntology(ContainerRequestContext context, String recordIdStr,
                                                  String branchIdStr, String commitIdStr) {
        try {
            JSONObject result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualArray, true);
            return Response.ok(result).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response addIndividualToOntology(ContainerRequestContext context, String recordIdStr,
                                            String individualJson) {
        verifyJsonldType(individualJson, OWL.INDIVIDUAL.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(individualJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteIndividualFromOntology(ContainerRequestContext context, String recordIdStr,
                                                 String individualIdStr, String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, individualIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getIRIsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getImportsClosure(ContainerRequestContext context, String recordIdStr, String rdfFormat,
                                      String branchIdStr, String commitIdStr) {
        try {
            Set<Ontology> importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
            JSONArray array = importedOntologies.stream()
                    .map(ontology -> getOntologyAsJsonObject(ontology, rdfFormat))
                    .collect(JSONArray::new, JSONArray::add, JSONArray::add);
            return array.size() == 0 ? Response.noContent().build() : Response.ok(array).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getAnnotationsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                       String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getAnnotationArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                   String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getClassIRIArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDatatypesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                     String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getDatatypeArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                            String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyIRIArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                          String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyIRIArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                            String branchIdStr, String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyClassHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubClassesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyObjectPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                       String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubObjectPropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyDataPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                     String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubDatatypePropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getOntologyAnnotationPropertyHierarchy(ContainerRequestContext context, String recordIdStr,
                                                           String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getSubAnnotationPropertiesOf(ontology);
            return Response.ok(getHierarchy(results)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getConceptHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                        String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getConceptRelationships(ontology);
            JSONObject response = getHierarchy(results);
            return Response.ok(response).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getConceptSchemeHierarchy(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getConceptSchemeRelationships(ontology);
            JSONObject response = getHierarchy(results);
            return Response.ok(response).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getClassesWithIndividuals(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                              String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            TupleQueryResult results = ontologyManager.getClassesWithIndividuals(ontology);
            Map<String, Set<String>> classIndividuals = getClassIndividuals(results);
            JSONObject response = new JSONObject().element("individuals", classIndividuals);
            return Response.ok(response).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getEntityUsages(ContainerRequestContext context, String recordIdStr, String entityIRIStr,
                                    String branchIdStr, String commitIdStr, String queryType) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Resource entityIRI = valueFactory.createIRI(entityIRIStr);
            if (queryType.equals("construct")) {
                Model results = ontologyManager.constructEntityUsages(ontology, entityIRI);
                return Response.ok(modelToJsonld(results, sesameTransformer)).build();
            } else if (queryType.equals("select")) {
                TupleQueryResult results = ontologyManager.getEntityUsages(ontology, entityIRI);
                return Response.ok(JSONQueryResults.getResponse(results)).build();
            } else {
                throw ErrorUtils.sendError("The queryType parameter is not select or construct as expected.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getSearchResults(ContainerRequestContext context, String recordIdStr, String searchText,
                                     String branchIdStr, String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            checkStringParam(searchText, "The searchText is missing.");
            TupleQueryResult results = ontologyManager.getSearchResults(ontology, searchText);
            Map<String, Set<String>> response = new HashMap<>();
            results.forEach(queryResult -> {
                Value entity = Bindings.requiredResource(queryResult, "entity");
                Value filter = Bindings.requiredResource(queryResult, "type");
                if (!(entity instanceof BNode) && !(filter instanceof BNode)) {
                    String entityString = entity.stringValue();
                    String filterString = filter.stringValue();
                    if (response.containsKey(filterString)) {
                        response.get(filterString).add(entityString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(entityString);
                        response.put(filterString, newSet);
                    }
                }
            });
            return response.size() == 0 ? Response.noContent().build() : Response.ok(JSONObject.fromObject(response))
                    .build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getFailedImports(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                     String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return Response.ok(getUnloadableImportIRIs(ontology)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Set<String> getUnloadableImportIRIs(Ontology ontology) {
        return ontology.getUnloadableImportIRIs().stream()
                .map(Value::stringValue)
                .collect(Collectors.toSet());
    }

    /**
     * Uses the provided Set to construct a hierarchy of the entities provided. Each BindingSet in the Set must have the
     * parent set as the first binding and the child set as the second binding.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-child relationships for creating the
     *                         hierarchy.
     * @return a JSONObject containing the hierarchy of the entities provided.
     */
    private JSONObject getHierarchy(TupleQueryResult tupleQueryResult) {
        Map<String, Set<String>> results = new HashMap<>();
        Map<String, Set<String>> index = new HashMap<>();
        Set<String> topLevel = new HashSet<>();
        Set<String> lowerLevel = new HashSet<>();
        tupleQueryResult.forEach(queryResult -> {
            Value key = Iterables.get(queryResult, 0).getValue();
            Binding value = Iterables.get(queryResult, 1, null);
            if (!(key instanceof BNode)) {
                String keyString = key.stringValue();
                topLevel.add(keyString);
                if (value != null && !(value.getValue() instanceof BNode)) {
                    String valueString = value.getValue().stringValue();
                    lowerLevel.add(valueString);
                    if (results.containsKey(keyString)) {
                        results.get(keyString).add(valueString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(valueString);
                        results.put(keyString, newSet);
                    }
                    if (index.containsKey(valueString)) {
                        index.get(valueString).add(keyString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(keyString);
                        index.put(valueString, newSet);
                    }
                } else {
                    results.put(key.stringValue(), new HashSet<>());
                }
            }
        });
        topLevel.removeAll(lowerLevel);
        Set<String> hierarchy = createHierarchy(topLevel, results).stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
        return new JSONObject().element("hierarchy", hierarchy).element("index", JSONObject.fromObject(index));
    }

    /**
     * Creates a Set of hierarchy items with their IRIs and lists of children based on the provided list of IRIs
     * of entities without parents and map of IRIs to their Sets of children.
     *
     * @param topLevel a set of IRI strings of entities without parents
     * @param results the results which contains a map of parents and their associated children.
     * @return a Set of HierarchyNodes representing the top level entities and their children
     */
    private Set<HierarchyNode> createHierarchy(Set<String> topLevel, Map<String, Set<String>> results) {
        Map<String, HierarchyNode> nodes = new HashMap<>();
        results.forEach((key, children) -> {
            HierarchyNode node = nodes.getOrDefault(key, new HierarchyNode(key));
            children.forEach(child -> {
                HierarchyNode obj = nodes.getOrDefault(child, new HierarchyNode(child));
                node.addChild(obj);
                nodes.put(child, obj);
            });
            nodes.put(key, node);
        });
        return topLevel.stream().map(nodes::get).collect(Collectors.toSet());
    }

    private class HierarchyNode {
        private String iri;
        private Set<HierarchyNode> children = new HashSet<>();

        HierarchyNode(String iri) {
            this.iri = iri;
        }

        void addChild(HierarchyNode node) {
            children.add(node);
        }

        public String toString() {
            StringBuilder builder = new StringBuilder(String.format("{\"entityIRI\": \"%s\"", iri));
            if (children.size() > 0) {
                builder.append(", \"subEntities\": [")
                        .append(String.join(", ", children.stream().map(Object::toString).collect(Collectors.toSet())))
                        .append("]");
            }
            builder.append("}");
            return builder.toString();
        }
    }

    /**
     * Gets the Resource for the InProgressCommit associated with the provided User and the Record identified by the
     * provided Resource. If that User does not have an InProgressCommit, a new one will be created and that Resource
     * will be returned.
     *
     * @param user     the User with the InProgressCommit
     * @param recordId the Resource identifying the Record with the InProgressCommit
     * @return a Resource which identifies the InProgressCommit associated with the User for the Record
     */
    private Resource getInProgressCommitIRI(User user, Resource recordId) {
        Optional<InProgressCommit> optional = catalogManager.getInProgressCommit(catalogManager.getLocalCatalogIRI(),
                recordId, user);
        if (optional.isPresent()) {
            return optional.get().getResource();
        } else {
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(user);
            catalogManager.addInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommit);
            return inProgressCommit.getResource();
        }
    }

    /**
     * Optionally gets the Ontology based on the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return an Optional containing the Ontology if it was found.
     */
    private Optional<Ontology> getOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr, boolean applyInProgressCommit) {
        checkStringParam(recordIdStr, "The recordIdStr is missing.");
        Optional<Ontology> optionalOntology;
        Optional<Cache<String, Ontology>> cache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordIdStr, branchIdStr, commitIdStr);

        try {
            if (cache.isPresent() && cache.get().containsKey(key)) {
                log.trace("cache hit");
                optionalOntology = Optional.of(cache.get().get(key));
            } else {
                log.trace("cache miss");
                Resource recordId = valueFactory.createIRI(recordIdStr);

                if (StringUtils.isNotBlank(commitIdStr)) {
                    checkStringParam(branchIdStr, "The branchIdStr is missing.");
                    optionalOntology = ontologyManager.retrieveOntology(recordId, valueFactory.createIRI(branchIdStr),
                            valueFactory.createIRI(commitIdStr));
                } else if (StringUtils.isNotBlank(branchIdStr)) {
                    optionalOntology = ontologyManager.retrieveOntology(recordId, valueFactory.createIRI(branchIdStr));
                } else {
                    optionalOntology = ontologyManager.retrieveOntology(recordId);
                }
            }

            if (optionalOntology.isPresent() && applyInProgressCommit) {
                User user = getActiveUser(context, engineManager);
                Optional<InProgressCommit> optional = catalogManager.getInProgressCommit(
                        catalogManager.getLocalCatalogIRI(), valueFactory.createIRI(recordIdStr), user);

                if (optional.isPresent()) {
                    Model ontologyModel = catalogManager.applyInProgressCommit(optional.get().getResource(),
                            optionalOntology.get().asModel(modelFactory));
                    optionalOntology = Optional.of(ontologyManager.createOntology(ontologyModel));
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }

        return optionalOntology;
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in an Ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private <T extends JSON> T doWithOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr, Function<Ontology, T> iriFunction, boolean applyInProgressCommit) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit);
        if (optionalOntology.isPresent()) {
            return iriFunction.apply(optionalOntology.get());
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in imported Ontologies for the Ontology identified
     * by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @return the JSON list of imported IRI lists determined by the provided Function.
     */
    private Response doWithImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                              String branchIdStr, String commitIdStr,
                                              Function<Ontology, JSONObject> iriFunction) {
        Set<Ontology> importedOntologies;
        try {
            importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
        } catch (MobiOntologyException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        if (!importedOntologies.isEmpty()) {
            return Response.ok(doWithOntologies(importedOntologies, iriFunction)).build();
        } else {
            return Response.noContent().build();
        }
    }

    private JSONArray doWithOntologies(Set<Ontology> ontologies, Function<Ontology, JSONObject> function) {
        JSONArray array = new JSONArray();
        for (Ontology ontology : ontologies) {
            JSONObject object = function.apply(ontology);
            object.put("id", ontology.getOntologyId().getOntologyIdentifier().stringValue());
            array.add(object);
        }
        return array;
    }

    /**
     * Gets the imported Ontologies for the Ontology identified by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @return the Set of imported Ontologies.
     */
    private Set<Ontology> getImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true);
        if (optionalOntology.isPresent()) {
            Ontology baseOntology = optionalOntology.get();
            return getImportedOntologies(baseOntology.getImportsClosure(), baseOntology.getOntologyId());
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets the imported ontologies for the Ontology identified, excluding the base Ontology.
     *
     * @param importedOntologies set of ontologies from the imports closure which includes the base ontology.
     * @param baseOntologyId     the {@link OntologyId} for the base Ontology to exclude from the {@link Set}.
     * @return the Set of imported Ontologies without the base Ontology.
     */
    private Set<Ontology> getImportedOntologies(Set<Ontology> importedOntologies, OntologyId baseOntologyId) {
        return importedOntologies.stream()
                .filter(ontology -> !ontology.getOntologyId().equals(baseOntologyId))
                .collect(Collectors.toSet());
    }

    /**
     * Gets a JSONArray of Annotations from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of Annotations from the provided Ontology.
     */
    private JSONObject getAnnotationArray(Ontology ontology) {
        Set<IRI> iris = new HashSet<>();
        iris.addAll(ontology.getAllAnnotations()
                .stream()
                .filter(Objects::nonNull)
                .map(Annotation::getProperty)
                .map(Entity::getIRI)
                .collect(Collectors.toSet()));
        iris.addAll(ontology.getAllAnnotationProperties()
                .stream()
                .map(AnnotationProperty::getIRI)
                .collect(Collectors.toSet()));
        return new JSONObject().element("annotationProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONObject of Class IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Class IRIs from.
     * @return a JSONObject of Class IRIs from the provided Ontology.
     */
    private JSONObject getClassIRIArray(Ontology ontology) {
        Model model = ontology.asModel(modelFactory);
        Set<IRI> iris = ontology.getAllClasses()
                .stream()
                .map(Entity::getIRI)
                .filter(iri -> model.contains(iri, valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                        null))
                .collect(Collectors.toSet());
        return new JSONObject().element("classes", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of Classes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return a JSONArray of Classes form the provided Ontology.
     */
    private JSONArray getClassArray(Ontology ontology) {
        Model model = ontology.asModel(modelFactory);
        return ontology.getAllClasses().stream()
                .filter(oClass -> model.contains(oClass.getIRI(),
                        valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null))
                .map(oClass -> model.filter(oClass.getIRI(), null, null))
                .filter(m -> !m.isEmpty())
                .map(m -> getObjectFromJsonld(modelToJsonld(m, sesameTransformer)))
                .collect(JSONArray::new, JSONArray::add, JSONArray::add);
    }

    /**
     * Gets a JSONArray of Datatypes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Datatypes from.
     * @return a JSONArray of Datatypes from the provided Ontology.
     */
    private JSONObject getDatatypeArray(Ontology ontology) {
        Set<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toSet());
        return new JSONObject().element("datatypes", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONObject of ObjectProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return a JSONObject of ObjectProperty IRIs from the provided Ontology.
     */
    private JSONObject getObjectPropertyIRIArray(Ontology ontology) {
        Set<IRI> iris = ontology.getAllObjectProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toSet());
        return new JSONObject().element("objectProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of ObjectProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return a JSONArray of ObjectProperties from the provided Ontology.
     */
    private JSONArray getObjectPropertyArray(Ontology ontology) {
        Model model = ontology.asModel(modelFactory);
        return ontology.getAllObjectProperties().stream()
                .map(property -> getObjectFromJsonld(modelToJsonld(model.filter(property.getIRI(), null, null),
                        sesameTransformer)))
                .collect(JSONArray::new, JSONArray::add, JSONArray::add);
    }

    /**
     * Gets a JSONObject of DatatypeProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperty from.
     * @return a JSONArray of DatatypeProperties from the provided Ontology.
     */
    private JSONObject getDataPropertyIRIArray(Ontology ontology) {
        Set<IRI> iris = ontology.getAllDataProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toSet());
        return new JSONObject().element("dataProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONArray of DatatypeProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return a JSONArray of DatatypeProperties from the provided Ontology.
     */
    private JSONArray getDataPropertyArray(Ontology ontology) {
        Model model = ontology.asModel(modelFactory);
        return ontology.getAllDataProperties().stream()
                .map(dataProperty -> getObjectFromJsonld(modelToJsonld(model.filter(dataProperty.getIRI(), null, null),
                        sesameTransformer)))
                .collect(JSONArray::new, JSONArray::add, JSONArray::add);
    }

    /**
     * Gets a JSONArray of NamedIndividuals from the provided Ontology.
     *
     * @param ontology the Ontology to get the NamedIndividuals from.
     * @return a JSONArray of NamedIndividuals from the provided Ontology.
     */
    private JSONObject getNamedIndividualArray(Ontology ontology) {
        Model model = ontology.asModel(modelFactory);
        Set<IRI> iris = ontology.getAllNamedIndividuals().stream()
                .filter(individual -> model.contains(individual.getIRI(),
                        valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null))
                .map(Entity::getIRI)
                .collect(Collectors.toSet());
        return new JSONObject().element("namedIndividuals", irisToJsonArray(iris));
    }

    private JSONObject getDerivedConceptTypeArray(Ontology ontology) {
        return getDerivedConceptTypeArray(ontologyManager.getSubClassesFor(ontology,
                sesameTransformer.mobiIRI(SKOS.CONCEPT)));
    }

    private JSONObject getDerivedConceptTypeArray(RepositoryConnection conn) {
        return getDerivedConceptTypeArray(ontologyManager.getSubClassesFor(sesameTransformer.mobiIRI(SKOS.CONCEPT),
                conn));
    }

    private JSONObject getDerivedConceptTypeArray(TupleQueryResult queryResult) {
        Set<IRI> iris = new HashSet<>();
        queryResult.forEach(r -> iris.add(valueFactory.createIRI(Bindings.requiredResource(r, "s").stringValue())));
        return new JSONObject().element("derivedConcepts", irisToJsonArray(iris));
    }

    private JSONObject getDerivedConceptSchemeTypeArray(Ontology ontology) {
        return getDerivedConceptSchemeTypeArray(ontologyManager.getSubClassesFor(ontology,
                sesameTransformer.mobiIRI(SKOS.CONCEPT_SCHEME)));
    }

    private JSONObject getDerivedConceptSchemeTypeArray(RepositoryConnection conn) {
        return getDerivedConceptSchemeTypeArray(ontologyManager.getSubClassesFor(sesameTransformer
                .mobiIRI(SKOS.CONCEPT_SCHEME), conn));
    }

    private JSONObject getDerivedConceptSchemeTypeArray(TupleQueryResult queryResult) {
        Set<IRI> iris = new HashSet<>();
        queryResult.forEach(r -> r.getBinding("s")
                .ifPresent(b -> iris.add(valueFactory.createIRI(b.getValue().stringValue()))));
        return new JSONObject().element("derivedConceptSchemes", irisToJsonArray(iris));
    }

    private JSONObject getDerivedSemanticRelationArray(Ontology ontology) {
        return getDerivedSemanticRelationArray(ontologyManager.getSubPropertiesFor(ontology,
                sesameTransformer.mobiIRI(SKOS.SEMANTIC_RELATION)));
    }

    private JSONObject getDerivedSemanticRelationArray(RepositoryConnection conn) {
        return getDerivedSemanticRelationArray(ontologyManager.getSubPropertiesFor(sesameTransformer
                .mobiIRI(SKOS.SEMANTIC_RELATION), conn));
    }

    private JSONObject getDerivedSemanticRelationArray(TupleQueryResult queryResult) {
        Set<IRI> iris = new HashSet<>();
        queryResult.forEach(r -> r.getBinding("s")
                .ifPresent(b -> iris.add(valueFactory.createIRI(b.getValue().stringValue()))));
        return new JSONObject().element("derivedSemanticRelations", irisToJsonArray(iris));
    }

    /**
     * Creates a JSONArray of IRI strings from the passed Set of IRIs.
     *
     * @param iris the Set of IRIs to turn into this JSONArray.
     * @return a JSONArray of the IRI strings.
     */
    private JSONArray irisToJsonArray(Set<IRI> iris) {
        return JSONArray.fromObject(iris.stream().map(Value::stringValue).collect(Collectors.toSet()));
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @param skolemize whether or not the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @return A String containing the newly serialized Ontology.
     */
    private String getOntologyAsRdf(Ontology ontology, String rdfFormat, boolean skolemize) {
        switch (rdfFormat.toLowerCase()) {
            case "rdf/xml":
                return ontology.asRdfXml().toString();
            case "owl/xml":
                return ontology.asOwlXml().toString();
            case "turtle":
                return ontology.asTurtle().toString();
            default:
                OutputStream outputStream = ontology.asJsonLD(skolemize);
                return outputStream.toString();
        }
    }

    /**
     * Return a JSONObject with the requested format and the requested ontology in that format.
     *
     * @param ontology  the ontology to format and return
     * @param rdfFormat the format to serialize the ontology in
     * @return a JSONObject with the document format and the ontology in that format
     */
    private JSONObject getOntologyAsJsonObject(Ontology ontology, String rdfFormat) {
        OntologyId ontologyId = ontology.getOntologyId();
        Optional<IRI> optIri = ontologyId.getOntologyIRI();
        return new JSONObject()
                .element("documentFormat", rdfFormat)
                .element("id", ontologyId.getOntologyIdentifier().stringValue())
                .element("ontologyId", optIri.isPresent() ? optIri.get().stringValue() : "")
                .element("ontology", getOntologyAsRdf(ontology, rdfFormat, false));
    }

    /**
     * Return a JSONObject with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs
     * @return the JSONObject with the IRIs for all components of an ontology.
     */
    private JSONObject getAllIRIs(Ontology ontology) {
        return combineJsonObjects(getAnnotationArray(ontology), getClassIRIArray(ontology),
                getDatatypeArray(ontology), getObjectPropertyIRIArray(ontology), getDataPropertyIRIArray(ontology),
                getNamedIndividualArray(ontology), getDerivedConceptTypeArray(ontology),
                getDerivedConceptSchemeTypeArray(ontology), getDerivedSemanticRelationArray(ontology));
    }

    /**
     * Return a JSONObject with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs.
     * @param conn     the {@link RepositoryConnection} to run the query on.
     * @return the JSONObject with the IRIs for all components of an ontology.
     */
    private JSONObject getAllIRIs(Ontology ontology, RepositoryConnection conn) {
        return combineJsonObjects(getAnnotationArray(ontology), getClassIRIArray(ontology),
                getDatatypeArray(ontology), getObjectPropertyIRIArray(ontology), getDataPropertyIRIArray(ontology),
                getNamedIndividualArray(ontology), getDerivedConceptTypeArray(conn),
                getDerivedConceptSchemeTypeArray(conn), getDerivedSemanticRelationArray(conn));
    }

    /**
     * Combines multiple JSONObjects into a single JSONObject.
     *
     * @param objects the JSONObjects to combine.
     * @return a JSONObject which has the combined key-value pairs from all of the provided JSONObjects.
     */
    private JSONObject combineJsonObjects(JSONObject... objects) {
        JSONObject json = new JSONObject();
        if (objects.length == 0) {
            return json;
        }
        for (JSONObject each : objects) {
            each.keySet().forEach(key -> json.put(key, each.get(key)));
        }
        return json;
    }

    /**
     * Creates a Model using the provided JSON-LD.
     *
     * @param json the JSON-LD to convert to a Model.
     * @return a Model created using the JSON-LD.
     */
    private Model getModelFromJson(String json) {
        return jsonldToModel(json, sesameTransformer);
    }

    /**
     * Adds the provided Model to the requester's InProgressCommit additions.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param entityModel the Model to add to the additions in the InProgressCommit.
     * @return a Response indicating the success or failure of the addition.
     */
    private Response additionsToInProgressCommit(ContainerRequestContext context, String recordIdStr,
                                                 Model entityModel) {
        User user = getActiveUser(context, engineManager);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                entityModel, null);
        return Response.status(Response.Status.CREATED).build();
    }

    /**
     * Adds the Statements associated with the entity identified by the provided ID to the requester's InProgressCommit
     * deletions.
     *
     * @param context     the context of the request.
     * @param ontology    the ontology to process.
     * @param entityIdStr the ID of the entity to be deleted.
     * @param recordIdStr the ID of the record which contains the entity to be deleted.
     * @return a Response indicating the success or failure of the deletion.
     */
    private Response deletionsToInProgressCommit(ContainerRequestContext context, Ontology ontology,
                                                 String entityIdStr, String recordIdStr) {
        User user = getActiveUser(context, engineManager);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        Model ontologyModel = ontology.asModel(modelFactory);
        Resource entityId = valueFactory.createIRI(entityIdStr);
        Model model = modelFactory.createModel(ontologyModel.stream()
                .filter(statement -> statement.getSubject().equals(entityId)
                        || statement.getPredicate().equals(entityId) || statement.getObject().equals(entityId))
                .collect(Collectors.toSet()));
        if (model.size() == 0) {
            throw ErrorUtils.sendError(entityIdStr + " was not found within the ontology.",
                    Response.Status.BAD_REQUEST);
        }
        catalogManager.updateInProgressCommit(catalogManager.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                null, model);
        return Response.ok().build();
    }

    /**
     * Gets the entity from within the provided Ontology based on the provided entity ID.
     *
     * @param ontology    the Ontology to process.
     * @param entityIdStr the ID of the entity to get.
     * @return a Model representation of the entity with the provided ID.
     */
    private Model getModelForEntityInOntology(Ontology ontology, String entityIdStr) {
        Model ontologyModel = ontology.asModel(modelFactory);
        return modelFactory.createModel(ontologyModel).filter(valueFactory.createIRI(entityIdStr), null, null);
    }

    /**
     * Verifies that the provided JSON-LD contains the proper @type.
     *
     * @param jsonldStr the JSON-LD of the entity being verified.
     * @param type      the @type that the entity should be.
     */
    private void verifyJsonldType(String jsonldStr, String type) {
        try {
            JSONObject json = JSONObject.fromObject(jsonldStr);
            Optional<JSONArray> optTypeArray = Optional.ofNullable(json.optJSONArray("@type"));
            if (!json.has("@id") || !optTypeArray.isPresent() || !optTypeArray.get().contains(type)) {
                throw ErrorUtils.sendError("The JSON-LD does not contain the proper type: " + type + ".",
                        Response.Status.BAD_REQUEST);
            }
        } catch (JSONException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Uploads the provided Ontology to a data store.
     *
     * @param user           the user making the request.
     * @param createActivity the activity for the creation of the OntologyRecord
     * @param ontology       the Ontology to upload.
     * @param title          the title for the OntologyRecord.
     * @param description    the description for the OntologyRecord.
     * @param keywords       the comma separated list of keywords associated with the OntologyRecord.
     * @return a Response indicating the success of the upload.
     */
    private Response uploadOntology(User user, CreateActivity createActivity, Ontology ontology, String title,
                                    String description, Set<String> keywords) throws MobiException {
        OntologyRecordConfig.OntologyRecordBuilder builder = new OntologyRecordConfig.OntologyRecordBuilder(title,
                Collections.singleton(user));
        ontology.getOntologyId().getOntologyIRI().ifPresent(builder::ontologyIRI);
        if (description != null) {
            builder.description(description);
        }
        if (keywords != null) {
            builder.keywords(keywords);
        }
        Resource catalogId = catalogManager.getLocalCatalogIRI();
        OntologyRecord record = ontologyManager.createOntologyRecord(builder.build());
        Resource masterBranchId;
        Resource commitId;
        try {
            semaphore.acquire();
            record.getOntologyIRI().ifPresent(this::testOntologyIRIUniqueness);
            catalogManager.addRecord(catalogId, record);
            masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            Model model = ontology.asModel(modelFactory);
            commitId = versioningManager.commit(catalogId, record.getResource(), masterBranchId, user,
                    "The initial commit.", model, null);
        } catch (InterruptedException e) {
            throw ErrorUtils.sendError(e, "Issue checking adding new OntologyRecord",
                    Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            ontologyManager.deleteOntology(record.getResource());
            throw ex;
        } finally {
            semaphore.release();
        }

        JSONObject response = new JSONObject()
                .element("ontologyId", ontology.getOntologyId().getOntologyIdentifier().stringValue())
                .element("recordId", record.getResource().stringValue())
                .element("branchId", masterBranchId.stringValue())
                .element("commitId", commitId.stringValue());
        provUtils.endCreateActivity(createActivity, record.getResource());
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    private void testOntologyIRIUniqueness(Resource ontologyIRI) {
        if (ontologyManager.ontologyIriExists(ontologyIRI)) {
            throw ErrorUtils.sendError("Ontology already exists with IRI " + ontologyIRI, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Parse the provided Set to provide a map with all the Individuals using their parent(class) as key.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-individuals relationships for creating the
     *                         map.
     * @return a JSONObject containing the map of the individuals provided.
     */
    private Map<String, Set<String>> getClassIndividuals(TupleQueryResult tupleQueryResult) {
        Map<String, Set<String>> classIndividuals = new HashMap<>();
        tupleQueryResult.forEach(queryResult -> {
            Optional<Value> individual = queryResult.getValue("individual");
            Optional<Value> parent = queryResult.getValue("parent");
            if (individual.isPresent() && parent.isPresent()) {
                String individualValue = individual.get().stringValue();
                String keyString = parent.get().stringValue();
                if (classIndividuals.containsKey(keyString)) {
                    classIndividuals.get(keyString).add(individualValue);
                } else {
                    Set<String> individualsSet = new HashSet<>();
                    individualsSet.add(individualValue);
                    classIndividuals.put(keyString, individualsSet);
                }
            }
        });
        return classIndividuals;
    }
}
