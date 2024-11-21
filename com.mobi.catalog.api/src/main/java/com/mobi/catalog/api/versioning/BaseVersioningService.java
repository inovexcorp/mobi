package com.mobi.catalog.api.versioning;

/*-
 * #%L
 * com.mobi.catalog.api
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
import com.mobi.catalog.api.CatalogTopics;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Bindings;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;

public abstract class BaseVersioningService<T extends VersionedRDFRecord> implements VersioningService<T> {
    @Reference
    public BranchFactory branchFactory;

    @Reference
    public CommitFactory commitFactory;

    @Reference
    public CommitManager commitManager;

    @Reference
    public RevisionManager revisionManager;

    @Reference
    public ThingManager thingManager;

    @Reference
    public BranchManager branchManager;

    @Reference
    public CompiledResourceManager compiledResourceManager;

    @Reference
    public DifferenceManager differenceManager;

    @Reference
    public CatalogConfigProvider configProvider;

    public EventAdmin eventAdmin;

    private static final String GET_BRANCHING_COMMIT_MASTER;
    private static final String GET_BRANCHING_COMMIT_FORWARD;
    private static final String GET_COMMIT_DELTAS;
    private static final String SOURCE_HEAD = "sourceHead";
    private static final String ADDITIONS = "Additions";
    private static final String DELETIONS = "Deletions";
    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final ModelFactory mf = new DynamicModelFactory();

    static {
        try {
            GET_BRANCHING_COMMIT_MASTER = IOUtils.toString(
                    Objects.requireNonNull(BaseVersioningService.class
                            .getResourceAsStream("/get-branching-commit-master.rq")),
                    StandardCharsets.UTF_8
            );
            GET_BRANCHING_COMMIT_FORWARD = IOUtils.toString(
                    Objects.requireNonNull(BaseVersioningService.class
                            .getResourceAsStream("/get-branching-commit-forward.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_DELTAS = IOUtils.toString(
                    Objects.requireNonNull(BaseVersioningService.class
                            .getResourceAsStream("/get-commit-deltas.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Resource addMasterCommit(VersionedRDFRecord record, MasterBranch branch, User user, String message,
                                    RepositoryConnection conn) {
        // flip the deltas when committing to master
        BiFunction<Commit, InProgressCommit, Commit> getCommit = (head, inProgressCommit) -> {
            Commit commit = commitManager.createCommit(inProgressCommit, message, head, null, true);
            IRI revisionIRI = getRevisionValue(inProgressCommit);

            Model revisionModel = mf.createEmptyModel();
            // Add all revision statements from InProgressCommit
            revisionModel.addAll(inProgressCommit.getModel().filter(revisionIRI, null, null));
            if (head != null) {
                updateBaseCommit(revisionModel, revisionIRI, inProgressCommit, head,
                        branchManager.getHeadGraph(branch), conn);
            }
            commit.getModel().addAll(revisionModel);

            return commit;
        };

        Resource commitIRI = addCommit(record, branch, user, getCommit, conn);
        Commit newCommit = commitManager.getCommit(commitIRI, conn).orElseThrow(
                () -> new IllegalStateException("Commit " + commitIRI.stringValue() + " could not be found"));
        newCommit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri -> {
                    updateMasterRecordIRI(record.getResource(), newCommit, conn);
                    sendCommitEvent(record.getResource(), branch.getResource(), userIri, user.getResource());
                });
        return commitIRI;
    }

    @Override
    public Resource addBranchCommit(VersionedRDFRecord record, Branch branch, User user, String message,
                                    RepositoryConnection conn) {
        if (branch instanceof MasterBranch
                || branch.getModel().contains(branch.getResource(), RDF.TYPE, vf.createIRI(MasterBranch.TYPE))) {
            throw new IllegalArgumentException("Provided branch must not be a MasterBranch");
        }
        BiFunction<Commit, InProgressCommit, Commit> getCommit = (head, inProgressCommit) ->
                commitManager.createCommit(inProgressCommit, message, head, null, false);
        Resource commitIRI = addCommit(record, branch, user, getCommit, conn);
        Commit newCommit = commitManager.getCommit(commitIRI, conn).orElseThrow(
                () -> new IllegalStateException("Commit " + commitIRI.stringValue() + " could not be found"));
        newCommit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri ->
                        sendCommitEvent(record.getResource(), branch.getResource(), userIri, user.getResource()));
        return commitIRI;
    }

    private Resource addCommit(VersionedRDFRecord record, Branch branch, User user,
                               BiFunction<Commit, InProgressCommit, Commit> getCommit, RepositoryConnection conn) {
        Commit head = commitManager.getHeadCommitFromBranch(branch, conn).orElse(null);
        InProgressCommit inProgressCommit = commitManager.getInProgressCommit(record.getResource(), user.getResource(),
                conn);
        Commit newCommit = getCommit.apply(head, inProgressCommit);

        if (head != null) {
            Revision headRevision = revisionManager.getGeneratedRevision(head);
            Revision newCommitRevision = revisionManager.getGeneratedRevision(newCommit);
            newCommitRevision.setProperty(headRevision.getResource(), PROV.HAD_PRIMARY_SOURCE);
            newCommit.getModel().addAll(newCommitRevision.getModel());
        }

        commitManager.addCommit(branch, newCommit, conn);
        commitManager.removeInProgressCommit(inProgressCommit, conn);
        return newCommit.getResource();
    }

    @Override
    public Resource mergeIntoMaster(VersionedRDFRecord record, Branch sourceBranch, MasterBranch targetBranch,
                                    User user, Model additions, Model deletions, Map<Resource, Conflict> conflictMap,
                                    RepositoryConnection conn) {
        InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
        Commit baseCommit = getHeadCommit(targetBranch, "Target", conn);
        Commit auxCommit = getHeadCommit(sourceBranch, "Source", conn);
        Commit newCommit = commitManager.createCommit(inProgressCommit, getMergeMessage(sourceBranch, targetBranch),
                baseCommit, auxCommit, true);
        MergeRevisions mergeRevisions = handleMergeConflicts(additions, deletions, conflictMap, conn);
        Resource headGraph = branchManager.getHeadGraph(targetBranch);
        reverseDeltas(baseCommit.getResource(), auxCommit.getResource(), newCommit, inProgressCommit, headGraph,
                mergeRevisions, conn);
        // Update master headGraph
        additions.removeAll(mergeRevisions.keptEntityDoNotAdd);
        additions.removeAll(mergeRevisions.duplicateAddsToRemove);
        deletions.removeAll(mergeRevisions.duplicateDelsToRemove);
        conn.add(additions, headGraph);
        conn.remove(deletions, headGraph);
        if (mergeRevisions.display != null) {
            newCommit.setMergeDisplayRevision(mergeRevisions.display);
            newCommit.getModel().addAll(mergeRevisions.display.getModel());
        }
        commitManager.addCommit(targetBranch, newCommit, conn);

        updateMasterRecordIRI(record.getResource(), newCommit, conn);
        sendCommitEvent(record.getResource(), targetBranch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
    }

    private void reverseDeltas(Resource baseCommitIRI, Resource auxCommitIRI, Commit newCommit,
                               InProgressCommit inProgressCommit, Resource headGraph, MergeRevisions mergeRevisions,
                               RepositoryConnection conn) {
        Resource branchingResource = getBranchingCommit(baseCommitIRI, auxCommitIRI, GET_BRANCHING_COMMIT_MASTER, conn);
        TupleQuery getCommitDeltas = conn.prepareTupleQuery(GET_COMMIT_DELTAS);
        getCommitDeltas.setBinding(SOURCE_HEAD, auxCommitIRI);
        try (TupleQueryResult deltaResult = getCommitDeltas.evaluate()) {
            deltaResult.forEach(bindings -> handleCommitDeltas(bindings, branchingResource, headGraph, conn));
        }

        IRI ipcRevisionIRI = getRevisionValue(inProgressCommit);
        Model newCommitRevModel = inProgressCommit.getModel().filter(ipcRevisionIRI, null, null);

        // Update baseCommit and auxCommit revisions to contain the conflict resolutions
        Resource baseRevisionIRI = updateRevisionForConflicts(baseCommitIRI, mergeRevisions.base, conn);
        Resource auxRevisionIRI = updateRevisionForConflicts(auxCommitIRI, mergeRevisions.aux, conn);

        // Add revision pointers for merge commit
        newCommitRevModel.add(ipcRevisionIRI, PROV.HAD_PRIMARY_SOURCE, baseRevisionIRI);
        newCommitRevModel.add(ipcRevisionIRI, PROV.WAS_DERIVED_FROM, auxRevisionIRI);
        newCommit.getModel().addAll(newCommitRevModel);
    }
    
    private Resource updateRevisionForConflicts(Resource commitIRI, Revision newRevision, RepositoryConnection conn) {
        Commit commit = getHeadCommit(commitIRI, conn);
        IRI commitRevisionIRI = getRevisionValue(commit);

        IRI addIRI = vf.createIRI(Revision.additions_IRI);
        IRI delIRI = vf.createIRI(Revision.deletions_IRI);
        Model commitModel = commit.getModel();
        commitModel.remove(commitRevisionIRI, addIRI, null);
        commitModel.remove(commitRevisionIRI, delIRI, null);

        IRI conflictAddGraph = getDeltaValue(newRevision.getAdditions(), ADDITIONS, newRevision.getResource());
        IRI conflictDelGraph = getDeltaValue(newRevision.getDeletions(), DELETIONS, newRevision.getResource());
        commitModel.add(commitRevisionIRI, addIRI, conflictDelGraph);
        commitModel.add(commitRevisionIRI, delIRI, conflictAddGraph);
        thingManager.updateObject(commit, conn);
        return commitRevisionIRI;
    }

    private Resource getBranchingCommit(Resource baseCommitIRI, Resource auxCommitIRI, String query, RepositoryConnection conn) {
        // Figure out what commit the source branch (auxCommit) originally diverged from the target branch (baseCommit)
        TupleQuery getBranchingCommit = conn.prepareTupleQuery(query);
        getBranchingCommit.setBinding("targetHead", baseCommitIRI);
        getBranchingCommit.setBinding(SOURCE_HEAD, auxCommitIRI);
        try (TupleQueryResult branchingCommitResult = getBranchingCommit.evaluate()) {
            Optional<BindingSet> bindingSet = branchingCommitResult
                    .stream()
                    .findFirst();
            if (bindingSet.isPresent()) {
                // Branching commit is a prior commit in the target branch
                return Bindings.requiredResource(bindingSet.get(), "branchingCommit");
            } else {
                // Branching commit is the HEAD of target
                return baseCommitIRI;
            }
        }
    }

    private void handleCommitDeltas(BindingSet bindings, Resource branchingResource, Resource headGraph,
                                    RepositoryConnection conn) {
        // Get results of query
        Resource commitIRI = Bindings.requiredResource(bindings, "commit");
        Resource parentIRI = Bindings.requiredResource(bindings, "parent");
        Resource addGraph = Bindings.requiredResource(bindings, "fadd");
        Resource delGraph = Bindings.requiredResource(bindings, "fdel");

        // Retrieve commit and parent
        Commit parentCommit = getHeadCommit(parentIRI, conn);
        Commit commit = getHeadCommit(commitIRI, conn);
        // Change branchCommit pointer to baseCommit
        commit.clearBranchCommit();
        commit.setBaseCommit(parentCommit);
        // Get commit revision
        Revision commitRevision = revisionManager.getRevisionFromCommitId(commitIRI, conn);

        // Handle merged branches that exist in source branch
        // These are forward delta branches
        // Check that the commit has an auxCommit and that the auxCommit contains a branchCommit property
        // This indicates that it is not a merge of master into the sourceBranch
        // Recurse down the commit/branch structure
        Optional<Resource> commitAuxCommitResourceOpt = commit.getAuxiliaryCommit_resource();
        boolean removeGraphs = false;
        if (commitAuxCommitResourceOpt.isPresent()) {
            Commit auxCommit = commitManager.getCommit(commitAuxCommitResourceOpt.get(), conn)
                    .orElseThrow(() -> new IllegalStateException("Commit could not be found for "
                            + commitAuxCommitResourceOpt.get().stringValue()));

            // Forward branches
            boolean auxIsForwardCommit = auxCommit.getBranchCommit_resource().isPresent();
            if (auxIsForwardCommit) {
                Resource forwardBranchingResource = getBranchingCommit(commit.getResource(),
                        auxCommit.getResource(), GET_BRANCHING_COMMIT_FORWARD, conn);
                TupleQuery getCommitDeltas = conn.prepareTupleQuery(GET_COMMIT_DELTAS);
                getCommitDeltas.setBinding(SOURCE_HEAD, auxCommit.getResource());
                try (TupleQueryResult deltaResult = getCommitDeltas.evaluate()) {
                    deltaResult.forEach(forwardBindings ->
                            handleCommitDeltas(forwardBindings, forwardBranchingResource, headGraph, conn));
                }
            }

            // Handle any merge conflict resolutions that exist in the commit:
            //      - move prov:generated Revision to mcat:mergeDisplayRevision
            //      - move the additions/deletions graphs from forwardMerge*Revisions down to the appropriate base/aux
            //        commits
            if (commit.getForwardMergeBaseRevision_resource().isPresent()
                    && commit.getForwardMergeAuxRevision_resource().isPresent()) {
                Revision forwardMergeBaseRevision = revisionManager.getRevision(
                        commit.getForwardMergeBaseRevision_resource().get(), conn);
                Revision forwardMergeAuxRevision = revisionManager.getRevision(
                        commit.getForwardMergeAuxRevision_resource().get(), conn);

                commitRevision.clearHadPrimarySource();
                commitRevision.clearWasDerivedFrom();

                // Update models for commits to contain the appropriate additions/deletions graphs on Revisions
                // Retrieve forwardMerge*Revisions from commit to push down to corresponding base/aux commits

                Resource commitBaseCommitResource = commit.getBaseCommit_resource().orElseThrow(
                        () -> new IllegalStateException("Forward merge commit does not contain a baseCommit"));
                Commit baseCommit = getHeadCommit(commitBaseCommitResource, conn);
                if (baseCommit.getResource().equals(branchingResource)) {
                    addInfluencedRevision(commit, baseCommit, getDeltaValue(forwardMergeBaseRevision.getAdditions(), ADDITIONS,
                            forwardMergeBaseRevision.getResource()), getDeltaValue(forwardMergeBaseRevision.getDeletions(), DELETIONS,
                            forwardMergeBaseRevision.getResource()), commitRevision, conn);
                } else {
                    Revision baseCommitRevision = revisionManager.getRevisionFromCommitId(commitBaseCommitResource,
                            conn);
                    baseCommitRevision.setDeletions(getDeltaValue(forwardMergeBaseRevision.getAdditions(), ADDITIONS,
                            forwardMergeBaseRevision.getResource()));
                    baseCommitRevision.setAdditions(getDeltaValue(forwardMergeBaseRevision.getDeletions(), DELETIONS,
                            forwardMergeBaseRevision.getResource()));
                    baseCommit.getModel().remove(baseCommitRevision.getResource(), null, null);
                    baseCommit.getModel().addAll(baseCommitRevision.getModel());
                }
                commit = getHeadCommit(commitIRI, conn);
                // Clear the forwardMerge*Revisions on the commit
                commit.clearForwardMergeBaseRevision();
                commit.clearForwardMergeAuxRevision();
                commit.getModel().remove(forwardMergeBaseRevision.getResource(), null, null);

                Resource commitAuxCommitResource = commitAuxCommitResourceOpt.get();
                auxCommit = getHeadCommit(commitAuxCommitResource, conn);

                Revision auxCommitRevision;
                if (auxCommit.getBaseCommit_resource().isPresent() && !auxIsForwardCommit) {
                    // Merge of master into forward branch
                    auxCommitRevision = revisionManager.createRevision(UUID.randomUUID());
                    auxCommitRevision.setDeletions(getDeltaValue(forwardMergeAuxRevision.getAdditions(), ADDITIONS,
                            forwardMergeAuxRevision.getResource()));
                    auxCommitRevision.setAdditions(getDeltaValue(forwardMergeAuxRevision.getDeletions(), DELETIONS,
                            forwardMergeAuxRevision.getResource()));
                    auxCommit.getModel().addAll(auxCommitRevision.getModel());
                    auxCommit.setMasterMergeIntoBranchRevision(auxCommitRevision);
                } else {
                    // Normal branch merge
                    auxCommitRevision = revisionManager.getRevisionFromCommitId(commitAuxCommitResource,
                            conn);
                    auxCommitRevision.setDeletions(getDeltaValue(forwardMergeAuxRevision.getAdditions(), ADDITIONS,
                            forwardMergeAuxRevision.getResource()));
                    auxCommitRevision.setAdditions(getDeltaValue(forwardMergeAuxRevision.getDeletions(), DELETIONS,
                            forwardMergeAuxRevision.getResource()));
                    auxCommit.getModel().remove(auxCommitRevision.getResource(), null, null);
                    auxCommit.getModel().addAll(auxCommitRevision.getModel());
                }
                commitRevision = revisionManager.getRevisionFromCommitId(commit.getResource(), conn);
                commitRevision.clearProperty(PROV.WAS_DERIVED_FROM);
                commitRevision.setProperty(auxCommitRevision.getResource(), PROV.WAS_DERIVED_FROM);
                commit.getModel().remove(commitRevision.getResource(), null, null);
                commit.getModel().addAll(commitRevision.getModel());
                commit.getModel().remove(forwardMergeAuxRevision.getResource(), null, null);

                thingManager.updateObject(commit, conn);
                thingManager.updateObject(baseCommit, conn);
                thingManager.updateObject(auxCommit, conn);

                removeGraphs = true;

                // Update MasterBranch HEAD graph with display revision differences
                IRI commitRevAddGraph = getDeltaValue(commitRevision.getAdditions(), ADDITIONS,
                        commitRevision.getResource());
                IRI commitRevDelGraph = getDeltaValue(commitRevision.getDeletions(), DELETIONS,
                        commitRevision.getResource());
                conn.add(conn.getStatements(null, null, null, commitRevAddGraph), headGraph);
                conn.remove(conn.getStatements(null, null, null, commitRevDelGraph), headGraph);
            }
        } else if (parentIRI.equals(branchingResource)) {
            addInfluencedRevision(commit, parentCommit, (IRI) addGraph, (IRI) delGraph, commitRevision, conn);
        } else {
            // If the parent is not the branching commit set the revision add/del graphs to be reverse deltas from the
            // child commit's revision
            Revision parentRevision = revisionManager.getRevisionFromCommitId(parentIRI, conn);

            parentCommit.getModel().removeAll(parentRevision.getModel());
            parentRevision.setAdditions((IRI) delGraph);
            parentRevision.setDeletions((IRI) addGraph);
            parentCommit.getModel().addAll(parentRevision.getModel());
            thingManager.updateObject(parentCommit, conn);

            // Add pointer on commit revision to parent revision
            commitRevision.setProperty(parentRevision.getResource(), PROV.HAD_PRIMARY_SOURCE);
            commit.getModel().addAll(commitRevision.getModel());
        }
        // Change branchCommit pointer to baseCommit
        commit.clearBranchCommit();
        commit.setBaseCommit(parentCommit);
        thingManager.updateObject(commit, conn);

        // Update MasterBranch HEAD graph
        conn.add(conn.getStatements(null, null, null, addGraph), headGraph);
        conn.remove(conn.getStatements(null, null, null, delGraph), headGraph);

        if (removeGraphs) {
            // Delete forward merge commit revision graphs
            // No longer needed once merged into MASTER since the forwardMerge*Revisions' graphs handle calculation
            conn.remove((IRI) null, null, null, addGraph);
            conn.remove((IRI) null, null, null, delGraph);
        }
    }

    private void addInfluencedRevision(Commit commit, Commit parentCommit, IRI addGraph, IRI delGraph, Revision commitRevision, RepositoryConnection conn) {
        // If the parent is the branching commit, add a new Revision to the branching commit
        Revision branchCommitRevision = revisionManager.createRevision(UUID.randomUUID());
        branchCommitRevision.setAdditions(delGraph);
        branchCommitRevision.setDeletions(addGraph);

        parentCommit.addProperty(branchCommitRevision.getResource(), PROV.INFLUENCED);
        parentCommit.getModel().addAll(branchCommitRevision.getModel());
        thingManager.updateObject(parentCommit, conn);

        // Add pointer on commit revision to newly generated revision on branching commit
        commitRevision.clearProperty(PROV.HAD_PRIMARY_SOURCE);
        commit.getModel().remove(commitRevision.getResource(), null, null);
        commitRevision.setProperty(branchCommitRevision.getResource(), PROV.HAD_PRIMARY_SOURCE);
        commit.getModel().addAll(commitRevision.getModel());
        thingManager.updateObject(commit, conn);
    }

    private Commit getHeadCommit(Resource commitIRI, RepositoryConnection conn) {
        return commitManager.getCommit(commitIRI, conn).orElseThrow(
                () -> new IllegalStateException("Could not find commit " + commitIRI.stringValue()));
    }

    @Override
    public Resource mergeIntoBranch(VersionedRDFRecord record, Branch sourceBranch, Branch targetBranch, User user,
                                    Model additions, Model deletions, Map<Resource, Conflict> conflictMap,
                                    RepositoryConnection conn) {
        if (branchManager.isMasterBranch(record, targetBranch)) {
            throw new IllegalArgumentException("Target branch must not be MASTER branch");
        }
        InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
        Commit baseCommit = getHeadCommit(targetBranch, "Target", conn);
        Commit auxCommit = getHeadCommit(sourceBranch, "Source", conn);
        Commit newCommit = commitManager.createCommit(inProgressCommit, getMergeMessage(sourceBranch, targetBranch),
                baseCommit, auxCommit, false);

        IRI baseCommitRevisionIRI = getRevisionValue(baseCommit);
        IRI auxCommitRevisionIRI = getRevisionValue(auxCommit);
        Revision newCommitRevision = revisionManager.getGeneratedRevision(newCommit);
        newCommitRevision.setProperty(baseCommitRevisionIRI, PROV.HAD_PRIMARY_SOURCE);
        newCommitRevision.setProperty(auxCommitRevisionIRI, PROV.WAS_DERIVED_FROM);
        newCommit.getModel().addAll(newCommitRevision.getModel());

        MergeRevisions mergeRevisions = handleMergeConflicts(additions, deletions, conflictMap, conn);
        if (mergeRevisions.base != null && mergeRevisions.aux != null) {
            newCommit.setForwardMergeBaseRevision(mergeRevisions.base);
            newCommit.setForwardMergeAuxRevision(mergeRevisions.aux);
            newCommit.getModel().addAll(mergeRevisions.base.getModel());
            newCommit.getModel().addAll(mergeRevisions.aux.getModel());
            newCommit.setMergeDisplayRevision(mergeRevisions.display);
            newCommit.getModel().addAll(mergeRevisions.display.getModel());
            IRI additionsGraph = getDeltaValue(newCommitRevision.getAdditions(), ADDITIONS,
                    newCommitRevision.getResource());
            IRI deletionsGraph = getDeltaValue(newCommitRevision.getDeletions(), DELETIONS,
                    newCommitRevision.getResource());
            additions.removeAll(mergeRevisions.keptEntityDoNotAdd);
            additions.removeAll(mergeRevisions.duplicateAddsToRemove);
            deletions.removeAll(mergeRevisions.duplicateDelsToRemove);
            conn.add(additions, additionsGraph);
            conn.add(deletions, deletionsGraph);
        }

        commitManager.addCommit(targetBranch, newCommit, conn);

        sendCommitEvent(record.getResource(), targetBranch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
    }

    private MergeRevisions handleMergeConflicts(Model additions, Model deletions, Map<Resource, Conflict> conflictMap,
                                                RepositoryConnection conn) {
        if (!conflictMap.isEmpty()) {
            RevisionGraphs base = RevisionGraphs.createRevision(revisionManager); // right
            RevisionGraphs aux = RevisionGraphs.createRevision(revisionManager); // left

            Set<Resource> allSubs = new HashSet<>();
            allSubs.addAll(additions.subjects());
            allSubs.addAll(deletions.subjects());
            allSubs.addAll(conflictMap.keySet());

            // Kept entity case resolutions has superfluous addition that should not be added to the generated revision,
            // but can stay on the display revision for the merge
            Model keptEntityDoNotAdd = mf.createEmptyModel();

            // Duplicate additions/deletions statements should be tracked to be removed from the additions/deletions
            // and not applied to the head graph
            Model duplicateDelsToRemove = mf.createEmptyModel();
            Model duplicateAddsToRemove = mf.createEmptyModel();

            // Iterate over all subjects with conflicts
            allSubs.forEach(subject -> {
                Conflict conflict = conflictMap.get(subject);
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();

                boolean hasDuplicateAdds = duplicate(left.getAdditions(), right.getAdditions());
                boolean hasDuplicateDels = duplicate(left.getDeletions(), right.getDeletions());
                boolean leftAddsContainsSub = containsSubject(left.getAdditions(), subject);
                boolean leftDelsContainsSub = containsSubject(left.getDeletions(), subject);
                boolean rightAddsContainsSub = containsSubject(right.getAdditions(), subject);
                boolean rightDelsContainsSub = containsSubject(right.getDeletions(), subject);
                boolean leftDiffContainsSub = leftAddsContainsSub && leftDelsContainsSub;
                boolean rightDiffContainsSub = rightAddsContainsSub && rightDelsContainsSub;
                boolean isSubPredConflict = leftDiffContainsSub && rightDiffContainsSub;

                // NOTE: All conflict revision graphs will be flipped when merged into master
                if (hasDuplicateAdds && !isSubPredConflict) {
                    // Duplicate additions
                    conn.add(left.getAdditions().filter(subject, null, null), base.deletionsIRI, aux.deletionsIRI);
                    duplicateDelsToRemove.addAll(left.getAdditions().filter(subject, null, null));
                    deletions.addAll(duplicateDelsToRemove);
                } else if (hasDuplicateDels && !isSubPredConflict) {
                    // Duplicate deletions
                    conn.add(left.getDeletions().filter(subject, null, null), base.additionsIRI, aux.additionsIRI);
                    duplicateAddsToRemove.addAll(left.getDeletions().filter(subject, null, null));
                    additions.addAll(duplicateAddsToRemove);
                } else if (hasDuplicateAdds && hasDuplicateDels) {
                    // Duplicate additions
                    conn.add(left.getAdditions().filter(subject, null, null), base.deletionsIRI, aux.deletionsIRI);
                    duplicateDelsToRemove.addAll(left.getAdditions().filter(subject, null, null));
                    deletions.addAll(duplicateDelsToRemove);
                    // Duplicate deletions
                    conn.add(left.getDeletions().filter(subject, null, null), base.additionsIRI, aux.additionsIRI);
                    duplicateAddsToRemove.addAll(left.getDeletions().filter(subject, null, null));
                    additions.addAll(duplicateAddsToRemove);
                } else if (isSubPredConflict) {
                    // If both differences in conflict has additions AND deletions that contain the subject,
                    // then it is a sub/pred conflict

                    // Add original sub/pred to both reverse deletions graphs
                    Model original = left.getDeletions().filter(subject, null, null);
                    conn.add(original, base.additionsIRI, aux.additionsIRI);

                    // Add dismissed sub/pred to the dismissed side additions
                    Model dismissed = deletions.filter(subject, null, null);
                    if (Models.isSubset(dismissed, left.getAdditions())) {
                        conn.add(dismissed, aux.deletionsIRI);
                    } else if (Models.isSubset(dismissed, right.getAdditions())) {
                        conn.add(dismissed, base.deletionsIRI);
                    }
                } else {
                    // If only one difference in conflict has additions AND deletions that contain the subject, while
                    // only the DELETIONS in the other difference contains the subject, then it is a deleted entity
                    // conflict or DELETIONS are empty (new statement added)

                    if (containsSubject(additions, subject) && !containsSubject(deletions, subject)) {
                        // If provided additions contain subject (and deletions do not), it is the case where they are
                        // KEEPING the deleted entity
                        Model keptEntity = additions.filter(subject, null, null);

                        if (Models.isSubset(keptEntity, left.getDeletions())) {
                            // Add deleted statements to the kept side deletions
                            Model deleted = right.getDeletions().filter(subject, null, null);
                            keptEntityDoNotAdd.addAll(right.getDeletions().filter(subject, null, null));
                            conn.add(deleted, base.additionsIRI);
                            // Remove full entity from dismissed side
                            conn.add(keptEntity, aux.additionsIRI);
                        } else if (Models.isSubset(keptEntity, right.getDeletions())) {
                            // Add deleted statements to the kept side deletions
                            Model deleted = left.getDeletions().filter(subject, null, null);
                            keptEntityDoNotAdd.addAll(left.getDeletions().filter(subject, null, null));
                            conn.add(deleted, aux.additionsIRI);
                            // Remove full entity from dismissed side
                            conn.add(keptEntity, base.additionsIRI);
                        }

                    } else if (!containsSubject(additions, subject) && containsSubject(deletions, subject)) {
                        // If the additions do not contain the subject and the deletions contain the subject, it is the
                        // case where they are DELETING the entity

                        Model dismissed = deletions.filter(subject, null, null);
                        Statement dismissedStatement = dismissed.stream()
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException(
                                        "Conflict resolution deletions must contain statement with subject: "
                                                + subject.stringValue()));
                        Model original = null;
                        if (conflict.getLeftDifference().getAdditions().contains(dismissedStatement)) {
                            original = conflict.getLeftDifference()
                                    .getDeletions()
                                    .filter(subject, dismissedStatement.getPredicate(), null);
                        } else if (conflict.getRightDifference().getAdditions().contains(dismissedStatement)) {
                            original = conflict.getRightDifference()
                                    .getDeletions()
                                    .filter(subject, dismissedStatement.getPredicate(), null);
                        }

                        // Add original statement to both sides
                        conn.add(original, aux.additionsIRI);
                        conn.add(original, base.additionsIRI);

                        // Add added statement to dismissed side
                        if (Models.isSubset(dismissed, left.getAdditions())) {
                            conn.add(dismissed, aux.deletionsIRI);
                        } else if (Models.isSubset(dismissed, right.getAdditions())) {
                            conn.add(dismissed, base.deletionsIRI);
                        }
                    } else {
                        throw new IllegalArgumentException("Deleted entity conflict resolution is not in expected "
                                + "state");
                    }
                }
            });
            RevisionGraphs display = RevisionGraphs.createRevision(revisionManager);
            conn.add(additions, display.additionsIRI);
            conn.add(deletions, display.deletionsIRI);
            return new MergeRevisions(base.revision, aux.revision, display.revision, keptEntityDoNotAdd,
                    duplicateAddsToRemove, duplicateDelsToRemove);
        }
        return new MergeRevisions(revisionManager.createRevision(UUID.randomUUID()),
                revisionManager.createRevision(UUID.randomUUID()), revisionManager.createRevision(UUID.randomUUID()),
                mf.createEmptyModel(), mf.createEmptyModel(), mf.createEmptyModel());
    }

    private boolean containsSubject(Model model, Resource subject) {
        return model.subjects().contains(subject);
    }

    private boolean duplicate(Model m1, Model m2) {
        return !m1.isEmpty() && !m2.isEmpty() && Models.isomorphic(m1, m2);
    }

    private record RevisionGraphs(Revision revision, IRI additionsIRI, IRI deletionsIRI) {
        public static RevisionGraphs createRevision(RevisionManager revisionManager) {
            Revision revision = revisionManager.createRevision(UUID.randomUUID());

            // Flip additions/deletions graphs to conform to reverse delta formatting (-A vs -B)
            IRI additions = revision.getAdditions()
                    .orElseThrow(() -> new IllegalStateException("Revision must have an additions graph"));
            IRI deletions = revision.getDeletions()
                    .orElseThrow(() -> new IllegalStateException("Revision must have a deletions graph"));
            return new RevisionGraphs(revision, additions, deletions);
        }
    }

    private record MergeRevisions(Revision base, Revision aux, Revision display, Model keptEntityDoNotAdd,
                                  Model duplicateAddsToRemove, Model duplicateDelsToRemove) {}

    protected void updateMasterRecordIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
    }

    protected void sendCommitEvent(Resource record, Resource branch, Resource user, Resource newCommit) {
        if (eventAdmin != null) {
            Map<String, Object> eventProps = new HashMap<>();
            eventProps.put(CatalogTopics.PROPERTY_COMMIT, newCommit);
            eventProps.put(CatalogTopics.PROPERTY_USER, user);
            eventProps.put(CatalogTopics.PROPERTY_BRANCH, branch);
            eventProps.put(CatalogTopics.PROPERTY_RECORD, record);
            Event event = new Event(CatalogTopics.TOPIC_NAME, eventProps);
            eventAdmin.postEvent(event);
        }
    }

    private void updateBaseCommit(Model revisionModel, Resource revisionIRI, InProgressCommit inProgressCommit,
                                  Commit baseCommit, Resource headGraph, RepositoryConnection conn) {
        IRI additionsIRI = vf.createIRI(Revision.additions_IRI);
        IRI deletionsIRI = vf.createIRI(Revision.deletions_IRI);

        // Remove existing delta graph pointers
        revisionModel.remove(revisionIRI, additionsIRI, null);
        revisionModel.remove(revisionIRI, deletionsIRI, null);
        UUID uuid = UUID.randomUUID();
        revisionModel.add(revisionIRI, additionsIRI, vf.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-A"));
        revisionModel.add(revisionIRI, deletionsIRI, vf.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-B"));

        Resource baseRevisionIRI = getRevisionValue(baseCommit);
        conn.remove(baseRevisionIRI, additionsIRI, null);
        conn.remove(baseRevisionIRI, deletionsIRI, null);
        revisionModel.add(revisionIRI, PROV.HAD_PRIMARY_SOURCE, baseRevisionIRI);
        // Flip baseCommit pointers to revision
        inProgressCommit.getModel()
                .filter(revisionIRI, additionsIRI, null)
                .forEach(st -> {
                    // Make the baseCommit's Revision deletions point to the InProgressCommit's additions (Reverse Delta)
                    conn.add(baseRevisionIRI, deletionsIRI, st.getObject(), baseCommit.getResource());
                    // Apply the statements in the InProgressCommit additions to the state graph
                    RepositoryResult<Statement> additions = conn.getStatements(null, null, null, (Resource) st.getObject());
                    conn.add(additions, headGraph);
                });
        inProgressCommit.getModel()
                .filter(revisionIRI, deletionsIRI, null)
                .forEach(st -> {
                    // Make the baseCommit's Revision additions point to the InProgressCommit's deletions (Reverse Delta)
                    conn.add(baseRevisionIRI, additionsIRI, st.getObject(), baseCommit.getResource());
                    // Apply the statements in the InProgressCommit deletions to the state graph
                    RepositoryResult<Statement> deletions = conn.getStatements(null, null, null, (Resource) st.getObject());
                    conn.remove(deletions, headGraph);
                });
    }

    private IRI getRevisionValue(Commit commit) {
        return (IRI) commit.getProperty(PROV.GENERATED)
                .orElseThrow(() -> new IllegalStateException(String.format("Commit %s does not contain a revision",
                        commit.getResource().stringValue())));
    }

    private Commit getHeadCommit(Branch branch, String type, RepositoryConnection conn) {
        return commitManager.getHeadCommitFromBranch(branch, conn)
                .orElseThrow(() -> new IllegalStateException(type + " branch " + branch.getResource().stringValue()
                        + "does not have a HEAD commit set."));
    }

    private IRI getDeltaValue(Optional<IRI> deltaGraphOpt, String type, Resource revisionResource) {
        return deltaGraphOpt.orElseThrow(() -> new IllegalStateException(type + " not set on Revision "
                + revisionResource.stringValue()));
    }

    /**
     * Creates a message for the Commit that occurs as a result of a merge between the provided Branches.
     *
     * @param sourceBranch The source Branch of the merge.
     * @param targetBranch The target Branch of the merge.
     * @return A string message to use for the merge Commit.
     */
    private String getMergeMessage(Branch sourceBranch, Branch targetBranch) {
        String sourceName = sourceBranch.getProperty(DCTERMS.TITLE).orElse(sourceBranch.getResource()).stringValue();
        String targetName = targetBranch.getProperty(DCTERMS.TITLE).orElse(targetBranch.getResource()).stringValue();
        return "Merge of " + sourceName + " into " + targetName;
    }
}
