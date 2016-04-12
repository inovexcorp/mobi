package org.matonto.etl.rest.impl;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.csv.MappingManager;
import org.matonto.etl.rest.MappingRest;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class MappingRestImpl implements MappingRest {

    private MappingManager manager;
    private final Logger logger = LoggerFactory.getLogger(MappingRestImpl.class);

    @Reference
    public void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail,
                           String jsonld, String mappingId) {
        if ((fileInputStream == null && jsonld == null) || (fileInputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Must provide either a file or a string of JSON-LD",
                    Response.Status.BAD_REQUEST);
        }

        Resource mappingIRI = mappingId != null ? manager.createMappingIRI(mappingId) : manager.createMappingIRI();
        Model mappingModel;
        try {
            if (fileInputStream != null) {
                RDFFormat format = Rio.getParserFormatForFileName(fileDetail.getFileName())
                        .orElseThrow(IllegalArgumentException::new);
                mappingModel = manager.createMapping(fileInputStream, format);
            } else {
                mappingModel = manager.createMapping(jsonld);
            }
            manager.storeMapping(mappingModel, mappingIRI);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing mapping", Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        logger.info("Mapping Uploaded: " + mappingIRI);

        return Response.status(200).entity(mappingIRI.stringValue()).build();
    }

    @Override
    public Response getMappingNames() {
        Set<Resource> registry = manager.getMappingRegistry();
        Set<String> mappings = registry.stream()
                .map(Value::stringValue)
                .collect(Collectors.toSet());
        Gson gson = new GsonBuilder().create();
        return Response.status(200).entity(gson.toJson(mappings)).build();
    }

    @Override
    public Response getMapping(String localName) {
        Resource mappingIRI = manager.createMappingIRI(localName);
        logger.info("Getting mapping " + mappingIRI);
        JSONObject json;
        try {
            json = getMappingAsJson(mappingIRI);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response downloadMapping(String localName) {
        Resource mappingIRI = manager.createMappingIRI(localName);
        logger.info("Downloading mapping " + mappingIRI);
        JSONObject json;
        try {
            json = getMappingAsJson(mappingIRI);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        StreamingOutput stream = os -> {
            Writer writer = new BufferedWriter(new OutputStreamWriter(os));
            writer.write(json.toString());
            writer.flush();
            writer.close();
        };

        return Response.ok(stream).build();
    }

    @Override
    public Response deleteMapping(String localName) {
        Resource mappingIRI = manager.createMappingIRI(localName);
        logger.info("Deleting mapping " + mappingIRI);
        boolean success = false;
        try {
            manager.deleteMapping(mappingIRI);
            success = true;
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(success).build();
    }

    private JSONObject getMappingAsJson(Resource mappingIRI) throws MatOntoException {
        JSONObject json;
        Optional<Model> mappingModel = manager.retrieveMapping(mappingIRI);
        if (mappingModel.isPresent()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Rio.write(mappingModel.get(), out, RDFFormat.JSONLD);
            JSONArray arr = JSONArray.fromObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
            json = arr.getJSONObject(0);
        } else {
            throw ErrorUtils.sendError("Error retrieving mapping", Response.Status.BAD_REQUEST);
        }
        return json;
    }
}
