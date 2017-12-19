package com.mobi.dataset.rest.impl;

/*-
 * #%L
 * com.mobi.dataset.rest
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


import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.dataset.rest.DatasetRest;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.jaxb.Links;
import net.sf.json.JSONArray;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.Rio;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class DatasetRestImpl implements DatasetRest {
    private DatasetManager manager;
    private EngineManager engineManager;
    private CatalogManager catalogManager;
    private SesameTransformer transformer;
    private BNodeService bNodeService;
    private ValueFactory vf;
    private ModelFactory mf;
    private CatalogProvUtils provUtils;
    private RDFImportService importService;

    @Reference
    void setManager(DatasetManager manager) {
        this.manager = manager;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setBNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
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
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setImportService(RDFImportService importService) {
        this.importService = importService;
    }

    @Override
    public Response getDatasetRecords(UriInfo uriInfo, int offset, int limit, String sort, boolean asc,
                                      String searchText) {
        try {
            LinksUtils.validateParams(limit, offset);
            DatasetPaginatedSearchParams params = new DatasetPaginatedSearchParams(vf).setOffset(offset)
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
            PaginatedSearchResults<DatasetRecord> results = manager.getDatasetRecords(params);
            JSONArray array = JSONArray.fromObject(results.getPage().stream()
                    .map(datasetRecord -> removeContext(datasetRecord.getModel()))
                    .map(model -> modelToSkolemizedJsonld(model, transformer, bNodeService))
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
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createDatasetRecord(ContainerRequestContext context, String title, String repositoryId,
                                        String datasetIRI, String description, List<FormDataBodyPart> keywords,
                                        List<FormDataBodyPart> ontologies) {
        checkStringParam(title, "Title is required");
        checkStringParam(repositoryId, "Repository id is required");
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            DatasetRecordConfig.DatasetRecordBuilder builder = new DatasetRecordConfig.DatasetRecordBuilder(title,
                    Collections.singleton(activeUser), repositoryId);
            if (datasetIRI != null && !datasetIRI.isEmpty()) {
                builder.dataset(datasetIRI);
            }
            if (description != null && !description.isEmpty()) {
                builder.description(description);
            }
            if (keywords != null) {
                builder.keywords(keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet()));
            }
            if (ontologies != null) {
                ontologies.forEach(formDataBodyPart -> builder.ontology(
                        getOntologyIdentifier(vf.createIRI(formDataBodyPart.getValue()))));
            }
            DatasetRecord record = manager.createDataset(builder.build());
            provUtils.endCreateActivity(createActivity, record.getResource());
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
        }
    }

    @Override
    public Response getDatasetRecord(String datasetRecordId) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            DatasetRecord datasetRecord = manager.getDatasetRecord(recordIRI).orElseThrow(() ->
                    ErrorUtils.sendError("DatasetRecord " + datasetRecordId + " could not be found",
                            Response.Status.NOT_FOUND));
            Model copy = mf.createModel();
            datasetRecord.getModel().forEach(st -> copy.add(st.getSubject(), st.getPredicate(), st.getObject()));
            return Response.ok(modelToJsonld(copy, transformer)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteDatasetRecord(ContainerRequestContext context, String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        User activeUser = getActiveUser(context, engineManager);
        DeleteActivity deleteActivity = null;
        try {
            deleteActivity = provUtils.startDeleteActivity(activeUser, recordIRI);

            DatasetRecord record = (force
                    ? manager.deleteDataset(recordIRI)
                    : manager.safeDeleteDataset(recordIRI));

            provUtils.endDeleteActivity(deleteActivity, record);
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response clearDatasetRecord(String datasetRecordId, boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.clearDataset(recordIRI);
            } else {
                manager.safeClearDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    @Override
    public Response uploadData(String datasetRecordId, InputStream fileInputStream,
                               FormDataContentDisposition fileDetail) {
        if (fileInputStream == null) {
            throw ErrorUtils.sendError("Must provide a file", Response.Status.BAD_REQUEST);
        }
        RDFFormat format = Rio.getParserFormatForFileName(fileDetail.getFileName()).orElseThrow(() ->
                ErrorUtils.sendError("File is not in a valid RDF format", Response.Status.BAD_REQUEST));

        ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                .dataset(vf.createIRI(datasetRecordId))
                .format(format)
                .logOutput(true);
        try {
            importService.importInputStream(builder.build(), fileInputStream);
            return Response.ok().build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private OntologyIdentifier getOntologyIdentifier(Resource recordId) {
        Branch masterBranch = catalogManager.getMasterBranch(catalogManager.getLocalCatalogIRI(), recordId);
        Resource commitId = masterBranch.getHead_resource().orElseThrow(() ->
                ErrorUtils.sendError("Branch " + masterBranch.getResource() + " has no head Commit set.",
                        Response.Status.INTERNAL_SERVER_ERROR));
        return new OntologyIdentifier(recordId, masterBranch.getResource(), commitId, vf, mf);
    }

    private Model removeContext(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }
}
