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
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.exception.MobiException;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.Bindings;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

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


    private static final String GET_MERGE_REQUESTS_QUERY;
    private static final String FILTERS = "%FILTERS%";
    private static final String REQUEST_ID_BINDING = "requestId";
    private static final String ASSIGNEE_BINDING = "assignee";
    private static final String ON_RECORD_BINDING = "onRecord";
    private static final String SOURCE_BRANCH_BINDING = "sourceBranch";
    private static final String TARGET_BRANCH_BINDING = "targetBranch";
    private static final String SOURCE_COMMIT_BINDING = "sourceCommit";
    private static final String TARGET_COMMIT_BINDING = "targetCommit";
    private static final String SORT_PRED_BINDING = "sortPred";

    static {
        try {
            GET_MERGE_REQUESTS_QUERY = IOUtils.toString(SimpleMergeRequestManager.class
                    .getResourceAsStream("/get-merge-requests.rq"), "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public List<MergeRequest> getMergeRequests(MergeRequestFilterParams params) {
        StringBuilder filters = new StringBuilder("FILTER ");
        if (!params.getAccepted()) {
            filters.append("NOT ");
        }
        filters.append("EXISTS { ?").append(REQUEST_ID_BINDING).append(" a mq:AcceptedMergeRequest . } ");
        params.getSortBy().ifPresent(sortBy -> filters.append("?").append(REQUEST_ID_BINDING).append(" <")
                .append(sortBy).append("> ?").append(SORT_PRED_BINDING).append(". "));

        if (params.hasFilters()) {
            filters.append("FILTER (");
            params.getAssignee().ifPresent(assignee -> filters.append("?").append(ASSIGNEE_BINDING).append(" = <")
                    .append(assignee).append("> && "));
            params.getOnRecord().ifPresent(onRecord -> filters.append("?").append(ON_RECORD_BINDING).append(" = <")
                    .append(onRecord).append("> && "));
            params.getSourceBranch().ifPresent(sourceBranch -> filters.append("?").append(SOURCE_BRANCH_BINDING)
                    .append(" = <").append(sourceBranch).append("> && "));
            params.getTargetBranch().ifPresent(targetBranch -> filters.append("?").append(TARGET_BRANCH_BINDING)
                    .append(" = <").append(targetBranch).append("> && "));
            params.getSourceCommit().ifPresent(sourceCommit -> filters.append("?").append(SOURCE_COMMIT_BINDING)
                    .append(" = <").append(sourceCommit).append("> && "));
            params.getTargetCommit().ifPresent(targetCommit -> filters.append("?").append(TARGET_COMMIT_BINDING)
                    .append(" = <").append(targetCommit).append("> && "));
            filters.delete(filters.lastIndexOf(" && "), filters.length());
            filters.append(")");
        }

        StringBuilder queryBuilder = new StringBuilder(GET_MERGE_REQUESTS_QUERY.replace(FILTERS, filters.toString()));
        if(params.getSortBy().isPresent()) {
            queryBuilder.append(" ORDER BY ");

            if (params.sortAscending()) {
                queryBuilder.append("?").append(SORT_PRED_BINDING);
            } else {
                queryBuilder.append("DESC(?").append(SORT_PRED_BINDING).append(")");
            }
        }
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(queryBuilder.toString());
            return StreamSupport.stream(query.evaluate().spliterator(), false)
                    .map(bindings -> Bindings.requiredResource(bindings, REQUEST_ID_BINDING))
                    .map(resource -> catalogUtils.getExpectedObject(resource, mergeRequestFactory, conn))
                    .collect(Collectors.toList());
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

    @Override
    public void deleteMergeRequest(Resource requestId) {
        try (RepositoryConnection conn = getCatalogRepo().getConnection()) {
            catalogUtils.validateResource(requestId, mergeRequestFactory.getTypeIRI(), conn);
            catalogUtils.remove(requestId, conn);
        }
    }

    private Repository getCatalogRepo() {
        return repositoryManager.getRepository(catalogManager.getRepositoryId()).orElseThrow(() ->
                new IllegalStateException("Cannot retrieve Catalog repository"));
    }
}
