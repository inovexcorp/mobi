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
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
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
import org.matonto.catalog.api.ontologies.mcat.TagFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
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
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    private final Logger log = Logger.getLogger(CatalogRestImpl.class);

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
        recordFactories.put(factory.getTypeIRI().stringValue(), factory);
    }

    protected <T extends Record> void removeRecordFactory(OrmFactory<T> factory) {
        recordFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Version> void addVersionFactory(OrmFactory<T> factory) {
        versionFactories.put(factory.getTypeIRI().stringValue(), factory);
    }

    protected <T extends Version> void removeVersionFactory(OrmFactory<T> factory) {
        versionFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Branch> void addBranchFactory(OrmFactory<T> factory) {
        branchFactories.put(factory.getTypeIRI().stringValue(), factory);
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

        JSONArray array = JSONArray.fromObject(catalogs.stream().map(this::thingToJsonld).collect(Collectors.toList()));
        return Response.ok(array.toString()).build();
    }

    @Override
    public Response getCatalog(String catalogId) {
        Catalog localCatalog = catalogManager.getLocalCatalog();
        Catalog distributedCatalog = catalogManager.getDistributedCatalog();
        Resource catalogIri = factory.createIRI(catalogId);
        if (catalogIri.equals(localCatalog.getResource())) {
            return Response.ok(thingToJsonld(localCatalog)).build();
        } else if (catalogIri.equals(distributedCatalog.getResource())) {
            return Response.ok(thingToJsonld(distributedCatalog)).build();
        } else {
            throw ErrorUtils.sendError("Catalog does not exist with id " + catalogId, Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getRecords(UriInfo uriInfo, String catalogId, String sort, String recordType, int offset, int limit,
                               boolean asc, String searchText) {
        IRI sortBy = getSortProperty(sort);
        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder(limit, offset, sortBy).ascending(asc);
        Optional.ofNullable(recordType).ifPresent(s -> builder.typeFilter(factory.createIRI(s)));
        Optional.ofNullable(searchText).ifPresent(builder::searchTerm);
        PaginatedSearchResults<Record> records = catalogManager.findRecord(factory.createIRI(catalogId),
                builder.build());
        return createPaginatedResponse(uriInfo, records.getPage(), records.getTotalSize(), limit, offset);
    }

    @Override
    public Response createRecord(ContainerRequestContext context, String catalogId, String typeIRI, String title,
                                 String identifierIRI, String description, String keywords) {
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
        Optional.ofNullable(description).ifPresent(builder::description);
        if (keywords != null && !keywords.isEmpty()) {
            builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
        }

        Record newRecord = catalogManager.createRecord(builder.build(), recordFactories.get(typeIRI));
        try {
            catalogManager.addRecord(factory.createIRI(catalogId), newRecord);
            if (typeIRI.equals(VersionedRDFRecord.TYPE) || typeIRI.equals(OntologyRecord.TYPE) ||
                    typeIRI.equals(MappingRecord.TYPE) || typeIRI.equals(DatasetRecord.TYPE)) {
                catalogManager.addMasterBranch(newRecord.getResource());
            }
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }

        return Response.ok(newRecord.getResource().stringValue()).build();
    }

    @Override
    public Response getRecord(String catalogId, String recordId) {
        Record record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactories.get(Record.TYPE)).orElseThrow(() ->
                ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        return Response.ok(thingToJsonld(record)).build();
    }

    @Override
    public Response deleteRecord(String catalogId, String recordId) {
        try {
            catalogManager.removeRecord(factory.createIRI(catalogId), factory.createIRI(recordId));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateRecord(String catalogId, String recordId, String newRecordJson) {
        Model newRecordModel = jsonldToModel(newRecordJson);
        Record newRecord = recordFactories.get(Record.TYPE).getExisting(factory.createIRI(recordId), newRecordModel);
        if (newRecord == null || newRecordModel.filter(newRecord.getResource(), null, null).isEmpty()) {
            throw ErrorUtils.sendError("Record ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateRecord(factory.createIRI(catalogId), newRecord);
        return Response.ok().build();
    }

    @Override
    public Response getUnversionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String sort,
                                                int offset, int limit) {
        IRI sortBy = getSortProperty(sort);
        UnversionedRecord record = getRecord(catalogId, recordId, UnversionedRecord.TYPE);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        Set<Distribution> distributions = distributionIRIs.stream()
                .map(resource -> catalogManager.getDistribution(resource))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparing(dist -> dist.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, distributions, distributionIRIs.size(), limit, offset);
    }

    @Override
    public Response createUnversionedDistribution(String catalogId, String recordId, String title, String description,
                                                  String format, String accessURL, String downloadURL) {
        recordInCatalog(catalogId, recordId);
        Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL);
        catalogManager.addDistributionToUnversionedRecord(newDistribution, factory.createIRI(recordId));
        return Response.ok(newDistribution.getResource().stringValue()).build();
    }

    @Override
    public Response getUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        Distribution distribution = testUnversionedDistributionPath(catalogId, recordId, distributionId);
        return Response.ok(thingToJsonld(distribution)).build();
    }

    @Override
    public Response deleteUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        recordInCatalog(catalogId, recordId);
        try {
            catalogManager.removeDistributionFromUnversionedRecord(factory.createIRI(distributionId),
                    factory.createIRI(recordId));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateUnversionedDistribution(String catalogId, String recordId, String distributionId, 
                                                  String newDistributionJson) {
        testUnversionedDistributionPath(catalogId, recordId, distributionId);
        updateDistribution(newDistributionJson, distributionId);
        return Response.ok().build();
    }

    @Override
    public Response getVersions(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset,
                                int limit) {
        IRI sortBy = getSortProperty(sort);
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Set<Version> versions = versionIRIs.stream()
                .map(resource -> catalogManager.getVersion(resource, versionFactory))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparing(ver -> ver.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, versions, versionIRIs.size(), limit, offset);
    }

    @Override
    public Response createVersion(String catalogId, String recordId, String typeIRI, String title, String description) {
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
    }

    @Override
    public Response getLatestVersion(String catalogId, String recordId) {
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Resource versionIRI = record.getLatestVersion().orElseThrow(() ->
                ErrorUtils.sendError("Record does not have a latest version", Response.Status.BAD_REQUEST))
                .getResource();
        Version version = getVersion(versionIRI.stringValue(), Version.TYPE);
        return Response.ok(thingToJsonld(version)).build();
    }

    @Override
    public Response getVersion(String catalogId, String recordId, String versionId) {
        Version version = testVersionPath(catalogId, recordId, versionId);
        return Response.ok(thingToJsonld(version)).build();
    }

    @Override
    public Response deleteVersion(String catalogId, String recordId, String versionId) {
        recordInCatalog(catalogId, recordId);
        try {
            catalogManager.removeVersion(factory.createIRI(versionId), factory.createIRI(recordId));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateVersion(String catalogId, String recordId, String versionId, String newVersionJson) {
        testVersionPath(catalogId, recordId, versionId);
        Model newVersionModel = jsonldToModel(newVersionJson);
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version newVersion = versionFactory.getExisting(factory.createIRI(versionId), newVersionModel);
        if (newVersion == null || newVersionModel.filter(newVersion.getResource(), null, null).isEmpty()) {
            throw ErrorUtils.sendError("Version ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateVersion(newVersion);
        return Response.ok().build();
    }

    @Override
    public Response getVersionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String versionId,
                                              String sort, int offset, int limit) {
        IRI sortBy = getSortProperty(sort);
        Version version = testVersionPath(catalogId, recordId, versionId);
        Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        Set<Distribution> distributions = distributionIRIs.stream()
                .map(resource -> catalogManager.getDistribution(resource))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparing(dist -> dist.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, distributions, distributionIRIs.size(), limit, offset);
    }

    @Override
    public Response createVersionedDistribution(String catalogId, String recordId, String versionId, String title,
                                                String description, String format, String accessURL,
                                                String downloadURL) {
        testVersionPath(catalogId, recordId, versionId);
        Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL);
        catalogManager.addDistributionToVersion(newDistribution, factory.createIRI(versionId));
        return Response.ok(newDistribution.getResource().stringValue()).build();
    }

    @Override
    public Response getVersionedDistribution(String catalogId, String recordId, String versionId, 
                                             String distributionId) {
        Distribution distribution = testVersionedDistributionPath(catalogId, recordId, versionId, distributionId);
        return Response.ok(thingToJsonld(distribution)).build();
    }

    @Override
    public Response deleteVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId) {
        testVersionPath(catalogId, recordId, versionId);
        try {
            catalogManager.removeDistributionFromVersion(factory.createIRI(distributionId),
                    factory.createIRI(versionId));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId, String newDistributionJson) {
        testVersionedDistributionPath(catalogId, recordId, versionId, distributionId);
        updateDistribution(newDistributionJson, distributionId);
        return Response.ok().build();
    }

    @Override
    public Response getVersionCommit(String catalogId, String recordId, String versionId, String format) {
        testVersionPath(catalogId, recordId, versionId);
        Tag version = getVersion(versionId, Tag.TYPE);
        Resource commitIRI = version.getCommit().orElseThrow(() ->
                ErrorUtils.sendError("Tag does not have a commit set", Response.Status.BAD_GATEWAY)).getResource();
        Commit commit = catalogManager.getCommit(commitIRI, commitFactory).orElseThrow(() ->
                ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
        return createCommitResponse(commit, format);
    }

    @Override
    public Response getBranches(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset, int
            limit) {
        IRI sortBy = getSortProperty(sort);
        VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
        Set<Resource> branchIRIs = record.getBranch().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        BranchFactory branchFactory = (BranchFactory) branchFactories.get(Branch.TYPE);
        Set<Branch> branches = branchIRIs.stream()
                .map(resource -> catalogManager.getBranch(resource, branchFactory))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparing(dist -> dist.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, branches, branchIRIs.size(), limit, offset);
    }

    @Override
    public Response createBranch(String catalogId, String recordId, String typeIRI, String title, String description) {
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
    }

    @Override
    public Response getMasterBranch(String catalogId, String recordId) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
        Resource branchIRI = record.getMasterBranch().orElseThrow(() ->
                ErrorUtils.sendError("Record does not have a master branch set", Response.Status.BAD_REQUEST))
                .getResource();
        Branch masterBranch = getBranch(branchIRI.stringValue(), Branch.TYPE);
        return Response.ok(thingToJsonld(masterBranch)).build();
    }

    @Override
    public Response getBranch(String catalogId, String recordId, String branchId) {
        Branch branch = testBranchPath(catalogId, recordId, branchId);
        return Response.ok(thingToJsonld(branch)).build();
    }

    @Override
    public Response deleteBranch(String catalogId, String recordId, String branchId) {
        recordInCatalog(catalogId, recordId);
        try {
            catalogManager.removeBranch(factory.createIRI(branchId), factory.createIRI(recordId));
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateBranch(String catalogId, String recordId, String branchId, String newBranchJson) {
        testBranchPath(catalogId, recordId, branchId);
        Model newBranchModel = jsonldToModel(newBranchJson);
        BranchFactory branchFactory = (BranchFactory) branchFactories.get(Branch.TYPE);
        Branch newBranch = branchFactory.getExisting(factory.createIRI(branchId), newBranchModel);
        if (newBranch == null || newBranchModel.filter(newBranch.getResource(), null, null).isEmpty()) {
            throw ErrorUtils.sendError("Branch ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateBranch(newBranch);
        return Response.ok().build();
    }

    @Override
    public Response getCommitChain(String catalogId, String recordId, String branchId) {
        Resource headIRI = getHeadCommitIRI(catalogId, recordId, branchId);
        JSONArray commitChain = new JSONArray();
        catalogManager.getCommitChain(headIRI).stream()
                .map(resource -> catalogManager.getCommit(resource, commitFactory))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(this::thingToJsonld)
                .forEach(commitChain::add);
        return Response.ok(commitChain.toString()).build();
    }

    @Override
    public Response createBranchCommit(ContainerRequestContext context, String catalogId, String recordId,
                                       String branchId, String message) {
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
        try {
            catalogManager.removeInProgressCommit(inProgressCommitIRI);
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        Commit newCommit = catalogManager.createCommit(inProgressCommit, parents, message);
        catalogManager.addCommitToBranch(newCommit, factory.createIRI(branchId));
        return Response.ok(newCommit.getResource().stringValue()).build();
    }

    @Override
    public Response getHead(String catalogId, String recordId, String branchId, String format) {
        Commit headCommit = getHeadCommit(catalogId, recordId, branchId);
        return createCommitResponse(headCommit, format);
    }

    @Override
    public Response getBranchCommit(String catalogId, String recordId, String branchId, String commitId,
                                    String format) {
        commitInBranch(catalogId, recordId, branchId, commitId);
        Commit commit = catalogManager.getCommit(factory.createIRI(commitId), commitFactory).orElseThrow(() ->
                ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
        return createCommitResponse(commit, format);
    }

    @Override
    public Response getConflicts(String catalogId, String recordId, String branchId, String targetBranchId) {
        Resource sourceHeadIRI = getHeadCommitIRI(catalogId, recordId, branchId);
        Resource targetHeadIRI = getHeadCommitIRI(catalogId, recordId, targetBranchId);
        Set<Conflict> conflicts;
        try {
            conflicts = catalogManager.getConflicts(sourceHeadIRI, targetHeadIRI);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
        JSONArray array = new JSONArray();
        conflicts.stream()
                .map(conflict -> {
                    JSONObject object = new JSONObject();
                    object.put("original", modelToJsonld(conflict.getOriginal()));
                    JSONObject leftObject = new JSONObject();
                    leftObject.put("additions", modelToJsonld(conflict.getLeftDifference().getAdditions()));
                    leftObject.put("deletions", modelToJsonld(conflict.getLeftDifference().getDeletions()));
                    object.put("left", leftObject);
                    JSONObject rightObject = new JSONObject();
                    rightObject.put("additions", modelToJsonld(conflict.getRightDifference().getAdditions()));
                    rightObject.put("deletions", modelToJsonld(conflict.getRightDifference().getDeletions()));
                    object.put("right", rightObject);
                    return object;
                })
                .forEach(array::add);
        return Response.ok(array.toString()).build();
    }

    @Override
    public Response merge(ContainerRequestContext context, String catalogId, String recordId, String branchId,
                          String targetBranchId, String additionsJson, String deletionsJson) {
        Commit sourceHead = getHeadCommit(catalogId, recordId, branchId);
        Commit targetHead = getHeadCommit(catalogId, recordId, targetBranchId);
        User activeUser = getActiveUser(context);
        if (catalogManager.getInProgressCommitIRI(activeUser.getResource(), factory.createIRI(recordId)).isPresent()) {
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
        try {
            catalogManager.removeInProgressCommit(inProgressCommit.getResource());
        } catch (MatOntoException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
        Commit newCommit = catalogManager.createCommit(inProgressCommit,
                Stream.of(sourceHead, targetHead).collect(Collectors.toSet()),
                getMergeMessage(sourceHead.getResource(), targetHead.getResource()));
        catalogManager.addCommitToBranch(newCommit, factory.createIRI(targetBranchId));
        return Response.ok(newCommit.getResource().stringValue()).build();
    }

    @Override
    public Response getCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                        String branchId, String commitId, String rdfFormat, boolean apply) {
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
    }

    @Override
    public Response downloadCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                             String branchId, String commitId, String rdfFormat, boolean apply) {
        commitInBranch(catalogId, recordId, branchId, commitId);
        Model resource;
        Model temp = catalogManager.getCompiledResource(factory.createIRI(commitId)).orElseThrow(() ->
                ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
        if (apply) {
            User activeUser = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME,
                    context.getProperty(AuthenticationProps.USERNAME).toString()).orElseThrow(() ->
                    ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));
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
                + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type", getRDFFormatMimeType(rdfFormat))
                .build();
    }

    @Override
    public Response createInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, VersionedRDFRecord.TYPE);
        User activeUser = getActiveUser(context);
        if (catalogManager.getInProgressCommitIRI(activeUser.getResource(), record.getResource()).isPresent()) {
            throw ErrorUtils.sendError("User already has an InProgressCommit for Record " + recordId,
                    Response.Status.BAD_REQUEST);
        }
        InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(activeUser, record.getResource());
        catalogManager.addInProgressCommit(inProgressCommit);
        return Response.ok().build();
    }

    @Override
    public Response getInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                        String format) {
        recordInCatalog(catalogId, recordId);
        User activeUser = getActiveUser(context);
        Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                factory.createIRI(recordId)).orElseThrow(() ->
                ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
        JSONObject object = getCommitDifferenceObject(inProgressCommitIRI, format);
        return Response.ok(object.toString()).build();
    }

    @Override
    public Response deleteInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        recordInCatalog(catalogId, recordId);
        User activeUser = getActiveUser(context);
        Resource inProgressCommitIRI = catalogManager.getInProgressCommitIRI(activeUser.getResource(),
                factory.createIRI(recordId)).orElseThrow(() ->
                ErrorUtils.sendError("User has no InProgressCommit", Response.Status.BAD_REQUEST));
        try {
            catalogManager.removeInProgressCommit(inProgressCommitIRI);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    @Override
    public Response updateInProgressCommit(ContainerRequestContext context, String catalogId, String recordId, 
                                           String additionsJson, String deletionsJson) {
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
    }

    @Override
    public Response getRecordTypes() {
        JSONArray json = JSONArray.fromObject(recordFactories.keySet());
        return Response.ok(json.toString()).build();
    }

    @Override
    public Response getSortOptions() {
        JSONArray json = JSONArray.fromObject(SORT_RESOURCES);
        return Response.ok(json.toString()).build();
    }

    private <T extends Thing> Response createPaginatedResponse(UriInfo uriInfo, Collection<T> items, int totalSize,
                                                               int limit, int offset) {
        Links links = LinksUtils.buildLinks(uriInfo, items.size(), totalSize, limit, offset);

        JSONArray results = JSONArray.fromObject(items.stream()
                .map(this::thingToJsonld)
                .collect(Collectors.toSet()));
        Response.ResponseBuilder response = Response.ok(results.toString())
                .header("X-Total-Count", totalSize);
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
    }

    private Response createCommitResponse(Commit commit, String format) {
        JSONObject object = getCommitDifferenceObject(commit.getResource(), format);
        object.put("commit", thingToJsonld(commit));
        return Response.ok(object.toString()).build();
    }

    private JSONObject getCommitDifferenceObject(Resource commitId, String format) {
        Difference difference;
        try {
            difference = catalogManager.getCommitDifference(commitId);
        } catch (MatOntoException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
        return new JSONObject().element("additions", getModelInFormat(difference.getAdditions(), format))
                .element("deletions", getModelInFormat(difference.getDeletions(), format));
    }

    private Distribution testUnversionedDistributionPath(String catalogId, String recordId, String distributionId) {
        UnversionedRecord record = getRecord(catalogId, recordId, UnversionedRecord.TYPE);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Record " + recordId,
                    Response.Status.BAD_REQUEST);
        }
        return catalogManager.getDistribution(factory.createIRI(distributionId)).orElseThrow(() ->
                ErrorUtils.sendError("Distribution not found", Response.Status.BAD_REQUEST));
    }

    private Version testVersionPath(String catalogId, String recordId, String versionId) {
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        return getVersion(versionId, Version.TYPE);
    }

    private Distribution testVersionedDistributionPath(String catalogId, String recordId, String versionId,
                                               String distributionId) {
        VersionedRecord record = getRecord(catalogId, recordId, VersionedRecord.TYPE);
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        Version version = getVersion(versionId, Version.TYPE);
        Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Version " + recordId,
                    Response.Status.BAD_REQUEST);
        }
        return catalogManager.getDistribution(factory.createIRI(distributionId)).orElseThrow(() ->
                ErrorUtils.sendError("Distribution not found", Response.Status.BAD_REQUEST));
    }

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

    private Optional<Resource> optHeadCommitIRI(String catalogId, String recordId, String branchId) {
        Branch branch = testBranchPath(catalogId, recordId, branchId);
        Optional<Commit> optional = branch.getHead();
        if (optional.isPresent()) {
            return Optional.of(optional.get().getResource());
        } else {
            return Optional.empty();
        }
    }

    private Resource getHeadCommitIRI(String catalogId, String recordId, String branchId) {
        return optHeadCommitIRI(catalogId, recordId, branchId).orElseThrow(() ->
                ErrorUtils.sendError("Branch does not have head Commit set", Response.Status.BAD_REQUEST));
    }

    private Optional<Commit> optHeadCommit(String catalogId, String recordId, String branchId) {
        Optional<Resource> iri = optHeadCommitIRI(catalogId, recordId, branchId);
        if (iri.isPresent()) {
            return catalogManager.getCommit(iri.get(), commitFactory);
        } else {
            return Optional.empty();
        }
    }

    private Commit getHeadCommit(String catalogId, String recordId, String branchId) {
        Resource iri = getHeadCommitIRI(catalogId, recordId, branchId);
        return catalogManager.getCommit(iri, commitFactory).orElseThrow(() ->
                ErrorUtils.sendError("Commit not found", Response.Status.BAD_REQUEST));
    }

    private void commitInBranch(String catalogId, String recordId, String branchId, String commitId) {
        Resource headIRI = getHeadCommitIRI(catalogId, recordId, branchId);
        if (!catalogManager.getCommitChain(headIRI).contains(factory.createIRI(commitId))) {
            throw ErrorUtils.sendError("Commit does not belong to Branch " + branchId, Response.Status.BAD_REQUEST);
        }
    }

    private void recordInCatalog(String catalogId, String recordId) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }
    }

    private User getActiveUser(ContainerRequestContext context) {
        return engineManager.retrieveUser(RdfEngine.COMPONENT_NAME,
                context.getProperty(AuthenticationProps.USERNAME).toString()).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));
    }

    private IRI getSortProperty(String sortIRI) {
        if (!SORT_RESOURCES.contains(sortIRI)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        return factory.createIRI(sortIRI);
    }

    private <T extends Record> T getRecord(String catalogId, String recordId, String recordType) {
        OrmFactory<T> recordFactory = (OrmFactory<T>) recordFactories.get(recordType);
        return catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
    }

    private <T extends Version> T getVersion(String versionId, String versionType) {
        OrmFactory<T> versionFactory = (OrmFactory<T>) versionFactories.get(versionType);
        return catalogManager.getVersion(factory.createIRI(versionId), versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
    }

    private <T extends Branch> T getBranch(String branchId, String branchType) {
        OrmFactory<T> branchFactory = (OrmFactory<T>) branchFactories.get(branchType);
        return catalogManager.getBranch(factory.createIRI(branchId), branchFactory).orElseThrow(() ->
                ErrorUtils.sendError("Branch not found", Response.Status.BAD_REQUEST));
    }

    private Distribution createDistribution(String title, String description, String format, String accessURL,
                                            String downloadURL) {
        if (title == null) {
            throw ErrorUtils.sendError("Distribution title is required", Response.Status.BAD_REQUEST);
        }
        DistributionConfig.Builder builder = new DistributionConfig.Builder(title);
        Optional.ofNullable(description).ifPresent(builder::description);
        Optional.ofNullable(format).ifPresent(builder::format);
        Optional.ofNullable(accessURL).ifPresent(s -> builder.accessURL(factory.createIRI(s)));
        Optional.ofNullable(downloadURL).ifPresent(s -> builder.downloadURL(factory.createIRI(s)));

        return catalogManager.createDistribution(builder.build());
    }

    private void updateDistribution(String newDistributionJson, String distributionId) {
        Model newDistributionModel = jsonldToModel(newDistributionJson);
        Distribution newDistribution = distributionFactory.getExisting(factory.createIRI(distributionId),
                newDistributionModel);
        if (newDistribution == null || newDistributionModel.filter(newDistribution.getResource(), null, null)
                .isEmpty()) {
            throw ErrorUtils.sendError("Distribution ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateDistribution(newDistribution);
    }

    private String thingToJsonld(Thing thing) {
        return getModelInFormat(thing.getModel(), "jsonld");
    }

    private String modelToJsonld(Model model) {
        return getModelInFormat(model, "jsonld");
    }

    private String getModelInFormat(Model model, String format) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Rio.write(transformer.sesameModel(model), out, getRDFFormat(format));
        return out.toString();
    }

    private Model jsonldToModel(String jsonld) {
        try {
            return transformer.matontoModel(Rio.parse(IOUtils.toInputStream(jsonld), "", RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
    }

    private String getMergeMessage(Resource sourceId, Resource targetId) {
        return "Merge of " + sourceId.stringValue() + " into " + targetId.stringValue();
    }
}
