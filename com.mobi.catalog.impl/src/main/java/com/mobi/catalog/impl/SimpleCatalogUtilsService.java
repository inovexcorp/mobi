package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.google.common.collect.ListMultimap;
import com.google.common.collect.MultimapBuilder;

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
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
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.BooleanQuery;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.eclipse.rdf4j.rio.helpers.TurtleWriterSettings;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nullable;

@Component(immediate = true)
public class SimpleCatalogUtilsService implements CatalogUtilsService {
    private static final Logger log = LoggerFactory.getLogger(SimpleCatalogUtilsService.class);

    private static final String GET_PAGED_CHANGES;
    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String GET_ALL_IN_PROGRESS_COMMIT_IRIS;
    private static final String GET_COMMIT_CHAIN;
    private static final String GET_COMMIT_ENTITY_CHAIN;
    private static final String GET_NEW_LATEST_VERSION;
    private static final String GET_COMMIT_PATHS;
    private static final String COMMIT_IN_RECORD;
    private static final String GET_SUBJECTS_WITH_DELETIONS;
    private static final String GET_COMMITS_WITH_SUBJECT;
    private static final String GET_ADDITIONS_IN_COMMIT;
    private static final String GET_ADDITIONS_FROM_COIS;
    private static final String GET_DELETIONS_IN_COMMIT;
    private static final String GET_FILTERED_ADDITIONS_SUBQUERY;
    private static final String GET_FILTERED_DELETIONS_SUBQUERY;
    private static final String USER_BINDING = "user";
    private static final String PARENT_BINDING = "parent";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";
    private static final String ENTITY_BINDING = "entity";
    private static final String VERSIONED_RDF_RECORD_IRI_QUERY;
    private static final String BRANCH_BINDING = "branch";

