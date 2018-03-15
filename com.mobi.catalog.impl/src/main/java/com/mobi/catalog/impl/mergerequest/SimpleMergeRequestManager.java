package com.mobi.catalog.impl.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component(name = SimpleMergeRequestManager.COMPONENT_NAME)
public class SimpleMergeRequestManager implements MergeRequestManager {

    static final String MERGE_REQUEST_NAMESPACE = "https://mobi.com/merge-requests#";
    static final String COMPONENT_NAME = "com.mobi.catalog.api.mergerequest.MergeRequestManager";

    private RepositoryManager repositoryManager;
    private ValueFactory vf;
    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;
    private MergeRequestFactory mergeRequestFactory;
    private VersionedRDFRecordFactory recordFactory;
    private BranchFactory branchFactory;

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Reference
    void setMergeRequestFactory(MergeRequestFactory mergeRequestFactory) {
        this.mergeRequestFactory = mergeRequestFactory;
    }

    @Reference
    void setRecordFactory(VersionedRDFRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Override
    public Set<MergeRequest> getMergeRequests() {
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            Set<MergeRequest> requests = new HashSet<>();
            conn.getStatements(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    vf.createIRI(MergeRequest.TYPE)).forEach(st ->
                    requests.add(catalogUtils.getExpectedObject(st.getSubject(), mergeRequestFactory, conn)));
            return requests;
        }
    }

    @Override
    public MergeRequest createMergeRequest(MergeRequestConfig config) {
        Resource catalogId = catalogManager.getLocalCatalogIRI();
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            catalogUtils.validateBranch(catalogId, config.getRecordId(), config.getSourceBranchId(), conn);
            catalogUtils.validateBranch(catalogId, config.getRecordId(), config.getTargetBranchId(), conn);
        }

        OffsetDateTime now = OffsetDateTime.now();
        MergeRequest request = mergeRequestFactory.createNew(vf.createIRI(MERGE_REQUEST_NAMESPACE + UUID.randomUUID()));
        request.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        request.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        request.setOnRecord(recordFactory.createNew(config.getRecordId()));
        request.setSourceBranch(branchFactory.createNew(config.getSourceBranchId()));
        request.setTargetBranch(branchFactory.createNew(config.getTargetBranchId()));
        request.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        config.getDescription().ifPresent(description ->
                request.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI)));
        request.setProperty(config.getCreator().getResource(), vf.createIRI(_Thing.creator_IRI));
        config.getAssignees().forEach(request::addAssignee);
        return request;
    }

    @Override
    public void addMergeRequest(MergeRequest request) {
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            if (conn.containsContext(request.getResource())) {
                throw catalogUtils.throwAlreadyExists(request.getResource(), recordFactory);
            }
            conn.add(request.getModel(), request.getResource());
        }
    }

    @Override
    public Optional<MergeRequest> getMergeRequest(Resource requestId) {
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            return catalogUtils.optObject(requestId, mergeRequestFactory, conn);
        }
    }

    @Override
    public void updateMergeRequest(Resource requestId, MergeRequest request) {
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            catalogUtils.validateResource(requestId, mergeRequestFactory.getTypeIRI(), conn);
            catalogUtils.updateObject(request, conn);
        }
    }

    private Repository getCatalogRepo() {
        return repositoryManager.getRepository(catalogManager.getRepositoryId()).orElseThrow(() ->
                new IllegalStateException("Cannot retrieve Catalog repository"));
    }
}
