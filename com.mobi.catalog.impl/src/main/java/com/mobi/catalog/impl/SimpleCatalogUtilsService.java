package com.mobi.catalog.impl;

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
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.GraphRevision;
import com.mobi.catalog.api.ontologies.mcat.GraphRevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecordFactory;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BooleanQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import javax.annotation.Nullable;

@Component(immediate = true)
public class SimpleCatalogUtilsService implements CatalogUtilsService {
    private static final Logger log = LoggerFactory.getLogger(SimpleCatalogUtilsService.class);

    private ModelFactory mf;
    private ValueFactory vf;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private DistributionFactory distributionFactory;
    private VersionFactory versionFactory;
    private BranchFactory branchFactory;
    private CommitFactory commitFactory;
    private RevisionFactory revisionFactory;
    private GraphRevisionFactory graphRevisionFactory;
    private InProgressCommitFactory inProgressCommitFactory;

    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String GET_COMMIT_CHAIN;
    private static final String GET_COMMIT_ENTITY_CHAIN;
    private static final String GET_NEW_LATEST_VERSION;
    private static final String GET_COMMIT_PATHS;
    private static final String COMMIT_IN_RECORD;
    private static final String USER_BINDING = "user";
    private static final String PARENT_BINDING = "parent";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";
    private static final String ENTITY_BINDING = "entity";

