package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitJson;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitResponse;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.getDifferenceJsonString;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createPaginatedResponse;
import static com.mobi.rest.util.RestUtils.createPaginatedResponseWithJson;
import static com.mobi.rest.util.RestUtils.createPaginatedThingResponse;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.jsonldToDeskolemizedModel;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.thingToSkolemizedJsonObject;
import static com.mobi.rest.util.RestUtils.validatePaginationParams;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.rest.CatalogRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogRestImpl.class);
    private static final Set<String> SORT_RESOURCES;

    private OrmFactoryRegistry factoryRegistry;
    private SesameTransformer transformer;
    private CatalogManager catalogManager;
    private ValueFactory vf;
    private VersioningManager versioningManager;
    private BNodeService bNodeService;
    private CatalogProvUtils provUtils;

    protected EngineManager engineManager;
    protected DistributionFactory distributionFactory;
    protected CommitFactory commitFactory;
    protected InProgressCommitFactory inProgressCommitFactory;

    static {
        Set<String> sortResources = new HashSet<>();
        sortResources.add(DCTERMS.MODIFIED.stringValue());
        sortResources.add(DCTERMS.ISSUED.stringValue());
        sortResources.add(DCTERMS.TITLE.stringValue());
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
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
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference
    void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Override
    public Response getCatalogs(String catalogType) {
        try {
            Set<Catalog> catalogs = new HashSet<>();
            Catalog localCatalog = catalogManager.getLocalCatalog();
            Catalog distributedCatalog = catalogManager.getDistributedCatalog();
            if (catalogType == null) {
                catalogs.add(localCatalog);
                catalogs.add(distributedCatalog);
            } else if (catalogType.equals("local")) {
                catalogs.add(localCatalog);
            } else if (catalogType.equals("distributed")) {
                catalogs.add(distributedCatalog);
            }

            JSONArray array = JSONArray.fromObject(catalogs.stream()
                    .map(catalog -> thingToSkolemizedJsonObject(catalog, Catalog.TYPE, transformer, bNodeService))
                    .collect(Collectors.toList()));
            return Response.ok(array).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getCatalog(String catalogId) {
        try {
            Resource catalogIri = vf.createIRI(catalogId);
            if (catalogIri.equals(catalogManager.getLocalCatalogIRI())) {
                return Response.ok(thingToSkolemizedJsonObject(catalogManager.getLocalCatalog(),
                        Catalog.TYPE, transformer, bNodeService)).build();
            } else if (catalogIri.equals(catalogManager.getDistributedCatalogIRI())) {
                return Response.ok(thingToSkolemizedJsonObject(catalogManager.getDistributedCatalog(),
                        Catalog.TYPE, transformer, bNodeService)).build();
            } else {
                throw ErrorUtils.sendError("Catalog " + catalogId + " does not exist", Response.Status.NOT_FOUND);
            }
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getRecords(UriInfo uriInfo, String catalogId, String sort, String recordType, int offset, int limit,
                               boolean asc, String searchText) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder().offset(offset).ascending(asc);

            if (limit > 0) {
                builder.limit(limit);
            }
            if (sort != null) {
                builder.sortBy(vf.createIRI(sort));
            }
            if (recordType != null) {
                builder.typeFilter(vf.createIRI(recordType));
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }

            PaginatedSearchResults<Record> records = catalogManager.findRecord(vf.createIRI(catalogId),
                    builder.build());

            return createPaginatedResponse(uriInfo, records.getPage(), records.getTotalSize(), limit, offset,
                    Record.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @ActionAttributes(
            @AttributeValue(id = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", value = "type",
                    type = ValueType.BODY))
    @ResourceId(id = "catalogId", type = ValueType.PATH)
    public Response createRecord(ContainerRequestContext context, String catalogId, String typeIRI, String title,
                                 String identifierIRI, String description, List<FormDataBodyPart> keywords) {
        checkStringParam(title, "Record title is required");
        Map<String, OrmFactory<? extends Record>> recordFactories = getRecordFactories();
        if (typeIRI == null || !recordFactories.keySet().contains(typeIRI)) {
            throw ErrorUtils.sendError("Invalid Record type", Response.Status.BAD_REQUEST);
        }
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            RecordConfig.Builder builder = new RecordConfig.Builder(title, Collections.singleton(activeUser));
            if (identifierIRI != null) {
                builder.identifier(identifierIRI);
            }
            if (description != null) {
                builder.description(description);
            }
            if (keywords != null) {
                builder.keywords(keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet()));
            }

            Record newRecord = catalogManager.createRecord(builder.build(), recordFactories.get(typeIRI));
            catalogManager.addRecord(vf.createIRI(catalogId), newRecord);
            provUtils.endCreateActivity(createActivity, newRecord.getResource());
            return Response.status(201).entity(newRecord.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
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
    public Response getRecord(String catalogId, String recordId) {
        try {
            Record record = catalogManager.getRecord(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Record " + recordId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(record, Record.TYPE, transformer, bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteRecord(ContainerRequestContext context, String catalogId, String recordId) {
        User activeUser = getActiveUser(context, engineManager);
        IRI recordIri = vf.createIRI(recordId);
        DeleteActivity deleteActivity = null;
        try {
            deleteActivity = provUtils.startDeleteActivity(activeUser, recordIri);
            Record record = catalogManager.removeRecord(vf.createIRI(catalogId), recordIri,
                    factoryRegistry.getFactoryOfType(Record.class).get());
            provUtils.endDeleteActivity(deleteActivity, record);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateRecord(String catalogId, String recordId, String newRecordJson) {
        try {
            Record newRecord = getNewThing(newRecordJson, vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get());
            catalogManager.updateRecord(vf.createIRI(catalogId), newRecord);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getUnversionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String sort,
                                                int offset, int limit, boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = catalogManager.getUnversionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId));
            return createPaginatedThingResponse(uriInfo, distributions, vf.createIRI(sort), SORT_RESOURCES, offset,
                    limit, asc, null,
                    Distribution.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createUnversionedDistribution(ContainerRequestContext context, String catalogId, String recordId,
                                                  String title, String description, String format, String accessURL,
                                                  String downloadURL) {
        try {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    context);
            catalogManager.addUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId), newDistribution);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        try {
            Distribution distribution = catalogManager.getUnversionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(distributionId)).orElseThrow(() ->
                    ErrorUtils.sendError("Distribution " + distributionId + " could not be found",
                            Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(distribution, Distribution.TYPE, transformer, bNodeService))
                    .build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        try {
            catalogManager.removeUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(distributionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateUnversionedDistribution(String catalogId, String recordId, String distributionId,
                                                  String newDistributionJson) {
        try {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            catalogManager.updateUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    newDistribution);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getVersions(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset,
                                int limit, boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Version> versions = catalogManager.getVersions(vf.createIRI(catalogId), vf.createIRI(recordId));
            return createPaginatedThingResponse(uriInfo, versions, vf.createIRI(sort), SORT_RESOURCES, offset, limit,
                    asc, null, Version.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createVersion(ContainerRequestContext context, String catalogId, String recordId, String typeIRI,
                                  String title, String description) {
        try {
            checkStringParam(title, "Version title is required");
            Map<String, OrmFactory<? extends Version>> versionFactories = getVersionFactories();
            if (typeIRI == null || !versionFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Version type", Response.Status.BAD_REQUEST);
            }

            Version newVersion = catalogManager.createVersion(title, description, versionFactories.get(typeIRI));
            newVersion.setProperty(getActiveUser(context, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            catalogManager.addVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion);
            return Response.status(201).entity(newVersion.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getLatestVersion(String catalogId, String recordId) {
        try {
            Version version = catalogManager.getLatestVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Version.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Latest Version could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(version, Version.TYPE, transformer, bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getVersion(String catalogId, String recordId, String versionId) {
        try {
            Version version = catalogManager.getVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), factoryRegistry.getFactoryOfType(Version.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Version " + versionId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(version, Version.TYPE, transformer, bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteVersion(String catalogId, String recordId, String versionId) {
        try {
            catalogManager.removeVersion(vf.createIRI(catalogId), vf.createIRI(recordId), vf.createIRI(versionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateVersion(String catalogId, String recordId, String versionId, String newVersionJson) {
        try {
            Version newVersion = getNewThing(newVersionJson, vf.createIRI(versionId),
                    factoryRegistry.getFactoryOfType(Version.class).get());
            catalogManager.updateVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getVersionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String versionId,
                                              String sort, int offset, int limit, boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = catalogManager.getVersionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId));
            return createPaginatedThingResponse(uriInfo, distributions, vf.createIRI(sort), SORT_RESOURCES, offset,
                    limit, asc, null,
                    Distribution.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createVersionedDistribution(ContainerRequestContext context, String catalogId, String recordId,
                                                String versionId, String title, String description, String format,
                                                String accessURL, String downloadURL) {
        try {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    context);
            catalogManager.addVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getVersionedDistribution(String catalogId, String recordId, String versionId,
                                             String distributionId) {
        try {
            Distribution distribution = catalogManager.getVersionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId), vf.createIRI(distributionId)).orElseThrow(() ->
                    ErrorUtils.sendError("Distribution " + distributionId + " could not be found",
                            Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(distribution, Distribution.TYPE, transformer, bNodeService))
                    .build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteVersionedDistribution(String catalogId, String recordId, String versionId,
                                                String distributionId) {
        try {
            catalogManager.removeVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), vf.createIRI(distributionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateVersionedDistribution(String catalogId, String recordId, String versionId,
                                                String distributionId, String newDistributionJson) {
        try {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            catalogManager.updateVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getVersionCommit(String catalogId, String recordId, String versionId, String format) {
        long start = System.currentTimeMillis();
        try {
            Commit commit = catalogManager.getTaggedCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId));
            return createCommitResponse(commit, catalogManager.getCommitDifference(commit.getResource()), format,
                    transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getVersionCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Response getBranches(ContainerRequestContext context, UriInfo uriInfo, String catalogId, String recordId,
                                String sort, int offset, int limit, boolean asc, boolean applyUserFilter) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Branch> branches = catalogManager.getBranches(vf.createIRI(catalogId), vf.createIRI(recordId));
            Function<Branch, Boolean> filterFunction = null;
            if (applyUserFilter) {
                User activeUser = getActiveUser(context, engineManager);
                filterFunction = branch -> {
                    Set<String> types = branch.getProperties(vf.createIRI(RDF.TYPE.stringValue())).stream()
                            .map(Value::stringValue)
                            .collect(Collectors.toSet());
                    return !types.contains(UserBranch.TYPE)
                           || branch.getProperty(vf.createIRI(DCTERMS.PUBLISHER.stringValue())).get()
                                    .stringValue().equals(activeUser.getResource().stringValue());
                };
            }
            return createPaginatedThingResponse(uriInfo, branches, vf.createIRI(sort), SORT_RESOURCES, offset, limit,
                    asc, filterFunction,
                    Branch.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createBranch(ContainerRequestContext context, String catalogId, String recordId,
                                 String typeIRI, String title, String description) {
        try {
            checkStringParam(title, "Branch title is required");
            Map<String, OrmFactory<? extends Branch>> branchFactories = getBranchFactories();
            if (typeIRI == null || !branchFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Branch type", Response.Status.BAD_REQUEST);
            }

            Branch newBranch = catalogManager.createBranch(title, description, branchFactories.get(typeIRI));
            newBranch.setProperty(getActiveUser(context, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            catalogManager.addBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch);
            return Response.status(201).entity(newBranch.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getMasterBranch(String catalogId, String recordId) {
        try {
            Branch masterBranch = catalogManager.getMasterBranch(vf.createIRI(catalogId), vf.createIRI(recordId));
            return Response.ok(thingToSkolemizedJsonObject(masterBranch, Branch.TYPE, transformer, bNodeService))
                    .build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getBranch(String catalogId, String recordId, String branchId) {
        try {
            Branch branch = catalogManager.getBranch(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), factoryRegistry.getFactoryOfType(Branch.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Branch " + branchId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedJsonObject(branch, Branch.TYPE, transformer, bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteBranch(String catalogId, String recordId, String branchId) {
        try {
            catalogManager.removeBranch(vf.createIRI(catalogId), vf.createIRI(recordId), vf.createIRI(branchId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateBranch(String catalogId, String recordId, String branchId, String newBranchJson) {
        try {
            Branch newBranch = getNewThing(newBranchJson, vf.createIRI(branchId),
                    factoryRegistry.getFactoryOfType(Branch.class).get());
            catalogManager.updateBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getCommitChain(UriInfo uriInfo, String catalogId, String recordId, String branchId, String targetId,
                                   int offset, int limit) {
        LinksUtils.validateParams(limit, offset);

        try {
            JSONArray commitChain = new JSONArray();

            final List<Commit> commits;
            if (StringUtils.isBlank(targetId)) {
                commits = catalogManager.getCommitChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId));
            } else {
                commits = catalogManager.getCommitChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId), vf.createIRI(targetId));
            }
            Stream<Commit> result = commits.stream();
            if (limit > 0) {
                result = result.skip(offset)
                        .limit(limit);
            }
            result.map(r -> createCommitJson(r, vf, engineManager)).forEach(commitChain::add);
            return createPaginatedResponseWithJson(uriInfo, commitChain, commits.size(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createBranchCommit(ContainerRequestContext context, String catalogId, String recordId,
                                       String branchId, String message) {
        try {
            checkStringParam(message, "Commit message is required");
            User activeUser = getActiveUser(context, engineManager);
            Resource newCommitId = versioningManager.commit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), activeUser, message);
            return Response.status(201).entity(newCommitId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getHead(String catalogId, String recordId, String branchId, String format) {
        long start = System.currentTimeMillis();
        try {
            Commit headCommit = catalogManager.getHeadCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId));
            return createCommitResponse(headCommit, catalogManager.getCommitDifference(headCommit.getResource()), format,
                    transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getHead took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Response getBranchCommit(String catalogId, String recordId, String branchId, String commitId,
                                    String format) {
        long start = System.currentTimeMillis();
        try {
            Commit commit = catalogManager.getCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), vf.createIRI(commitId)).orElseThrow(() ->
                    ErrorUtils.sendError("Commit " + commitId + " could not be found", Response.Status.NOT_FOUND));
            return createCommitResponse(commit, catalogManager.getCommitDifference(commit.getResource()), format,
                    transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getBranchCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Response getDifference(String catalogId, String recordId, String branchId, String targetBranchId,
                                  String rdfFormat) {
        try {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Commit sourceHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(branchId));
            Commit targetHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(targetBranchId));
            Difference diff = catalogManager.getDifference(sourceHead.getResource(), targetHead.getResource());
            return Response.ok(getDifferenceJsonString(diff, rdfFormat, transformer, bNodeService),
                    MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getConflicts(String catalogId, String recordId, String branchId, String targetBranchId,
                                 String rdfFormat) {
        try {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Commit sourceHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(branchId));
            Commit targetHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(targetBranchId));
            Set<Conflict> conflicts = catalogManager.getConflicts(sourceHead.getResource(), targetHead.getResource());
            JSONArray array = new JSONArray();
            conflicts.stream()
                    .map(conflict -> conflictToJson(conflict, rdfFormat))
                    .forEach(array::add);
            return Response.ok(array).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response merge(ContainerRequestContext context, String catalogId, String recordId, String sourceBranchId,
                          String targetBranchId, String additionsJson, String deletionsJson) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            Resource newCommitId = versioningManager.merge(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(sourceBranchId), vf.createIRI(targetBranchId), activeUser, additions, deletions);
            return Response.ok(newCommitId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getCompiledResource(ContainerRequestContext context, String catalogId, String recordId,
                                        String branchId, String commitId, String rdfFormat, boolean apply) {
        try {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource commitIRI = vf.createIRI(commitId);
            catalogManager.getCommit(catalogIRI, recordIRI, vf.createIRI(branchId), commitIRI);
            Model resource = catalogManager.getCompiledResource(commitIRI);
            if (apply) {
                User activeUser = getActiveUser(context, engineManager);
                Optional<InProgressCommit> inProgressCommit = catalogManager.getInProgressCommit(catalogIRI, recordIRI,
                        activeUser);
                if (inProgressCommit.isPresent()) {
                    resource = catalogManager.applyInProgressCommit(inProgressCommit.get().getResource(), resource);
                }
            }
            return Response.ok(modelToSkolemizedString(resource, rdfFormat, transformer, bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response downloadCompiledResource(ContainerRequestContext context, String catalogId, String recordId,
                                             String branchId, String commitId, String rdfFormat, boolean apply,
                                             String fileName) {
        try {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource commitIRI = vf.createIRI(commitId);
            catalogManager.getCommit(catalogIRI, recordIRI, vf.createIRI(branchId), commitIRI);
            Model resource;
            Model temp = catalogManager.getCompiledResource(vf.createIRI(commitId));
            if (apply) {
                User activeUser = getActiveUser(context, engineManager);
                Optional<InProgressCommit> inProgressCommit = catalogManager.getInProgressCommit(catalogIRI, recordIRI,
                        activeUser);
                resource = inProgressCommit.map(inProgressCommit1 ->
                        catalogManager.applyInProgressCommit(inProgressCommit1.getResource(), temp)).orElse(temp);
            } else {
                resource = temp;
            }
            StreamingOutput stream = os -> {
                try (Writer writer = new BufferedWriter(new OutputStreamWriter(os))) {
                    writer.write(modelToSkolemizedString(resource, rdfFormat, transformer, bNodeService));
                    writer.flush();
                }
            };

            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                                                                     + "." + getRDFFormatFileExtension(rdfFormat))
                    .header("Content-Type", getRDFFormatMimeType(rdfFormat)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(activeUser);
            catalogManager.addInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), inProgressCommit);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                        String format) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            InProgressCommit inProgressCommit = catalogManager.getInProgressCommit(vf.createIRI(catalogId),
                    vf.createIRI(recordId), activeUser).orElseThrow(() ->
                    ErrorUtils.sendError("InProgressCommit could not be found", Response.Status.NOT_FOUND));
            return Response.ok(getCommitDifferenceObject(inProgressCommit.getResource(), format),
                    MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response deleteInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            catalogManager.removeInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response updateInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                           String additionsJson, String deletionsJson) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            catalogManager.updateInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser,
                    additions, deletions);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response getRecordTypes() {
        try {
            return Response.ok(JSONArray.fromObject(getRecordFactories().keySet())).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getSortOptions() {
        try {
            return Response.ok(JSONArray.fromObject(SORT_RESOURCES)).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format of the Commit with the specified
     * id. Key "additions" has value of the Commit's addition statements and key "deletions" has value of the Commit's
     * deletion statements.
     *
     * @param commitId The id of the Commit to retrieve the Difference of.
     * @param format   A string representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Commit's addition statements and a key for the Commit's deletion
     *         statements.
     */
    private JSONObject getCommitDifferenceObject(Resource commitId, String format) {
        long start = System.currentTimeMillis();
        try {
            return getDifferenceJson(catalogManager.getCommitDifference(commitId), format);
        } finally {
            LOG.trace("getCommitDifferenceObject took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format. Key "additions" has value of the
     * Difference's addition statements and key "deletions" has value of the Difference's deletion statements.
     *
     * @param difference The Difference to convert into a JSONObject.
     * @param format     A String representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Difference's addition statements and a key for the Difference's deletion
     *         statements.
     */
    private JSONObject getDifferenceJson(Difference difference, String format) {
        long start = System.currentTimeMillis();
        try {
            return new JSONObject().element("additions", modelToSkolemizedString(difference.getAdditions(), format,
                    transformer, bNodeService))
                    .element("deletions", modelToSkolemizedString(difference.getDeletions(), format, transformer,
                            bNodeService));
        } finally {
            LOG.trace("getDifferenceJson took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a Distribution object using the provided metadata strings. If the title is null, throws a 400 Response.
     *
     * @param title       The required title for the new Distribution.
     * @param description The optional description for the new Distribution.
     * @param format      The optional format string for the new Distribution.
     * @param accessURL   The optional access URL for the new Distribution.
     * @param downloadURL The optional download URL for the Distribution.
     *
     * @return The new Distribution if passed a title.
     */
    private Distribution createDistribution(String title, String description, String format, String accessURL,
                                            String downloadURL, ContainerRequestContext context) {
        checkStringParam(title, "Distribution title is required");
        DistributionConfig.Builder builder = new DistributionConfig.Builder(title);
        if (description != null) {
            builder.description(description);
        }
        if (format != null) {
            builder.format(format);
        }
        if (accessURL != null) {
            builder.accessURL(vf.createIRI(accessURL));
        }
        if (downloadURL != null) {
            builder.downloadURL(vf.createIRI(downloadURL));
        }
        Distribution distribution = catalogManager.createDistribution(builder.build());
        distribution.setProperty(getActiveUser(context, engineManager).getResource(),
                vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        return distribution;
    }

    /**
     * Attempts to retrieve a new Thing from the passed JSON-LD string based on the type of the passed OrmFactory. If
     * the passed JSON-LD does not contain the passed ID Resource defined as the correct type, throws a 400 Response.
     *
     * @param newThingJson The JSON-LD of the new Thing.
     * @param thingId      The ID Resource to confirm.
     * @param factory      The OrmFactory to use when creating the new Thing.
     * @param <T>          A class that extends Thing.
     *
     * @return The new Thing if the JSON-LD contains the correct ID Resource; throws a 400 otherwise.
     */
    private <T extends Thing> T getNewThing(String newThingJson, Resource thingId, OrmFactory<T> factory) {
        Model newThingModel = convertJsonld(newThingJson);
        return factory.getExisting(thingId, newThingModel).orElseThrow(() ->
                ErrorUtils.sendError(factory.getTypeIRI().getLocalName() + " IDs must match",
                        Response.Status.BAD_REQUEST));
    }

    /**
     * Creates a JSONObject representing the provided Conflict in the provided RDF format. Key "original" has value of
     * the serialized original Model of a conflict, key "left" has a value of an object with the additions and
     *
     * @param conflict  The Conflict to turn into a JSONObject
     * @param rdfFormat A string representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Conflict's original Model, a key for the Conflict's left Difference, and
     *         a key for the Conflict's right Difference.
     */
    private JSONObject conflictToJson(Conflict conflict, String rdfFormat) {
        JSONObject object = new JSONObject();
        object.put("iri", conflict.getIRI().stringValue());
        object.put("left", getDifferenceJson(conflict.getLeftDifference(), rdfFormat));
        object.put("right", getDifferenceJson(conflict.getRightDifference(), rdfFormat));
        return object;
    }

    /**
     * Converts a JSON-LD string into a Model.
     *
     * @param jsonld The string of JSON-LD to convert.
     *
     * @return A Model containing the statements from the JSON-LD string.
     */
    private Model convertJsonld(String jsonld) {
        return jsonldToDeskolemizedModel(jsonld, transformer, bNodeService);
    }

    private Map<String, OrmFactory<? extends Record>> getRecordFactories() {
        return getThingFactories(Record.class);
    }

    private Map<String, OrmFactory<? extends Version>> getVersionFactories() {
        return getThingFactories(Version.class);
    }

    private Map<String, OrmFactory<? extends Branch>> getBranchFactories() {
        return getThingFactories(Branch.class);
    }

    private <T extends Thing> Map<String, OrmFactory<? extends T>> getThingFactories(Class<T> clazz) {
        Map<String, OrmFactory<? extends T>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(clazz).forEach(factory ->
                factoryMap.put(factory.getTypeIRI().stringValue(), factory));
        return factoryMap;
    }
}
