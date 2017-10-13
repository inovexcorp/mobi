package com.mobi.etl.rest.impl;

/*-
 * #%L
 * com.mobi.etl.rest
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
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.etl.api.config.delimited.MappingRecordConfig;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.pagination.MappingPaginatedSearchParams;
import com.mobi.etl.rest.MappingRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.jaxb.Links;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Collections;
import java.util.List;
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
    private CatalogProvUtils provUtils;

    @Reference
    void setManager(MappingManager manager) {
        this.manager = manager;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
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
                .map(model -> modelToJsonld(model, transformer))
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
        checkStringParam(title, "Title is required");
        User user = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(user);
            MappingWrapper mapping;
            if (fileInputStream != null) {
                RDFFormat format = Rio.getParserFormatForFileName(fileDetail.getFileName()).orElseThrow(() ->
                        new IllegalArgumentException("File is not in a valid RDF format"));
                mapping = manager.createMapping(fileInputStream, format);
            } else {
                mapping = manager.createMapping(jsonld);
            }
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
            Resource branchId = record.getMasterBranch_resource().orElseThrow(() ->
                    ErrorUtils.sendError("Master Branch was not set on MappingRecord",
                            Response.Status.INTERNAL_SERVER_ERROR));
            versioningManager.commit(catalogId, record.getResource(), branchId, user, "The initial commit.",
                    mapping.getModel(), null);

            logger.info("Mapping Uploaded: " + record.getResource());
            provUtils.endCreateActivity(createActivity, record.getResource());
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IOException | IllegalArgumentException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
        }
    }

    @Override
    public Response getMapping(String recordId) {
        try {
            logger.info("Getting mapping " + recordId);
            MappingWrapper mapping = manager.retrieveMapping(vf.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND));
            String mappingJsonld = groupedModelToString(mapping.getModel(), getRDFFormat("jsonld"), transformer);
            return Response.ok(mappingJsonld).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException e) {
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
            String mappingJsonld = groupedModelToString(mapping.getModel(), rdfFormat, transformer);
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
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteMapping(ContainerRequestContext context, String recordId) {
        User activeUser = getActiveUser(context, engineManager);
        IRI recordIri = vf.createIRI(recordId);
        DeleteActivity deleteActivity = null;
        try {
            logger.info("Deleting mapping: " + recordId);
            deleteActivity = provUtils.startDeleteActivity(activeUser, recordIri);
            MappingRecord record = manager.deleteMapping(recordIri);
            provUtils.endDeleteActivity(deleteActivity, record);
            return Response.ok().build();
        } catch (IllegalArgumentException e) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException e) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the actual JSON-LD of a mapping. Removes the wrapping JSON array from
     * around the result of using Rio to parse the mapping model into JSON-LD
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
