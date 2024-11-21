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

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.RevisionChain;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.BooleanQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class SimpleRevisionManager implements RevisionManager {
    private static final String COMMIT_BINDING = "commit";
    private static final String MERGE_COMMIT_BINDING = "mergeCommit";
    private static final String BRANCH_BINDING = "branch";
    private static final String HEAD_COMMIT_BINDING = "headCommit";
    private static final String MASTER_BRANCH_BINDING = "masterBranch";
    private static final String MASTER_HEAD_BINDING = "masterHead";
    private static final String PARENT_BINDING = "parent";
    private static final String REVISION_BINDING = "revision";
    private static final String GET_MASTER_CHAIN;
    private static final String GET_MASTER_HEAD;
    private static final String GET_MERGE_CHAINS;
    private static final String IS_BRANCH_COMMIT;
    private static final String GET_FORWARD_REVISION_CHAIN;
    private static final String GET_FORWARD_BRANCHING_COMMIT;
    private static final String GET_PREVIOUS_MASTER_MERGE;
    private static final String GET_LATEST_MASTER_MERGE_INTO_FORWARD;
    private static final String IS_COI_DOWN_BASE;
    private static final String ASK_CONFLICT_ADDS;
    private static final String ASK_CONFLICT_DELS;
    private static final String REVISION_ERROR_MESSAGE = "Could not retrieve revision from Commit.";

    static {
        try {
            GET_MASTER_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-master-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_MASTER_HEAD = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-master-head.rq")),
                    StandardCharsets.UTF_8
            );
            GET_MERGE_CHAINS = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-merge-chains.rq")),
                    StandardCharsets.UTF_8
            );
            IS_BRANCH_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/is-branch-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FORWARD_REVISION_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-forward-revision-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FORWARD_BRANCHING_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-forward-branching-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_PREVIOUS_MASTER_MERGE = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-previous-master-merge.rq")),
                    StandardCharsets.UTF_8
            );
            GET_LATEST_MASTER_MERGE_INTO_FORWARD = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/get-latest-master-merge-into-forward-chain.rq")),
                    StandardCharsets.UTF_8
            );
            IS_COI_DOWN_BASE = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/is-coi-down-base.rq")),
                    StandardCharsets.UTF_8
            );
            ASK_CONFLICT_ADDS = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/ask-conflict-adds.rq")),
                    StandardCharsets.UTF_8
            );
            ASK_CONFLICT_DELS = IOUtils.toString(
                    Objects.requireNonNull(SimpleRevisionManager.class
                            .getResourceAsStream("/revision/ask-conflict-dels.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    ThingManager thingManager;

    @Reference
    CommitFactory commitFactory;

    @Reference
    RevisionFactory revisionFactory;

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    @Override
    public Revision createRevision(UUID uuid) {
        Revision revision = revisionFactory.createNew(vf.createIRI(Catalogs.REVISION_NAMESPACE + uuid));
        revision.setAdditions(vf.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-A"));
        revision.setDeletions(vf.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-B"));
        return revision;
    }

    @Override
    public Revision getRevisionFromCommitId(Resource commitId, RepositoryConnection conn) {
        Commit commit = thingManager.getObject(commitId, commitFactory, conn);
        return getGeneratedRevision(commit);
    }

    @Override
    public Set<Revision> getAllRevisionsFromCommitId(Resource commitId, RepositoryConnection conn) {
        Commit commit = thingManager.getObject(commitId, commitFactory, conn);
        Set<Revision> revisions = new HashSet<>();
        revisions.add(getGeneratedRevision(commit));
        revisions.addAll(getInfluencedRevisions(commit));
        commit.getForwardMergeAuxRevision_resource()
                .ifPresent(iri -> revisions.add(getRevisionFromCommitId(commitId, iri, conn)));
        commit.getForwardMergeBaseRevision_resource()
                .ifPresent(iri -> revisions.add(getRevisionFromCommitId(commitId, iri, conn)));
        commit.getMergeDisplayRevision_resource()
                .ifPresent(iri -> revisions.add(getRevisionFromCommitId(commitId, iri, conn)));
        commit.getInitialRevision_resource()
                .ifPresent(iri -> revisions.add(getRevisionFromCommitId(commitId, iri, conn)));
        commit.getMasterMergeIntoBranchRevision_resource()
                .ifPresent(iri -> revisions.add(getRevisionFromCommitId(commitId, iri, conn)));
        return revisions;
    }

    @Override
    public Revision getDisplayRevisionFromCommitId(Resource commitId, RepositoryConnection conn) {
        Commit commit = thingManager.getObject(commitId, commitFactory, conn);
        Revision revision = getGeneratedRevision(commit);
        if (commit.getMergeDisplayRevision().isPresent()) {
            // Merge commit has a separate display revision for user-friendly view
            return commit.getMergeDisplayRevision().get();
        } else if (commit.getBranchCommit_resource().isPresent()
                || commit.getModel().contains(null, RDF.TYPE, vf.createIRI(InProgressCommit.TYPE))) {
            // Branch commits are forward and can be returned as such
            return revision;
        } else {
            // Handle reverse delta contents
            Set<Resource> primarySources = revision.getHadPrimarySource_resource();
            if (primarySources.isEmpty() && commit.getInitialRevision_resource().isPresent()) {
                return getInitialRevision(commit);
            } else {
                // Return the contents of the previous revision and flip contents for display
                Resource prevRevIRI = primarySources.iterator().next();
                Revision prevRev = getRevision(prevRevIRI, conn);
                IRI additionsGraph = prevRev.getAdditions().orElseThrow(() ->
                        new IllegalStateException("Additions not set on Revision " + prevRevIRI.stringValue()));
                IRI deletionsGraph = prevRev.getDeletions().orElseThrow(() ->
                        new IllegalStateException("Deletions not set on Revision " + prevRevIRI.stringValue()));
                prevRev.clearAdditions();
                prevRev.clearDeletions();
                Resource context = prevRev.getModel()
                        .contexts()
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("No context set on Revision"));
                prevRev.getModel().add(prevRev.getResource(), vf.createIRI(Revision.additions_IRI), deletionsGraph, context);
                prevRev.getModel().add(prevRev.getResource(), vf.createIRI(Revision.deletions_IRI), additionsGraph, context);
                return prevRev;
            }
        }
    }

    @Override
    public Revision getRevision(Resource revisionId, RepositoryConnection conn) {
        try (RepositoryResult<Statement> repositoryResult = conn.getStatements(revisionId, null, null)) {
            Model model = QueryResults.asModel(repositoryResult, mf);
            return revisionFactory.getExisting(revisionId, model).orElseThrow(() ->
                    new IllegalArgumentException(revisionFactory.getTypeIRI().getLocalName() + " "
                            + revisionId + " could not be found"));
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Revision getGeneratedRevision(Commit commit) {
        Resource revisionResource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Commit does not have a Revision"));
        return revisionFactory.getExisting(revisionResource, commit.getModel().filter(revisionResource, null, null))
                .orElseThrow(() -> new IllegalStateException(REVISION_ERROR_MESSAGE));
    }

    @Override
    public List<Revision> getInfluencedRevisions(Resource commitId, RepositoryConnection conn) {
        Commit commit = thingManager.getObject(commitId, commitFactory, conn);
        return getInfluencedRevisions(commit);
    }

    private List<Revision> getInfluencedRevisions(Commit commit) {
        return commit.getProperties(PROV.INFLUENCED).stream()
                .map(Resource.class::cast)
                .map(revisionIRI ->
                        revisionFactory.getExisting(revisionIRI,
                                commit.getModel().filter(revisionIRI, null, null)))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    @Override
    public RevisionChain getRevisionChain(Resource commitId, RepositoryConnection conn) {
        // Verify commitId
        Revision revision = getRevisionFromCommitId(commitId, conn);
        HeadAndBranch headAndBranch = getHeadAndBranch(commitId, conn);

        // If the provided commit is the HEAD of master, return the empty revision for commit
        // The stored state graph reflects this commit
        if (headAndBranch.masterHead().equals(commitId)) {
            return new RevisionChain(List.of(revision), List.of());
        }

        // If the forwardBranchingCommit does not exist, then the provided commitId exists in the master chain
        // If the forwardBranchingCommit does exist, then we need to only calculate the master commits/revisions until
        //      that commit since the provided commitId exists in a forward delta chain
        Resource forwardBranchingCommit = getForwardBranchingCommit(commitId, headAndBranch.masterHead, conn);
        Resource masterCommitOfInterest = forwardBranchingCommit == null ? commitId : forwardBranchingCommit;

        // Retrieve the previous merge of the branch into master, if present, only need to iterate until then
        Resource previousMasterMerge = getPreviousMasterMerge(masterCommitOfInterest, headAndBranch.masterHead, conn);

        Map<Resource, MergeChains> mergeChainsMap = getMergeChainsMap(headAndBranch.masterBranch(),
                previousMasterMerge, conn);
        LinkedHashMap<Resource, Resource> masterChainMap = getMasterChainMap(headAndBranch.masterHead(),
                previousMasterMerge, conn);

        // Iterate over the direct master commit chain and recursively traverse the merged aux branches
        // End early if the master commit being iterated over equals the lastBranchingCommit
        // (on the direct master chain) or the masterCommitOfInterest
        List<Revision> revisionList = new ArrayList<>();
        Set<Resource> revisionResourceSet = new HashSet<>();
        List<Revision> forwardRevisions = getForwardRevisions(commitId, conn);
        for (Map.Entry<Resource, Resource> commitToRevision : masterChainMap.entrySet()) {
            // Get the commit and revision for the direct master chain node
            Resource masterCommit = commitToRevision.getKey();
            Resource masterRevision = commitToRevision.getValue();

            // If the revision has already been processed move to the next commit
            if (revisionResourceSet.contains(masterRevision)) {
                continue;
            }
            
            // Add the revision
            // If it is a merge commit then recurse down the chains
            boolean done = traverseRevisions(revisionList, revisionResourceSet, masterCommit, masterRevision,
                    mergeChainsMap, masterCommitOfInterest, conn);

            if ((done || masterCommitOfInterest.equals(masterCommit))
                    && (!forwardRevisions.isEmpty() || masterChainMap.containsKey(masterCommitOfInterest))) {
                // If the commit of interest has been reached then exit loop
                // Unless there are forwards revisions or the master chain has the master COI
                //      - Need to continue in this case to apply deltas from master
                break;
            }
        }

        handleMasterMergeIntoBranch(revisionList, forwardRevisions, conn);
        return new RevisionChain(revisionList, forwardRevisions);
    }

    /**
     * Recurses down the Revision chains and updates the revisionList with {@link Revision}s to process.
     *
     * @param revisionList The resulting {@link List} of {@link Revision}s to process
     * @param revisionResourceSet A {@link Set} of {@link Revision} {@link Resource}s for quick lookup
     * @param commitId The {@link Resource} of the commitId to process
     * @param revisionId The {@link Resource} of the revisionId to process
     * @param mergeChainsMap The {@link Map} of {@link Resource} to {@link MergeChains}
     * @param commitOfInterest The {@link Resource} of the {@link Commit} to terminate the recursive function at
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A boolean indicating if the commitOfInterest has been hit
     */
    private boolean traverseRevisions(List<Revision> revisionList, Set<Resource> revisionResourceSet, Resource commitId,
                                      Resource revisionId, Map<Resource, MergeChains> mergeChainsMap,
                                      Resource commitOfInterest, RepositoryConnection conn) {
        if (!revisionResourceSet.contains(revisionId)) {
            // If the revision hasn't been processed, add it to the list
            revisionList.add(getRevisionFromCommitId(commitId, revisionId, conn));
            revisionResourceSet.add(revisionId);
        }

        if (commitId.equals(commitOfInterest)) {
            return true;
        }

        if (mergeChainsMap.containsKey(commitId)) {
            // Indicates that this commit is a merge commit. Should process down the chains on the commit
            MergeChains mergeChains = mergeChainsMap.get(commitId);
            // General strategy is to process the AUX chain first UNLESS the commit of interest exists in the AUX chain
            // then the BASE chain should be handled first for conflict calculation
            // If both the BASE chain and AUX chain have the commit of interest, this indicates it is the branching
            // commit and the AUX chain should be processed first
            boolean baseFirst = isCoiInAux(mergeChains, commitOfInterest)
                    || isCoiDownBase(mergeChains, commitOfInterest, conn);
            return handleChains(revisionList, revisionResourceSet, mergeChains, commitOfInterest, mergeChainsMap,
                    baseFirst, conn);
        }
        // Indicates this is a normal commit
        return false;
    }

    /**
     * Iterate down the different AUX and BASE chains based on whether the BASE chain should be first. If the commit of
     * interest is hit, then exit recursing down the chains.
     *
     * @param revisionList The resulting {@link List} of {@link Revision}s to process
     * @param revisionResourceSet A {@link Set} of {@link Revision} {@link Resource}s for quick lookup
     * @param mergeChains The {@link MergeChains} of the AUX and BASE commits
     * @param commitOfInterest The {@link Resource} of the {@link Commit} to terminate the recursive function at
     * @param mergeChainsMap The {@link Map} of {@link Resource} to {@link MergeChains}
     * @param baseFirst A boolean indicating whether to process the BASE or AUX chain first
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A boolean indicating if the commitOfInterest has been hit
     */
    private boolean handleChains(List<Revision> revisionList, Set<Resource> revisionResourceSet,
                                 MergeChains mergeChains, Resource commitOfInterest,
                                 Map<Resource, MergeChains> mergeChainsMap, boolean baseFirst,
                                 RepositoryConnection conn) {
        LinkedHashMap<Resource, Resource> first;
        LinkedHashMap<Resource, Resource> second;

        if (baseFirst) {
            first = mergeChains.getBaseCommitToRevision();
            second = mergeChains.getAuxCommitToRevision();
        } else {
            // Ignore the masterMergeIntoBranchRevision chain when the commit of interest is in the base chain
            // Processing with it adds extra data for conflicts
            if (mergeChains.isAuxMasterMergeIntoBranch()
                    && mergeChains.getBaseCommitToRevision().containsKey(commitOfInterest)) {
                first = new LinkedHashMap<>();
            } else {
                first = mergeChains.getAuxCommitToRevision();
            }
            second = mergeChains.getBaseCommitToRevision();
        }
        boolean endOfChain = addRevisionsFromChain(revisionList, revisionResourceSet, first, commitOfInterest,
                mergeChainsMap, conn);
        if (endOfChain && !mergeChains.getBranchingCommit().equals(commitOfInterest)) {
            return true;
        }
        return addRevisionsFromChain(revisionList, revisionResourceSet, second, commitOfInterest, mergeChainsMap, conn);
    }

    /**
     * Add the revisions from the BASE/AUX chain being processed to the revisionList until the commit of interest is hit
     *
     * @param revisionList The resulting {@link List} of {@link Revision}s to process
     * @param revisionResourceSet A {@link Set} of {@link Revision} {@link Resource}s for quick lookup
     * @param commitToRevision A {@link Map} of {@link Resource}s representing a chain
     * @param commitOfInterest The {@link Resource} of the {@link Commit} to terminate the recursive function at
     * @param mergeChainsMap The {@link Map} of {@link Resource} to {@link MergeChains}
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A boolean indicating if the commitOfInterest has been hit
     */
    private boolean addRevisionsFromChain(List<Revision> revisionList, Set<Resource> revisionResourceSet,
                                          LinkedHashMap<Resource, Resource> commitToRevision, Resource commitOfInterest,
                                          Map<Resource, MergeChains> mergeChainsMap, RepositoryConnection conn) {
        for (Map.Entry<Resource, Resource> entry : commitToRevision.entrySet()) {
            Resource commitId = entry.getKey();
            Resource revisionId = entry.getValue();

            if (commitId.equals(commitOfInterest)) {
                // If the commit being added is the commit of interest, processing can stop
                revisionList.add(getRevisionFromCommitId(commitId, revisionId, conn));
                revisionResourceSet.add(revisionId);
                return true;
            }

            // Recurse and process commit
            boolean endOfChain = traverseRevisions(revisionList, revisionResourceSet, commitId, revisionId,
                    mergeChainsMap, commitOfInterest, conn);
            if (endOfChain) {
                // If the commit being added is the commit of interest, processing can stop
                return true;
            }
        }
        // Commit of interest has not been hit
        return false;
    }

    private boolean isCoiInAux(MergeChains mergeChains, Resource commitOfInterest) {
        List<Resource> commits = new ArrayList<>(mergeChains.getAuxCommitToRevision().keySet());
        return commits.contains(commitOfInterest) && !commits.get(commits.size() - 1).equals(commitOfInterest)
                && !mergeChains.getBaseCommitToRevision().containsKey(commitOfInterest);
    }

    private boolean isCoiDownBase(MergeChains mergeChains, Resource commitOfInterest, RepositoryConnection conn) {
        if (mergeChains.isConflictMerge()) {
            BooleanQuery isCoiDownBaseQuery = conn.prepareBooleanQuery(IS_COI_DOWN_BASE);
            isCoiDownBaseQuery.setBinding(COMMIT_BINDING, commitOfInterest);
            isCoiDownBaseQuery.setBinding(MERGE_COMMIT_BINDING, mergeChains.getMergeCommit());
            return !isCoiDownBaseQuery.evaluate();
        }
        return false;
    }

    /**
     * Retrieves the mcat:initialRevision for the provided {@link Commit}. This should only be set on the initial
     * {@link Commit} in a VersionedRDFRecord.
     *
     * @param commit The initial {@link Commit} to retrieve the initial {@link Revision} from
     * @return The initial {@link Revision}
     */
    private Revision getInitialRevision(Commit commit) {
        Resource revisionResource = commit.getInitialRevision_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Commit does not have an initial Revision"));
        return revisionFactory.getExisting(revisionResource, commit.getModel().filter(revisionResource, null, null))
                .orElseThrow(() -> new IllegalStateException(REVISION_ERROR_MESSAGE));
    }

    private void handleMasterMergeIntoBranch(List<Revision> revisionList, List<Revision> forwardRevisions,
                                             RepositoryConnection conn) {
        if (!forwardRevisions.isEmpty()) {
            String queryStr = GET_LATEST_MASTER_MERGE_INTO_FORWARD
                    .replace("%FORWARDREVISIONS%", getValuesStr(forwardRevisions, ""))
                    .replace("%MASTERREVISIONS%", getValuesStr(revisionList, ","));
            TupleQuery getLatestMasterMergeIntoForward = conn.prepareTupleQuery(queryStr);
            Resource latestMasterMergeBack = null;
            try (TupleQueryResult result = getLatestMasterMergeIntoForward.evaluate()) {
                for (BindingSet bindings : result) {
                    latestMasterMergeBack = Bindings.requiredResource(bindings, REVISION_BINDING);
                }
            }
            if (latestMasterMergeBack != null) {
                int index = -1;
                for (int i = 0; i < revisionList.size(); i++) {
                    if (revisionList.get(i).getResource().equals(latestMasterMergeBack)) {
                        index = i;
                        break;
                    }
                }
                if (index == -1) {
                    throw new RuntimeException("Could not get latest commit of master merged into branch.");
                }
                revisionList.subList(index + 1, revisionList.size()).clear();
            }
        }
    }

    /**
     * Retreives the MASTER HEAD and the Branch IRI that the provided commitId belongs to.
     *
     * @param commitId A {@link Resource} of the {@link Commit} in
     *                 a {@link com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord}
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A {@link HeadAndBranch} record
     */
    private HeadAndBranch getHeadAndBranch(Resource commitId, RepositoryConnection conn) {
        // Retrieve the master HEAD commit and masterBranch
        TupleQuery getMasterHead = conn.prepareTupleQuery(GET_MASTER_HEAD);
        getMasterHead.setBinding(COMMIT_BINDING, commitId);
        Resource masterHead;
        Resource masterBranch;
        try (TupleQueryResult getMasterHeadResult = getMasterHead.evaluate()) {
            BindingSet bindings = getMasterHeadResult.iterator().next();
            masterHead = Bindings.requiredResource(bindings, HEAD_COMMIT_BINDING);
            masterBranch = Bindings.requiredResource(bindings, MASTER_BRANCH_BINDING);
        }
        return new HeadAndBranch(masterHead, masterBranch);
    }

    private record HeadAndBranch(Resource masterHead, Resource masterBranch) {
    }

    /**
     * Retrieves a sorted map of {@link Resource}s of the Commit IRI to Revision IRI on the direct MASTER chain (base)
     *
     * @param masterHead The {@link Resource} of the HEAD of MASTER
     * @param previousMasterMerge The {@link Resource} of the previous merge into MASTER. Can filter results to process
     *                            based on this value.
     * @param conn A {@link RepositoryConnection} for lookip
     * @return A sorted map of {@link Resource}s of the Commit IRI to Revision IRI on the direct MASTER chain (base)
     */
    private LinkedHashMap<Resource, Resource> getMasterChainMap(Resource masterHead, Resource previousMasterMerge,
                                                                RepositoryConnection conn) {
        // Retrieve master chain
        TupleQuery getMasterChain = conn.prepareTupleQuery(GET_MASTER_CHAIN);
        getMasterChain.setBinding(COMMIT_BINDING, masterHead);
        LinkedHashMap<Resource, Resource> masterChainMap = new LinkedHashMap<>();
        try (TupleQueryResult getMasterChainResult = getMasterChain.evaluate()) {
            getMasterChainResult.forEach(bindings ->
                    masterChainMap.put(Bindings.requiredResource(bindings, PARENT_BINDING),
                            Bindings.requiredResource(bindings, REVISION_BINDING)));
        }

        // If previousMasterMerge is provided, we can ignore values after it
        if (previousMasterMerge != null) {
            boolean found = false;
            for (Resource masterCommit : new LinkedHashSet<>(masterChainMap.keySet())) {
                if (found) {
                    masterChainMap.remove(masterCommit);
                }
                if (masterCommit.equals(previousMasterMerge)) {
                    found = true;
                }
            }
        }
        return masterChainMap;
    }

    /**
     * Retrieves a {@link List} of {@link Revision}s of the forward delta branch
     *
     * @param commitId A {@link Resource} of the commitId being calculated
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A {@link List} of {@link Revision}s of the forward delta branch
     */
    private List<Revision> getForwardRevisions(Resource commitId, RepositoryConnection conn) {
        // Check if commit is a forward delta
        BooleanQuery isBranchCommit = conn.prepareBooleanQuery(IS_BRANCH_COMMIT);
        isBranchCommit.setBinding(COMMIT_BINDING, commitId);

        List<Revision> forwardRevisions = new ArrayList<>();
        if (isBranchCommit.evaluate()) {
            // Retrieve the forward commits chain for the branch to compile
            TupleQuery getForwardRevisionChain = conn.prepareTupleQuery(GET_FORWARD_REVISION_CHAIN);
            getForwardRevisionChain.setBinding(COMMIT_BINDING, commitId);
            try (TupleQueryResult result = getForwardRevisionChain.evaluate()) {
                for (BindingSet bindings : result) {
                    Resource commitResultId = Bindings.requiredResource(bindings, PARENT_BINDING);
                    Resource revisionId = Bindings.requiredResource(bindings, REVISION_BINDING);
                    boolean isMasterMerge = Bindings.requiredLiteral(bindings, "masterMerge").booleanValue();

                    if (!isMasterMerge) {
                        Revision forwardRevision = getRevisionFromCommitId(commitResultId, revisionId, conn);
                        forwardRevisions.add(forwardRevision);
                    }
                }
            }
        }
        return forwardRevisions;
    }

    /**
     * Retrieves a {@link Resource} that indicates the commit that begins a forward delta branch (a branch not merged
     * into MASTER). Will return null if not a forward branch
     *
     * @param commitId A {@link Resource} of the commitId being calculated
     * @param masterHead A {@link Resource} of the MASTER branch HEAD commit
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A {@link Resource} that indicates the commit that begins a forward delta branch or null if not a forward
     *         branch
     */
    private Resource getForwardBranchingCommit(Resource commitId, Resource masterHead, RepositoryConnection conn) {
        return getMergeOrBranchingCommit(commitId, masterHead, conn, GET_FORWARD_BRANCHING_COMMIT);
    }

    /**
     * Retrieves a {@link Resource} that indicates the branch has been merge into master previously. Will return null
     * otherwise
     *
     * @param commitId A {@link Resource} of the commitId being calculated
     * @param masterHead A {@link Resource} of the MASTER branch HEAD commit
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A {@link Resource} that indicates the branch has been merge into master previously or null otherwise
     */
    private Resource getPreviousMasterMerge(Resource commitId, Resource masterHead, RepositoryConnection conn) {
        return getMergeOrBranchingCommit(commitId, masterHead, conn, GET_PREVIOUS_MASTER_MERGE);
    }

    private Resource getMergeOrBranchingCommit(Resource commitId, Resource masterHead, RepositoryConnection conn,
                                               String getPreviousMasterMerge) {
        Resource resource = null;
        TupleQuery tupleQuery = conn.prepareTupleQuery(getPreviousMasterMerge);
        tupleQuery.setBinding(COMMIT_BINDING, commitId);
        tupleQuery.setBinding(MASTER_HEAD_BINDING, masterHead);
        try (TupleQueryResult result = tupleQuery.evaluate()) {
            for (BindingSet bindings : result) {
                resource = Bindings.requiredResource(bindings, PARENT_BINDING);
                Binding isInMaster = bindings.getBinding("isInMaster");
                if (isInMaster != null) {
                    return null;
                }
            }
        }
        return resource;
    }

    /**
     * Gets a {@link Map} of the merge commit {@link Resource} to a {@link MergeChains} object.
     *
     * @param masterBranch The MASTER branch to retrieve all merges for.
     * @param previousMasterMerge The {@link Resource} of the previous merge into MASTER. Can filter results to process
     *                            based on this value.
     * @param conn A {@link RepositoryConnection} for lookup.
     * @return
     */
    private Map<Resource, MergeChains> getMergeChainsMap(Resource masterBranch, Resource previousMasterMerge,
                                                         RepositoryConnection conn) {
        // Get merge commit chains
        Map<Resource, MergeChains> mergeChainsMap = new HashMap<>(); // Stores the merge commit to aux/base chains
        TupleQuery getBranchingCommits = conn.prepareTupleQuery(GET_MERGE_CHAINS);
        getBranchingCommits.setBinding(BRANCH_BINDING, masterBranch);

        Set<Resource> commitsToIgnore = new HashSet<>();
        try (TupleQueryResult getBranchingCommitsResult = getBranchingCommits.evaluate()) {
            getBranchingCommitsResult.forEach(bindings -> {
                // Retrieve values from bindings
                Resource mergeCommit = Bindings.requiredResource(bindings, MERGE_COMMIT_BINDING);
                Resource branchingCommit = Bindings.requiredResource(bindings, "branchingCommit");

                // Type identifies if the chain is a base chain or an aux chain
                String type = Bindings.requiredLiteral(bindings, "type").stringValue();
                MergeChains chains = mergeChainsMap
                        .getOrDefault(mergeCommit, new MergeChains(mergeCommit, branchingCommit));

                // Get the Commits and Revisions for the chain
                String revisionsStr = Bindings.requiredLiteral(bindings, "revisions").stringValue();
                List<Resource> revisionList = getList(revisionsStr);
                String commitsStr = Bindings.requiredLiteral(bindings, "commits").stringValue();
                List<Resource> commitList = getList(commitsStr);
                if (revisionList.size() != commitList.size()) {
                    throw new IllegalStateException("Mismatched commit to revision count for "
                            + mergeCommit.stringValue());
                }

                // If there is a previous merge of master for the commit being calculated, then filter the lists
                // to not process results after that commit
                if (previousMasterMerge != null) {
                    int index = commitList.indexOf(previousMasterMerge);
                    if (index >= 0) {
                        List<Resource> ignore = commitList.subList(index + 1, commitList.size());
                        commitsToIgnore.add(previousMasterMerge);
                        commitsToIgnore.addAll(ignore);
                        ignore.clear();
                        revisionList.subList(index + 1, revisionList.size()).clear();
                    }
                }

                // Build Maps of Commit to Revision
                LinkedHashMap<Resource, Resource> commitToRevision = new LinkedHashMap<>();
                for (int i = 0; i < revisionList.size(); i++) {
                    commitToRevision.put(commitList.get(i), revisionList.get(i));
                }

                Value isMasterMergeIntoBranch = Bindings.requiredLiteral(bindings, "isMasterMergeIntoBranch");
                chains.setAuxMasterMergeIntoBranch(Integer.parseInt(isMasterMergeIntoBranch.stringValue()) > 0);

                setConflictMerge(chains, mergeCommit, conn);

                if ("AUX".equals(type)) {
                    chains.setAuxCommitToRevision(commitToRevision);
                }
                if ("BASE".equals(type)) {
                    chains.setBaseCommitToRevision(commitToRevision);
                }
                mergeChainsMap.put(mergeCommit, chains);
            });
        }
        // If the previousMasterMerge was set, we can remove any MergeChains after the previousMasterMerge
        commitsToIgnore.forEach(mergeChainsMap::remove);
        return mergeChainsMap;
    }

    /**
     * Sets the conflict merge flag for the given merge chains and merge commit using the provided RepositoryConnection.
     * Determines if it is a conflict merge if the mcat:mergeDisplayRevision's additions/deletions have any statements.
     *
     * @param chains the merge chains to set the conflict merge flag for
     * @param mergeCommit the merge commit to check for conflict merges
     * @param conn the repository connection to use for querying the repository
     */
    private void setConflictMerge(MergeChains chains, Resource mergeCommit, RepositoryConnection conn) {
        BooleanQuery askAdds = conn.prepareBooleanQuery(ASK_CONFLICT_ADDS);
        askAdds.setBinding(MERGE_COMMIT_BINDING, mergeCommit);
        BooleanQuery askDels = conn.prepareBooleanQuery(ASK_CONFLICT_DELS);
        askAdds.setBinding(MERGE_COMMIT_BINDING, mergeCommit);

        chains.setConflictMerge(askAdds.evaluate() || askDels.evaluate());
    }

    /**
     * Converts a pipe delimited string into a List of {@link Resource}s
     *
     * @param pipeSeparatedString the pipe delimited string to convert
     * @return A {@link List} of {@link Resource}s
     */
    private List<Resource> getList(String pipeSeparatedString) {
        return Stream.of(StringUtils.split(pipeSeparatedString, '|'))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .map(vf::createIRI)
                .map(Resource.class::cast)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    /**
     * Retrieves a {@link Revision} from the provided commitId and revisionId
     *
     * @param commitId The Commit IRI that should contain the provided revisionID
     * @param revisionId The IRI of the Revision to retrieve
     * @param conn A {@link RepositoryConnection} for lookup
     * @return A {@link Revision} for the provided revisionId
     */
    private Revision getRevisionFromCommitId(Resource commitId, Resource revisionId, RepositoryConnection conn) {
        Commit commit = thingManager.getObject(commitId, commitFactory, conn);
        return revisionFactory.getExisting(revisionId, commit.getModel().filter(revisionId, null, null))
                .orElseThrow(() -> new IllegalStateException(REVISION_ERROR_MESSAGE));
    }

    /**
     * Creates a SPARQL VALUES or FILTER string from the provided List of {@link Revision}s
     *
     * @param revisions A List of {@link Revision}s to convert into a SPARQL string
     * @param separator A delimiter to add between values
     * @return A VALUES or FILTER string to be used in a SPARQL query
     */
    private String getValuesStr(List<Revision> revisions, String separator) {
        StringBuilder sb = new StringBuilder();
        sb.append("<");
        for (int i = 0; i < revisions.size(); i++) {
            sb.append(revisions.get(i).getResource().stringValue());
            sb.append("> ");
            if (i < revisions.size() - 1) {
                sb.append(separator);
                sb.append("<");
            }
        }
        return sb.toString();
    }
}
