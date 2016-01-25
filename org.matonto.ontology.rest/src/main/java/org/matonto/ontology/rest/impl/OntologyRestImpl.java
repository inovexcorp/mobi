package org.matonto.ontology.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
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
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import java.io.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;


@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    private OntologyManager manager;
    private ValueFactory factory;
    private final Logger LOG = LoggerFactory.getLogger(OntologyRestImpl.class);

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

    @Override
    public Response getAllOntologies() {
        List<String> ontologyIds = manager.getOntologyRegistry().keySet()
                .stream()
                .map(Resource::stringValue)
                .collect(Collectors.toList());

        return Response.status(200).entity(getOntologies(ontologyIds).toString()).build();
    }

    @Override
    public Response getOntologies(String ontologyIdList) {
        if (ontologyIdList == null || ontologyIdList.length() == 0)
            throw sendError("ontologyIdList is missing", Response.Status.BAD_REQUEST);

        List<String> ontologyIds = Arrays.asList(ontologyIdList.trim().split("\\s*,\\s*"));

        if (ontologyIds.isEmpty())
            throw sendError("Invalid ontology id(s) on the list", Response.Status.BAD_REQUEST);

        return Response.status(200).entity(getOntologies(ontologyIds).toString()).build();
    }

    @Override
    public Response uploadFile(InputStream fileInputStream) {
        boolean persisted = false;
        Ontology ontology = null;

        try {
            ontology = manager.createOntology(fileInputStream);
            persisted = manager.storeOntology(ontology);
        } catch (MatontoOntologyException ex) {
            throw sendError(ex, "Exception occurred while processing ontology.", Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }

        JSONObject json = new JSONObject();

        if (persisted) {
            OntologyId oid = ontology.getOntologyId();
            json.put("ontologyId", oid.getOntologyIdentifier().stringValue());
        }

        json.put("persisted", persisted);

        return Response.status(200).entity(json.toString()).build();
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
    public Response deleteOntology(String ontologyIdStr) {
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            throw sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);

        boolean deleted;
        try {
            Resource resource;
            if (isBNodeString(ontologyIdStr.trim()))
                resource = factory.createBNode(ontologyIdStr.trim());
            else
                resource = factory.createIRI(ontologyIdStr.trim());

            deleted = manager.deleteOntology(resource);
        } catch (MatontoOntologyException ex) {
            throw sendError(ex, "Exception occurred while deleting ontology.", Response.Status.INTERNAL_SERVER_ERROR);
        }

        JSONObject json = new JSONObject();
        json.put("deleted", deleted);

        return Response.status(200).entity(json.toString()).build();
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
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies -> {
            JSONObject json = new JSONObject();
            json.put("ontology id", ontologyIdStr);
            JSONArray ontoArray = new JSONArray();
            for(Ontology ontology : importedOntologies) {
                JSONObject object = getAllIRIs(ontology);
                ontoArray.add(object);
            }
            json.put("imported ontologies", ontoArray);
            return json;
        });
        
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getAnnotationsInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
                applyToImportedOntologies(ontologyIdStr, importedOntologies, "annotationProperties", this::getAnnotationArray));
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getClassesInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
                applyToImportedOntologies(ontologyIdStr, importedOntologies, "classes", this::getClassArray));
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDatatypesInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
            applyToImportedOntologies(ontologyIdStr, importedOntologies, "datatypes", this::getDatatypeArray));
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
        applyToImportedOntologies(ontologyIdStr, importedOntologies, "objectProperties", this::getObjectPropertyArray));
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
        applyToImportedOntologies(ontologyIdStr, importedOntologies, "dataProperties", this::getDataPropertyArray));
        return Response.status(200).entity(result.toString()).build();
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(String ontologyIdStr) {
        JSONObject result = doWithImportedOntologies(ontologyIdStr, importedOntologies ->
        applyToImportedOntologies(ontologyIdStr, importedOntologies, "namedIndividuals", this::getNamedIndividualArray));
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

        return iriListToJsonArray(iris);
    }

    /**
     * Gets Class JSONArray.
     */
    private JSONObject getClassArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllClasses()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        return iriListToJsonArray(iris);
    }

    /**
     * Gets Datatype JSONArray.
     */
    private JSONObject getDatatypeArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        return iriListToJsonArray(iris);
    }

    /**
     * Gets ObjectProperty JSONArray.
     */
    private JSONObject getObjectPropertyArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllObjectProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        return iriListToJsonArray(iris);
    }

    /**
     * Gets DataProperty JSONArray.
     */
    private JSONObject getDataPropertyArray(@Nonnull Ontology ontology) {
        List<IRI> iris = ontology.getAllDataProperties()
                .stream()
                .map(Entity::getIRI)
                .collect(Collectors.toList());

        return iriListToJsonArray(iris);
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

        return iriListToJsonArray(iris);
    }

    /**
     * Gets the List of Entities in an Ontology identified by a lambda function.
     *
     * @param ontologyIdStr The Ontology to process.
     * @param iriFunction The Function that takes an Ontology and returns a List of IRI corresponding to
     *                    an Ontology component.
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private JSONObject doWithOntology(String ontologyIdStr, Function<Ontology, JSONObject> iriFunction){
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            throw sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);

        Optional<Ontology> optOntology;

        try {
            optOntology = getOntology(ontologyIdStr);
        } catch (MatontoOntologyException ex) {
            throw sendError(ex, "Problem occurred while retrieving ontology", Response.Status.INTERNAL_SERVER_ERROR);
        }

        if (optOntology.isPresent()) {
            return iriFunction.apply(optOntology.get());
        } else {
            throw sendError("ontology does not exist", Response.Status.BAD_REQUEST);
        }
    }
    
    private JSONObject doWithImportedOntologies(String ontologyIdStr, Function<Set<Ontology>, JSONObject> iriFunction){
        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            throw sendError("ontologyIdStr is missing", Response.Status.BAD_REQUEST);

        Set<Ontology> importedOntology;

        try {
            importedOntology = getImportedOntologies(ontologyIdStr);
        } catch (MatontoOntologyException ex) {
            throw sendError(ex, "Problem occurred while retrieving imported ontologies", Response.Status.INTERNAL_SERVER_ERROR);
        }

        if (!importedOntology.isEmpty()) {
            return iriFunction.apply(importedOntology);
        } else {
            throw sendError("No imported ontologies found", Response.Status.NO_CONTENT);
        }
    }

    private JSONObject iriListToJsonArray(@Nonnull List<IRI> iris) {
        if (iris.isEmpty())
            return new JSONObject();

        Map<String, ArrayList<String>> iriMap = new HashMap<>();
        for (IRI iri : iris) {
            if (!iriMap.containsKey(iri.getNamespace())) {
                ArrayList<String> localnames = new ArrayList<>();
                localnames.add(iri.getLocalName());
                iriMap.put(iri.getNamespace(), localnames);
            } else if (!iriMap.get(iri.getNamespace()).contains(iri.getLocalName())) {
                iriMap.get(iri.getNamespace()).add(iri.getLocalName());
            }
        }

        JSONObject json = new JSONObject();

        for (String key : iriMap.keySet()) {
            JSONArray jsonArray = new JSONArray();
            jsonArray.addAll(iriMap.get(key));
            json.put(key, jsonArray);
        }

        return json;
    }

    private Optional<Ontology> getOntology(@Nonnull String ontologyIdStr) throws MatontoOntologyException {
        Resource resource;
        String id = ontologyIdStr.trim();
        if (isBNodeString(id))
            resource = factory.createBNode(id);
        else
            resource = factory.createIRI(id);

        return manager.retrieveOntology(resource);
    }
    
    private Set<Ontology> getImportedOntologies(@Nonnull String ontologyIdStr) throws MatontoOntologyException {
        Optional<Ontology> optOntology = getOntology(ontologyIdStr);
        if(optOntology.isPresent()) 
            return optOntology.get().getDirectImports();
 
        else
            return new HashSet<>();
    }

    private JSONArray getOntologies(List<String> ontIds) {
        JSONArray jsonArray = new JSONArray();

        for (String id : ontIds) {
            Optional<Ontology> optOntology;

            try {
                optOntology = getOntology(id);
            } catch (MatontoOntologyException ex) {
                throw sendError(ex, "Exception occurred while retrieving ontology.", Response.Status.INTERNAL_SERVER_ERROR);
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

    private WebApplicationException sendError(Throwable t, String msg, Response.Status status) {
        LOG.debug(String.format("%d: %s", status.getStatusCode(), msg), t);
        throw new WebApplicationException(msg, status);
    }

    private WebApplicationException sendError(String msg, Response.Status status) throws WebApplicationException {
        LOG.debug(String.format("%d: %s", status.getStatusCode(), msg));
        return new  WebApplicationException(msg, status);
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
    
    private JSONObject getAllIRIs(Ontology ontology) {
        JSONArray array = new JSONArray();

        JSONObject annotations = new JSONObject();
        annotations.put("annotationProperties", getAnnotationArray(ontology));
        array.add(annotations);

        JSONObject classes = new JSONObject();
        classes.put("classes", getClassArray(ontology));
        array.add(classes);

        JSONObject datatypes = new JSONObject();
        datatypes.put("datatypes", getDatatypeArray(ontology));
        array.add(datatypes);

        JSONObject objectProperties = new JSONObject();
        objectProperties.put("objectProperties", getObjectPropertyArray(ontology));
        array.add(objectProperties);

        JSONObject dataProperties = new JSONObject();
        dataProperties.put("dataProperties", getDataPropertyArray(ontology));
        array.add(dataProperties);

        JSONObject namedIndividuals = new JSONObject();
        namedIndividuals.put("namedIndividuals", getNamedIndividualArray(ontology));
        array.add(namedIndividuals);
        
        JSONObject json = new JSONObject();
        json.put(ontology.getOntologyId().getOntologyIdentifier().stringValue(), array);
        return json;
    }
    
    private JSONObject applyToImportedOntologies(String ontologyIdStr, Set<Ontology> importedOntologies, String key, Function<Ontology, JSONObject> function) {
        JSONObject json = new JSONObject();
        json.put("ontologyId", ontologyIdStr);
        JSONArray ontoArray = new JSONArray();
        for (Ontology ontology : importedOntologies) {
            JSONObject object = new JSONObject();
            object.put("importedOntologyId", ontology.getOntologyId().getOntologyIdentifier().stringValue());
            object.put(key, function.apply(ontology));
            ontoArray.add(object);
        }
        json.put("importedOntologies", ontoArray);
        return json;
    }
}
