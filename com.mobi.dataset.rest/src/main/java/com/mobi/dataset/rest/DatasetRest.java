package com.mobi.dataset.rest;

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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
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
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(service = DatasetRest.class, immediate = true)
@Path("/datasets")
@Api(value = "/datasets")
public class DatasetRest {
    private DatasetManager manager;
    private EngineManager engineManager;
    private CatalogConfigProvider configProvider;
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
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
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

    /**
     * Retrieves all the DatasetRecords in the local Catalog in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of DatasetRecords
     * @param offset The offset for a page of DatasetRecords
     * @param limit The number of DatasetRecords to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param searchText The optional search text for the query
     * @return A Response with a JSON array of DatasetRecords
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all DatasetRecords in the local Catalog")
    public Response getDatasetRecords(@Context UriInfo uriInfo,
                               @QueryParam("offset") int offset,
                               @QueryParam("limit") int limit,
                               @QueryParam("sort") String sort,
                               @DefaultValue("true") @QueryParam("ascending") boolean asc,
                               @QueryParam("searchText") String searchText) {
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

    /**
     * Creates a new DatasetRecord in the local Catalog using the passed information and Dataset with the passed
     * IRI in the repository with the passed id.
     *
     * @param context The context of the request
     * @param title The required title for the new DatasetRecord
     * @param repositoryId The required id of a repository in Mobi
     * @param datasetIRI The optional IRI for the new Dataset
     * @param description The optional description for the new DatasetRecord
     * @param markdown The optional markdown abstract for the new DatasetRecord.
     * @param keywords The optional list of keywords strings for the new DatasetRecord
     * @param ontologies The optional list of OntologyRecord IRI strings for the new DatasetRecord
     * @return A Response with the IRI string of the created DatasetRecord
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Creates a new DatasetRecord in the local Catalog and Dataset in the specified repository")
    public Response createDatasetRecord(@Context ContainerRequestContext context,
                                 @FormDataParam("title") String title,
                                 @FormDataParam("repositoryId") String repositoryId,
                                 @FormDataParam("datasetIRI") String datasetIRI,
                                 @FormDataParam("description") String description,
                                 @FormDataParam("markdown") String markdown,
                                 @FormDataParam("keywords") List<FormDataBodyPart> keywords,
                                 @FormDataParam("ontologies") List<FormDataBodyPart> ontologies) {
        checkStringParam(title, "Title is required");
        checkStringParam(repositoryId, "Repository id is required");
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            DatasetRecordConfig.DatasetRecordBuilder builder = new DatasetRecordConfig.DatasetRecordBuilder(title,
                    Collections.singleton(activeUser), repositoryId);
            if (StringUtils.isNotEmpty(datasetIRI)) {
                builder.dataset(datasetIRI);
            }
            if (StringUtils.isNotEmpty(description)) {
                builder.description(description);
            }
            if (StringUtils.isNotEmpty(markdown)) {
                builder.markdown(markdown);
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

    /**
     * Gets a specific DatasetRecord from the local Catalog.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @return A Response indicating the success of the request
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @ApiOperation("Gets a specific DatasetRecord from the local Catalog")
    public Response getDatasetRecord(@PathParam("datasetRecordId") String datasetRecordId) {
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

    /**
     * Deletes a specific DatasetRecord and its Dataset from the local Catalog. By default only removes named graphs
     * that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param context The context of the request
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the delete should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific DatasetRecord in the local Catalog")
    public Response deleteDatasetRecord(@Context ContainerRequestContext context,
                                 @PathParam("datasetRecordId") String datasetRecordId,
                                 @DefaultValue("false") @QueryParam("force") boolean force) {
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

    /**
     * Deletes all named graphs associated with the Dataset of a specific DatasetRecord. By default only removes named
     * graphs that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the clear should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @ApiOperation("Clears the data within a specific DatasetRecord in the local Catalog")
    public Response clearDatasetRecord(@PathParam("datasetRecordId") String datasetRecordId,
                                @DefaultValue("false") @QueryParam("force") boolean force) {
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

    /**
     * Uploads all RDF data in the provided file into the Dataset of a specific DatasetRecord.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param fileInputStream An InputStream of a RDF file passed as form data
     * @param fileDetail Information about the RDF file being uploaded, including the name
     * @return A Response indicating the success of the request
     */
    @POST
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @ApiOperation("Uploads the data within an RDF file to a specific DatasetRecord in the local Catalog")
    public Response uploadData(@PathParam("datasetRecordId") String datasetRecordId,
                        @FormDataParam("file") InputStream fileInputStream,
                        @FormDataParam("file") FormDataContentDisposition fileDetail) {
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
        Branch masterBranch = catalogManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId);
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
