package org.matonto.ontology.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.google.common.collect.Sets;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.rest.OntologyRest;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.Rio;
import org.openrdf.rio.WriterConfig;
import org.openrdf.rio.helpers.JSONLDMode;
import org.openrdf.rio.helpers.JSONLDSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    private OntologyManager manager;
    private ValueFactory factory;
    private final Logger LOG = LoggerFactory.getLogger(OntologyRestImpl.class);

    private boolean stringParamIsMissing(String param) {
        return param == null || param.length() == 0;
    }

    @Reference
    public void setManager(OntologyManager manager) {
        this.manager = manager;
    }

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Override
    public Response getAllOntologyIds() {
        JSONObject json = new JSONObject();

        Map<Resource, String> ontoIdRegistry = manager.getOntologyRegistry();

        ontoIdRegistry.keySet().forEach(oid ->
                json.put(oid.stringValue(), ontoIdRegistry.get(oid))
        );

        return Response.status(200).entity(json.toString()).build();
    }

    private Response getAllOntologies() {
        List<String> ontologyIds = manager.getOntologyRegistry().keySet()
                .stream()
                .map(Resource::stringValue)
                .collect(Collectors.toList());

        return Response.status(200).entity(getOntologies(ontologyIds).toString()).build();
    }

    @Override
    public Response getOntologies(String ontologyIdList) {
        if (stringParamIsMissing(ontologyIdList)) {
            return getAllOntologies();
        }

        List<String> ontologyIds = Arrays.asList(ontologyIdList.trim().split("\\s*,\\s*"));

        if (ontologyIds.isEmpty()) {
            throw ErrorUtils.sendError("Invalid ontology id(s) on the list", Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(getOntologies(ontologyIds).toString()).build();
    }

    private Response getUploadResponse(boolean persisted, Ontology ontology) {
        JSONObject json = new JSONObject();

        if (persisted) {
            OntologyId oid = ontology.getOntologyId();
            json.put("ontologyId", oid.getOntologyIdentifier().stringValue());
            Set<IRI> missingImports = ontology.getUnloadableImportIRIs();
            if(!missingImports.isEmpty()) {
                JSONArray array = new JSONArray();
                missingImports.forEach(iri -> array.add(iri.stringValue()));
                json.put("unloadableImportedOntologies", array.toString());
            }
        }

        json.put("persisted", persisted);

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response uploadFile(InputStream fileInputStream) {
        boolean persisted = false;
        Ontology ontology = null;

        try {
            ontology = manager.createOntology(fileInputStream);
            persisted = manager.storeOntology(ontology);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while processing ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }

        return getUploadResponse(persisted, ontology);
    }

    @Override
    public Response uploadOntologyJson(String ontologyJson) {
        boolean persisted = false;
        Ontology ontology = null;

        try {
            ontology = manager.createOntology(ontologyJson);
            persisted = manager.storeOntology(ontology);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while processing ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        return getUploadResponse(persisted, ontology);
    }

    @Override
    public Response getOntology(String ontologyIdStr, String rdfFormat) {
        JSONObject result = doWithOntology(ontologyIdStr, ontology -> {
            String content = getOntologyAsRdf(ontology, rdfFormat);

            JSONObject json = new JSONObject();
            json.put("documentFormat", rdfFormat);
            json.put("ontology", content);
            return json;
        });
        
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response downloadOntologyFile(String ontologyIdStr, String rdfFormat) {
        JSONObject result = doWithOntology(ontologyIdStr, ontology -> {
            final String content = getOntologyAsRdf(ontology, rdfFormat);
            JSONObject json = new JSONObject();
            json.put("ontology", content);
            return json;
        });
        
        StreamingOutput stream = os -> {
            Writer writer = new BufferedWriter(new OutputStreamWriter(os));
            writer.write(result.get("ontology").toString());
            writer.flush();
            writer.close();
        };

        return Response.ok(stream).build();
    }

    @Override
    public Response saveChangesToOntology(String ontologyIdStr, String resourceIdStr, String resourceJson) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        if (stringParamIsMissing(resourceIdStr)) {
            throw ErrorUtils.sendError("resourceIdStr is missing", Response.Status.BAD_REQUEST);
        }

        if (stringParamIsMissing(resourceJson)) {
            throw ErrorUtils.sendError("resourceJson is missing", Response.Status.BAD_REQUEST);
        }

        boolean updated;
        try {
            Resource ontologyResource;
            if (isBNodeString(ontologyIdStr.trim())) {
                ontologyResource = factory.createBNode(ontologyIdStr.trim());
            } else {
                ontologyResource = factory.createIRI(ontologyIdStr.trim());
            }

            Resource changedResource;
            if (isBNodeString(resourceIdStr.trim())) {
                changedResource = factory.createBNode(resourceIdStr.trim());
            } else {
                changedResource = factory.createIRI(resourceIdStr.trim());
            }

            updated = manager.saveChangesToOntology(ontologyResource, changedResource, resourceJson);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while updating ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        JSONObject json = new JSONObject();
        json.put("updated", updated);

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response deleteOntology(String ontologyIdStr) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        boolean deleted;
        try {
            Resource resource;
            if (isBNodeString(ontologyIdStr.trim())) {
                resource = factory.createBNode(ontologyIdStr.trim());
            } else {
                resource = factory.createIRI(ontologyIdStr.trim());
            }

            deleted = manager.deleteOntology(resource);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while deleting ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        JSONObject json = new JSONObject();
        json.put("deleted", deleted);

        return Response.status(200).entity(json.toString()).build();
    }

    private Response deleteEntityFromOntology(String ontologyIdStr, String entityIdStr) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        if (stringParamIsMissing(entityIdStr)) {
            throw ErrorUtils.sendError("entityIdStr is missing", Response.Status.BAD_REQUEST);
        }

        Map<String, Set> changedEntities;
        try {
            Resource ontologyResource;
            if (isBNodeString(ontologyIdStr.trim())) {
                ontologyResource = factory.createBNode(ontologyIdStr.trim());
            } else {
                ontologyResource = factory.createIRI(ontologyIdStr.trim());
            }

            Resource entityResource;
            if (isBNodeString(entityIdStr.trim())) {
                entityResource = factory.createBNode(entityIdStr.trim());
            } else {
                entityResource = factory.createIRI(entityIdStr.trim());
            }

            changedEntities = manager.deleteEntityFromOntology(ontologyResource, entityResource);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while deleting ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        JSONArray iris = new JSONArray();
        iris.addAll(changedEntities.get("iris"));

        JSONArray models = new JSONArray();
        for(Object model : changedEntities.get("models")) {
            OutputStream outputStream = new ByteArrayOutputStream();
            WriterConfig config = new WriterConfig();
            config.set(JSONLDSettings.JSONLD_MODE, JSONLDMode.FLATTEN);

            try {
                Rio.write((org.openrdf.model.Model)model, outputStream, RDFFormat.JSONLD, config);
            } catch (RDFHandlerException e) {
                throw new MatontoOntologyException("Error while parsing changed entity.");
            }

            models.add(outputStream.toString());
        }

        JSONObject json = new JSONObject();
        json.put("deleted", true);
        json.put("iris", iris);
        json.put("models", models);

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response deleteClassFromOntology(String ontologyIdStr, String classIdStr) {
        return deleteEntityFromOntology(ontologyIdStr, classIdStr);
    }

    @Override
    public Response deleteObjectPropertyFromOntology(String ontologyIdStr, String propertyIdStr) {
        return deleteEntityFromOntology(ontologyIdStr, propertyIdStr);
    }

    @Override
    public Response deleteDataPropertyFromOntology(String ontologyIdStr, String propertyIdStr) {
        return deleteEntityFromOntology(ontologyIdStr, propertyIdStr);
    }

    private Response addEntityToOntology(String ontologyIdStr, String entityJson) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        if (stringParamIsMissing(entityJson)) {
            throw ErrorUtils.sendError("entityJson is missing", Response.Status.BAD_REQUEST);
        }

        boolean added = false;
        try {
            Resource ontologyResource;
            if (isBNodeString(ontologyIdStr.trim())) {
                ontologyResource = factory.createBNode(ontologyIdStr.trim());
            } else {
                ontologyResource = factory.createIRI(ontologyIdStr.trim());
            }

            added = manager.addEntityToOntology(ontologyResource, entityJson);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Exception occurred while deleting ontology.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        JSONObject json = new JSONObject();
        json.put("added", added);

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response addClassToOntology(String ontologyIdStr, String classJson) {
        return addEntityToOntology(ontologyIdStr, classJson);
    }

    @Override
    public Response addObjectPropertyToOntology(String ontologyIdStr, String propertyJson) {
        return addEntityToOntology(ontologyIdStr, propertyJson);
    }

    @Override
    public Response addDataPropertyToOntology(String ontologyIdStr, String propertyJson) {
        return addEntityToOntology(ontologyIdStr, propertyJson);
    }

    @Override
    public Response getIRIsInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getAllIRIs);      
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getAnnotationsInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getAnnotationArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getClassesInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getClassArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDatatypesInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getDatatypeArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getObjectPropertiesInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getObjectPropertyArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDataPropertiesInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getDataPropertyArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getNamedIndividualsInOntology(String ontologyIdStr) {
        JSONObject result = doWithOntology(ontologyIdStr, this::getNamedIndividualArray);
        return Response.status(200).entity(result.toString()).build();
    }
    
    @Override
    public Response getIRIsInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getAllIRIs);
        
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getAnnotationsInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getAnnotationArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getClassesInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getClassArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDatatypesInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getDatatypeArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getObjectPropertyArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getDataPropertyArray);
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(String ontologyIdStr) {
        JSONArray result = doWithImportedOntologies(ontologyIdStr, this::getNamedIndividualArray);
        return Response.status(200).entity(result.toString()).build();
    }

    /**
     * Gets Annotation JSONArray.
     */
    private JSONObject getAnnotationArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllAnnotations()
                .stream()
                .map(Annotation::getProperty)
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        
        JSONObject object = new JSONObject();
        object.put("annotationProperties", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets Class JSONArray.
     */
    private JSONObject getClassArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllClasses()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());
        
        JSONObject object = new JSONObject();
        object.put("classes", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets Datatype JSONArray.
     */
    private JSONObject getDatatypeArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        JSONObject object = new JSONObject();
        object.put("datatypes", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets ObjectProperty JSONArray.
     */
    private JSONObject getObjectPropertyArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllObjectProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        JSONObject object = new JSONObject();
        object.put("objectProperties", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets DataProperty JSONArray.
     */
    private JSONObject getDataPropertyArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllDataProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        JSONObject object = new JSONObject();
        object.put("dataProperties", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets NamedIndividual JSONArray.
     */
    private JSONObject getNamedIndividualArray(Ontology ontology) {
        List<IRI> iris = ontology.getAllIndividuals()
                .stream()
                .filter(ind -> ind instanceof NamedIndividual)
                .map(ind -> ((NamedIndividual) ind).getIRI())
                .collect(Collectors.toList());

        JSONObject object = new JSONObject();
        object.put("namedIndividuals", iriListToJsonArray(iris));
        return object;
    }

    /**
     * Gets the List of Entities in an Ontology identified by a lambda function.
     *
     * @param ontologyIdStr The Ontology to process.
     * @param iriFunction The Function that takes an Ontology and returns a List of IRI corresponding to
     *                    an Ontology component.
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private JSONObject doWithOntology(String ontologyIdStr, Function<Ontology, JSONObject> iriFunction) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        Optional<Ontology> optOntology;

        try {
            optOntology = getOntology(ontologyIdStr);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Problem occurred while retrieving ontology",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        if (optOntology.isPresent()) {
            return iriFunction.apply(optOntology.get());
        } else {
            throw ErrorUtils.sendError("ontology does not exist", Response.Status.BAD_REQUEST);
        }
    }
    
    private JSONArray doWithImportedOntologies(String ontologyIdStr, Function<Ontology, JSONObject> iriFunction) {
        if (stringParamIsMissing(ontologyIdStr)) {
            throw ErrorUtils.sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);
        }

        Set<Ontology> importedOntologies;

        try {
            importedOntologies = getImportedOntologies(ontologyIdStr);
        } catch (MatontoOntologyException ex) {
            throw ErrorUtils.sendError(ex, "Problem occurred while retrieving imported ontologies",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }

        if (!importedOntologies.isEmpty()) {
            JSONArray ontoArray = new JSONArray();
            for (Ontology ontology : importedOntologies) {
                JSONObject object = iriFunction.apply(ontology);
                object.put("id", ontology.getOntologyId().getOntologyIdentifier().stringValue());
                ontoArray.add(object);
            }
            return ontoArray;
        } else {
            throw ErrorUtils.sendError("No imported ontologies found", Response.Status.NO_CONTENT);
        }
    }

    private JSONArray iriListToJsonArray(@Nonnull List<IRI> iris) {
        if (iris.isEmpty()) {
            return new JSONArray();
        }

        JSONArray array = new JSONArray();
        for (IRI iri : iris) {
            JSONObject object = new JSONObject();
            object.put("namespace", iri.getNamespace());
            object.put("localName", iri.getLocalName());
            if (!array.contains(object)) {
                array.add(object);
            }
        }
        return array;
    }

    private Optional<Ontology> getOntology(@Nonnull String ontologyIdStr) throws MatontoOntologyException {
        Resource resource;
        String id = ontologyIdStr.trim();
        if (isBNodeString(id)) {
            resource = factory.createBNode(id);
        } else {
            resource = factory.createIRI(id);
        }

        return manager.retrieveOntology(resource);
    }
    
    private Set<Ontology> getImportedOntologies(@Nonnull String ontologyIdStr) throws MatontoOntologyException {
        Optional<Ontology> optOntology = getOntology(ontologyIdStr);
        if (optOntology.isPresent()) {
            return optOntology.get().getDirectImports();
        } else {
            return new HashSet<>();
        }
    }

    private JSONArray getOntologies(List<String> ontIds) {
        JSONArray jsonArray = new JSONArray();

        for (String id : ontIds) {
            Optional<Ontology> optOntology;

            try {
                optOntology = getOntology(id);
            } catch (MatontoOntologyException ex) {
                throw ErrorUtils.sendError(ex, "Exception occurred while retrieving ontology.",
                        Response.Status.INTERNAL_SERVER_ERROR);
            }

            if (optOntology.isPresent()) {
                JSONObject json = new JSONObject();
                json.put("ontologyId", id);
                json.put("ontology", optOntology.get().asJsonLD().toString());
                jsonArray.add(json);
            } else {
                LOG.debug("Ontology " + id + "does not exist");
            }
        }

        return jsonArray;
    }

    private boolean isBNodeString(String string) {
        return string.matches("^_:.*$");
    }

    private String getOntologyAsRdf(Ontology ontology, String rdfFormat) {
        String normalizedFormat = rdfFormat.toLowerCase();

        switch (normalizedFormat) {
            case "rdf/xml":
                return ontology.asRdfXml().toString();
            case "owl/xml":
                return ontology.asOwlXml().toString();
            case "turtle":
                return ontology.asTurtle().toString();
            default:
                return ontology.asJsonLD().toString();
        }
    }

    /**
     * Return a JSONObject with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs
     * @return the JSONObject with the IRIs for all components of an ontology.
     */
    private JSONObject getAllIRIs(Ontology ontology) {
        return combineJSONObjects(getAnnotationArray(ontology), getClassArray(ontology), 
                getDatatypeArray(ontology), getObjectPropertyArray(ontology), getDataPropertyArray(ontology),
                getNamedIndividualArray(ontology));
    }
    
    
    private JSONObject combineJSONObjects(JSONObject... objects) {
        if (objects.length == 0) {
            return new JSONObject();
        }

        JSONObject json = new JSONObject();        
        for (int i = 0; i < objects.length; i++) {
            JSONObject each = objects[i];
            each.keySet().forEach(key -> json.put(key, each.get(key)));
        }
        return json;
    }
}