    static {
        try {
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-in-progress-commit.rq"),
                    "UTF-8"
            );
            GET_COMMIT_CHAIN = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-chain.rq"),
                    "UTF-8"
            );
            GET_COMMIT_ENTITY_CHAIN = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-entity-chain.rq"),
                    "UTF-8"
            );
            GET_NEW_LATEST_VERSION = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-new-latest-version.rq"),
                    "UTF-8"
            );
            GET_COMMIT_PATHS = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-paths.rq"),
                    "UTF-8"
            );
            COMMIT_IN_RECORD = IOUtils.toString(
                    SimpleCatalogUtilsService.class.getResourceAsStream("/commit-in-record.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setUnversionedRecordFactory(UnversionedRecordFactory unversionedRecordFactory) {
        this.unversionedRecordFactory = unversionedRecordFactory;
    }

    @Reference
    void setVersionedRecordFactory(VersionedRecordFactory versionedRecordFactory) {
        this.versionedRecordFactory = versionedRecordFactory;
    }

    @Reference
    void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setRevisionFactory(RevisionFactory revisionFactory) {
        this.revisionFactory = revisionFactory;
    }

    @Reference
    void setGraphRevisionFactory(GraphRevisionFactory graphRevisionFactory) {
        this.graphRevisionFactory = graphRevisionFactory;
    }

    @Override
    public void validateResource(Resource resource, IRI classId, RepositoryConnection conn) {
        if (!conn.contains(resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), classId, resource)) {
            throw new IllegalArgumentException(classId.getLocalName() + " " + resource + " could not be found");
        }
    }

    @Override
    public <T extends Thing> void addObject(T object, RepositoryConnection conn) {
        conn.add(object.getModel(), object.getResource());
    }

    @Override
    public <T extends Thing> void updateObject(T object, RepositoryConnection conn) {
        removeObject(object, conn);
        addObject(object, conn);
    }

    @Override
    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        Model model = RepositoryResults.asModel(conn.getStatements(null, null, null, id), mf);
        return factory.getExisting(id, model);
    }

    @Override
    public <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public <T extends Thing> T getExpectedObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalStateException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public void remove(Resource resourceId, RepositoryConnection conn) {
        conn.remove((Resource) null, null, null, resourceId);
    }

    @Override
    public <T extends Thing> void removeObject(T object, RepositoryConnection conn) {
        remove(object.getResource(), conn);
    }

    @Override
    public void removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate,
                                             RepositoryConnection conn) {
        remove(objectId, conn);
        conn.remove(removeFromId, vf.createIRI(predicate), objectId, removeFromId);
    }

    @Override
    public void validateRecord(Resource catalogId, Resource recordId, IRI recordType,
                               RepositoryConnection conn) {
        validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
        validateResource(recordId, recordType, conn);
        if (!conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId).hasNext()) {
            throw throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    @Override
    public <T extends Record> T getRecord(Resource catalogId, Resource recordId,
                                          OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        validateRecord(catalogId, recordId, factory.getTypeIRI(), conn);
        return getObject(recordId, factory, conn);
    }

    @Override
    public void validateUnversionedDistribution(Resource catalogId, Resource recordId,
                                                Resource distributionId, RepositoryConnection conn) {
        UnversionedRecord record = getRecord(catalogId, recordId, unversionedRecordFactory, conn);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution_resource();
        if (!distributionIRIs.contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, recordId, unversionedRecordFactory);
        }
    }

    @Override
    public Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                   RepositoryConnection conn) {
        validateUnversionedDistribution(catalogId, recordId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void validateVersion(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn) {
        VersionedRecord record = getRecord(catalogId, recordId, versionedRecordFactory, conn);
        Set<Resource> versionIRIs = record.getVersion_resource();
        if (!versionIRIs.contains(versionId)) {
            throw throwDoesNotBelong(versionId, versionFactory, recordId, versionedRecordFactory);
        }
    }

    @Override
    public <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId,
                                            OrmFactory<T> factory, RepositoryConnection conn) {
        validateVersion(catalogId, recordId, versionId, conn);
        return getObject(versionId, factory, conn);
    }

    @Override
    public void removeVersion(Resource recordId, Version version, RepositoryConnection conn) {
        removeObjectWithRelationship(version.getResource(), recordId, VersionedRecord.version_IRI, conn);
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        if (conn.contains(recordId, latestVersionIRI, version.getResource(), recordId)) {
            conn.remove(recordId, latestVersionIRI, version.getResource(), recordId);
            TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
            query.setBinding(RECORD_BINDING, recordId);
            TupleQueryResult result = query.evaluate();

            Optional<Binding> binding;
            if (result.hasNext() && (binding = result.next().getBinding("version")).isPresent()) {
                conn.add(recordId, latestVersionIRI, binding.get().getValue(), recordId);
            }
        }
        version.getVersionedDistribution_resource().forEach(resource -> remove(resource, conn));
    }

    @Override
    public void removeVersion(Resource recordId, Resource versionId, RepositoryConnection conn) {
        Version version = getObject(versionId, versionFactory, conn);
        removeVersion(recordId, version, conn);
    }

    @Override
    public void validateVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                              Resource distributionId, RepositoryConnection conn) {
        Version version = getVersion(catalogId, recordId, versionId, versionFactory, conn);
        if (!version.getVersionedDistribution_resource().contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, versionId, versionFactory);
        }
    }

    @Override
    public Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                 Resource distributionId, RepositoryConnection conn) {
        validateVersionedDistribution(catalogId, recordId, versionId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void validateBranch(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, versionedRDFRecordFactory, conn);
        testBranchPath(record, branchId);
    }

    private void testBranchPath(VersionedRDFRecord record, Resource branchId) {
        Set<Resource> branchIRIs = record.getBranch_resource();
        if (!branchIRIs.contains(branchId)) {
            throw throwDoesNotBelong(branchId, branchFactory, record.getResource(), versionedRDFRecordFactory);
        }
    }

    @Override
    public <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId,
                                          OrmFactory<T> factory, RepositoryConnection conn) {
        validateBranch(catalogId, recordId, branchId, conn);
        return getObject(branchId, factory, conn);
    }

    @Override
    public <T extends Branch> T getBranch(VersionedRDFRecord record, Resource branchId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        testBranchPath(record, branchId);
        return getObject(branchId, factory, conn);
    }

    @Override
    public List<Resource> removeBranch(Resource recordId, Resource branchId, RepositoryConnection conn) {
        Branch branch = getObject(branchId, branchFactory, conn);
        return removeBranch(recordId, branch, conn);
    }

    @Override
    public void removeBranch(Resource recordId, Resource branchId, List<Resource> deletedCommits,
                             RepositoryConnection conn) {
        Branch branch = getObject(branchId, branchFactory, conn);
        removeBranch(recordId, branch, deletedCommits, conn);
    }

    @Override
    public List<Resource> removeBranch(Resource recordId, Branch branch, RepositoryConnection conn) {
        List<Resource> deletedCommits = new ArrayList<>();
        removeBranch(recordId, branch, deletedCommits, conn);
        return deletedCommits;
    }

    private void removeBranch(Resource recordId, Branch branch, List<Resource> deletedCommits,
                              RepositoryConnection conn) {
        removeObjectWithRelationship(branch.getResource(), recordId, VersionedRDFRecord.branch_IRI, conn);
        Optional<Resource> headCommit = branch.getHead_resource();
        if (headCommit.isPresent()) {
            // Explicitly remove this so algorithm works for head commit
            conn.remove(branch.getResource(), vf.createIRI(Branch.head_IRI), headCommit.get());
            IRI commitIRI = vf.createIRI(Tag.commit_IRI);
            Set<Resource> deltaIRIs = new HashSet<>();
            getCommitPaths(headCommit.get(), conn).forEach(path -> {
                for (Resource commitId : path) {
                    if (!deletedCommits.contains(commitId)) {
                        if (!commitIsReferenced(commitId, deletedCommits, conn)) {
                            // Get Additions/Deletions Graphs
                            Revision revision = getRevision(commitId, conn);
                            revision.getAdditions().ifPresent(deltaIRIs::add);
                            revision.getDeletions().ifPresent(deltaIRIs::add);
                            revision.getGraphRevision().forEach(graphRevision -> {
                                graphRevision.getAdditions().ifPresent(deltaIRIs::add);
                                graphRevision.getDeletions().ifPresent(deltaIRIs::add);
                            });

                            // Remove Commit
                            remove(commitId, conn);

                            // Remove Tags Referencing this Commit
                            Set<Resource> tags = RepositoryResults.asModel(
                                    conn.getStatements(null, commitIRI, commitId), mf).subjects();
                            tags.forEach(tagId -> removeObjectWithRelationship(tagId, recordId,
                                    VersionedRecord.version_IRI, conn));
                            deletedCommits.add(commitId);
                        } else {
                            break;
                        }
                    }
                }
            });
            deltaIRIs.forEach(resource -> remove(resource, conn));
        }
    }

    private List<List<Resource>> getCommitPaths(Resource commitId, RepositoryConnection conn) {
        List<List<Resource>> rtn = new ArrayList<>();
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_PATHS);
        query.setBinding("start", commitId);
        query.evaluate().forEach(bindings -> {
            String[] path = StringUtils.split(Bindings.requiredLiteral(bindings, "path").stringValue(), " ");
            Optional<Binding> parent = bindings.getBinding("parent");
            if (!parent.isPresent()) {
                rtn.add(Stream.of(path).map(vf::createIRI).collect(Collectors.toList()));
            } else {
                String[] connectPath = StringUtils.split(
                        Bindings.requiredLiteral(bindings, "connectPath").stringValue(), " ");
                rtn.add(Stream.of(connectPath, path).flatMap(Stream::of).map(vf::createIRI)
                        .collect(Collectors.toList()));
            }
        });
        return rtn;
    }

    private boolean commitIsReferenced(Resource commitId, List<Resource> deletedCommits, RepositoryConnection conn) {
        IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
        IRI baseCommitIRI = vf.createIRI(Commit.baseCommit_IRI);
        IRI auxiliaryCommitIRI = vf.createIRI(Commit.auxiliaryCommit_IRI);

        boolean isHeadCommit = conn.contains(null, headCommitIRI, commitId);
        boolean isParent = Stream.of(baseCommitIRI, auxiliaryCommitIRI)
                .map(iri -> {
                    List<Resource> temp = new ArrayList<>();
                    conn.getStatements(null, iri, commitId).forEach(statement -> temp.add(statement.getSubject()));
                    temp.removeAll(deletedCommits);
                    return temp.size() > 0;
                })
                .reduce(false, (iri1, iri2) -> iri1 || iri2);
        return isHeadCommit || isParent;
    }

    @Override
    public Resource getHeadCommitIRI(Branch branch) {
        return branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch " + branch.getResource()
                + " does not have a head Commit set"));
    }

    @Override
    public void validateInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                         RepositoryConnection conn) {
        validateRecord(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = getObject(commitId, inProgressCommitFactory, conn);
        Resource onRecord = commit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                new IllegalStateException("Record was not set on InProgressCommit " + commitId));
        if (!onRecord.equals(recordId)) {
            throw throwDoesNotBelong(commitId, inProgressCommitFactory, recordId, versionedRDFRecordFactory);
        }
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn) {
        Resource commitId = getInProgressCommitIRI(recordId, userId, conn).orElseThrow(() ->
                new IllegalArgumentException("InProgressCommit not found"));
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                                RepositoryConnection conn) {
        validateInProgressCommit(catalogId, recordId, commitId, conn);
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_IN_PROGRESS_COMMIT);
        query.setBinding(USER_BINDING, userId);
        query.setBinding(RECORD_BINDING, recordId);
        TupleQueryResult queryResult = query.evaluate();
        if (queryResult.hasNext()) {
            return Optional.of(Bindings.requiredResource(queryResult.next(), COMMIT_BINDING));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn) {
        Revision revision = getRevision(commit.getResource(), conn);
        removeObject(commit, conn);

        Set<Resource> graphs = new HashSet<>();
        revision.getAdditions().ifPresent(graphs::add);
        revision.getDeletions().ifPresent(graphs::add);
        revision.getGraphRevision().forEach(graphRevision -> {
            graphRevision.getAdditions().ifPresent(graphs::add);
            graphRevision.getDeletions().ifPresent(graphs::add);
        });

        graphs.forEach(resource -> {
            if (!conn.contains(null, null, resource)) {
                remove(resource, conn);
            }
        });
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
    public void updateCommit(Resource commitId, Model additions, Model deletions, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);
        updateCommit(commitId, revision, additions, deletions, conn);
    }

    private void updateCommit(Resource commitId, Revision revision, @Nullable Model additions,
                              @Nullable Model deletions, RepositoryConnection conn) {
        if (additions != null && deletions != null) {
            Model commonStatements = mf.createModel(additions);
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
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

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
        graphs.forEach(modifiedGraph -> {
            if (knownGraphs.containsKey(modifiedGraph)) {
                GraphRevision graphRevision = graphRevisionFactory
                        .getExisting(knownGraphs.get(modifiedGraph), revision.getModel())
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve expected GraphRevision."));

                IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                        new IllegalStateException("Additions not set on Commit " + commitId + " for graph "
                                + modifiedGraph));
                IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                        new IllegalStateException("Deletions not set on Commit " + commitId + " for graph "
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
                try {
                    changesContextLocalName = commitHash + "%00" + URLEncoder.encode(modifiedGraph.stringValue(),
                            "UTF-8");
                } catch (UnsupportedEncodingException e) {
                    throw new MobiException(e);
                }

                IRI additionsIRI = vf.createIRI(Catalogs.ADDITIONS_NAMESPACE + changesContextLocalName);
                IRI deletionsIRI = vf.createIRI(Catalogs.DELETIONS_NAMESPACE + changesContextLocalName);

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

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        if (conn.containsContext(commit.getResource())) {
            throw throwAlreadyExists(commit.getResource(), commitFactory);
        }
        branch.setHead(commit);
        updateObject(branch, conn);
        addObject(commit, conn);
    }

    @Override
    public Revision getRevision(Resource commitId, RepositoryConnection conn) {
        Commit commit = getObject(commitId, commitFactory, conn);
        Resource revisionResource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Commit does not have a Revision"));
        return revisionFactory.getExisting(revisionResource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve revision from Commit."));
    }

    @Override
    public Stream<Statement> getAdditions(Resource commitId, RepositoryConnection conn) {
        return getAdditions(getRevision(commitId, conn), conn);
    }

    @Override
    public Stream<Statement> getAdditions(Commit commit, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        return getAdditions(revision, conn);
    }

    /**
     * Gets the addition statements for the provided Revision. Assumes additions are stored in the Repository.
     *
     * @param revision The Revision containing change statements.
     * @param conn     The RepositoryConnection used to query the Repository.
     * @return A Stream of change Statements.
     */
    private Stream<Statement> getAdditions(Revision revision, RepositoryConnection conn) {
        List<Stream<Statement>> streams = new ArrayList<>();

        // Get Triples
        revision.getAdditions().ifPresent(changesGraph -> collectChanges(streams, changesGraph, null, conn));

        // Get Versioned Graphs
        revision.getGraphRevision().forEach(graphRevision -> graphRevision.getAdditions()
                .ifPresent(changesGraph -> collectRevisionedGraphChanges(streams, graphRevision, changesGraph, conn)));

        // NOTE: Potential stack overflow with large number of streams
        return streams.stream()
                .reduce(Stream::concat)
                .orElseGet(Stream::empty);
    }

    @Override
    public Stream<Statement> getDeletions(Resource commitId, RepositoryConnection conn) {
        return getDeletions(getRevision(commitId, conn), conn);
    }

    @Override
    public Stream<Statement> getDeletions(Commit commit, RepositoryConnection conn) {
        Resource resource = commit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, commit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        return getDeletions(revision, conn);
    }

    /**
     * Gets the deletion statements for the provided Revision. Assumes deletions are stored in the Repository.
     *
     * @param revision The Revision containing change statements.
     * @param conn     The RepositoryConnection used to query the Repository.
     * @return A Stream of change Statements.
     */
    private Stream<Statement> getDeletions(Revision revision, RepositoryConnection conn) {
        List<Stream<Statement>> streams = new ArrayList<>();

        // Get Triples
        revision.getDeletions().ifPresent(changesGraph -> collectChanges(streams, changesGraph, null, conn));

        // Get Versioned Graphs
        revision.getGraphRevision().forEach(graphRevision -> graphRevision.getDeletions()
                .ifPresent(changesGraph -> collectRevisionedGraphChanges(streams, graphRevision, changesGraph, conn)));

        // NOTE: Potential stack overflow with large number of streams
        return streams.stream()
                .reduce(Stream::concat)
                .orElseGet(Stream::empty);
    }

    /**
     * Collects the change statements from the provided GraphRevision and adds them to the provided List of Streams.
     *
     * @param streams       The List of Streams that collects the change statements.
     * @param graphRevision The GraphRevision from which to collect change statements.
     * @param changesGraph  The context that contains the change statements.
     * @param conn          The RepositoryConnection used to query the Repository.
     */
    private void collectRevisionedGraphChanges(List<Stream<Statement>> streams, GraphRevision graphRevision,
                                               IRI changesGraph, RepositoryConnection conn) {
        Resource versionedGraph = graphRevision.getRevisionedGraph()
                .orElseThrow(() -> new IllegalStateException("GraphRevision missing Revisioned Graph."));
        collectChanges(streams, changesGraph, versionedGraph, conn);
    }

    /**
     * Collects the change statements from the provided context and adds them to the provided List of Streams using the
     * provided context. Note, the versionedGraph is optional with null representing a changed triple instead of quad.
     *
     * @param streams        The List of Streams that collects the change statements.
     * @param changesGraph   The context that contains the change statements.
     * @param versionedGraph The context to use for the collected statements.
     * @param conn           The RepositoryConnection used to query the Repository.
     */
    private void collectChanges(List<Stream<Statement>> streams, IRI changesGraph, Resource versionedGraph,
                                RepositoryConnection conn) {
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, changesGraph);
        GraphRevisionIterator iterator = new GraphRevisionIterator(statements, versionedGraph);
        streams.add(StreamSupport.stream(iterator.spliterator(), false));
    }

    @Override
    public void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                           RepositoryConnection conn) {
        if (changes == null) {
            return;
        }

        Set<Statement> oppositeGraphStatements = RepositoryResults.asSet(conn.getStatements(null,
                null, null, oppositeNamedGraph));

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
    }

    @Override
    public void validateCommitPath(Resource catalogId, Resource recordId, Resource branchId, Resource commitId,
                                   RepositoryConnection conn) {
        validateBranch(catalogId, recordId, branchId, conn);
        if (!commitInBranch(branchId, commitId, conn)) {
            throw throwDoesNotBelong(commitId, commitFactory, branchId, branchFactory);
        }
    }

    @Override
    public void validateCommitPath(Resource catalogId, Resource recordId, Resource commitId,
                                   RepositoryConnection conn) {
        validateRecord(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        if (!commitInRecord(recordId, commitId, conn)) {
            throw throwDoesNotBelong(commitId, commitFactory, recordId, versionedRDFRecordFactory);
        }
    }

    @Override
    public boolean commitInBranch(Resource branchId, Resource commitId, RepositoryConnection conn) {
        Branch branch = getExpectedObject(branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return (head.equals(commitId) || getCommitChain(head, false, conn).contains(commitId));
    }

    @Override
    public boolean commitInRecord(Resource recordId, Resource commitId, RepositoryConnection conn) {
        BooleanQuery query = conn.prepareBooleanQuery(COMMIT_IN_RECORD);
        query.setBinding(RECORD_BINDING, recordId);
        query.setBinding(COMMIT_BINDING, commitId);
        return query.evaluate();
    }

    @Override
    public List<Resource> getCommitChain(Resource commitId, boolean asc, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, asc, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    @Override
    public List<Resource> getCommitChain(Resource commitId, Resource entityId, boolean asc, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, entityId, asc, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    @Override
    public List<Resource> getDifferenceChain(final Resource sourceCommitId, final Resource targetCommitId,
                                             final RepositoryConnection conn) {
        return getDifferenceChain(sourceCommitId, targetCommitId, conn, false);
    }

    @Override
    public List<Resource> getDifferenceChain(final Resource sourceCommitId, final Resource targetCommitId,
                                             final RepositoryConnection conn, boolean asc) {
        validateResource(sourceCommitId, commitFactory.getTypeIRI(), conn);
        validateResource(targetCommitId, commitFactory.getTypeIRI(), conn);

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
    public List<Resource> getDifferenceChain(final Resource sourceCommitId, final Resource targetCommitId,
                                             final Resource targetEntityId, final RepositoryConnection conn) {
        return getDifferenceChain(sourceCommitId, targetCommitId, targetEntityId,conn, false);
    }

    @Override
    public List<Resource> getDifferenceChain(final Resource sourceCommitId, final Resource targetCommitId,
                                             final Resource targetEntityId, final RepositoryConnection conn,
                                             boolean asc) {
        validateResource(sourceCommitId, commitFactory.getTypeIRI(), conn);
        validateResource(targetCommitId, commitFactory.getTypeIRI(), conn);

        final List<Resource> sourceCommits = getCommitChain(sourceCommitId, targetEntityId, true, conn);
        final List<Resource> targetCommits = getCommitChain(targetCommitId, targetEntityId, true, conn);

        final List<Resource> commonCommits = new ArrayList<>(sourceCommits);
        commonCommits.retainAll(targetCommits);

        sourceCommits.removeAll(commonCommits);

        if (!asc) {
            Collections.reverse(sourceCommits);
        }

        return sourceCommits;
    }

    @Override
    public Difference getCommitDifference(List<Resource> commits, RepositoryConnection conn) {
        Map<Statement, Integer> additions = new HashMap<>();
        Map<Statement, Integer> deletions = new HashMap<>();
        commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, conn));

        return new Difference.Builder()
                .additions(mf.createModel(additions.keySet()))
                .deletions(mf.createModel(deletions.keySet()))
                .build();
    }

    @Override
    public Difference getCommitDifference(Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        Model addModel = mf.createModel();
        Model deleteModel = mf.createModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        conn.getStatements(null, null, null, additionsGraph).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(null, null, null, deletionsGraph).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));

        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph().orElseThrow(() ->
                    new IllegalStateException("GraphRevision missing Revisioned Graph."));
            IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on Commit " + commitId));
            IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on Commit " + commitId));

            conn.getStatements(null, null, null, adds).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
            conn.getStatements(null, null, null, dels).forEach(statement ->
                    deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
        });

        return new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build();
    }

    @Override
    public Model getCompiledResource(Resource commitId, RepositoryConnection conn) {
        return getCompiledResource(getCommitChain(commitId, true, conn), conn);
    }

    @Override
    public Model getCompiledResource(List<Resource> commits, RepositoryConnection conn) {
        Difference difference = getCommitDifference(commits, conn);
        return difference.getAdditions();
    }

    @Override
    public Difference getRevisionChanges(Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        Model addModel = RepositoryResults.asModel(conn.getStatements(null, null, null, additionsGraph), mf);
        Model deleteModel = RepositoryResults.asModel(conn.getStatements(null, null, null, deletionsGraph), mf);

        revision.getGraphRevision().forEach(graphRevision -> {
            IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on GraphRevision for Commit " + commitId));
            IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on GraphRevision for Commit " + commitId));

            conn.getStatements(null, null, null, adds).forEach(addModel::add);
            conn.getStatements(null, null, null, dels).forEach(deleteModel::add);
        });

        return new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build();
    }

    @Override
    public Model applyDifference(Model base, Difference diff) {
        Model result = mf.createModel(base);
        result.addAll(diff.getAdditions());
        result.removeAll(diff.getDeletions());
        return result;
    }

    @Override
    public Set<Conflict> getConflicts(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn) {
        long start = System.currentTimeMillis();
        // Does not take into account named graphs
        validateResource(sourceCommitId, commitFactory.getTypeIRI(), conn);
        validateResource(targetCommitId, commitFactory.getTypeIRI(), conn);

        ArrayList<Resource> sourceCommits = new ArrayList<>(getCommitChain(sourceCommitId, true, conn));
        ArrayList<Resource> targetCommits = new ArrayList<>(getCommitChain(targetCommitId, true, conn));
        ArrayList<Resource> commonCommits = new ArrayList<>(sourceCommits);
        commonCommits.retainAll(targetCommits);

        sourceCommits.removeAll(commonCommits);
        targetCommits.removeAll(commonCommits);

        sourceCommits.trimToSize();
        targetCommits.trimToSize();

        Difference sourceDiff = getCommitDifference(sourceCommits, conn);
        Difference targetDiff = getCommitDifference(targetCommits, conn);

        Model sourceAdds = sourceDiff.getAdditions();
        Set<Resource> sourceAddSubjects = sourceAdds.subjects();
        Model targetAdds = targetDiff.getAdditions();
        Set<Resource> targetAddSubjects = targetAdds.subjects();
        Model sourceDels = sourceDiff.getDeletions();
        Model targetDels = targetDiff.getDeletions();

        Set<Conflict> result = new HashSet<>();
        Model original = getCompiledResource(commonCommits, conn);

        Set<Statement> statementsToRemove = new HashSet<>();

        sourceDels.subjects().forEach(subject -> {
            Model sourceDelSubjectStatements = sourceDels.filter(subject, null, null);

            // Check for modification in left and right
            sourceDelSubjectStatements.forEach(statement -> {
                IRI pred = statement.getPredicate();
                Value obj = statement.getObject();

                if (targetDels.contains(subject, pred, obj)
                        && sourceAdds.contains(subject, pred, null)
                        && targetAdds.contains(subject, pred, null)) {
                    result.add(createConflict(subject, pred, sourceAdds, sourceDels, targetAdds, targetDels));
                    statementsToRemove.add(statement);
                }
            });

            // Check for deletion in left and addition in right if there are common parents
            if (commonCommits.size() != 0) {
                Model targetSubjectAdd = targetAdds.filter(subject, null, null);
                boolean sourceEntityDeleted = !sourceAddSubjects.contains(subject)
                        && sourceDelSubjectStatements.equals(original.filter(subject, null, null));
                boolean targetEntityDeleted = targetDels.containsAll(sourceDelSubjectStatements);

                if (sourceEntityDeleted && !targetEntityDeleted && targetSubjectAdd.size() > 0) {
                    result.add(createConflict(subject, null, sourceAdds, sourceDels, targetAdds, targetDels));
                    statementsToRemove.addAll(targetSubjectAdd);
                }
            }
        });

        statementsToRemove.forEach(statement -> Stream.of(sourceAdds, sourceDels, targetAdds, targetDels)
                .forEach(model -> model.remove(statement.getSubject(), statement.getPredicate(), null)));

        if (commonCommits.size() != 0) {
            targetDels.subjects().forEach(subject -> {
                // Check for deletion in right and addition in left if there are common parents
                Model targetDelSubjectStatements = targetDels.filter(subject, null, null);
                Model sourceSubjectAdd = sourceAdds.filter(subject, null, null);
                boolean targetEntityDeleted = !targetAddSubjects.contains(subject)
                        && targetDelSubjectStatements.equals(original.filter(subject, null, null));
                boolean sourceEntityDeleted = sourceDels.containsAll(targetDelSubjectStatements);

                if (targetEntityDeleted && !sourceEntityDeleted && sourceSubjectAdd.size() > 0) {
                    result.add(createConflict(subject, null, sourceAdds, sourceDels, targetAdds, targetDels));
                }
            });
        }

        log.trace("getConflicts took {}ms", System.currentTimeMillis() - start);
        return result;
    }

    @Override
    public <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory) {
        return new IllegalArgumentException(String.format("%s %s already exists", factory.getTypeIRI().getLocalName(),
                id));
    }

    @Override
    public <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                          OrmFactory<T> childFactory,
                                                                                          Resource parent,
                                                                                          OrmFactory<S> parentFactory) {
        return new IllegalArgumentException(String.format("%s %s does not belong to %s %s",
                childFactory.getTypeIRI().getLocalName(), child, parentFactory.getTypeIRI().getLocalName(), parent));
    }

    @Override
    public <T extends Thing> IllegalStateException throwThingNotFound(Resource id, OrmFactory<T> factory) {
        return new IllegalStateException(String.format("%s %s could not be found", factory.getTypeIRI().getLocalName(),
                id));
    }

    /**
     * Gets an iterator which contains all of the Commit ids in the specified direction, either ascending or
     * descending by date. If descending, the provided Resource identifying a Commit will be first.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether or not the iterator should be ascending by date
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, boolean asc, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        TupleQueryResult result = query.evaluate();
        LinkedList<Resource> commits = new LinkedList<>();
        result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
        commits.addFirst(commitId);
        return asc ? commits.descendingIterator() : commits.iterator();
    }

    /**
     * Gets an iterator which contains all of the Commit ids, filtered by a Commit containing the Entity id in its
     * additions or deletions, in the specified direction, either ascending or descending by date. If descending,
     * the provided Resource identifying a Commit will be first.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param entityId The Resource identifying the Entity that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether or not the iterator should be ascending by date
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, Resource entityId, boolean asc,
                                                      RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_ENTITY_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        query.setBinding(ENTITY_BINDING, entityId);
        TupleQueryResult result = query.evaluate();
        LinkedList<Resource> commits = new LinkedList<>();
        result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
        return asc ? commits.descendingIterator() : commits.iterator();
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the Revision associated with
     * the supplied Commit resource. Revision addition statements are added to the additions map if not present. If
     * present, the counter of the times the statement has been added is incremented. Revision deletion
     * statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param additions The Map of Statements deleted to update.
     * @param commitId  The Resource identifying the Commit.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions, Resource commitId,
                                      RepositoryConnection conn) {
        getAdditions(commitId, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Remove the supplied triple from the mapToRemove if one instance of it exists, if more than one, decrement counter.
     * Otherwise add the triple to mapToAdd. If one already exists in mapToAdd, increment counter.
     *
     * @param statement   The statement to process
     * @param mapToAdd    The Map of addition statements to track number of times a statement has been added and to add
     *                    the statement to if it does not exist in mapToRemove
     * @param mapToRemove The Map of deletion statements to track the number of times a statement has been removed and
     *                    to remove the statement from if it exists
     */
    private void updateModels(Statement statement, Map<Statement, Integer> mapToAdd, Map<Statement, Integer> mapToRemove) {
        if (mapToRemove.containsKey(statement)) {
            int count = mapToRemove.get(statement);
            if (count == 1) {
                mapToRemove.remove(statement);
            } else {
                mapToRemove.put(statement, count - 1);
            }
        } else if (mapToAdd.containsKey(statement)) {
           int count = mapToAdd.get(statement);
           mapToAdd.put(statement, count + 1);
        } else {
            mapToAdd.put(statement, 1);
        }
    }

    private class GraphRevisionIterator implements Iterator<Statement>, Iterable<Statement> {
        private final Iterator<Statement> delegate;
        private final Resource graph;

        GraphRevisionIterator(Iterator<Statement> delegate, Resource graph) {
            this.delegate = delegate;
            this.graph = graph;
        }

        @Override
        public boolean hasNext() {
            return delegate.hasNext();
        }

        @Override
        public Statement next() {
            Statement statement = delegate.next();
            return vf.createStatement(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph);
        }

        @Override
        public Iterator<Statement> iterator() {
            return this;
        }
    }

    /**
     * Creates a conflict using the provided parameters as the data to construct it.
     *
     * @param subject        The Resource identifying the conflicted statement's subject.
     * @param predicate      The IRI identifying the conflicted statement's predicate.
     * @param left           The Model of the left item being compared.
     * @param leftDeletions  The Model of the deleted statements from the left Model.
     * @param right          The Model of the right item being compared.
     * @param rightDeletions The Model of the deleted statements from the right Model.
     * @return A Conflict created using all of the provided data.
     */
    private Conflict createConflict(Resource subject, IRI predicate, Model left, Model leftDeletions,
                                    Model right, Model rightDeletions) {
        Difference.Builder leftDifference = new Difference.Builder();
        Difference.Builder rightDifference = new Difference.Builder();

        leftDifference
                .additions(mf.createModel(left).filter(subject, predicate, null))
                .deletions(mf.createModel(leftDeletions).filter(subject, predicate, null));
        rightDifference
                .additions(mf.createModel(right).filter(subject, predicate, null))
                .deletions(mf.createModel(rightDeletions).filter(subject, predicate, null));

        return new Conflict.Builder(vf.createIRI(subject.stringValue()))
                .leftDifference(leftDifference.build())
                .rightDifference(rightDifference.build())
                .build();
    }
}
