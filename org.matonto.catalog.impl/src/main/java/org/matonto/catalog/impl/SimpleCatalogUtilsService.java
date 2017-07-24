package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.builder.Difference;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Revision;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

@Component(
        immediate = true,
        name = SimpleCatalogUtilsService.COMPONENT_NAME
)
public class SimpleCatalogUtilsService implements CatalogUtilsService {
    static final String COMPONENT_NAME = "org.matonto.catalog.api.CatalogUtilsService";
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
    private InProgressCommitFactory inProgressCommitFactory;

    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String GET_COMMIT_CHAIN;
    private static final String USER_BINDING = "user";
    private static final String PARENT_BINDING = "parent";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";

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
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Reference
    protected void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    protected void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    protected void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    protected void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    protected void setUnversionedRecordFactory(UnversionedRecordFactory unversionedRecordFactory) {
        this.unversionedRecordFactory = unversionedRecordFactory;
    }

    @Reference
    protected void setVersionedRecordFactory(VersionedRecordFactory versionedRecordFactory) {
        this.versionedRecordFactory = versionedRecordFactory;
    }

    @Reference
    protected void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    protected void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    protected void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Override
    public void validateResource(Resource resource, IRI classId, RepositoryConnection conn) {
        if (!conn.contains(resource, vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI), classId, resource)) {
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
    public void validateRecord(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection conn) {
        validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
        validateResource(recordId, recordType, conn);
        if (!conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId).hasNext()) {
            throw throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    @Override
    public <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        validateRecord(catalogId, recordId, factory.getTypeIRI(), conn);
        return getObject(recordId, factory, conn);
    }

    @Override
    public void validateUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                RepositoryConnection conn) {
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
        // TODO: Update to handle quads
        removeObject(commit, conn);
        Resource additionsResource = getAdditionsResource(commit);
        if (!conn.getStatements(null, null, additionsResource).hasNext()) {
            remove(additionsResource, conn);
        }
        Resource deletionsResource = getDeletionsResource(commit);
        if (!conn.getStatements(null, null, deletionsResource).hasNext()) {
            remove(deletionsResource, conn);
        }
    }

