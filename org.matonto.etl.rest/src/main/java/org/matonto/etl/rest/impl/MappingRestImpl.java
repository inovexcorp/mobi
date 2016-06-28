package org.matonto.etl.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.delimited.Mapping;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.rest.MappingRest;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class MappingRestImpl implements MappingRest {

    private MappingManager manager;
    private ValueFactory factory;
    private final Logger logger = LoggerFactory.getLogger(MappingRestImpl.class);

    @Reference
    public void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail,
                              String jsonld) {
        if ((fileInputStream == null && jsonld == null) || (fileInputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Must provide either a file or a string of JSON-LD",
                    Response.Status.BAD_REQUEST);
        }
        Mapping mapping;
        try {
            if (fileInputStream != null) {
                RDFFormat format = Rio.getParserFormatForFileName(fileDetail.getFileName())
                        .orElseThrow(IllegalArgumentException::new);
                mapping = manager.createMapping(fileInputStream, format);
            } else {
                mapping = manager.createMapping(jsonld);
            }
            manager.storeMapping(mapping);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing mapping", Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        logger.info("Mapping Uploaded: " + mapping.getId().getMappingIdentifier().stringValue());
        return Response.status(200).entity(mapping.getId().getMappingIdentifier().stringValue()).build();
    }

    @Override
    public Response getMappings(List<String> idList) {
        JSONArray mappings = new JSONArray();
        if (idList.isEmpty()) {
            manager.getMappingRegistry().stream()
                .map(Value::stringValue)
                .forEach(mappings::add);
        } else {
            idList.stream()
                .map(id -> factory.createIRI(id))
                .map(this::getMappingAsJson)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .forEach(mappings::add);
        }

        return Response.status(200).entity(mappings.toString()).build();
    }

    @Override
    public Response getMapping(String mappingIRI) {
        Resource mappingId;
        try {
            mappingId = manager.createMappingId(factory.createIRI(mappingIRI)).getMappingIdentifier();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, "Invalid mapping IRI", Response.Status.BAD_REQUEST);
        }

        logger.info("Getting mapping " + mappingId);
        Optional<JSONObject> optJson;
        try {
            optJson = getMappingAsJson(mappingId);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        if (optJson.isPresent()) {
            return Response.status(200).entity(optJson.get().toString()).build();
        } else {
            throw ErrorUtils.sendError("Mapping not found", Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response downloadMapping(String mappingIRI) {
        Resource mappingId;
        try {
            mappingId = manager.createMappingId(factory.createIRI(mappingIRI)).getMappingIdentifier();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, "Invalid mapping IRI", Response.Status.BAD_REQUEST);
        }

        logger.info("Downloading mapping " + mappingIRI);
        Optional<JSONObject> optJson;
        try {
            optJson = getMappingAsJson(mappingId);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        if (optJson.isPresent()) {
            JSONObject json = optJson.get();
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(json.toString());
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).header("Content-Disposition", "attachment; filename="
                    + manager.getMappingLocalName(factory.createIRI(mappingIRI)) + ".jsonld").header("Content-Type",
                    "application/octet-stream").build();
        } else {
            throw ErrorUtils.sendError("Mapping not found", Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response deleteMapping(String mappingIRI) {
        Resource mappingId;
        try {
            mappingId = manager.createMappingId(factory.createIRI(mappingIRI)).getMappingIdentifier();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, "Invalid mapping IRI", Response.Status.BAD_REQUEST);
        }

        logger.info("Deleting mapping " + mappingId);
        try {
            manager.deleteMapping(mappingId);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(true).build();
    }

    /**
     * Attempts to retrieve a mapping from the mapping registry and convert it into
     * JSON-LD and then into a JSONObject.
     *
     * @param mappingIRI the IRI of a mapping in the mapping registry
     * @return a JSONObject with the JSON-LD of a mapping if it exists
     * @throws MatOntoException thrown if there is an error retrieving the mapping
     */
    private Optional<JSONObject> getMappingAsJson(Resource mappingIRI) throws MatOntoException {
        JSONObject json;
        Optional<Mapping> mappingModel = manager.retrieveMapping(mappingIRI);
        if (mappingModel.isPresent()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Rio.write(Values.sesameModel(mappingModel.get().asModel()), out, RDFFormat.JSONLD);
            JSONArray arr = JSONArray.fromObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
            json = arr.getJSONObject(0);
        } else {
            return Optional.empty();
        }
        return Optional.of(json);
    }
}
