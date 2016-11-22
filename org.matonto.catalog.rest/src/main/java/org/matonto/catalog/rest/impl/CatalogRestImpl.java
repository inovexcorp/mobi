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
import org.apache.log4j.Logger;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.rdf.api.ValueFactory;

import java.util.*;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {

    private CatalogManager catalogManager;
    private ValueFactory valueFactory;
    private CatalogFactory catalogFactory;

    private static final Set<String> RESOURCE_TYPES;
    private static final Set<String> SORT_RESOURCES;

    private static final String DC = "http://purl.org/dc/terms/";

    private final Logger log = Logger.getLogger(CatalogRestImpl.class);

    static {
        Set<String> types = new HashSet<>();
        types.add("http://matonto.org/ontologies/catalog#PublishedResource");
        types.add("http://matonto.org/ontologies/catalog#Ontology");
        types.add("http://matonto.org/ontologies/catalog#Mapping");
        RESOURCE_TYPES = Collections.unmodifiableSet(types);

        Set<String> sortResources = new HashSet<>();
        sortResources.add(DC + "modified");
        sortResources.add(DC + "issued");
        sortResources.add(DC + "title");
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    protected void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Override
    public Response getCatalogs(String catalogType) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getCatalog(String catalogId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getRecords(String catalogId, String sort, String recordType, int offset, int limit, String searchText) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public <T extends Record> Response createRecord(String catalogId, T newRecord) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getRecord(String catalogId, String recordId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteRecord(String catalogId, String recordId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public <T extends Record> Response updateRecord(String catalogId, String recordId, T newRecord) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getUnversionedDistributions(String catalogId, String recordId, String sort, int offset, int limit) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response createUnversionedDistribution(String catalogId, String recordId, Distribution newDistribution) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteUnversionedDistribution(String catalogId, String recordId, String distributionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response updateUnversionedDistribution(String catalogId, String recordId, String distributionId, 
                                                  Distribution newDistribution) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getLatestVersion(String catalogId, String recordId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getVersions(String catalogId, String recordId, String sort, int offset, int limit) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public <T extends Version> Response createVersion(String catalogId, String recordId, T newVersion) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getVersion(String catalogId, String recordId, String versionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteVersion(String catalogId, String recordId, String versionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public <T extends Version> Response updateVersion(String catalogId, String recordId, String versionId, 
                                                      T newVersion) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getVersionedDistributions(String catalogId, String recordId, String versionId, String sort, 
                                              int offset, int limit) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response createVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                Distribution newDistribution) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getVersionedDistribution(String catalogId, String recordId, String versionId, 
                                             String distributionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response updateVersionedDistribution(String catalogId, String recordId, String versionId, 
                                                String distributionId, Distribution newDistribution) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
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
}
