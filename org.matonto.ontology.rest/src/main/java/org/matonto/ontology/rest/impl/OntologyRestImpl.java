package org.matonto.ontology.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.matonto.ontology.core.api.*;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.rest.OntologyRest;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
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
        LOG.debug("Request: getAllOntologyIds");

        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        JSONObject json = new JSONObject();

        Map<Resource, String> ontoIdRegistry = manager.getOntologyRegistry();
        if (!ontoIdRegistry.isEmpty()) {
            for (Resource oid : ontoIdRegistry.keySet())
                json.put(oid.stringValue(), ontoIdRegistry.get(oid));
        }

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response getAllOntologies() {
        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        JSONArray jsonArray = new JSONArray();
        Map<Resource, String> ontoIdRegistry = manager.getOntologyRegistry();
        if (!ontoIdRegistry.isEmpty()) {
            for (Resource oid : ontoIdRegistry.keySet()) {
                JSONObject json = new JSONObject();
                json.put("ontologyId", oid.stringValue());
                Optional<Ontology> optOntology = Optional.empty();
                String message = null;

                try {
                    optOntology = getOntology(oid.stringValue());
                } catch (MatontoOntologyException ex) {
                    message = ex.getMessage();
                    LOG.error("Exception occurred while retrieving ontology with ontology id " + oid + ": " + message + ex);
                }

                if (optOntology.isPresent()) {
                    OutputStream outputStream = optOntology.get().asJsonLD();

                    if (outputStream != null)
                        json.put("ontology", outputStream.toString());

                    IOUtils.closeQuietly(outputStream);

                } else if (message == null) {
                    json.put("error", "OntologyId doesn't exist.");
                } else {
                    json.put("error", "Exception occurred while retrieving ontology: " + message);
                }

                jsonArray.add(json);
            }
        }

        return Response.status(200).entity(jsonArray.toString()).build();
    }

    @Override
    public Response getOntologies(String ontologyIdList) {
        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        if (ontologyIdList == null || ontologyIdList.length() == 0)
            return responseMessage(400, "ontologyIdList is missing");

        List<String> ontologyIds = Arrays.asList(ontologyIdList.trim().split("\\s*,\\s*"));

        if (ontologyIds.isEmpty())
            return Response.status(400).entity("Invalid ontology id(s) on the list").build();

        JSONArray jsonArray = new JSONArray();

        for (String id : ontologyIds) {
            Optional<Ontology> optOntology = Optional.empty();
            JSONObject json = new JSONObject();
            String message = null;
            json.put("ontologyId", id);

            try {
                optOntology = getOntology(id);
            } catch (MatontoOntologyException ex) {
                message = ex.getMessage();
                LOG.error("Exception occurred while retrieving ontology with ontology id " + id + ": " + message + ex);
            }

            if (optOntology.isPresent()) {
                OutputStream outputStream = optOntology.get().asJsonLD();
                String content = "";
                if (outputStream != null)
                    content = outputStream.toString();

                IOUtils.closeQuietly(outputStream);
                json.put("ontology", content);
            } else if (message == null) {
                json.put("error", "OntologyId doesn't exist.");
            } else {
                json.put("error", "Exception occurred while retrieving ontology: " + message);
            }

            jsonArray.add(json);
        }

        return Response.status(200).entity(jsonArray.toString()).build();
    }

    @Override
    public Response uploadFile(InputStream fileInputStream) {
        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        boolean persisted = false;
        Ontology ontology = null;
        try {
            ontology = manager.createOntology(fileInputStream);
            persisted = manager.storeOntology(ontology);
        } catch (MatontoOntologyException ex) {
            return responseMessage(500, "Exception occurred while uploading ontology: " + ex.getMessage());
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
        return doWithOntology(ontologyIdStr, ontology -> {
            String content = getOntologyAsRdf(ontology, rdfFormat);

            JSONObject json = new JSONObject();
            json.put("documentFormat", rdfFormat);
            json.put("ontology", content);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response downloadOntologyFile(String ontologyIdStr, String rdfFormat) {
        return doWithOntology(ontologyIdStr, ontology -> {
            final String content = getOntologyAsRdf(ontology, rdfFormat);

            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(content);
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).build();
        });
    }

    @Override
    public Response deleteOntology(String ontologyIdStr) {
        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return responseMessage(400, "ontologyIdStr is missing");

        boolean deleted;
        try {
            Resource resource;
            if (isBNodeString(ontologyIdStr.trim()))
                resource = factory.createBNode(ontologyIdStr.trim());
            else
                resource = factory.createIRI(ontologyIdStr.trim());

            deleted = manager.deleteOntology(resource);
        } catch (MatontoOntologyException ex) {
            return responseMessage(500, "Exception occurred while deleting ontology: " + ex.getMessage());
        }

        JSONObject json = new JSONObject();
        json.put("deleted", deleted);

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response getIRIsInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
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

            return Response.status(200).entity(array.toString()).build();
        });
    }

    @Override
    public Response getAnnotationsInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getAnnotationArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response getClassesInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getClassArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response getDatatypesInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getDatatypeArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response getObjectPropertiesInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getObjectPropertyArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response getDataPropertiesInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getDataPropertyArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
    }

    @Override
    public Response getNamedIndividualsInOntology(String ontologyIdStr) {
        return doWithOntology(ontologyIdStr, ontology -> {
            JSONObject json = getNamedIndividualArray(ontology);
            return Response.status(200).entity(json.toString()).build();
        });
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
    private Response doWithOntology(String ontologyIdStr, Function<Ontology, Response> iriFunction){
        if (manager == null)
            return responseMessage(500, "Ontology Manager is null");

        if (ontologyIdStr == null || ontologyIdStr.length() == 0)
            return responseMessage(400, "ontologyIdStr is missing");

        Optional<Ontology> optOntology = Optional.empty();

        try {
            optOntology = getOntology(ontologyIdStr);
        } catch (MatontoOntologyException ex) {
            LOG.error("Exception occurred while retrieving ontology: " + ex.getMessage(), ex);
        }

        if (optOntology.isPresent()) {
            return iriFunction.apply(optOntology.get());
        } else {
            return responseMessage(400, "Ontology does not exist");
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

    private boolean isBNodeString(String string) {
        return string.matches("^_:.*$");
    }

    private Response responseMessage(int statusCode, String msg) {
        LOG.debug(msg);
        return Response.status(statusCode).type("text/plain").entity(msg).build();
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
}
