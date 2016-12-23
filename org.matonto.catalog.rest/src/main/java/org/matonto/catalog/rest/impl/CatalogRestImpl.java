package org.matonto.catalog.rest.impl;

/*-
 * #%L
 * org.matonto.catalog.rest
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
import static org.matonto.rest.util.RestUtils.getRDFFormatFileExtension;
import static org.matonto.rest.util.RestUtils.getRDFFormatMimeType;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.apache.commons.lang3.StringUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.DatasetRecord;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.MappingRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.Tag;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.engines.RdfEngine;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.LinksUtils;
import org.matonto.rest.util.jaxb.Links;
import org.matonto.web.security.util.AuthenticationProps;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
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
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {
    protected EngineManager engineManager;
    private SesameTransformer transformer;
    private CatalogManager catalogManager;
    private ValueFactory factory;
    protected Map<String, OrmFactory<? extends Record>> recordFactories = new HashMap<>();
    protected Map<String, OrmFactory<? extends Version>> versionFactories = new HashMap<>();
    protected Map<String, OrmFactory<? extends Branch>> branchFactories = new HashMap<>();
    protected DistributionFactory distributionFactory;
    protected CommitFactory commitFactory;
    protected InProgressCommitFactory inProgressCommitFactory;

    private static final Set<String> SORT_RESOURCES;

    static {
        Set<String> sortResources = new HashSet<>();
        sortResources.add(DCTERMS.MODIFIED.stringValue());
        sortResources.add(DCTERMS.ISSUED.stringValue());
        sortResources.add(DCTERMS.TITLE.stringValue());
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Record> void addRecordFactory(OrmFactory<T> factory) {
        if (Record.class.isAssignableFrom(factory.getType())) {
            recordFactories.put(factory.getTypeIRI().stringValue(), factory);
        }
    }

    protected <T extends Record> void removeRecordFactory(OrmFactory<T> factory) {
        recordFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Version> void addVersionFactory(OrmFactory<T> factory) {
        if (Version.class.isAssignableFrom(factory.getType())) {
            versionFactories.put(factory.getTypeIRI().stringValue(), factory);
        }
    }

    protected <T extends Version> void removeVersionFactory(OrmFactory<T> factory) {
        versionFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Branch> void addBranchFactory(OrmFactory<T> factory) {
        if (Branch.class.isAssignableFrom(factory.getType())) {
            branchFactories.put(factory.getTypeIRI().stringValue(), factory);
        }
    }

    protected <T extends Branch> void removeBranchFactory(OrmFactory<T> factory) {
        branchFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference
    protected void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
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

            JSONArray array = JSONArray.fromObject(catalogs.stream().map(this::thingToJsonObject)
                    .collect(Collectors.toList()));
            return Response.ok(array).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getCatalog(String catalogId) {
        try {
            Catalog localCatalog = catalogManager.getLocalCatalog();
            Catalog distributedCatalog = catalogManager.getDistributedCatalog();
            Resource catalogIri = factory.createIRI(catalogId);
            if (catalogIri.equals(localCatalog.getResource())) {
                return Response.ok(thingToJsonObject(localCatalog)).build();
            } else if (catalogIri.equals(distributedCatalog.getResource())) {
                return Response.ok(thingToJsonObject(distributedCatalog)).build();
            } else {
                throw ErrorUtils.sendError("Catalog does not exist with id " + catalogId, Response.Status.BAD_REQUEST);
            }
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getRecords(UriInfo uriInfo, String catalogId, String sort, String recordType, int offset, int limit,
                               boolean asc, String searchText) {
        try {
            validatePaginationParams(sort, offset, limit);
            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder(limit, offset,
                    factory.createIRI(sort)).ascending(asc);
            if (recordType != null) {
                builder.typeFilter(factory.createIRI(recordType));
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }
            PaginatedSearchResults<Record> records = catalogManager.findRecord(factory.createIRI(catalogId),
                    builder.build());
            return createPaginatedResponse(uriInfo, records.getPage(), records.getTotalSize(), limit, offset);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createRecord(ContainerRequestContext context, String catalogId, String typeIRI, String title,
                                 String identifierIRI, String description, String keywords) {
        try {
            if (typeIRI == null || !recordFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Record type", Response.Status.BAD_REQUEST);
            }
            if (title == null) {
                throw ErrorUtils.sendError("Record title is required", Response.Status.BAD_REQUEST);
            }
            if (identifierIRI == null) {
                throw ErrorUtils.sendError("Record identifier is required", Response.Status.BAD_REQUEST);
            }

            User activeUser = getActiveUser(context);
            RecordConfig.Builder builder = new RecordConfig.Builder(title, identifierIRI,
                    Collections.singleton(activeUser));
            if (description != null) {
                builder.description(description);
            }
            if (keywords != null && !keywords.isEmpty()) {
                builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
            }

            Record newRecord = catalogManager.createRecord(builder.build(), recordFactories.get(typeIRI));
            catalogManager.addRecord(factory.createIRI(catalogId), newRecord);
            if (typeIRI.equals(VersionedRDFRecord.TYPE) || typeIRI.equals(OntologyRecord.TYPE)
                    || typeIRI.equals(MappingRecord.TYPE) || typeIRI.equals(DatasetRecord.TYPE)) {
                catalogManager.addMasterBranch(newRecord.getResource());
            }
            return Response.ok(newRecord.getResource().stringValue()).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getRecord(String catalogId, String recordId) {
        try {
            Record record = getRecord(factory.createIRI(catalogId), factory.createIRI(recordId));
            return Response.ok(thingToJsonObject(record)).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a Record or subclass of Record based on the passed type IRI identified by the passed ID strings.
     * Throws a 400 Response if it could not be found.
     *
     * @param catalogId The ID string of the Catalog to retrieve the Record from.
     * @param recordId The ID string of the Record to retrieve.
     * @param recordType The IRI string of the Record class or subclass.
     * @param <T> A class that extends Record.
     * @return The Record or subclass of a Record identified by the passed ID strings.
     */
    private <T extends Record> T getRecord(String catalogId, String recordId, String recordType) {
        return getRecord(factory.createIRI(catalogId), factory.createIRI(recordId), recordType);
    }

    /**
     * Retrieves a Record or subclass of Record based on the passed type IRI identified by the passed ID Resources.
     * Throws a 400 Response if it could not be found.
     *
     * @param catalogId The ID Resource of the Catalog to retrieve the Record from.
     * @param recordId The ID Resource of the Record to retrieve.
     * @param recordType The IRI string of the Record class or subclass.
     * @param <T> A class that extends Record.
     * @return The Record or subclass of a Record identified by the passed ID Resources.
     */
    private <T extends Record> T getRecord(Resource catalogId, Resource recordId, String recordType) {
        OrmFactory<T> recordFactory = (OrmFactory<T>) recordFactories.get(recordType);
        return catalogManager.getRecord(catalogId, recordId, recordFactory).orElseThrow(() ->
                ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Retrieves a Record identified by the passed ID Resources. Throws a 400 Response if it could not be found.
     *
     * @param catalogId The ID Resource of the Catalog to retrieve the Record from.
     * @param recordId The ID Resource of the Record to retrieve.
     * @return The Record identified by the passed ID Resources.
     */
    private Record getRecord(Resource catalogId, Resource recordId) {
        return catalogManager.getRecord(catalogId, recordId, recordFactories.get(Record.TYPE)).orElseThrow(() ->
                ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
    }

    @Override
    public Response deleteRecord(String catalogId, String recordId) {
        try {
            catalogManager.removeRecord(factory.createIRI(catalogId), factory.createIRI(recordId));
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateRecord(String catalogId, String recordId, String newRecordJson) {
        try {
            Record newRecord = validateNewThing(newRecordJson, factory.createIRI(recordId),
                    recordFactories.get(Record.TYPE));
            catalogManager.updateRecord(factory.createIRI(catalogId), newRecord);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getUnversionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String sort,
                                                int offset, int limit, boolean asc) {
        try {
            validatePaginationParams(sort, offset, limit);
            UnversionedRecord record = getRecord(catalogId, recordId, UnversionedRecord.TYPE);
            Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                    .map(Thing::getResource)
                    .collect(Collectors.toSet());
            List<Distribution> distributions = getSortedThingPage(distributionIRIs, this::getDistribution, sort,
                    offset, limit, asc);
            return createPaginatedResponse(uriInfo, distributions, distributionIRIs.size(), limit, offset);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createUnversionedDistribution(String catalogId, String recordId, String title, String description,
                                                  String format, String accessURL, String downloadURL) {
        try {
            recordInCatalog(catalogId, recordId);
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL);
            catalogManager.addDistributionToUnversionedRecord(newDistribution, factory.createIRI(recordId));
            return Response.ok(newDistribution.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        try {
            Distribution distribution = testUnversionedDistributionPath(catalogId, recordId, distributionId);
            return Response.ok(thingToJsonObject(distribution)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response deleteUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        try {
            recordInCatalog(catalogId, recordId);
            catalogManager.removeDistributionFromUnversionedRecord(factory.createIRI(distributionId),
                    factory.createIRI(recordId));
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateUnversionedDistribution(String catalogId, String recordId, String distributionId, 
                                                  String newDistributionJson) {
        try {
            testUnversionedDistributionPath(catalogId, recordId, distributionId);
            updateDistribution(newDistributionJson, distributionId);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getVersions(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset,
                                int limit, boolean asc) {
        try {
            validatePaginationParams(sort, offset, limit);
            VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
            Set<Resource> versionIRIs = record.getVersion().stream()
                    .map(Thing::getResource)
                    .collect(Collectors.toSet());
            List<Version> versions = getSortedThingPage(versionIRIs, this::getVersion, sort, offset, limit, asc);
            return createPaginatedResponse(uriInfo, versions, versionIRIs.size(), limit, offset);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createVersion(String catalogId, String recordId, String typeIRI, String title, String description) {
        try {
            recordInCatalog(catalogId, recordId);
            if (typeIRI == null || !versionFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Version type", Response.Status.BAD_REQUEST);
            }
            if (title == null) {
                throw ErrorUtils.sendError("Version title is required", Response.Status.BAD_REQUEST);
            }

            Version newVersion = catalogManager.createVersion(title, description, versionFactories.get(typeIRI));
            catalogManager.addVersion(newVersion, factory.createIRI(recordId));
            return Response.ok(newVersion.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getLatestVersion(String catalogId, String recordId) {
        try {
            VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
            Resource versionIRI = record.getLatestVersion().orElseThrow(() ->
                    ErrorUtils.sendError("Record does not have a latest version", Response.Status.BAD_REQUEST))
                    .getResource();
            Version version = getVersion(versionIRI);
            return Response.ok(thingToJsonObject(version)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getVersion(String catalogId, String recordId, String versionId) {
        try {
            Version version = testVersionPath(catalogId, recordId, versionId);
            return Response.ok(thingToJsonObject(version)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a Version or subclass of Version based on the passed type IRI identified by the passed ID string.
     * Throws a 400 Response if it could not be found.
     *
     * @param versionId The ID string of the Version to retrieve.
     * @param versionType The IRI string of the Version class or subclass.
     * @param <T> A class that extends Version.
     * @return The Version or subclass of a Version identified by the passed ID string.
     */
    private <T extends Version> T getVersion(String versionId, String versionType) {
        return getVersion(factory.createIRI(versionId), versionType);
    }

    /**
     * Retrieves a Version or subclass of Version based on the passed type IRI identified by the passed ID Resource.
     * Throws a 400 Response if it could not be found.
     *
     * @param versionId The ID Resource of the Version to retrieve.
     * @param versionType The IRI string of the Version class or subclass.
     * @param <T> A class that extends Version.
     * @return The Version or subclass of a Version identified by the passed ID Resource.
     */
    private <T extends Version> T getVersion(Resource versionId, String versionType) {
        OrmFactory<T> versionFactory = (OrmFactory<T>) versionFactories.get(versionType);
        return catalogManager.getVersion(versionId, versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Retrieves a Version identified by the passed ID string. Throws a 400 Response if it could not be found.
     *
     * @param versionId The ID string of the Version to retrieve.
     * @return The Version identified by the passed ID string.
     */
    private Version getVersion(String versionId) {
        return getVersion(factory.createIRI(versionId));
    }

    /**
     * Retrieves a Version identified by the passed ID Resource. Throws a 400 Response if it could not be found.
     *
     * @param versionId The ID Resource of the Version to retrieve.
     * @return The Version identified by the passed ID Resource.
     */
    private Version getVersion(Resource versionId) {
        return catalogManager.getVersion(versionId, versionFactories.get(Version.TYPE))
                .orElseThrow(() -> ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
    }

    @Override
    public Response deleteVersion(String catalogId, String recordId, String versionId) {
        try {
            recordInCatalog(catalogId, recordId);
            catalogManager.removeVersion(factory.createIRI(versionId), factory.createIRI(recordId));
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateVersion(String catalogId, String recordId, String versionId, String newVersionJson) {
        try {
            testVersionPath(catalogId, recordId, versionId);
            Version newVersion = validateNewThing(newVersionJson, factory.createIRI(versionId),
                    versionFactories.get(Version.TYPE));
            catalogManager.updateVersion(newVersion);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getVersionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String versionId,
                                              String sort, int offset, int limit, boolean asc) {
        try {
            validatePaginationParams(sort, offset, limit);
            Version version = testVersionPath(catalogId, recordId, versionId);
            Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                    .map(Thing::getResource)
                    .collect(Collectors.toSet());
            List<Distribution> distributions = getSortedThingPage(distributionIRIs, this::getDistribution, sort,
                    offset, limit, asc);
            return createPaginatedResponse(uriInfo, distributions, distributionIRIs.size(), limit, offset);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createVersionedDistribution(String catalogId, String recordId, String versionId, String title,
                                                String description, String format, String accessURL,
                                                String downloadURL) {
        try {
            testVersionPath(catalogId, recordId, versionId);
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL);
            catalogManager.addDistributionToVersion(newDistribution, factory.createIRI(versionId));
            return Response.ok(newDistribution.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getVersionedDistribution(String catalogId, String recordId, String versionId, 
                                             String distributionId) {
        try {
            Distribution distribution = testVersionedDistributionPath(catalogId, recordId, versionId, distributionId);
            return Response.ok(thingToJsonObject(distribution)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response deleteVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId) {
        try {
            testVersionPath(catalogId, recordId, versionId);
            catalogManager.removeDistributionFromVersion(factory.createIRI(distributionId),
                    factory.createIRI(versionId));
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId, String newDistributionJson) {
        try {
            testVersionedDistributionPath(catalogId, recordId, versionId, distributionId);
            updateDistribution(newDistributionJson, distributionId);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getVersionCommit(String catalogId, String recordId, String versionId, String format) {
        try {
            testVersionPath(catalogId, recordId, versionId);
            Tag version = getVersion(versionId, Tag.TYPE);
            Resource commitIRI = version.getCommit().orElseThrow(() ->
                    ErrorUtils.sendError("Tag does not have a commit set", Response.Status.BAD_GATEWAY)).getResource();
            Commit commit = catalogManager.getCommit(commitIRI, commitFactory).orElseThrow(() ->
                    ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
            return createCommitResponse(commit, format);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getBranches(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset, int limit,
                                boolean asc) {
        try {
            validatePaginationParams(sort, offset, limit);
            VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
            Set<Resource> branchIRIs = record.getBranch().stream()
                    .map(Thing::getResource)
                    .collect(Collectors.toSet());
            List<Branch> branches = getSortedThingPage(branchIRIs, this::getBranch, sort, offset, limit, asc);
            return createPaginatedResponse(uriInfo, branches, branchIRIs.size(), limit, offset);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createBranch(String catalogId, String recordId, String typeIRI, String title, String description) {
        try {
            recordInCatalog(catalogId, recordId);
            if (typeIRI == null || !branchFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Branch type", Response.Status.BAD_REQUEST);
            }
            if (title == null) {
                throw ErrorUtils.sendError("Branch title is required", Response.Status.BAD_REQUEST);
            }

            Branch newBranch = catalogManager.createBranch(title, description, branchFactories.get(typeIRI));
            catalogManager.addBranch(newBranch, factory.createIRI(recordId));
            return Response.ok(newBranch.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getMasterBranch(String catalogId, String recordId) {
        try {
            VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
            Resource branchIRI = record.getMasterBranch().orElseThrow(() ->
                    ErrorUtils.sendError("Record does not have a master branch set", Response.Status.BAD_REQUEST))
                    .getResource();
            Branch masterBranch = getBranch(branchIRI, Branch.TYPE);
            return Response.ok(thingToJsonObject(masterBranch)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getBranch(String catalogId, String recordId, String branchId) {
        try {
            Branch branch = testBranchPath(catalogId, recordId, branchId);
            return Response.ok(thingToJsonObject(branch)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a Branch or subclass of Branch based on the passed type IRI identified by the passed ID string.
     * Throws a 400 Response if it could not be found.
     *
     * @param branchId The ID string of the Branch to retrieve.
     * @param branchType The IRI string of the Branch class or subclass.
     * @param <T> A class that extends Branch
     * @return The Branch or subclass of a Branch identified by the passed ID string.
     */
    private <T extends Branch> T getBranch(String branchId, String branchType) {
        return getBranch(factory.createIRI(branchId), branchType);
    }

    /**
     * Retrieves a Branch or subclass of Branch based on the passed type IRI identified by the passed ID Resource.
     * Throws a 400 Response if it could not be found.
     *
     * @param branchId The ID Resource of the Branch to retrieve.
     * @param branchType The IRI string of the Branch class or subclass.
     * @param <T> A class that extends Branch
     * @return The Branch or subclass of a Branch identified by the passed ID Resource.
     */
    private <T extends Branch> T getBranch(Resource branchId, String branchType) {
        OrmFactory<T> branchFactory = (OrmFactory<T>) branchFactories.get(branchType);
        return catalogManager.getBranch(branchId, branchFactory).orElseThrow(() ->
                ErrorUtils.sendError("Branch not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Retrieves a Branch identified by the passed ID string. Throws a 400 Response if it could not be found.
     *
     * @param branchId The ID string of the Branch to retrieve.
     * @return The Branch identified by the passed ID string.
     */
    private Branch getBranch(String branchId) {
        return getBranch(factory.createIRI(branchId));
    }

    /**
     * Retrieves a Branch identified by the passed ID Resource. Throws a 400 Response if it could not be found.
     *
     * @param branchId The ID Resource of the Branch to retrieve.
     * @return The Branch identified by the passed ID Resource.
     */
    private Branch getBranch(Resource branchId) {
        return catalogManager.getBranch(branchId, branchFactories.get(Branch.TYPE)).orElseThrow(() ->
                ErrorUtils.sendError("Branch not found", Response.Status.BAD_REQUEST));
    }

    @Override
    public Response deleteBranch(String catalogId, String recordId, String branchId) {
        try {
            recordInCatalog(catalogId, recordId);
            catalogManager.removeBranch(factory.createIRI(branchId), factory.createIRI(recordId));
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateBranch(String catalogId, String recordId, String branchId, String newBranchJson) {
        try {
            testBranchPath(catalogId, recordId, branchId);
            Branch newBranch = validateNewThing(newBranchJson, factory.createIRI(branchId),
                    branchFactories.get(Branch.TYPE));
            catalogManager.updateBranch(newBranch);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getCommitChain(String catalogId, String recordId, String branchId) {
        try {
            Resource headIRI = getHeadCommitIRI(catalogId, recordId, branchId);
            JSONArray commitChain = new JSONArray();
            catalogManager.getCommitChain(headIRI).stream()
                    .map(resource -> catalogManager.getCommit(resource, commitFactory))
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .map(this::thingToJsonld)
                    .forEach(commitChain::add);
            return Response.ok(commitChain).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createBranchCommit(ContainerRequestContext context, String catalogId, String recordId,
                                       String branchId, String message) {
        try {
            if (message == null) {
                throw ErrorUtils.sendError("Commit message is required", Response.Status.BAD_REQUEST);
            }
            Optional<Commit> headCommit = optHeadCommit(catalogId, recordId, branchId);
            Set<Commit> parents = headCommit.isPresent() ? Collections.singleton(headCommit.get()) : null;
            User activeUser = getActiveUser(context);
            Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                    factory.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
            InProgressCommit inProgressCommit = catalogManager.getCommit(inProgressCommitIRI, inProgressCommitFactory)
                    .orElseThrow(() -> ErrorUtils.sendError("InProgressCommit not found", Response.Status.BAD_REQUEST));
            Commit newCommit = catalogManager.createCommit(inProgressCommit, parents, message);
            catalogManager.addCommitToBranch(newCommit, factory.createIRI(branchId));
            catalogManager.removeInProgressCommit(inProgressCommitIRI);
            return Response.ok(newCommit.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getHead(String catalogId, String recordId, String branchId, String format) {
        try {
            Commit headCommit = getHeadCommit(catalogId, recordId, branchId);
            return createCommitResponse(headCommit, format);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getBranchCommit(String catalogId, String recordId, String branchId, String commitId,
                                    String format) {
        try {
            commitInBranch(catalogId, recordId, branchId, commitId);
            Commit commit = catalogManager.getCommit(factory.createIRI(commitId), commitFactory).orElseThrow(() ->
                    ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
            return createCommitResponse(commit, format);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getConflicts(String catalogId, String recordId, String branchId, String targetBranchId,
                                 String rdfFormat) {

        try {
            Resource sourceHeadIRI = getHeadCommitIRI(catalogId, recordId, branchId);
            Resource targetHeadIRI = getHeadCommitIRI(catalogId, recordId, targetBranchId);
            Set<Conflict> conflicts = catalogManager.getConflicts(sourceHeadIRI, targetHeadIRI);
            JSONArray array = new JSONArray();
            conflicts.stream()
                    .map(conflict -> conflictToJson(conflict, rdfFormat))
                    .forEach(array::add);
            return Response.ok(array).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response merge(ContainerRequestContext context, String catalogId, String recordId, String branchId,
                          String targetBranchId, String additionsJson, String deletionsJson) {
        try {
            final Commit sourceHead = getHeadCommit(catalogId, recordId, branchId);
            final Commit targetHead = getHeadCommit(catalogId, recordId, targetBranchId);
            User activeUser = getActiveUser(context);
            if (catalogManager.getInProgressCommitIRI(activeUser.getResource(), factory.createIRI(recordId))
                    .isPresent()) {
                throw ErrorUtils.sendError("User already has an InProgressCommit for Record " + recordId,
                        Response.Status.BAD_REQUEST);
            }
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(activeUser,
                    factory.createIRI(recordId));
            catalogManager.addInProgressCommit(inProgressCommit);
            if (additionsJson != null && !additionsJson.isEmpty()) {
                catalogManager.addAdditions(jsonldToModel(additionsJson), inProgressCommit.getResource());
            }
            if (deletionsJson != null && !deletionsJson.isEmpty()) {
                catalogManager.addDeletions(jsonldToModel(deletionsJson), inProgressCommit.getResource());
            }
            Commit newCommit = catalogManager.createCommit(inProgressCommit,
                    Stream.of(sourceHead, targetHead).collect(Collectors.toSet()),
                    getMergeMessage(branchId, targetBranchId));
            catalogManager.addCommitToBranch(newCommit, factory.createIRI(targetBranchId));
            catalogManager.removeInProgressCommit(inProgressCommit.getResource());
            return Response.ok(newCommit.getResource().stringValue()).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                        String branchId, String commitId, String rdfFormat, boolean apply) {
        try {
            commitInBranch(catalogId, recordId, branchId, commitId);
            Model resource = catalogManager.getCompiledResource(factory.createIRI(commitId)).orElseThrow(() ->
                    ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
            if (apply) {
                User activeUser = getActiveUser(context);
                Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                        factory.createIRI(recordId)).orElseThrow(() ->
                        ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
                resource = catalogManager.applyInProgressCommit(inProgressCommitIRI, resource);
            }
            return Response.ok(getModelInFormat(resource, rdfFormat)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response downloadCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                             String branchId, String commitId, String rdfFormat, boolean apply) {
        try {
            commitInBranch(catalogId, recordId, branchId, commitId);
            Model resource;
            Model temp = catalogManager.getCompiledResource(factory.createIRI(commitId)).orElseThrow(() ->
                    ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
            if (apply) {
                User activeUser = getActiveUser(context);
                Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                        factory.createIRI(recordId)).orElseThrow(() ->
                        ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
                resource = catalogManager.applyInProgressCommit(inProgressCommitIRI, temp);
            } else {
                resource = temp;
            }
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(getModelInFormat(resource, rdfFormat));
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + recordId
                    + "." + getRDFFormatFileExtension(rdfFormat))
                    .header("Content-Type", getRDFFormatMimeType(rdfFormat)).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response createInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        try {
            VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
            User activeUser = getActiveUser(context);
            if (catalogManager.getInProgressCommitIRI(activeUser.getResource(), record.getResource()).isPresent()) {
                throw ErrorUtils.sendError("User already has an InProgressCommit for Record " + recordId,
                        Response.Status.BAD_REQUEST);
            }
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(activeUser, record.getResource());
            catalogManager.addInProgressCommit(inProgressCommit);
            return Response.ok().build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                        String format) {
        try {
            recordInCatalog(catalogId, recordId);
            User activeUser = getActiveUser(context);
            Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                    factory.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
            JSONObject object = getCommitDifferenceObject(inProgressCommitIRI, format);
            return Response.ok(object).build();
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response deleteInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        try {
            recordInCatalog(catalogId, recordId);
            User activeUser = getActiveUser(context);
            Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                    factory.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
            catalogManager.removeInProgressCommit(inProgressCommitIRI);
            return Response.ok().build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateInProgressCommit(ContainerRequestContext context, String catalogId, String recordId, 
                                           String additionsJson, String deletionsJson) {
        try {
            recordInCatalog(catalogId, recordId);
            User activeUser = getActiveUser(context);
            Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                    factory.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
            if (additionsJson != null && !additionsJson.isEmpty()) {
                catalogManager.addAdditions(jsonldToModel(additionsJson), inProgressCommitIRI);
            }
            if (deletionsJson != null && !deletionsJson.isEmpty()) {
                catalogManager.addDeletions(jsonldToModel(deletionsJson), inProgressCommitIRI);
            }
            return Response.ok().build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getRecordTypes() {
        try {
            return Response.ok(JSONArray.fromObject(recordFactories.keySet())).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getSortOptions() {
        try {
            return Response.ok(JSONArray.fromObject(SORT_RESOURCES)).build();
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates a Response for a list of paginated Things based on the passed URI information, page of items, the total
     * number of Things, the limit for each page, and the offset for the current page. Sets the "X-Total-Count" header
     * to the total size and the "Links" header to the next and prev URLs if present.
     *
     * @param uriInfo The URI information of the request.
     * @param items The limited and sorted Collection of items for the current page
     * @param totalSize The total number of items.
     * @param limit The limit for each page.
     * @param offset The offset for the current page.
     * @param <T> A class that extends Thing
     * @return A Response with the current page of Things and headers for the total size and links to the next and prev
     *      pages if present.
     */
    private <T extends Thing> Response createPaginatedResponse(UriInfo uriInfo, Collection<T> items, int totalSize,
                                                               int limit, int offset) {
        Links links = LinksUtils.buildLinks(uriInfo, items.size(), totalSize, limit, offset);

        JSONArray results = JSONArray.fromObject(items.stream()
                .map(this::thingToJsonObject)
                .collect(Collectors.toList()));
        Response.ResponseBuilder response = Response.ok(results).header("X-Total-Count", totalSize);
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
    }

    /**
     * Creates a Response for a Commit and its addition and deletion statements in the specified format. The JSONObject
     * in the Response has key "commit" with value of the Commit's JSON-LD and the keys and values of the result of
     * getCommitDifferenceObject.
     *
     * @param commit The Commit to create a response for
     * @param format The RDF format to return the addition and deletion statements in.
     * @return A Response containing a JSONObject with the Commit JSON-LD and its addition and deletion statements
     */
    private Response createCommitResponse(Commit commit, String format) {
        JSONObject object = getCommitDifferenceObject(commit.getResource(), format);
        object.put("commit", thingToJsonld(commit));
        return Response.ok(object).build();
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format of the Commit with the specified
     * id. Key "additions" has value of the Commit's addition statements and key "deletions" has value of the Commit's
     * deletion statements.
     *
     * @param commitId The id of the Commit to retrieve the Difference of.
     * @param format A string representing the RDF format to return the statements in.
     * @return A JSONObject with a key for the Commit's addition statements and a key for the Commit's deletion
     *      statements.
     */
    private JSONObject getCommitDifferenceObject(Resource commitId, String format) {
        return getDifferenceJson(catalogManager.getCommitDifference(commitId), format);
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format. Key "additions" has value of the
     * Difference's addition statements and key "deletions" has value of the Difference's deletion statements.
     *
     * @param difference The Difference to convert into a JSONObject.
     * @param format A String representing the RDF format to return the statements in.
     * @return A JSONObject with a key for the Difference's addition statements and a key for the Difference's deletion
     *      statements.
     */
    private JSONObject getDifferenceJson(Difference difference, String format) {
        return new JSONObject().element("additions", getModelInFormat(difference.getAdditions(), format))
                .element("deletions", getModelInFormat(difference.getDeletions(), format));
    }

    /**
     * Attempts to retrieve a unversioned Distribution following the path of provided IDs for the Catalog, Record, and
     * Distribution. Throws a 400 Response if a part of the path is incorrect.
     *
     * @param catalogId The ID of the Catalog the Distribution should be part of.
     * @param recordId The ID of the Record the Distribution should be part of.
     * @param distributionId The ID of the Distribution to retrieve.
     * @return The Distribution if found.
     */
    private Distribution testUnversionedDistributionPath(String catalogId, String recordId, String distributionId) {
        UnversionedRecord record = getRecord(catalogId, recordId, UnversionedRecord.TYPE);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Record " + recordId,
                    Response.Status.BAD_REQUEST);
        }
        return getDistribution(distributionId);
    }

    /**
     * Attempts to retrieve a Version following the path of provided IDs for the Catalog, Record, and Version. Throws
     * a 400 Response if a part of the path is incorrect.
     *
     * @param catalogId The ID of the Catalog the Version should be part of.
     * @param recordId The ID of the Record the Version should be part of.
     * @param versionId The ID of the Version to retrieve.
     * @return The Version if found.
     */
    private Version testVersionPath(String catalogId, String recordId, String versionId) {
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        return getVersion(versionId);
    }

    /**
     * Attempts to retrieve a versioned Distribution following the path of provided IDs for the Catalog, Record,
     * Version, and Distribution. Throws a 400 Response if a part of the path is incorrect.
     *
     * @param catalogId The ID of the Catalog the Distribution should be part of.
     * @param recordId The ID of the Record the Distribution should be part of.
     * @param versionId The ID of the Version the Distribution should be part of.
     * @param distributionId The ID of the Distribution to retrieve.
     * @return The Distribution if found.
     */
    private Distribution testVersionedDistributionPath(String catalogId, String recordId, String versionId,
                                               String distributionId) {
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        Version version = getVersion(versionId);
        Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Version " + recordId,
                    Response.Status.BAD_REQUEST);
        }
        return getDistribution(distributionId);
    }

    /**
     * Attempts to retrieve a Branch following the path of provided IDs for the Catalog, Record, and Branch. Throws a
     * 400 Response if a part of the path is incorrect.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of.
     * @param branchId The ID of the Branch to retrieve.
     * @return The Branch if found.
     */
    private Branch testBranchPath(String catalogId, String recordId, String branchId) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
        Set<Resource> branchIRIs = record.getBranch().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!branchIRIs.contains(factory.createIRI(branchId))) {
            throw ErrorUtils.sendError("Branch does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        return getBranch(branchId, Branch.TYPE);
    }

    /**
     * Attempts to retrieve the Resource of the head Commit of a Branch identified by the provided IDs. If the head
     * Commit Resource could not be found, returns an empty Optional.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of
     * @param branchId The ID of the Branch to retrieve the head Commit Resource of.
     * @return The Resource of the head Commit if found; empty otherwise.
     */
    private Optional<Resource> optHeadCommitIRI(String catalogId, String recordId, String branchId) {
        Branch branch = testBranchPath(catalogId, recordId, branchId);
        Optional<Commit> optional = branch.getHead();
        if (optional.isPresent()) {
            return Optional.of(optional.get().getResource());
        } else {
            return Optional.empty();
        }
    }

    /**
     * Attempts to retrieve the Resource of the head Commit of a Branch identified by the provided IDs. If the head
     * Commit Resource could not be found, throws a 400 Response.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of
     * @param branchId The ID of the Branch to retrieve the head Commit Resource of.
     * @return The Resource of the head Commit if found; throws a 400 otherwise
     */
    private Resource getHeadCommitIRI(String catalogId, String recordId, String branchId) {
        return optHeadCommitIRI(catalogId, recordId, branchId).orElseThrow(() ->
                ErrorUtils.sendError("Branch does not have head Commit set", Response.Status.BAD_REQUEST));
    }

    /**
     * Attempts to retrieve the head Commit of a Branch identified by the provided IDs. If the head Commit could not be
     * found, returns an empty Optional.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of
     * @param branchId The ID of the Branch to retrieve the head Commit of.
     * @return The head Commit if found; empty otherwise.
     */
    private Optional<Commit> optHeadCommit(String catalogId, String recordId, String branchId) {
        Optional<Resource> iri = optHeadCommitIRI(catalogId, recordId, branchId);
        if (iri.isPresent()) {
            return catalogManager.getCommit(iri.get(), commitFactory);
        } else {
            return Optional.empty();
        }
    }

    /**
     * Attempts to retrieve the head Commit of a Branch identified by the provided IDs. If the head Commit could not be
     * found, throws a 400 Response.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of
     * @param branchId The ID of the Branch to retrieve the head Commit of.
     * @return The head Commit if found; throws a 400 otherwise.
     */
    private Commit getHeadCommit(String catalogId, String recordId, String branchId) {
        return optHeadCommit(catalogId, recordId, branchId).orElseThrow(() ->
                ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Tests whether the Commit identified by the provided ID is a part of the Branch identified by the provided
     * Catalog, Record, and Branch IDs. If not, throws a 400 Response.
     *
     * @param catalogId The ID of the Catalog the Branch should be part of.
     * @param recordId The ID of the Record the Branch should be part of.
     * @param branchId The ID of the Branch.
     * @param commitId The ID of the Commit to test.
     */
    private void commitInBranch(String catalogId, String recordId, String branchId, String commitId) {
        Resource headIRI = getHeadCommitIRI(catalogId, recordId, branchId);
        if (!catalogManager.getCommitChain(headIRI).contains(factory.createIRI(commitId))) {
            throw ErrorUtils.sendError("Commit does not belong to Branch " + branchId, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Tests whether the Record identified by the provided ID is in the Catalog identified by the provided ID. If not,
     * throws a 400 Response.
     *
     * @param catalogId The ID of the Catalog the Record should be part of.
     * @param recordId The ID of the Record.
     */
    private void recordInCatalog(String catalogId, String recordId) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the User associated with a Request. If the User cannot be found, throws a 400 Response.
     *
     * @param context The context of a Request.
     * @return The User who made the Request if found; throws a 400 otherwise.
     */
    private User getActiveUser(ContainerRequestContext context) {
        return engineManager.retrieveUser(RdfEngine.COMPONENT_NAME,
                context.getProperty(AuthenticationProps.USERNAME).toString()).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Validates the sort property IRI, offset, and limit parameters for pagination. The sort IRI string must be a valid
     * sort property. The offset must be greater than or equal to 0. The limit must be postitive. If any parameters are
     * invalid, throws a 400 Response.
     *
     * @param sortIRI The sort property string to test.
     * @param offset The offset for the paginated response.
     * @param limit The limit of the paginated response.
     */
    private void validatePaginationParams(String sortIRI, int offset, int limit) {
        if (!SORT_RESOURCES.contains(sortIRI)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        if (offset < 0) {
            throw ErrorUtils.sendError("Offset cannot be negative.", Response.Status.BAD_REQUEST);
        }
        if (limit <= 0) {
            throw ErrorUtils.sendError("Limit must be positive", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates a Distribution object using the provided metadata strings. If the title is null, throws a 400 Response.
     *
     * @param title The required title for the new Distribution.
     * @param description The optional description for the new Distribution.
     * @param format The optional format string for the new Distribution.
     * @param accessURL The optional access URL for the new Distribution.
     * @param downloadURL The optional download URL for the Distribution.
     * @return The new Distribution if passed a title.
     */
    private Distribution createDistribution(String title, String description, String format, String accessURL,
                                            String downloadURL) {
        if (title == null) {
            throw ErrorUtils.sendError("Distribution title is required", Response.Status.BAD_REQUEST);
        }
        DistributionConfig.Builder builder = new DistributionConfig.Builder(title);
        if (description != null) {
            builder.description(description);
        }
        if (format != null) {
            builder.format(format);
        }
        if (accessURL != null) {
            builder.accessURL(factory.createIRI(accessURL));
        }
        if (downloadURL != null) {
            builder.downloadURL(factory.createIRI(downloadURL));
        }
        return catalogManager.createDistribution(builder.build());
    }

    /**
     * Retrieves a Distribution identified by the passed ID string. Throws a 400 Response if it could not be found.
     *
     * @param distributionId The ID string of the Branch to retrieve.
     * @return The Distribution identified by the passed ID string.
     */
    private Distribution getDistribution(String distributionId) {
        return getDistribution(factory.createIRI(distributionId));
    }

    /**
     * Retrieves a Distribution identified by the passed ID Resource. Throws a 400 Response if it could not be found.
     *
     * @param distributionId The ID Resource of the Branch to retrieve.
     * @return The Distribution identified by the passed ID Resource.
     */
    private Distribution getDistribution(Resource distributionId) {
        return catalogManager.getDistribution(distributionId).orElseThrow(() ->
                ErrorUtils.sendError("Distribution not found", Response.Status.BAD_REQUEST));
    }

    /**
     * Updates the Distribution identified with the passed ID string with the new passed JSON-LD string.
     *
     * @param newDistributionJson The JSON-LD of the new Distribution.
     * @param distributionId The ID string of the Distribution to update.
     */
    private void updateDistribution(String newDistributionJson, String distributionId) {
        Distribution newDistribution = validateNewThing(newDistributionJson, factory.createIRI(distributionId),
                distributionFactory);
        catalogManager.updateDistribution(newDistribution);
    }

    /**
     * Attempts to create a new Thing based on the type of the passed OrmFactory using the passed JSON-LD string as
     * long as it contains the passed ID Resource. If the passed JSON-LD does not contain the passed ID Resource, throws
     * a 400 Response.
     *
     * @param newThingJson The JSON-LD of the new Thing.
     * @param thingId The ID Resource to confirm.
     * @param ormFactory The OrmFactory to use when creating the new Thing.
     * @param <T> A class that extends Thing.
     * @return The new Thing if the JSON-LD contains the correct ID Resource; throws a 400 otherwise.
     */
    private <T extends Thing> T validateNewThing(String newThingJson, Resource thingId, OrmFactory<T> ormFactory) {
        Model newThingModel = jsonldToModel(newThingJson);
        T newThing = ormFactory.getExisting(thingId, newThingModel);
        if (newThing == null || newThingModel.filter(newThing.getResource(), null, null).isEmpty()) {
            throw ErrorUtils.sendError(ormFactory.getType().getSimpleName() + " ids must match",
                    Response.Status.BAD_REQUEST);
        }
        return newThing;
    }

    /**
     * Creates a sorted limited offset Set of Things based on the return type of the passed function representing a
     * page in a paginated Response using the passed full Set of Resources.
     *
     * @param iris The Set of Resource for all of the Things.
     * @param thingFunction A Function to retrieve Things based on their Resource IDs.
     * @param sortBy The property IRI string to sort the Set of Things by.
     * @param offset The number of Things to skip.
     * @param limit The size of the page of Things to the return.
     * @param asc Whether the sorting should be ascending or descending.
     * @param <T> A class that extends Things.
     * @return A Set of Things that has been sorted and limited to create a page in a paginated Response.
     */
    private <T extends Thing> List<T> getSortedThingPage(Set<Resource> iris, Function<Resource, T> thingFunction,
                                                         String sortBy, int offset, int limit, boolean asc) {
        if (offset > iris.size()) {
            throw ErrorUtils.sendError("Offset exceeds total size", Response.Status.BAD_REQUEST);
        }
        IRI sortIRI = factory.createIRI(sortBy);
        Comparator<T> comparator = Comparator.comparing(dist -> dist.getProperty(sortIRI).get().stringValue());
        Stream<T> stream = iris.stream()
                .map(thingFunction);
        if (!asc) {
            comparator = comparator.reversed();
        }
        return stream.sorted(comparator)
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Creates a message for the Commit that occurs as a result of a merge between the Branches identified by the
     * provided ID strings.
     *
     * @param sourceId The ID string of the source Branch of the merge.
     * @param targetId The ID string of the target Branch of the merge.
     * @return A string message to use for the merge Commit.
     */
    private String getMergeMessage(String sourceId, String targetId) {
        return "Merge of " + sourceId + " into " + targetId;
    }

    /**
     * Creates a JSONObject representing the provided Conflict in the provided RDF format. Key "original" has value of
     * the serialized original Model of a conflict, key "left" has a value of an object with the additions and
     *
     * @param conflict The Conflict to turn into a JSONObject
     * @param rdfFormat A string representing the RDF format to return the statements in.
     * @return A JSONObject with a key for the Conflict's original Model, a key for the Conflict's left Difference,
     *      and a key for the Conflict's right Difference.
     */
    private JSONObject conflictToJson(Conflict conflict, String rdfFormat) {
        JSONObject object = new JSONObject();
        object.put("original", getModelInFormat(conflict.getOriginal(), rdfFormat));
        object.put("left", getDifferenceJson(conflict.getLeftDifference(), rdfFormat));
        object.put("right", getDifferenceJson(conflict.getRightDifference(), rdfFormat));
        return object;
    }

    /**
     * Converts a Thing into a JSON-LD string.
     *
     * @param thing THe Thing whose Model will be converted.
     * @return A JSON-LD string for the Thing's Model.
     */
    private String thingToJsonld(Thing thing) {
        return modelToJsonld(thing.getModel());
    }

    /**
     * Coverts a Model into a JSON-LD string.
     *
     * @param model The Model to convert.
     * @return A JSON-LD string for the Model.
     */
    private String modelToJsonld(Model model) {
        return getModelInFormat(model, "jsonld");
    }

    /**
     * Converts a Model into a string of the provided RDF format.
     *
     * @param model The Model to convert.
     * @param format A string representing the RDF format to return the Model in.
     * @return A String of the converted Model in the requested RDF format.
     */
    private String getModelInFormat(Model model, String format) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Rio.write(transformer.sesameModel(model), out, getRDFFormat(format));
        return out.toString();
    }

    /**
     * Converts a JSON-LD string into a Model.
     *
     * @param jsonld The string of JSON-LD to convert.
     * @return A Model containing the statements from the JSON-LD string.
     */
    private Model jsonldToModel(String jsonld) {
        try {
            return transformer.matontoModel(Rio.parse(IOUtils.toInputStream(jsonld), "", RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Grabs a single Entity object from a JSON-LD string and returns it as a JSONObject. Looks within the first
     * context object if present.
     *
     * @param json A JSON-LD string.
     * @return The first object representing a single Entity present in the JSON-LD array.
     */
    private JSONObject getObjectFromJsonld(String json) {
        JSONArray array = JSONArray.fromObject(json);
        JSONObject firstObject = array.getJSONObject(0);
        if (firstObject.containsKey("@graph")) {
            firstObject = Optional.ofNullable(firstObject.getJSONArray("@graph").optJSONObject(0))
                    .orElse(new JSONObject());
        }
        return firstObject;
    }

    /**
     * Converts a Thing into a JSONObject by the first object in the JSON-LD serialization of the Thing's Model.
     *
     * @param thing The Thing to convert into a JSONObject.
     * @return The JSONObject with the JSON-LD of the Thing entity from its Model.
     */
    private JSONObject thingToJsonObject(Thing thing) {
        return getObjectFromJsonld(thingToJsonld(thing));
    }
}
