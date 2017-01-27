package org.matonto.etl.rest.impl;

/*-
 * #%L
 * org.matonto.etl.rest
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

import static org.matonto.rest.util.RestUtils.getRDFFormat;
import static org.matonto.rest.util.RestUtils.modelToString;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.rest.MappingRest;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true)
public class MappingRestImpl implements MappingRest {

    private MappingManager manager;
    private ValueFactory factory;
    private final Logger logger = LoggerFactory.getLogger(MappingRestImpl.class);
    private SesameTransformer transformer;

    @Reference
    public void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Response upload(InputStream fileInputStream, FormDataContentDisposition fileDetail,
                              String jsonld) {
        if ((fileInputStream == null && jsonld == null) || (fileInputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Must provide either a file or a string of JSON-LD",
                    Response.Status.BAD_REQUEST);
        }

        MappingWrapper mapping;
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

        String mappingId = mapping.getId().getMappingIdentifier().stringValue();

        logger.info("Mapping Uploaded: " + mappingId);
        return Response.ok(mappingId).build();
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
                .map(id -> getFormattedMapping(id, getRDFFormat("jsonld")))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(this::getJsonObject)
                .forEach(mappings::add);
        }

        return Response.ok(mappings.toString()).build();
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
        Optional<String> optMapping;
        try {
            optMapping = getFormattedMapping(mappingId, getRDFFormat("jsonld"));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        if (optMapping.isPresent()) {
            return Response.ok(getJsonObject(optMapping.get())).build();
        } else {
            throw ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND);
        }
    }

    @Override
    public Response downloadMapping(String mappingIRI, String format) {
        Resource mappingId;
        try {
            mappingId = manager.createMappingId(factory.createIRI(mappingIRI)).getMappingIdentifier();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, "Invalid mapping IRI", Response.Status.BAD_REQUEST);
        }

        logger.info("Downloading mapping " + mappingIRI);
        RDFFormat rdfFormat = getRDFFormat(format);
        Optional<String> optMapping;
        try {
            optMapping = getFormattedMapping(mappingId, rdfFormat);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        if (optMapping.isPresent()) {
            String mapping = optMapping.get();
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(format.equalsIgnoreCase("jsonld") ? getJsonObject(mapping).toString() : mapping);
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).header("Content-Disposition", "attachment; filename="
                    + factory.createIRI(mappingIRI).getLocalName() + "."
                    + rdfFormat.getDefaultFileExtension()).header("Content-Type", rdfFormat.getDefaultMIMEType())
                    .build();
        } else {
            throw ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND);
        }
    }

    @Override
    public Response updateMapping(String mappingIRI, String newJsonld) {
        Resource mappingId = factory.createIRI(mappingIRI);
        MappingWrapper newMapping;
        try {
            newMapping = manager.createMapping(newJsonld);
            manager.updateMapping(mappingId, newMapping);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing mapping", Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
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

        return Response.ok().build();
    }

    /**
     * Attempts to retrieve a mapping from the mapping registry and convert it into
     * the specified RDF serialization format.
     *
     * @param mappingIRI the IRI of a mapping in the mapping registry
     * @param format the RDF serialization format to retrieve the mapping in
     * @return a String with the serialization of a mapping if it exists
     * @throws MatOntoException thrown if there is an error retrieving the mapping
     */
    private Optional<String> getFormattedMapping(Resource mappingIRI, RDFFormat format) throws MatOntoException {
        String mapping;
        Optional<MappingWrapper> mappingModel = manager.retrieveMapping(mappingIRI);
        if (mappingModel.isPresent()) {
            mapping = modelToString(transformer.sesameModel(mappingModel.get().getModel()), format);
        } else {
            return Optional.empty();
        }
        return Optional.of(mapping);
    }

    /**
     * Retrieves the actual JSON-LD of a mapping. Removes the wrapping JSON array from
     * around the result of using Rio to parsethe mapping model into JSON-LD
     *
     * @param jsonld a mapping serialized as JSON-LD with a wrapping JSON array
     * @return a JSONObject with a mapping serialized as JSON-LD
     */
    private JSONObject getJsonObject(String jsonld) {
        JSONArray arr = JSONArray.fromObject(jsonld);
        return arr.getJSONObject(0);
    }
}
