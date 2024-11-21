package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.GraphRevision;
import com.mobi.catalog.api.ontologies.mcat.GraphRevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.TagFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.BooleanQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import static org.eclipse.rdf4j.common.iteration.Iterations.asSet;

@Component
public class SimpleCommitManager implements CommitManager {

    private static final Logger log = LoggerFactory.getLogger(SimpleCommitManager.class);
    private static final String USER_BINDING = "user";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";
    private static final String BRANCH_BINDING = "branch";
    private static final String PARENT_BINDING = "parent";
    private static final String ENTITY_BINDING = "entity";
    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String GET_ALL_IN_PROGRESS_COMMIT_IRIS;
    private static final String VERSIONED_RDF_RECORD_IRI_QUERY;
    private static final String COMMIT_IN_RECORD;
    private static final String GET_COMMIT_CHAIN;
    private static final String GET_COMMIT_ENTITY_CHAIN;
    private static final String ADDITIONS_NOT_SET_ON_COMMIT = "Additions not set on Commit ";
    private static final String DELETIONS_NOT_SET_ON_COMMIT = "Deletions not set on Commit ";

    static {
        try {
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCommitManager.class
                            .getResourceAsStream("/commit/get-in-progress-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_IN_PROGRESS_COMMIT_IRIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCommitManager.class
                            .getResourceAsStream("/commit/get-all-in-progress-commit-iris.rq")),
                    StandardCharsets.UTF_8
            );
            VERSIONED_RDF_RECORD_IRI_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCommitManager.class
                            .getResourceAsStream("/commit/get-record-from-branch.rq")),
                    StandardCharsets.UTF_8
            );
            COMMIT_IN_RECORD = IOUtils.toString(
                    Objects.requireNonNull(
                            SimpleCommitManager.class.getResourceAsStream("/commit/commit-in-record.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(
                            SimpleCommitManager.class.getResourceAsStream("/commit/get-commit-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_ENTITY_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(
                            SimpleCommitManager.class.getResourceAsStream("/commit/get-commit-entity-chain.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    RevisionManager revisionManager;

    @Reference
    VersionManager versionManager;

    @Reference
    ThingManager thingManager;

    @Reference
    CommitFactory commitFactory;

    @Reference
    RevisionFactory revisionFactory;

    @Reference
    BranchFactory branchFactory;

    @Reference
    VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Reference
    InProgressCommitFactory inProgressCommitFactory;

    @Reference
    GraphRevisionFactory graphRevisionFactory;

    @Reference
    TagFactory tagFactory;

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        if (ConnectionUtils.containsContext(conn, commit.getResource())) {
            throw thingManager.throwAlreadyExists(commit.getResource(), commitFactory);
        }

        Optional<Resource> recordOpt = getRecordFromBranch(branch, conn);
        recordOpt.ifPresent(recordId -> {
            conn.getStatements(recordId, vf.createIRI(_Thing.modified_IRI), null)
                    .forEach(conn::remove);
            conn.add(recordId, vf.createIRI(_Thing.modified_IRI), vf.createLiteral(OffsetDateTime.now()), recordId);
        });

        branch.setHead(commit);
        branch.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        thingManager.updateObject(branch, conn);
        thingManager.addObject(commit, conn);
    }

    @Override
    public void addInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                    InProgressCommit inProgressCommit, RepositoryConnection conn) {
        Resource userIRI = (Resource) inProgressCommit.getProperty(PROV.WAS_ASSOCIATED_WITH)
                .orElseThrow(() -> new IllegalArgumentException("User not set on InProgressCommit "
                        + inProgressCommit.getResource()));
        if (getInProgressCommitIRI(versionedRDFRecordId, userIRI, conn).isPresent()) {
            throw new IllegalStateException("User " + userIRI + " already has an InProgressCommit for Record "
                    + versionedRDFRecordId);
        }
        VersionedRDFRecord record = recordManager.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                conn);
        if (ConnectionUtils.containsContext(conn, inProgressCommit.getResource())) {
            throw thingManager.throwAlreadyExists(inProgressCommit.getResource(), inProgressCommitFactory);
        }
        inProgressCommit.setOnVersionedRDFRecord(record);
        thingManager.addObject(inProgressCommit, conn);
    }

    @Override
    public boolean commitInRecord(Resource recordId, Resource commitId, RepositoryConnection conn) {
        BooleanQuery query = conn.prepareBooleanQuery(COMMIT_IN_RECORD);
        query.setBinding(RECORD_BINDING, recordId);
        query.setBinding(COMMIT_BINDING, commitId);
        return query.evaluate();
    }

    @Override
    public Commit createCommit(@Nonnull InProgressCommit inProgressCommit, @Nonnull String message, Commit baseCommit,
                               Commit auxCommit, boolean masterCommit) {
        if (auxCommit != null && baseCommit == null) {
            throw new IllegalArgumentException("Commit must have a base commit in order to have an auxiliary commit");
        }
        Resource revisionIRI = getRevisionValue(inProgressCommit);
        Value user = getCommitUser(inProgressCommit);

        Commit commit = commitFactory.createNew(vf.createIRI(Catalogs.COMMIT_NAMESPACE + UUID.randomUUID()));
        commit.setProperty(revisionIRI, PROV.GENERATED);
        commit.setProperty(vf.createLiteral(OffsetDateTime.now()), PROV.AT_TIME);
        commit.setProperty(vf.createLiteral(message), DCTERMS.TITLE);
        commit.setProperty(user, PROV.WAS_ASSOCIATED_WITH);

        if (!masterCommit) {
            commit.getModel().addAll(inProgressCommit.getModel().filter(revisionIRI, null, null));
        }
        if (masterCommit && baseCommit != null) {
            commit.setBaseCommit(baseCommit);
        } else if (!masterCommit && baseCommit != null) {
            commit.setBranchCommit(baseCommit);
        }
        if (auxCommit != null) {
            commit.setAuxiliaryCommit(auxCommit);
        }
        return commit;
    }

    private Resource getRevisionValue(Commit commit) {
        return (Resource) commit.getProperty(PROV.GENERATED)
                .orElseThrow(() -> new IllegalStateException(String.format("Commit %s does not contain a revision",
                        commit.getResource().stringValue())));
    }

    private Value getCommitUser(Commit commit) {
        return commit.getProperty(PROV.WAS_ASSOCIATED_WITH)
                .orElseThrow(() -> new IllegalStateException(String.format("InProgressCommit %s does not contain a "
                        + "user", commit.getResource().stringValue())));
    }

    @Override
    public InProgressCommit createInProgressCommit(User user) {
        UUID uuid = UUID.randomUUID();
        Revision revision = revisionManager.createRevision(uuid);

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(
                Catalogs.IN_PROGRESS_COMMIT_NAMESPACE + uuid));
        inProgressCommit.setProperty(user.getResource(), PROV.WAS_ASSOCIATED_WITH);
        inProgressCommit.setProperty(revision.getResource(), PROV.GENERATED);
        inProgressCommit.getModel().addAll(revision.getModel());

        return inProgressCommit;
    }

    @Override
    public InProgressCommit createInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                                   @Nullable File additionsFile, @Nullable File deletionsFile,
                                                   RepositoryConnection conn) {
        InProgressCommit inProgressCommit = createInProgressCommit(user);
        addInProgressCommit(catalogId, versionedRDFRecordId, inProgressCommit, conn);
        Resource resource = inProgressCommit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, inProgressCommit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException(ADDITIONS_NOT_SET_ON_COMMIT + inProgressCommit.getResource()));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException(DELETIONS_NOT_SET_ON_COMMIT + inProgressCommit.getResource()));

        try {
            if (additionsFile != null) {
                conn.add(additionsFile, additionsGraph);
                additionsFile.delete();
            }
            if (deletionsFile != null) {
                conn.add(deletionsFile, deletionsGraph);
                deletionsFile.delete();
            }

            return inProgressCommit;
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Optional<Commit> getCommit(Resource commitId, RepositoryConnection conn) {
        long start = System.currentTimeMillis();
        Optional<Commit> rtn;
        try {
            rtn = thingManager.optObject(commitId, commitFactory, conn);
        } finally {
            log.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
        return rtn;
    }

    @Override
    public Optional<Commit> getCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                      Resource commitId, RepositoryConnection conn) {
        long start = System.currentTimeMillis();
        Optional<Commit> rtn = Optional.empty();
        try {
            branchManager.validateBranch(catalogId, versionedRDFRecordId, branchId, conn);
            if (commitInBranch(branchId, commitId, conn)) {
                rtn = Optional.of(thingManager.getExpectedObject(commitId, commitFactory, conn));
            }
        } finally {
            log.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
        return rtn;
    }

    @Override
    public List<Commit> getCommitChain(Resource commitId, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        return getCommitChain(commitId, false, conn).stream()
                .map(resource -> thingManager.getExpectedObject(resource, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Commit> getCommitChain(Resource commitId, Resource targetId, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        thingManager.validateResource(targetId, commitFactory.getTypeIRI(), conn);
        return getDifferenceChain(commitId, targetId, false, conn).stream()
                .map(resource -> thingManager.getExpectedObject(resource, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                       RepositoryConnection conn) {
        Branch branch = branchManager.getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return getCommitChain(head, false, conn).stream()
                .map(resource -> thingManager.getExpectedObject(resource, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Resource> getCommitChain(Resource commitId, boolean asc, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, asc, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    @Override
    public List<Commit> getCommitEntityChain(Resource commitId, Resource entityId, RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        return getEntityCommitChain(commitId, entityId, conn).stream()
                .map(resource -> thingManager.getExpectedObject(resource, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Commit> getCommitEntityChain(Resource commitId, Resource targetId, Resource entityId,
                                             RepositoryConnection conn) {
        thingManager.validateResource(commitId, commitFactory.getTypeIRI(), conn);
        thingManager.validateResource(targetId, commitFactory.getTypeIRI(), conn);

        final List<Resource> sourceCommits = getEntityCommitChain(commitId, entityId, conn);
        final List<Resource> targetCommits = getEntityCommitChain(targetId, entityId, conn);

        final List<Resource> commonCommits = new ArrayList<>(sourceCommits);
        commonCommits.retainAll(targetCommits);

        sourceCommits.removeAll(commonCommits);

        return sourceCommits.stream()
                .map(resource -> thingManager.getExpectedObject(resource, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Commit> getDifferenceChain(Resource catalogId, Resource versionedRDFRecordId, Resource sourceBranchId,
                                           final Resource targetBranchId, RepositoryConnection conn) {
        Branch sourceBranch = branchManager.getBranch(catalogId, versionedRDFRecordId, sourceBranchId, branchFactory,
                conn);
        Resource sourceHead = getHeadCommitIRI(sourceBranch);

        Branch targetBranch = branchManager.getBranch(catalogId, versionedRDFRecordId, targetBranchId, branchFactory,
                conn);
        Resource targetHead = getHeadCommitIRI(targetBranch);

        return getDifferenceChain(sourceHead, targetHead, false, conn).stream()
                .map(res -> thingManager.getExpectedObject(res, commitFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public List<Resource> getDifferenceChain(final Resource sourceCommitId, final Resource targetCommitId,
                                             boolean asc, final RepositoryConnection conn) {
        thingManager.validateResource(sourceCommitId, commitFactory.getTypeIRI(), conn);
        thingManager.validateResource(targetCommitId, commitFactory.getTypeIRI(), conn);

        final List<Resource> sourceCommits = getCommitChain(sourceCommitId, true, conn);
        final List<Resource> targetCommits = getCommitChain(targetCommitId, true, conn);

        final List<Resource> commonCommits = new ArrayList<>(sourceCommits);
        commonCommits.retainAll(targetCommits);

        sourceCommits.removeAll(commonCommits);

        if (!asc) {
            Collections.reverse(sourceCommits);
        }

        return sourceCommits;
    }

    @Override
    public Commit getHeadCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                RepositoryConnection conn) {
        branchManager.validateBranch(catalogId, versionedRDFRecordId, branchId, conn);
        Branch branch = thingManager.getExpectedObject(branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return thingManager.getExpectedObject(head, commitFactory, conn);
    }

    @Override
    public Optional<Commit> getHeadCommitFromBranch(Branch branch, RepositoryConnection conn) {
        return branch.getHead_resource().flatMap(resource -> thingManager.optObject(resource, commitFactory, conn));
    }

    @Override
    public Resource getHeadCommitIRI(Branch branch) {
        return branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch " + branch.getResource()
                + " does not have a head Commit set"));
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn) {
        Resource commitId = getInProgressCommitIRI(recordId, userId, conn).orElseThrow(() ->
                new IllegalArgumentException("InProgressCommit not found"));
        return thingManager.getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                                RepositoryConnection conn) {
        validateInProgressCommit(catalogId, recordId, commitId, conn);
        return thingManager.getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public Optional<InProgressCommit> getInProgressCommitOpt(Resource catalogId, Resource versionedRDFRecordId,
                                                             User user, RepositoryConnection conn) {
        recordManager.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        return getInProgressCommitIRI(versionedRDFRecordId, user.getResource(), conn).flatMap(resource ->
                thingManager.optObject(resource, inProgressCommitFactory, conn));
    }

    @Override
    public List<InProgressCommit> getInProgressCommits(User user, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_ALL_IN_PROGRESS_COMMIT_IRIS);
        query.setBinding(USER_BINDING, user.getResource());
        try (TupleQueryResult queryResult = query.evaluate()) {
            List<Resource> inProgressCommitIRIs = new ArrayList<>();
            queryResult.forEach(bindings -> inProgressCommitIRIs.add(Bindings.requiredResource(bindings,
                    COMMIT_BINDING)));
            return inProgressCommitIRIs
                    .stream()
                    .map(resource -> thingManager.getExpectedObject(resource, inProgressCommitFactory, conn))
                    .toList();
        }
    }

    @Override
    public Commit getTaggedCommit(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                  RepositoryConnection conn) {
        versionManager.validateVersion(catalogId, versionedRecordId, versionId, conn);
        Tag tag = thingManager.getExpectedObject(versionId, tagFactory, conn);
        Resource commitId = tag.getCommit_resource().orElseThrow(() ->
                new IllegalStateException("Tag " + versionId + " does not have a Commit set"));
        return thingManager.getExpectedObject(commitId, commitFactory, conn);
    }

    @Override
    public void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                       RepositoryConnection conn) {
        recordManager.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = getInProgressCommit(versionedRDFRecordId, user.getResource(), conn);
        removeInProgressCommit(commit, conn);
    }

    @Override
    public void removeInProgressCommit(Resource inProgressCommitId, RepositoryConnection conn) {
        InProgressCommit commit = thingManager.getObject(inProgressCommitId, inProgressCommitFactory, conn);
        removeInProgressCommit(commit, conn);
    }

    @Override
    public void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn) {
        boolean isActive = conn.isActive();
        if (!isActive) {
            conn.begin();
        }

        Revision revision = revisionManager.getRevisionFromCommitId(commit.getResource(), conn);
        thingManager.removeObject(commit, conn);

        Set<Resource> graphs = new HashSet<>();
        revision.getAdditions().ifPresent(graphs::add);
        revision.getDeletions().ifPresent(graphs::add);
        revision.getGraphRevision().forEach(graphRevision -> {
            graphRevision.getAdditions().ifPresent(graphs::add);
            graphRevision.getDeletions().ifPresent(graphs::add);
        });

        graphs.forEach(resource -> {
             if (!conn.hasStatement(null, null, resource, false)) {
                 thingManager.remove(resource, conn);
             }
        });

        if (!isActive) {
            conn.commit();
        }
    }

    @Override
    public void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        updateCommit(commit.getResource(), revision, additions, deletions, conn);
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource commitId,
                                       @Nullable Model additions, @Nullable Model deletions,
                                       RepositoryConnection conn) {
        validateInProgressCommit(catalogId, versionedRDFRecordId, commitId, conn);
        Revision revision = revisionManager.getRevisionFromCommitId(commitId, conn);
        updateCommit(commitId, revision, additions, deletions, conn);
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                       @Nullable Model additions, @Nullable Model deletions,
                                       RepositoryConnection conn) {
        recordManager.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        Optional<Resource> inProgressCommitIri = getInProgressCommitIRI(versionedRDFRecordId,
                user.getResource(), conn);
        if (inProgressCommitIri.isPresent()) {
            InProgressCommit commit = thingManager.getExpectedObject(inProgressCommitIri.get(), inProgressCommitFactory,
                    conn);
            updateCommit(commit, additions, deletions, conn);
        } else {
            InProgressCommit commit = createInProgressCommit(user);
            commit.setOnVersionedRDFRecord(versionedRDFRecordFactory.createNew(versionedRDFRecordId));
            thingManager.addObject(commit, conn);
            updateCommit(commit, additions, deletions, conn);
        }
    }

    @Override
    public void validateCommitPath(Resource catalogId, Resource recordId, Resource branchId, Resource commitId,
                                   RepositoryConnection conn) {
        branchManager.validateBranch(catalogId, recordId, branchId, conn);
        if (!commitInBranch(branchId, commitId, conn)) {
            throw thingManager.throwDoesNotBelong(commitId, commitFactory, branchId, branchFactory);
        }
    }

    boolean commitInBranch(Resource branchId, Resource commitId, RepositoryConnection conn) {
        Branch branch = thingManager.getExpectedObject(branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return (head.equals(commitId) || getCommitChain(head, false, conn).contains(commitId));
    }

    Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_IN_PROGRESS_COMMIT);
        query.setBinding(USER_BINDING, userId);
        query.setBinding(RECORD_BINDING, recordId);
        TupleQueryResult queryResult = query.evaluate();
        if (queryResult.hasNext()) {
            BindingSet bindingSet = queryResult.next();
            queryResult.close();
            return Optional.of(Bindings.requiredResource(bindingSet, COMMIT_BINDING));
        } else {
            return Optional.empty();
        }
    }

    void updateCommit(Resource commitId, Revision revision, @Nullable Model additions,
                      @Nullable Model deletions, RepositoryConnection conn) {
        if (additions != null && deletions != null) {
            Model commonStatements = mf.createEmptyModel();
            commonStatements.addAll(additions);
            commonStatements.retainAll(deletions);
            additions.removeAll(commonStatements);
            deletions.removeAll(commonStatements);
        }

        // Map of revisionedGraph -> GraphRevision resources
        Map<Resource, Resource> knownGraphs = new HashMap<>();
        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph()
                    .orElseThrow(() -> new IllegalStateException("Could not retrieve expected RevisionedGraph."));
            knownGraphs.put(graph, graphRevision.getResource());
        });

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException(ADDITIONS_NOT_SET_ON_COMMIT + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException(DELETIONS_NOT_SET_ON_COMMIT + commitId));

        Model filteredAdditions = additions == null ? null : additions.filter(null, null, null, (Resource) null);
        Model filteredDeletions = deletions == null ? null : deletions.filter(null, null, null, (Resource) null);
        addChanges(additionsGraph, deletionsGraph, filteredAdditions, conn);
        addChanges(deletionsGraph, additionsGraph, filteredDeletions, conn);

        Set<Resource> graphs = new HashSet<>();
        if (additions != null) {
            graphs.addAll(additions.contexts());
        }
        if (deletions != null) {
            graphs.addAll(deletions.contexts());
        }
        graphs.remove(null);
        graphs.forEach(modifiedGraph -> {
            if (knownGraphs.containsKey(modifiedGraph)) {
                GraphRevision graphRevision = graphRevisionFactory
                        .getExisting(knownGraphs.get(modifiedGraph), revision.getModel())
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve expected GraphRevision."));

                IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                        new IllegalStateException(ADDITIONS_NOT_SET_ON_COMMIT + commitId + " for graph "
                                + modifiedGraph));
                IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                        new IllegalStateException(DELETIONS_NOT_SET_ON_COMMIT + commitId + " for graph "
                                + modifiedGraph));

                Model filteredGraphAdditions = additions == null ? null :
                        additions.filter(null, null, null, modifiedGraph);
                Model filteredGraphDeletions = deletions == null ? null :
                        deletions.filter(null, null, null, modifiedGraph);
                addChanges(adds, dels, filteredGraphAdditions, conn);
                addChanges(dels, adds, filteredGraphDeletions, conn);
            } else {
                Resource graphRevisionResource = vf.createBNode();
                GraphRevision graphRevision = graphRevisionFactory.createNew(graphRevisionResource);
                graphRevision.setRevisionedGraph(modifiedGraph);

                String commitHash = vf.createIRI(commitId.stringValue()).getLocalName();
                String changesContextLocalName;
                changesContextLocalName = commitHash + "%00" + URLEncoder.encode(modifiedGraph.stringValue(),
                        StandardCharsets.UTF_8);

                IRI additionsIRI = vf.createIRI(Catalogs.DELTAS_NAMESPACE + changesContextLocalName + "-A");
                IRI deletionsIRI = vf.createIRI(Catalogs.DELTAS_NAMESPACE + changesContextLocalName + "-B");

                graphRevision.setAdditions(additionsIRI);
                graphRevision.setDeletions(deletionsIRI);

                conn.add(revision.getResource(), vf.createIRI(Revision.graphRevision_IRI), graphRevisionResource,
                        commitId);
                conn.add(graphRevision.getModel(), commitId);

                Model filteredGraphAdditions = additions == null ? null :
                        additions.filter(null, null, null, modifiedGraph);
                Model filteredGraphDeletions = deletions == null ? null :
                        deletions.filter(null, null, null, modifiedGraph);
                addChanges(additionsIRI, deletionsIRI, filteredGraphAdditions, conn);
                addChanges(deletionsIRI, additionsIRI, filteredGraphDeletions, conn);
            }
        });
    }

    void validateInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                  RepositoryConnection conn) {
        recordManager.validateRecord(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = thingManager.getObject(commitId, inProgressCommitFactory, conn);
        Resource onRecord = commit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                new IllegalStateException("Record was not set on InProgressCommit " + commitId));
        if (!onRecord.equals(recordId)) {
            throw thingManager.throwDoesNotBelong(commitId, inProgressCommitFactory, recordId,
                    versionedRDFRecordFactory);
        }
    }

    /**
     * Adds the provided statements as changes in the target named graph. If a statement in the changes exists in the
     * opposite named graph, they are removed from that named graph and not added to the target.
     *
     * @param targetNamedGraph   A Resource identifying the target named graph for the changes. Assumed to be the
     *                           additions or deletions named graph of a Commit.
     * @param oppositeNamedGraph A Resource identifying the opposite named graph from the target. For example, the
     *                           opposite of a deletions named graph is the additions and vice versa.
     * @param changes            The statements which represent changes to the named graph.
     * @param conn               A RepositoryConnection to use for lookup.
     */
    protected void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                              RepositoryConnection conn) {
        if (changes == null) {
            return;
        }

        Set<Statement> oppositeGraphStatements = QueryResults.asSet(conn.getStatements(null,
                null, null, oppositeNamedGraph));

        boolean isActive = conn.isActive();
        if (!isActive) {
            conn.begin();
        }

        changes.forEach(statement -> {
            Statement withContext = vf.createStatement(statement.getSubject(), statement.getPredicate(),
                    statement.getObject(), oppositeNamedGraph);
            if (!oppositeGraphStatements.contains(withContext)) {
                conn.add(statement, targetNamedGraph);
            } else {
                conn.remove(withContext, oppositeNamedGraph);
                oppositeGraphStatements.remove(withContext);
            }
        });

        if (!isActive) {
            conn.commit();
        }
    }

    /**
     * Gets a List which represents the commit chain from the initial commit to the specified commit in either
     * ascending or descending date order. The resulting Commit is then filtered by an Entity IRI to return Commits
     * containing the Entity IRI in the additions or deletions of a commit.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param entityId The Resource identifying the Entity that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @return List of Resource ids for the requested Commits.
     */
    private List<Resource> getEntityCommitChain(Resource commitId, Resource entityId,
                                                RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, entityId, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    /**
     * Gets an iterator which contains all the Commit ids in the specified direction, either ascending or descending by
     * date. If descending, the provided Resource identifying a Commit will be first.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether the iterator should be ascending by date
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, boolean asc, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        try (TupleQueryResult result = query.evaluate()) {
            LinkedList<Resource> commits = new LinkedList<>();
            result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
            commits.addFirst(commitId);
            return asc ? commits.descendingIterator() : commits.iterator();
        }
    }

    /**
     * Gets an iterator which contains all the Commit ids, filtered by a Commit containing the Entity id in its
     * additions or deletions.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param entityId The Resource identifying the Entity that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, Resource entityId,
                                                      RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_ENTITY_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        query.setBinding(ENTITY_BINDING, entityId);
        try (TupleQueryResult result = query.evaluate()) {
            LinkedList<Resource> commits = new LinkedList<>();
            result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
            return commits.iterator();
        }
    }

    private Optional<Resource> getRecordFromBranch(Branch branch, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(VERSIONED_RDF_RECORD_IRI_QUERY);
        query.setBinding(BRANCH_BINDING, branch.getResource());
        TupleQueryResult result = query.evaluate();
        if (!result.hasNext()) {
            return Optional.empty();
        }
        BindingSet bindingSet = result.next();
        result.close();
        return Optional.of(Bindings.requiredResource(bindingSet, RECORD_BINDING));
    }
}
