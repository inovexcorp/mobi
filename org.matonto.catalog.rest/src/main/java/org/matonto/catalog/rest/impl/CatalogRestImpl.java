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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.engines.RdfEngine;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
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

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {
    protected MatontoConfiguration matontoConfiguration;
    protected EngineManager engineManager;
    private SesameTransformer transformer;
    private CatalogManager catalogManager;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    protected Map<String, OrmFactory<? extends Record>> recordFactories = new HashMap<>();
    protected Map<String, OrmFactory<? extends Version>> versionFactories = new HashMap<>();
    protected DistributionFactory distributionFactory;

    private static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";
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
    protected void setMatontoConfiguration(MatontoConfiguration configuration) {
        this.matontoConfiguration = configuration;
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends Record> void addRecordFactory(OrmFactory<T> factory) {
        recordFactories.put(factory.getTypeIRI().stringValue(), factory);
    }

    protected <T extends Record> void removeRecordFactory(OrmFactory<T> factory) {
        recordFactories.remove(factory.getTypeIRI().stringValue());
    }

    @Reference
    protected <T extends Version> void addVersionFactory(OrmFactory<T> factory) {
        versionFactories.put(factory.getTypeIRI().stringValue(), factory);
    }

    protected <T extends Version> void removeVersionFactory(OrmFactory<T> factory) {
        versionFactories.remove(factory.getTypeIRI().stringValue());
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

    @Reference
    protected void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    protected void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
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
        if (!SORT_RESOURCES.contains(sort)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        IRI sortBy = factory.createIRI(sort);
        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder(limit, offset, sortBy).ascending(asc);
        Optional.ofNullable(recordType).ifPresent(s -> builder.typeFilter(factory.createIRI(s)));
        Optional.ofNullable(searchText).ifPresent(builder::searchTerm);
        PaginatedSearchResults<Record> records = catalogManager.findRecord(factory.createIRI(catalogId),
                builder.build());
        int size = records.getPage().size();
        Links links = LinksUtils.buildLinks(uriInfo, size, records.getTotalSize(), limit, offset);

        JSONArray results = JSONArray.fromObject(records.getPage().stream()
                .map(this::thingToJsonld)
                .collect(Collectors.toSet()));

        Response.ResponseBuilder response = Response.ok(results.toString())
                .header("X-Total-Count", records.getTotalSize());
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
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

        User activeUser = engineManager.retrieveUser(RdfEngine.COMPONENT_NAME,
                context.getProperty(AuthenticationProps.USERNAME).toString()).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.FORBIDDEN));
        RecordConfig.Builder builder = new RecordConfig.Builder(title, identifierIRI,
                Collections.singleton(activeUser));
        Optional.ofNullable(description).ifPresent(builder::description);
        if (keywords != null && !keywords.isEmpty()) {
            builder.keywords(Arrays.stream(StringUtils.split(keywords, ",")).collect(Collectors.toSet()));
        }

        Record newRecord = catalogManager.createRecord(builder.build(), recordFactories.get(typeIRI));
        catalogManager.addRecord(factory.createIRI(catalogId), newRecord);
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
        Model newRecordModel;
        try {
            newRecordModel = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(newRecordJson), "",
                    RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
        Record newRecord = recordFactories.get(Record.TYPE).getExisting(factory.createIRI(recordId), newRecordModel);
        if (newRecord == null) {
            throw ErrorUtils.sendError("Record ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateRecord(factory.createIRI(catalogId), newRecord);
        return Response.ok().build();
    }

    @Override
    public Response getUnversionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String sort,
                                                int offset, int limit) {
        if (!SORT_RESOURCES.contains(sort)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        IRI sortBy = factory.createIRI(sort);
        UnversionedRecordFactory recordFactory = (UnversionedRecordFactory) recordFactories.get(UnversionedRecord.TYPE);
        UnversionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());

        Set<Distribution> distributions = distributionIRIs.stream()
                .map(resource -> catalogManager.getDistribution(resource))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted((dist1, dist2) -> dist1.getProperty(sortBy).get().stringValue()
                        .compareTo(dist2.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, distributions, distributionIRIs, limit, offset);
    }

    @Override
    public Response createUnversionedDistribution(String catalogId, String recordId, String title, String description,
                                                  String format, String accessURL, String downloadURL) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }

        Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL);
        catalogManager.addDistributionToUnversionedRecord(newDistribution, factory.createIRI(recordId));
        return Response.ok(newDistribution.getResource().stringValue()).build();
    }

    @Override
    public Response getUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        testUnversionedDistributionPath(catalogId, recordId, distributionId);
        Distribution distribution = catalogManager.getDistribution(factory.createIRI(distributionId)).orElseThrow(() ->
                ErrorUtils.sendError("Distribution not found", Response.Status.BAD_REQUEST));
        return Response.ok(thingToJsonld(distribution)).build();
    }

    @Override
    public Response deleteUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }
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
    public Response getLatestVersion(String catalogId, String recordId) {
        VersionedRecordFactory recordFactory = (VersionedRecordFactory) recordFactories.get(VersionedRecord.TYPE);
        VersionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Resource versionIRI = record.getLatestVersion().orElseThrow(() ->
                ErrorUtils.sendError("Record does not have a latest version", Response.Status.BAD_REQUEST))
                .getResource();
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version version = catalogManager.getVersion(versionIRI, versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
        return Response.ok(thingToJsonld(version)).build();
    }

    @Override
    public Response getVersions(UriInfo uriInfo, String catalogId, String recordId, String sort, int offset, int limit) {
        if (!SORT_RESOURCES.contains(sort)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        IRI sortBy = factory.createIRI(sort);
        VersionedRecordFactory ormFactory = (VersionedRecordFactory) recordFactories.get(VersionedRecord.TYPE);
        VersionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                ormFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());

        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Set<Version> versions = versionIRIs.stream()
                .map(resource -> catalogManager.getVersion(resource, versionFactory))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted((ver1, ver2) -> ver1.getProperty(sortBy).get().stringValue()
                        .compareTo(ver2.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, versions, versionIRIs, limit, offset);
    }

    @Override
    public Response createVersion(String catalogId, String recordId, String typeIRI, String title, String description) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }
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
    public Response getVersion(String catalogId, String recordId, String versionId) {
        testVersionPath(catalogId, recordId, versionId);
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version version = catalogManager.getVersion(factory.createIRI(versionId), versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
        return Response.ok(thingToJsonld(version)).build();
    }

    @Override
    public Response deleteVersion(String catalogId, String recordId, String versionId) {
        if (!catalogManager.getRecordIds(factory.createIRI(catalogId)).contains(factory.createIRI(recordId))) {
            throw ErrorUtils.sendError("Record not found in Catalog " + catalogId, Response.Status.BAD_REQUEST);
        }
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
        Model newVersionModel;
        try {
            newVersionModel = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(newVersionJson), "",
                    RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version newVersion = versionFactory.getExisting(factory.createIRI(versionId), newVersionModel);
        if (newVersion == null) {
            throw ErrorUtils.sendError("Version ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateVersion(newVersion);
        return Response.ok().build();
    }

    @Override
    public Response getVersionedDistributions(UriInfo uriInfo, String catalogId, String recordId, String versionId, String sort,
                                              int offset, int limit) {
        if (!SORT_RESOURCES.contains(sort)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        IRI sortBy = factory.createIRI(sort);
        testVersionPath(catalogId, recordId, versionId);
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version version = catalogManager.getVersion(factory.createIRI(versionId), versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
        Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());

        Set<Distribution> distributions = distributionIRIs.stream()
                .map(resource -> catalogManager.getDistribution(resource))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted((dist1, dist2) -> dist1.getProperty(sortBy).get().stringValue()
                        .compareTo(dist2.getProperty(sortBy).get().stringValue()))
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toSet());
        return createPaginatedResponse(uriInfo, distributions, distributionIRIs, limit, offset);
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
        testVersionedDistributionPath(catalogId, recordId, versionId, distributionId);
        Distribution distribution = catalogManager.getDistribution(factory.createIRI(distributionId)).orElseThrow(() ->
                ErrorUtils.sendError("Distribution not found", Response.Status.BAD_REQUEST));
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
    public Response getVersionCommit(String catalogId, String recordId, String versionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getMasterBranch(String catalogId, String recordId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getBranches(String catalogId, String recordId, String sort, int offset, int limit) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response createBranch(String catalogId, String recordId, Branch newBranch) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getBranch(String catalogId, String recordId, String branchId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteBranch(String catalogId, String recordId, String branchId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response updateBranch(String catalogId, String recordId, String branchId, Branch newBranch) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getHead(String catalogId, String recordId, String branchId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getCommitChain(String catalogId, String recordId, String branchId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response createBranchCommit(@Context ContainerRequestContext context, String catalogId, String recordId, 
                                       String branchId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getBranchCommit(String catalogId, String recordId, String branchId, String commitId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getConflicts(String catalogId, String recordId, String branchId, String leftId, String rightId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response merge(String catalogId, String recordId, String branchId, String leftId, String rightId, 
                          String additionsJson, String deletionsJson) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                        String branchId, String commitId, String rdfFormat, boolean apply) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response downloadCompiledResource(ContainerRequestContext context, String catalogId, String recordId, 
                                             String branchId, String commitId, String rdfFormat, boolean apply) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response createInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                           InProgressCommit newInProgressCommit) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getInProgressCommit(ContainerRequestContext context, String catalogId, String recordId,
                                        String rdfFormat) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteInProgressCommit(ContainerRequestContext context, String catalogId, String recordId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response updateInProgressCommit(ContainerRequestContext context, String catalogId, String recordId, 
                                           String additionsJson, String deletionsJson) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
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

    private String thingToJsonld(Thing thing) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Rio.write(transformer.sesameModel(thing.getModel()), out, RDFFormat.JSONLD);
        return out.toString();
    }

    private <T extends Thing> Response createPaginatedResponse(UriInfo uriInfo, Set<T> things, Set<Resource> iris, int limit,
                                             int offset) {
        Links links = LinksUtils.buildLinks(uriInfo, things.size(), iris.size(), limit, offset);
        JSONArray results = JSONArray.fromObject(things.stream()
                .map(this::thingToJsonld)
                .collect(Collectors.toSet()));
        Response.ResponseBuilder response = Response.ok(results.toString())
                .header("X-Total-Count", iris.size());
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
    }

    private void testUnversionedDistributionPath(String catalogId, String recordId, String distributionId) {
        UnversionedRecordFactory recordFactory = (UnversionedRecordFactory) recordFactories.get(UnversionedRecord.TYPE);
        UnversionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Set<Resource> distributionIRIs = record.getUnversionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Record " + recordId,
                    Response.Status.BAD_REQUEST);
        }
    }

    private void testVersionPath(String catalogId, String recordId, String versionId) {
        VersionedRecordFactory recordFactory = (VersionedRecordFactory) recordFactories.get(VersionedRecord.TYPE);
        VersionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
    }

    private void testVersionedDistributionPath(String catalogId, String recordId, String versionId, String distributionId) {
        VersionedRecordFactory recordFactory = (VersionedRecordFactory) recordFactories.get(VersionedRecord.TYPE);
        VersionedRecord record = catalogManager.getRecord(factory.createIRI(catalogId), factory.createIRI(recordId),
                recordFactory).orElseThrow(() -> ErrorUtils.sendError("Record not found", Response.Status.BAD_REQUEST));
        Set<Resource> versionIRIs = record.getVersion().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!versionIRIs.contains(factory.createIRI(versionId))) {
            throw ErrorUtils.sendError("Version does not belong to Record " + recordId, Response.Status.BAD_REQUEST);
        }
        VersionFactory versionFactory = (VersionFactory) versionFactories.get(Version.TYPE);
        Version version = catalogManager.getVersion(factory.createIRI(versionId), versionFactory).orElseThrow(() ->
                ErrorUtils.sendError("Version not found", Response.Status.BAD_REQUEST));
        Set<Resource> distributionIRIs = version.getVersionedDistribution().stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        if (!distributionIRIs.contains(factory.createIRI(distributionId))) {
            throw ErrorUtils.sendError("Distribution does not belong to Version " + recordId,
                    Response.Status.BAD_REQUEST);
        }
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
        Model newDistributionModel;
        try {
            newDistributionModel = transformer.matontoModel(Rio.parse(IOUtils.toInputStream(newDistributionJson), "",
                    RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
        Distribution newDistribution = distributionFactory.getExisting(factory.createIRI(distributionId),
                newDistributionModel);
        if (newDistribution == null) {
            throw ErrorUtils.sendError("Distribution ids must match", Response.Status.BAD_REQUEST);
        }
        catalogManager.updateDistribution(newDistribution);
    }
}