    static {
        try {
            GET_PAGED_CHANGES = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-paged-changes.rq")),
                    StandardCharsets.UTF_8
            );
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-in-progress-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_IN_PROGRESS_COMMIT_IRIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-all-in-progress-commit-iris.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_ENTITY_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-commit-entity-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_NEW_LATEST_VERSION = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-new-latest-version.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_PATHS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class.getResourceAsStream("/get-commit-paths.rq")),
                    StandardCharsets.UTF_8
            );
            COMMIT_IN_RECORD = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class.getResourceAsStream("/commit-in-record.rq")),
                    StandardCharsets.UTF_8
            );
            GET_SUBJECTS_WITH_DELETIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-subjects-with-deletions.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMITS_WITH_SUBJECT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-commits-with-subject.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_IN_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-additions-in-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ADDITIONS_FROM_COIS = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-additions-from-cois.rq")),
                    StandardCharsets.UTF_8
            );
            GET_DELETIONS_IN_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-deletions-in-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_ADDITIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-filtered-additions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
            GET_FILTERED_DELETIONS_SUBQUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-filtered-deletions-subquery.rq")),
                    StandardCharsets.UTF_8
            );
            VERSIONED_RDF_RECORD_IRI_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogUtilsService.class
                            .getResourceAsStream("/get-record-from-branch.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    ModelFactory mf = new DynamicModelFactory();
    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogFactory catalogFactory;

    @Reference
    RecordFactory recordFactory;

    @Reference
    UnversionedRecordFactory unversionedRecordFactory;

    @Reference
    VersionedRecordFactory versionedRecordFactory;

    @Reference
    VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Reference
    DistributionFactory distributionFactory;

    @Reference
    VersionFactory versionFactory;

    @Reference
    BranchFactory branchFactory;

    @Reference
    InProgressCommitFactory inProgressCommitFactory;

    @Reference
    CommitFactory commitFactory;

    @Reference
    RevisionFactory revisionFactory;

    @Reference
    GraphRevisionFactory graphRevisionFactory;

    @Override
    public void validateResource(Resource resource, IRI classId, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                classId, resource)) {
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
        Model model = QueryResults.asModel(conn.getStatements(null, null, null, id), mf);
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
        // https://github.com/eclipse/rdf4j/issues/3796
        // The explicit graph removal while within a transaction is causing issues. Using this alternate solution
        // until a fix is made.
        // conn.remove((Resource) null, null, null, resourceId);
        conn.getStatements(null, null, null, resourceId).forEach(conn::remove);
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
        if (!ConnectionUtils.contains(conn, recordId, vf.createIRI(Record.catalog_IRI), catalogId)) {
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
        if (ConnectionUtils.contains(conn, recordId, latestVersionIRI, version.getResource(), recordId)) {
            conn.remove(recordId, latestVersionIRI, version.getResource(), recordId);
            TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
            query.setBinding(RECORD_BINDING, recordId);
            TupleQueryResult result = query.evaluate();

            Optional<Binding> binding;
            if (result.hasNext()
                    && (binding = Optional.ofNullable(result.next().getBinding("version"))).isPresent()) {
                conn.add(recordId, latestVersionIRI, binding.get().getValue(), recordId);
            }
            result.close();
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
                            Set<Resource> tags = QueryResults.asModel(
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
        try (TupleQueryResult result = query.evaluate()) {
            result.forEach(bindings -> {
                String[] path = StringUtils.split(Bindings.requiredLiteral(bindings, "path").stringValue(), " ");
                assert path != null;
                Optional<Binding> parent = Optional.ofNullable(bindings.getBinding("parent"));
                if (parent.isEmpty()) {
                    rtn.add(Stream.of(path).map(vf::createIRI).collect(Collectors.toList()));
                } else {
                    String[] connectPath = StringUtils.split(
                            Bindings.requiredLiteral(bindings, "connectPath").stringValue(), " ");
                    rtn.add(Stream.of(connectPath, path).flatMap(Stream::of).map(vf::createIRI)
                            .collect(Collectors.toList()));
                }
            });
        }
        return rtn;
    }

    private boolean commitIsReferenced(Resource commitId, List<Resource> deletedCommits, RepositoryConnection conn) {
        IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
        IRI baseCommitIRI = vf.createIRI(Commit.baseCommit_IRI);
        IRI auxiliaryCommitIRI = vf.createIRI(Commit.auxiliaryCommit_IRI);

        boolean isHeadCommit = ConnectionUtils.contains(conn, null, headCommitIRI, commitId);
        boolean isParent = Stream.of(baseCommitIRI, auxiliaryCommitIRI)
                .map(iri -> {
                    List<Resource> temp = new ArrayList<>();
                    conn.getStatements(null, iri, commitId).forEach(statement -> temp.add(statement.getSubject()));
                    temp.removeAll(deletedCommits);
                    return !temp.isEmpty();
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
    public InProgressCommit getInProgressCommit(Resource inProgressCommitId, RepositoryConnection conn) {
        return getObject(inProgressCommitId, inProgressCommitFactory, conn);
    }

    @Override
    public Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection conn) {
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

    @Override
    public List<Resource> getInProgressCommitIRIs(Resource userId, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_ALL_IN_PROGRESS_COMMIT_IRIS);
        query.setBinding(USER_BINDING, userId);
        try (TupleQueryResult queryResult = query.evaluate()) {
            List<Resource> inProgressCommitIRIs = new ArrayList<>();
            queryResult.forEach(bindings -> inProgressCommitIRIs.add(Bindings.requiredResource(bindings,
                    COMMIT_BINDING)));
            return inProgressCommitIRIs;
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
            // Transaction bug here where the statements in the removed commit are still in the repo when retrieved
            // with the additions/deletions graph resource as the object. When retrieving the InProgressCommit graph
            // no results are returned as expected.

            // Original logic:
            // if (!ConnectionUtils.contains(conn, null, null, resource)) {
            //     remove(resource, conn);
            // }
            Model model = QueryResults.asModel(conn.getStatements(null, null, resource), mf);
            model.remove(null, null, null, commit.getResource());
            if (!model.contains(null, null, resource)) {
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
        graphs.remove(null);
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
                changesContextLocalName = commitHash + "%00" + URLEncoder.encode(modifiedGraph.stringValue(),
                        StandardCharsets.UTF_8);

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
        if (ConnectionUtils.containsContext(conn, commit.getResource())) {
            throw throwAlreadyExists(commit.getResource(), commitFactory);
        }

        Optional<Resource> recordOpt = getRecordFromBranch(branch, conn);
        recordOpt.ifPresent(recordId -> {
            conn.getStatements(recordId, vf.createIRI(_Thing.modified_IRI), null)
                    .forEach(conn::remove);
            conn.add(recordId, vf.createIRI(_Thing.modified_IRI), vf.createLiteral(OffsetDateTime.now()), recordId);
        });

        branch.setHead(commit);
        branch.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
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
    public void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                           RepositoryConnection conn) {
        if (changes == null) {
            return;
        }

        Set<Statement> oppositeGraphStatements = QueryResults.asSet(conn.getStatements(null,
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

        Model additionsModel = mf.createEmptyModel();
        additionsModel.addAll(additions.keySet());
        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.addAll(deletions.keySet());

        return new Difference.Builder()
                .additions(additionsModel)
                .deletions(deletionsModel)
                .build();
    }

    @Override
    public Difference getCommitDifference(Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

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
    public PagedDifference getCommitDifferencePaged(List<Resource> commits, RepositoryConnection conn, int limit,
                                                    int offset) {
        Map<Statement, Integer> additions = new HashMap<>();
        Map<Statement, Integer> deletions = new HashMap<>();
        boolean hasMoreResults = false;

        commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, conn));

        /** We are using Multimaps instead of regular maps because Multimaps represent a one key to many values
        relationship. In this case, one subject may have many statements. The reason that we do not just have a Model
         or Collection<Statement> as the value of a regular Map is that it would require us to look up the value in
         order to update it. Doing a lookup on a possibly enormous Map is very computationally expensive if done inside
         a loop. Using Multimap allows us to avoid a lookup and just add statements as values for a given subject
         without worrying about what is already there. **/
        ListMultimap<String, Statement> addSubjMap = MultimapBuilder.hashKeys().arrayListValues().build();
        ListMultimap<String, Statement> addDelMap = MultimapBuilder.hashKeys().arrayListValues().build();

        TreeSet<String> subjects = new TreeSet<>();

        additions.forEach( (statement, integer) -> {
            String subj = statement.getSubject().stringValue();
            subjects.add(subj);
            addSubjMap.put(subj, statement);
        });

        deletions.forEach( (statement, integer) -> {
            String subj = statement.getSubject().stringValue();
            subjects.add(subj);
            addDelMap.put(subj, statement);
        });

        subjects.retainAll(subjects.stream()
                .skip(offset)
                .limit(limit + 1L)
                .collect(Collectors.toSet()));

        if (subjects.size() > limit) {
            hasMoreResults = true;
            subjects.remove(subjects.last());
        }

        addSubjMap.keySet().retainAll(subjects);
        addDelMap.keySet().retainAll(subjects);

        Model additionsModel = mf.createEmptyModel();
        additionsModel.addAll(addSubjMap.values());
        Model deletionsModel = mf.createEmptyModel();
        deletionsModel.addAll(addDelMap.values());

        return new PagedDifference(new Difference.Builder()
                .additions(additionsModel)
                .deletions(deletionsModel)
                .build(), hasMoreResults);
    }


    @Override
    public PagedDifference getCommitDifferencePaged(Resource commitId, RepositoryConnection conn, int limit,
                                                    int offset) {
        Revision revision = getRevision(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        String queryString = GET_PAGED_CHANGES.replace("%ADDITIONS_GRAPH%", "<" + additionsGraph.stringValue() + ">");
        queryString = queryString.replace("%DELETIONS_GRAPH%", "<" + deletionsGraph.stringValue() + ">");
        // Query for limit plus 1 to see if more results exist
        queryString = queryString.replace("%LIMIT%", String.valueOf(limit + 1));
        queryString = queryString.replace("%OFFSET%", String.valueOf(offset));

        TupleQuery query = conn.prepareTupleQuery(queryString);

        Resource lastSubject = null;
        try (TupleQueryResult it = query.evaluate()) {
            while (it.hasNext()) {
                BindingSet bindingSet = it.next();
                if (bindingSet.hasBinding("additionsObj")) {
                    addModel.add(vf.createStatement(Bindings.requiredResource(bindingSet, "s"),
                            (IRI) Bindings.requiredResource(bindingSet, "additionsPred"),
                            bindingSet.getValue("additionsObj")));
                }
                if (bindingSet.hasBinding("deletionsObj")) {
                    deleteModel.add(vf.createStatement(Bindings.requiredResource(bindingSet, "s"),
                            (IRI) Bindings.requiredResource(bindingSet, "deletionsPred"),
                            bindingSet.getValue("deletionsObj")));
                }
                if (!it.hasNext()) {
                    // Keep track of last subject, so we can remove it (we queried for limit + 1 subjects)
                    lastSubject = Bindings.requiredResource(bindingSet, "s");
                }
            }
        }

        boolean hasMoreResults = false;

        Set<Resource> setOfSubjects = new HashSet<>();
        setOfSubjects.addAll(addModel.subjects());
        setOfSubjects.addAll(deleteModel.subjects());

        // Remove last subject if we retrieved more subjects than the limit
        if (setOfSubjects.size() > limit) {
            hasMoreResults = true;
            if (lastSubject != null) {
                addModel.remove(lastSubject, null, null);
                deleteModel.remove(lastSubject, null, null);
            }
        }

        return new PagedDifference(new Difference.Builder()
                .additions(addModel)
                .deletions(deleteModel)
                .build(), hasMoreResults);
    }

    @Override
    public Difference getCommitDifferenceForSubject(Resource subjectId, Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        Model addModel = mf.createEmptyModel();
        Model deleteModel = mf.createEmptyModel();

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        conn.getStatements(subjectId, null, null, additionsGraph).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(subjectId, null, null, deletionsGraph).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));

        revision.getGraphRevision().forEach(graphRevision -> {
            Resource graph = graphRevision.getRevisionedGraph().orElseThrow(() ->
                    new IllegalStateException("GraphRevision missing Revisioned Graph."));
            IRI adds = graphRevision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on Commit " + commitId));
            IRI dels = graphRevision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on Commit " + commitId));

            conn.getStatements(subjectId, null, null, adds).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), graph));
            conn.getStatements(subjectId, null, null, dels).forEach(statement ->
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
    public Model getCompiledResource(List<Resource> commits, RepositoryConnection conn, Resource... subjectIds) {
        Model compiledResource = mf.createEmptyModel();
        if (commits.isEmpty()) {
            return compiledResource;
        }
        buildCompiledResource(commits, conn, compiledResource::add, subjectIds);
        return compiledResource;
    }

    @Override
    public File getCompiledResourceFile(Resource commitId, RDFFormat rdfFormat, RepositoryConnection conn) {
        return getCompiledResourceFile(getCommitChain(commitId, true, conn), rdfFormat, conn);
    }

    @Override
    public File getCompiledResourceFile(List<Resource> commits, RDFFormat rdfFormat, RepositoryConnection conn,
                                        Resource... subjectIds) {
        try {
            long writeTimeStart = System.currentTimeMillis();
            if (commits.isEmpty()) {
                throw new IllegalArgumentException("List of commits must contain at least one Resource");
            }
            String tmpDir = System.getProperty("java.io.tmpdir");
            Path tmpFile = Files.createFile(Paths.get(tmpDir + File.separator + UUID.randomUUID()));
            try (OutputStream outputStream = Files.newOutputStream(tmpFile)) {
                RDFWriter writer = Rio.createWriter(rdfFormat, outputStream);
                if (RDFFormat.TURTLE.equals(rdfFormat) || RDFFormat.TRIG.equals(rdfFormat)) {
                    writer.getWriterConfig().set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
                }
                writer.getWriterConfig().set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
                writer.startRDF();
                Consumer<Statement> consumer = statement ->
                        com.mobi.persistence.utils.rio.Rio.write(statement, writer);
                buildCompiledResource(commits, conn, consumer, subjectIds);
                writer.endRDF();
            }
            log.trace("Write statements to file in {} ms", System.currentTimeMillis() - writeTimeStart);
            return tmpFile.toFile();
        } catch (IOException e) {
            throw new MobiException("Error creating compiled resource file", e);
        }
    }

    /**
     * Runs queries to calculate the compiled resource. Uses the provided {@link Consumer} to handle the resulting
     * {@link Statement} that gets generated as part of the compiled resource.
     *
     * @param commits The {@link List} of Commits {@link Resource}s.
     * @param conn The {@link RepositoryConnection} to use to query the repository.
     * @param consumer The {@link Consumer} to handle the generated {@link Statement}.
     * @param subjectIds Optional list of entity {@link Resource}s to filter the compiled resource by
     */
    private void buildCompiledResource(List<Resource> commits, RepositoryConnection conn,
                                       Consumer<Statement> consumer, Resource... subjectIds) {
        // Get all subjects in deletions graphs for provided commits
        Set<Resource> deletionSubjects = getDeletionSubjects(commits, conn, subjectIds);
        // Find all commits with the subjects in additions or deletions graphs
        // These are the commits of interest for comparing changes
        Set<Resource> commitsOfInterest = getCommitWithSubjects(commits, conn, deletionSubjects, subjectIds);

        if (!deletionSubjects.isEmpty()) {
            // Write any addition statement in commitsOfInterest whose subject is NOT a deletionsSubject
            String additionsFromCoisQueryString = replaceCommitList(GET_ADDITIONS_FROM_COIS, commits);
            additionsFromCoisQueryString = replaceSubjectList(additionsFromCoisQueryString,
                    "deletionSubject", "%SUBJECTLIST%", subjectIds);
            additionsFromCoisQueryString = replaceSubjectList(additionsFromCoisQueryString,
                    "addSubject", "%SUBJECTLISTADD%", subjectIds);

            GraphQuery additionsInCOIQuery = conn.prepareGraphQuery(additionsFromCoisQueryString);
            try (GraphQueryResult result = additionsInCOIQuery.evaluate()) {
                result.forEach(statement -> {
                    if (!deletionSubjects.contains(statement.getSubject())) {
                        consumer.accept(statement);
                    }
                });
            }

            // Gather and write final statements from all subjects that have deletions
            Map<Statement, Integer> additions = new HashMap<>();
            Map<Statement, Integer> deletions = new HashMap<>();
            commits.forEach(commitId -> aggregateDifferences(additions, deletions, commitId, commits, conn));
            additions.keySet().forEach(consumer);
        }

        // Write any commit that has additions that do not contain any subject in a deletions graph
        List<Resource> commitsAdditionsOnly = commits.stream()
                .filter(commit -> !commitsOfInterest.contains(commit))
                .collect(Collectors.toList());
        if (!commitsAdditionsOnly.isEmpty()) {
            String additionInCommitQuery =  replaceCommitList(GET_ADDITIONS_IN_COMMIT, commitsAdditionsOnly);
            additionInCommitQuery = replaceSubjectList(additionInCommitQuery, "s", "%SUBJECTLIST%", subjectIds);
            GraphQuery additionsQuery = conn.prepareGraphQuery(additionInCommitQuery);
            try (GraphQueryResult result = additionsQuery.evaluate()) {
                result.forEach(consumer);
            }
        }
    }

    protected Set<Resource> getDeletionSubjects(List<Resource> commits, RepositoryConnection conn,
                                                Resource... subjectIds) {
        Set<Resource> deletionSubjects = new HashSet<>();
        String query = replaceCommitList(GET_SUBJECTS_WITH_DELETIONS, commits);
        query = replaceSubjectList(query, "s", "%SUBJECTLIST%", subjectIds);
        TupleQuery subjectsQuery = conn.prepareTupleQuery(query);
        try (TupleQueryResult result = subjectsQuery.evaluate()) {
            result.forEach(bindings ->
                    deletionSubjects.add((Bindings.requiredResource(bindings, "s"))));
        }
        return deletionSubjects;
    }

    protected Set<Resource> getCommitWithSubjects(List<Resource> commits, RepositoryConnection conn,
                                       Set<Resource> deletionSubjects, Resource... subjectIds) {

        Set<Resource> commitsOfInterest = new HashSet<>();
        if (!deletionSubjects.isEmpty()) {
            String query = replaceCommitList(GET_COMMITS_WITH_SUBJECT, commits);
            query = replaceSubjectList(query, "deletionSubject", "%SUBJECTLIST%", subjectIds);
            TupleQuery commitsQuery = conn.prepareTupleQuery(query);
            try (TupleQueryResult result = commitsQuery.evaluate()) {
                result.forEach(bindingSet ->
                        commitsOfInterest.add(Bindings.requiredResource(bindingSet, "commitOfInterest")));
            }
        }
        return commitsOfInterest;

    }

    private static String replaceCommitList(String query, List<Resource> commits) {
        return query.replace("%COMMITLIST%", "<" + StringUtils.join(commits, "> <") + ">");
    }

    private static String replaceSubjectList(String query, String binding, String target, Resource... subjectIds) {
        if (subjectIds.length > 0) {
            return query.replace(target,
                    "VALUES ?" + binding + " { <" + StringUtils.join(subjectIds, "> <") + "> }");
        } else {
            return query.replace(target, "");
        }
    }

    @Override
    public Difference getRevisionChanges(Resource commitId, RepositoryConnection conn) {
        Revision revision = getRevision(commitId, conn);

        IRI additionsGraph = revision.getAdditions().orElseThrow(() ->
                new IllegalStateException("Additions not set on Commit " + commitId));
        IRI deletionsGraph = revision.getDeletions().orElseThrow(() ->
                new IllegalStateException("Deletions not set on Commit " + commitId));

        Model addModel = QueryResults.asModel(conn.getStatements(null, null, null, additionsGraph), mf);
        Model deleteModel = QueryResults.asModel(conn.getStatements(null, null, null, deletionsGraph), mf);

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
        Model result = mf.createEmptyModel();
        result.addAll(base);
        result.addAll(diff.getAdditions());
        result.removeAll(diff.getDeletions());
        return result;
    }

    @Override
    public Set<Conflict> getConflicts(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn) {
        final long start = System.currentTimeMillis();
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
            if (!commonCommits.isEmpty()) {
                Model targetSubjectAdd = targetAdds.filter(subject, null, null);
                boolean sourceEntityDeleted = !sourceAddSubjects.contains(subject)
                        && sourceDelSubjectStatements.equals(original.filter(subject, null, null));
                boolean targetEntityDeleted = targetDels.containsAll(sourceDelSubjectStatements);

                if (sourceEntityDeleted && !targetEntityDeleted && !targetSubjectAdd.isEmpty()) {
                    result.add(createConflict(subject, null, sourceAdds, sourceDels, targetAdds, targetDels));
                    statementsToRemove.addAll(targetSubjectAdd);
                }
            }
        });

        statementsToRemove.forEach(statement -> Stream.of(sourceAdds, sourceDels, targetAdds, targetDels)
                .forEach(model -> model.remove(statement.getSubject(), statement.getPredicate(), null)));

        if (!commonCommits.isEmpty()) {
            targetDels.subjects().forEach(subject -> {
                // Check for deletion in right and addition in left if there are common parents
                Model targetDelSubjectStatements = targetDels.filter(subject, null, null);
                Model sourceSubjectAdd = sourceAdds.filter(subject, null, null);
                boolean targetEntityDeleted = !targetAddSubjects.contains(subject)
                        && targetDelSubjectStatements.equals(original.filter(subject, null, null));
                boolean sourceEntityDeleted = sourceDels.containsAll(targetDelSubjectStatements);

                if (targetEntityDeleted && !sourceEntityDeleted && !sourceSubjectAdd.isEmpty()) {
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
     * additions or deletions, in the specified direction, either ascending or descending by date. If descending,
     * the provided Resource identifying a Commit will be first.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param entityId The Resource identifying the Entity that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether the iterator should be ascending by date
     * @return Iterator of Resource ids for the requested Commits.
     */
    private Iterator<Resource> getCommitChainIterator(Resource commitId, Resource entityId, boolean asc,
                                                      RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_ENTITY_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        query.setBinding(ENTITY_BINDING, entityId);
        try (TupleQueryResult result = query.evaluate()) {
            LinkedList<Resource> commits = new LinkedList<>();
            result.forEach(bindings -> commits.add(Bindings.requiredResource(bindings, PARENT_BINDING)));
            return asc ? commits.descendingIterator() : commits.iterator();
        }
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the Revision associated with
     * the supplied Commit resource. Revision addition statements are added to the additions map if not present. If
     * present, the counter of the times the statement has been added is incremented. Revision deletion
     * statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param deletions The Map of Statements deleted to update.
     * @param commitId  The Resource identifying the Commit.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions,
                                      Resource commitId, RepositoryConnection conn) {
        getAdditions(commitId, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Updates the supplied Maps of addition and deletions statements with statements from the additions/deletions
     * associated with the supplied Commit resource. These additions/deletions are filtered to only include statements
     * whose subjects are Subjects of Deletions from the provided List of Commits. Addition statements are added to the
     * additions map if not present. If present, the counter of the times the statement has been added is incremented.
     * Deletion statements are removed from the additions map if only one exists, if more than one exists the counter is
     * decremented, otherwise the statements are added to the deletions list.
     *
     * @param additions The Map of Statements added to update.
     * @param deletions The Map of Statements deleted to update.
     * @param commitId  The Resource identifying the Commit.
     * @param commits   The Set of Commit IRIs to filter the additions/deletions with.
     * @param conn      The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Map<Statement, Integer> additions, Map<Statement, Integer> deletions,
                                      Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        getAdditions(commitId, commits, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, commits, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Retrieves the additions for provided commitId. Returns a {@link GraphQueryResult}, an iterator over the returned
     * statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getAdditions(Resource commitId, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_ADDITIONS_IN_COMMIT
                .replace("%COMMITLIST%","<" + commitId.stringValue() + ">")
                .replace("%SUBJECTLIST%", ""));
        return additionsQuery.evaluate();
    }

    /**
     * Retrieves the additions for provided commitId whose subjects are filtered from the provided Commit List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param commits  The Set of Commit IRIs used to filter the Resources to retrieve from the additions graph.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getAdditions(Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_FILTERED_ADDITIONS_SUBQUERY
                .replace("%COMMITLIST%","<" + StringUtils.join(commits, "> <") + ">")
                .replace("%THISCOMMIT%", "<" + commitId.stringValue() + ">"));
        return additionsQuery.evaluate();
    }

    /**
     * Retrieves the deletions for provided commitId. Returns a {@link GraphQueryResult}, an iterator over the returned
     * statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getDeletions(Resource commitId, RepositoryConnection conn) {
        GraphQuery additionsQuery = conn.prepareGraphQuery(GET_DELETIONS_IN_COMMIT
                .replace("%COMMITLIST%","<" + commitId.stringValue() + ">")
                .replace("%SUBJECTLIST%", ""));
        return additionsQuery.evaluate();
    }

    /**
     * Retrieves the deletions for provided commitId whose subjects are filtered from the provided Commit List.
     * Returns a {@link GraphQueryResult}, an iterator over the returned statements.
     *
     * @param commitId The Resource of the Commit to query for additions.
     * @param commits  The Set of Commit IRIs used to filter the Resources to retrieve from the deletions graph.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A {@link GraphQueryResult} iterator of Statements returned from the query.
     */
    private GraphQueryResult getDeletions(Resource commitId, List<Resource> commits, RepositoryConnection conn) {
        GraphQuery deletionsQuery = conn.prepareGraphQuery(GET_FILTERED_DELETIONS_SUBQUERY
                .replace("%COMMITLIST%","<" + StringUtils.join(commits, "> <") + ">")
                .replace("%THISCOMMIT%", "<" + commitId.stringValue() + ">"));
        return deletionsQuery.evaluate();
    }

    /**
     * Remove the supplied triple from the mapToRemove if one instance of it exists, if more than one, decrement
     * counter. Otherwise, add the triple to mapToAdd. If one already exists in mapToAdd, increment counter.
     *
     * @param statement   The statement to process
     * @param mapToAdd    The Map of addition statements to track number of times a statement has been added and to add
     *                    the statement to if it does not exist in mapToRemove
     * @param mapToRemove The Map of deletion statements to track the number of times a statement has been removed and
     *                    to remove the statement from if it exists
     */
    private void updateModels(Statement statement, Map<Statement, Integer> mapToAdd, Map<Statement,
            Integer> mapToRemove) {
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

    /**
     * Creates a conflict using the provided parameters as the data to construct it.
     *
     * @param subject        The Resource identifying the conflicted statement's subject.
     * @param predicate      The IRI identifying the conflicted statement's predicate.
     * @param left           The Model of the left item being compared.
     * @param leftDeletions  The Model of the deleted statements from the left Model.
     * @param right          The Model of the right item being compared.
     * @param rightDeletions The Model of the deleted statements from the right Model.
     * @return A Conflict created using all the provided data.
     */
    private Conflict createConflict(Resource subject, IRI predicate, Model left, Model leftDeletions,
                                    Model right, Model rightDeletions) {
        Difference.Builder leftDifference = new Difference.Builder();
        final Difference.Builder rightDifference = new Difference.Builder();

        Model leftAddModel = mf.createEmptyModel();
        leftAddModel.addAll(left.filter(subject, predicate, null));
        Model leftDelModel = mf.createEmptyModel();
        leftDelModel.addAll(leftDeletions.filter(subject, predicate, null));
        leftDifference
                .additions(leftAddModel)
                .deletions(leftDelModel);

        Model rightAddModel = mf.createEmptyModel();
        rightAddModel.addAll(right.filter(subject, predicate, null));
        Model rightDelModel = mf.createEmptyModel();
        rightDelModel.addAll(rightDeletions.filter(subject, predicate, null));
        rightDifference
                .additions(rightAddModel)
                .deletions(rightDelModel);

        return new Conflict.Builder(vf.createIRI(subject.stringValue()))
                .leftDifference(leftDifference.build())
                .rightDifference(rightDifference.build())
                .build();
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