    @Override
    public void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource additionsResource = getAdditionsResource(commit);
        Resource deletionsResource = getDeletionsResource(commit);
        addChanges(additionsResource, deletionsResource, additions, conn);
        addChanges(deletionsResource, additionsResource, deletions, conn);
    }

    @Override
    public void updateCommit(Resource commitId, Model additions, Model deletions, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource additionsResource = getAdditionsResource(commitId, conn);
        Resource deletionsResource = getDeletionsResource(commitId, conn);
        addChanges(additionsResource, deletionsResource, additions, conn);
        addChanges(deletionsResource, additionsResource, deletions, conn);
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
    public Resource getAdditionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.additions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Additions not set on Commit " + commitId);
        }
        return (Resource) results.next().getObject();
    }

    @Override
    public Resource getAdditionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.additions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Additions not set on Commit " + commit.getResource());
        }
        return (Resource) new ArrayList<>(values).get(0);
    }

    @Override
    public Stream<Statement> getAdditions(Resource commitId, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource additionsId = getAdditionsResource(commitId, conn);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, additionsId);
        return StreamSupport.stream(statements.spliterator(), false);
    }

    @Override
    public Stream<Statement> getAdditions(Commit commit, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource additionsId = getAdditionsResource(commit);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, additionsId);
        return StreamSupport.stream(statements.spliterator(), false);
    }

    @Override
    public Resource getDeletionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.deletions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Deletions not set on Commit " + commitId);
        }
        return (Resource) results.next().getObject();
    }

    @Override
    public Resource getDeletionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.deletions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Deletions not set on Commit " + commit.getResource());
        }
        return (Resource) new ArrayList<>(values).get(0);
    }

    @Override
    public Stream<Statement> getDeletions(Resource commitId, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource deletionsId = getDeletionsResource(commitId, conn);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, deletionsId);
        return StreamSupport.stream(statements.spliterator(), false);
    }

    @Override
    public Stream<Statement> getDeletions(Commit commit, RepositoryConnection conn) {
        // TODO: Update to handle quads
        Resource deletionsId = getDeletionsResource(commit);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, deletionsId);
        return StreamSupport.stream(statements.spliterator(), false);
    }

    @Override
    public void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                           RepositoryConnection conn) {
        if (changes != null) {
            changes.forEach(statement -> {
                if (!conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                        oppositeNamedGraph).hasNext()) {
                    conn.add(statement, targetNamedGraph);
                } else {
                    conn.remove(statement, oppositeNamedGraph);
                }
            });
        }
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
    public boolean commitInBranch(Resource branchId, Resource commitId, RepositoryConnection conn) {
        Branch branch = getExpectedObject(branchId, branchFactory, conn);
        Resource head = getHeadCommitIRI(branch);
        return (head.equals(commitId) || getCommitChain(head, false, conn).contains(commitId));
    }
    
    @Override
    public List<Resource> getCommitChain(Resource commitId, boolean asc, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Resource> commits = getCommitChainIterator(commitId, asc, conn);
        commits.forEachRemaining(results::add);
        return results;
    }

    @Override
    public Difference getRevisionChanges(List<Resource> commits, RepositoryConnection conn) {
        Difference difference = new Difference.Builder()
                .additions(mf.createModel())
                .deletions(mf.createModel())
                .build();
        commits.forEach(commitId -> aggregateDifferences(difference, commitId, conn));
        return difference;
    }

    @Override
    public Model getCompiledResource(Resource commitId, RepositoryConnection conn) {
        return getCompiledResource(getCommitChain(commitId, false, conn), conn);
    }

    @Override
    public Model getCompiledResource(List<Resource> commits, RepositoryConnection conn) {
        Difference revisionChanges = getRevisionChanges(commits, conn);
        return revisionChanges.getAdditions();
    }

    @Override
    public Difference getCommitDifference(Resource commitId, RepositoryConnection conn) {
        Resource additionsIRI = getAdditionsResource(commitId, conn);
        Resource deletionsIRI = getDeletionsResource(commitId, conn);
        Model addModel = mf.createModel();
        Model deleteModel = mf.createModel();
        conn.getStatements(null, null, null, additionsIRI).forEach(statement ->
                addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        conn.getStatements(null, null, null, deletionsIRI).forEach(statement ->
                deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
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
     * Updates the supplied Difference with statements from the Revision associated with the supplied Commit resource.
     * Revision addition statements are added to the Difference additions model. Revision deletion statements are
     * removed from the Difference additions model if they exist, otherwise they are added to the Difference deletions
     * model.
     *
     * @param difference    The Difference object to update.
     * @param commitId      The Resource identifying the Commit.
     * @param conn          The RepositoryConnection to query the repository.
     */
    private void aggregateDifferences(Difference difference, Resource commitId, RepositoryConnection conn) {
        Model additions = difference.getAdditions();
        Model deletions = difference.getDeletions();
        getAdditions(commitId, conn).forEach(statement -> updateModels(statement, additions, deletions));
        getDeletions(commitId, conn).forEach(statement -> updateModels(statement, deletions, additions));
    }

    /**
     * Remove the supplied triple from the modelToRemove if it exists, otherwise add the triple to modelToAdd.
     *
     * @param statement     The statement to process
     * @param modelToAdd    The Model to add the statement to if it does not exist in modelToRemove
     * @param modelToRemove The Model to remove the statement from if it exists
     */
    private void updateModels(Statement statement, Model modelToAdd, Model modelToRemove) {
        Resource subject = statement.getSubject();
        IRI predicate = statement.getPredicate();
        Value object = statement.getObject();
        if (modelToRemove.contains(subject, predicate, object)) {
            modelToRemove.remove(subject, predicate, object);
        } else {
            modelToAdd.add(subject, predicate, object);
        }
    }
}
