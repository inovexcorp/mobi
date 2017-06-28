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

import static org.matonto.rest.util.RestUtils.getActiveUser;
import static org.matonto.rest.util.RestUtils.getObjectFromJsonld;
import static org.matonto.rest.util.RestUtils.getRDFFormat;
import static org.matonto.rest.util.RestUtils.groupedModelToString;
import static org.matonto.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.versioning.VersioningManager;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.etl.api.config.MappingRecordConfig;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.api.ontologies.delimited.MappingRecord;
import org.matonto.etl.api.pagination.MappingPaginatedSearchParams;
import org.matonto.etl.rest.MappingRest;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.LinksUtils;
import org.matonto.rest.util.RestUtils;
import org.matonto.rest.util.jaxb.Links;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class MappingRestImpl implements MappingRest {

    private MappingManager manager;
    private CatalogManager catalogManager;
    private VersioningManager versioningManager;
    private ValueFactory vf;
    private ModelFactory mf;
    private EngineManager engineManager;
    private final Logger logger = LoggerFactory.getLogger(MappingRestImpl.class);
    private SesameTransformer transformer;

    @Reference
    protected void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    protected void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Response getMappings(UriInfo uriInfo, int offset, int limit, String sort, boolean asc, String searchText) {
        LinksUtils.validateParams(limit, offset);
        MappingPaginatedSearchParams params = new MappingPaginatedSearchParams(vf).setOffset(offset)
                .setAscending(asc);
        if (limit > 0) {
            params.setLimit(limit);
        }
        if (sort != null && !sort.isEmpty()) {
            params.setSortBy(vf.createIRI(sort));
        }
        if (searchText != null && !searchText.isEmpty()) {
            params.setSearchText(searchText);
        }
        PaginatedSearchResults<MappingRecord> results = manager.getMappingRecords(params);
        JSONArray array = JSONArray.fromObject(results.getPage().stream()
                .map(record -> removeContext(record.getModel()))
                .map(model -> modelToJsonld(transformer.sesameModel(model)))
                .map(RestUtils::getObjectFromJsonld)
                .collect(Collectors.toList()));
        Links links = LinksUtils.buildLinks(uriInfo, array.size(), results.getTotalSize(), limit, offset);
        Response.ResponseBuilder response = Response.ok(array).header("X-Total-Count", results.getTotalSize());
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
    }

    @Override
    public Response upload(ContainerRequestContext context, String title, String description,
                           List<FormDataBodyPart> keywords, InputStream fileInputStream,
                           FormDataContentDisposition fileDetail, String jsonld) {
        if ((fileInputStream == null && jsonld == null) || (fileInputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Must provide either a file or a JSON-LD string", Response.Status.BAD_REQUEST);
        }

        try {
            MappingWrapper mapping;
            if (fileInputStream != null) {
                RDFFormat format = Rio.getParserFormatForFileName(fileDetail.getFileName()).orElseThrow(() ->
                        new IllegalArgumentException("File is not in a valid RDF format"));
                mapping = manager.createMapping(fileInputStream, format);
            } else {
                mapping = manager.createMapping(jsonld);
            }
            User user = getActiveUser(context, engineManager);
            MappingRecordConfig.MappingRecordBuilder builder = new MappingRecordConfig.MappingRecordBuilder(title,
                    Collections.singleton(user));
            if (description != null) {
                builder.description(description);
            }
            if (keywords != null) {
                builder.keywords(keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet()));
            }
            IRI catalogId = catalogManager.getLocalCatalogIRI();
            MappingRecord record = manager.createMappingRecord(builder.build());
            catalogManager.addRecord(catalogId, record);
            Resource branchId = record.getMasterBranch_resource().get();
            versioningManager.commit(catalogId, record.getResource(), branchId, user, "The initial commit.",
                    mapping.getModel(), null);

            logger.info("Mapping Uploaded: " + record.getResource());

            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IOException | IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getMapping(String recordId) {
        try {
            logger.info("Getting mapping " + recordId);
            MappingWrapper mapping = manager.retrieveMapping(vf.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND));
            String mappingJsonld = groupedModelToString(transformer.sesameModel(mapping.getModel()),
                    getRDFFormat("jsonld"));
            return Response.ok(mappingJsonld).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response downloadMapping(String recordId, String format) {
        try {
            logger.info("Downloading mapping " + recordId);
            MappingWrapper mapping = manager.retrieveMapping(vf.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND));
            RDFFormat rdfFormat = getRDFFormat(format);
            String mappingJsonld = groupedModelToString(transformer.sesameModel(mapping.getModel()), rdfFormat);
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(format.equalsIgnoreCase("jsonld") ? getJsonObject(mappingJsonld).toString() :
                        mappingJsonld);
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).header("Content-Disposition", "attachment; filename="
                    + vf.createIRI(mapping.getId().getMappingIdentifier().stringValue()).getLocalName() + "."
                    + rdfFormat.getDefaultFileExtension()).header("Content-Type", rdfFormat.getDefaultMIMEType())
                    .build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteMapping(String recordId) {
        try {
            logger.info("Deleting mapping: " + recordId);
            manager.deleteMapping(vf.createIRI(recordId));
            return Response.ok().build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
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

    private Model removeContext(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }
}
