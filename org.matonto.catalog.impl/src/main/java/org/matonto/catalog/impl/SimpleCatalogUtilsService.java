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
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogUtilsService;
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
import org.openrdf.model.vocabulary.RDF;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Optional;
import java.util.Set;

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
    private static final String USER_BINDING = "user";
    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";

    static {
        try {
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-in-progress-commit.rq"),
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
    public boolean resourceExists(Resource resourceIRI, String type, RepositoryConnection conn) {
        return conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(type), resourceIRI)
                .hasNext();
    }

    @Override
    public boolean resourceExists(Resource resourceIRI, RepositoryConnection conn) {
        return conn.getStatements(null, null, null, resourceIRI).hasNext();
    }

    @Override
    public void testObjectId(Resource objectId, IRI classId, RepositoryConnection conn) {
        if (!resourceExists(objectId, classId.stringValue(), conn)) {
            throw new IllegalArgumentException(classId.getLocalName() + " " + objectId.stringValue()
                    + " could not be found.");
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
    public <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                        + " could not be found"));
    }

    @Override
    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        Model model = RepositoryResults.asModel(conn.getStatements(null, null, null, id), mf);
        return factory.getExisting(id, model);
    }

    @Override
    public <T extends Thing> void removeObject(T object, RepositoryConnection conn) {
        remove(object.getResource(), conn);
    }

    @Override
    public void remove(Resource resourceId, RepositoryConnection conn) {
        conn.remove((Resource) null, null, null, resourceId);
    }

    @Override
    public void testRecordPath(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection conn) {
        testObjectId(catalogId, vf.createIRI(Catalog.TYPE), conn);
        testObjectId(recordId, recordType, conn);
        if (!conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId).hasNext()) {
            throw throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    @Override
    public <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        testRecordPath(catalogId, recordId, factory.getTypeIRI(), conn);
        return getObject(recordId, factory, conn);
    }

    @Override
    public void testUnversionedDistributionPath(Resource catalogId, Resource recordId, Resource distributionId,
                                                RepositoryConnection conn) {
        UnversionedRecord record = getRecord(catalogId, recordId, unversionedRecordFactory, conn);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution_resource();
        if (!distributionIRIs.contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, recordId, recordFactory);
        }
    }

    @Override
    public Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                   RepositoryConnection conn) {
        testUnversionedDistributionPath(catalogId, recordId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void testVersionPath(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn) {
        VersionedRecord record = getRecord(catalogId, recordId, versionedRecordFactory, conn);
        Set<Resource> versionIRIs = record.getVersion_resource();
        if (!versionIRIs.contains(versionId)) {
            throw throwDoesNotBelong(versionId, versionFactory, recordId, recordFactory);
        }
    }

    @Override
    public <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId,
                                            OrmFactory<T> factory, RepositoryConnection conn) {
        testVersionPath(catalogId, recordId, versionId, conn);
        return getObject(versionId, factory, conn);
    }

    @Override
    public void testVersionedDistributionPath(Resource catalogId, Resource recordId, Resource versionId,
                                              Resource distributionId, RepositoryConnection conn) {
        Version version = getVersion(catalogId, recordId, versionId, versionFactory, conn);
        if (!version.getVersionedDistribution_resource().contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, versionId, versionFactory);
        }
    }

    @Override
    public Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                 Resource distributionId, RepositoryConnection conn) {
        testVersionedDistributionPath(catalogId, recordId, versionId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void testBranchPath(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, versionedRDFRecordFactory, conn);
        testBranchPath(record, branchId);
    }

    @Override
    public <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId,
                                          OrmFactory<T> factory, RepositoryConnection conn) {
        testBranchPath(catalogId, recordId, branchId, conn);
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
        return branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch "
                + branch.getResource().stringValue() + " does not have a head Commit set."));
    }

    @Override
    public void testInProgressCommitPath(Resource catalogId, Resource recordId, Resource commitId,
                                         RepositoryConnection conn) {
        testRecordPath(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = getObject(commitId, inProgressCommitFactory, conn);
        Resource onRecord = commit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                new IllegalStateException("Record was not set on InProgressCommit " + commitId.stringValue()));
        if (!onRecord.equals(recordId)) {
            throw throwDoesNotBelong(commitId, commitFactory, recordId, recordFactory);
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
        testInProgressCommitPath(catalogId, recordId, commitId, conn);
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
    public void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn) {
        Resource additionsResource = getAdditionsResource(commit);
        Resource deletionsResource = getDeletionsResource(commit);
        addChanges(additionsResource, deletionsResource, additions, conn);
        addChanges(deletionsResource, additionsResource, deletions, conn);
    }

    @Override
    public void updateCommit(Resource commitId, Model additions, Model deletions, RepositoryConnection conn) {
        Resource additionsResource = getAdditionsResource(commitId, conn);
        Resource deletionsResource = getDeletionsResource(commitId, conn);
        addChanges(additionsResource, deletionsResource, additions, conn);
        addChanges(deletionsResource, additionsResource, deletions, conn);
    }

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        if (!resourceExists(commit.getResource(), conn)) {
            branch.setHead(commit);
            removeObject(branch, conn);
            addObject(branch, conn);
            addObject(commit, conn);
        } else {
            throw throwAlreadyExists(commit.getResource(), commitFactory);
        }
    }

    @Override
    public Resource getAdditionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.additions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Additions not set on Commit " + commitId.stringValue());
        }
        return (Resource) results.next().getObject();
    }

    @Override
    public Resource getAdditionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.additions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Additions not set on Commit " + commit.getResource().stringValue());
        }
        return (Resource) new ArrayList<>(values).get(0);
    }

    @Override
    public Resource getDeletionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.deletions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Deletions not set on Commit " + commitId.stringValue());
        }
        return (Resource) results.next().getObject();
    }

    @Override
    public Resource getDeletionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.deletions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Deletions not set on Commit " + commit.getResource().stringValue());
        }
        return (Resource) new ArrayList<>(values).get(0);
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
    public <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory) {
        return new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                + " already exists");
    }

    @Override
    public <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                          OrmFactory<T> childFactory,
                                                                                          Resource parent,
                                                                                          OrmFactory<S> parentFactory) {
        return new IllegalArgumentException(childFactory.getTypeIRI().getLocalName() + " " + child.stringValue()
                + " does not belong to " + parentFactory.getTypeIRI().getLocalName() + " " + parent.stringValue());
    }

    @Override
    public <T extends Thing> IllegalStateException throwThingNotFound(Resource id, OrmFactory<T> factory) {
        return new IllegalStateException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                + " could not be found");
    }

    private void testBranchPath(VersionedRDFRecord record, Resource branchId) {
        Set<Resource> branchIRIs = record.getBranch_resource();
        if (!branchIRIs.contains(branchId)) {
            throw throwDoesNotBelong(branchId, branchFactory, record.getResource(), versionedRDFRecordFactory);
        }
    }
}
