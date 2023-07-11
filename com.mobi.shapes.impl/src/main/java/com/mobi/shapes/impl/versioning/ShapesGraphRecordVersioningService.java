package com.mobi.shapes.impl.versioning;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.owl.Ontology;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecordFactory;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.EventAdmin;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Component(
        immediate = true,
        service = { VersioningService.class, ShapesGraphRecordVersioningService.class }
)
public class ShapesGraphRecordVersioningService extends BaseVersioningService<ShapesGraphRecord> {

    private static final String ADDITION_SHAPES_GRAPH_IRI_QUERY;
    private static final String REVISION_BINDING = "revision";
    private static final String SHAPES_GRAPH_IRI_BINDING = "shapesGraphIRI";

    static {
        try {
            ADDITION_SHAPES_GRAPH_IRI_QUERY = IOUtils.toString(
                    Objects.requireNonNull(ShapesGraphRecordVersioningService.class
                            .getResourceAsStream("/get-shapes-graph-iri-addition.rq")), StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    ShapesGraphRecordFactory shapesGraphRecordFactory;

    @Reference
    ShapesGraphManager shapesGraphManager;

    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Activate
    void start(BundleContext context) {
        final ServiceReference<EventAdmin> ref = context.getServiceReference(EventAdmin.class);
        if (ref != null) {
            this.eventAdmin = context.getService(ref);
        }
    }

    @Override
    public String getTypeIRI() {
        return ShapesGraphRecord.TYPE;
    }

    @Override
    public void addCommit(VersionedRDFRecord record, Branch branch, Commit commit, RepositoryConnection conn) {
        if (isMasterBranch(record, branch)) {
            commit.getBaseCommit_resource()
                    .ifPresent(baseCommit -> updateShapesGraphIRI(record.getResource(), commit, conn));
        }
        catalogUtils.addCommit(branch, commit, conn);
        commit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri -> sendCommitEvent(record.getResource(), branch.getResource(), userIri,
                        commit.getResource()));
    }

    @Override
    public Resource addCommit(VersionedRDFRecord record, Branch branch, User user, String message, Model additions,
                              Model deletions, Commit baseCommit, Commit auxCommit, RepositoryConnection conn) {
        Commit newCommit = createCommit(catalogManager.createInProgressCommit(user), message, baseCommit, auxCommit);
        // Determine if branch is the master branch of a record
        if (isMasterBranch(record, branch)) {
            if (baseCommit != null) {
                // If this is not the initial commit
                Model model;
                Difference diff = new Difference.Builder()
                        .additions(additions == null ? mf.createEmptyModel() : additions)
                        .deletions(deletions == null ? mf.createEmptyModel() : deletions)
                        .build();
                if (auxCommit != null) {
                    // If this is a merge, collect all the additions from the aux branch and provided models
                    List<Resource> sourceChain = catalogUtils.getCommitChain(auxCommit.getResource(), false, conn);
                    sourceChain.removeAll(catalogUtils.getCommitChain(baseCommit.getResource(), false, conn));
                    model = catalogUtils.applyDifference(catalogUtils.getCompiledResource(sourceChain, conn), diff);
                } else {
                    // Else, this is a regular commit. Make sure we remove duplicated add/del statements
                    model = catalogUtils.applyDifference(mf.createEmptyModel(), diff);
                }
                updateShapesGraphIRI(record.getResource(), model, conn);
            }
        }
        catalogUtils.addCommit(branch, newCommit, conn);
        catalogUtils.updateCommit(newCommit, additions, deletions, conn);
        sendCommitEvent(record.getResource(), branch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
    }

    private void updateShapesGraphIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
        ShapesGraphRecord record = catalogUtils.getObject(recordId, shapesGraphRecordFactory, conn);
        Optional<Resource> iri = record.getShapesGraphIRI();
        IRI generatedIRI = vf.createIRI(Activity.generated_IRI);
        Resource revisionIRI = (Resource) commit.getProperty(generatedIRI)
                .orElseThrow(() -> new IllegalStateException("Commit is missing revision."));
        TupleQuery query = conn.prepareTupleQuery(ADDITION_SHAPES_GRAPH_IRI_QUERY);
        query.setBinding(REVISION_BINDING, revisionIRI);
        try (TupleQueryResult result = query.evaluate()) {
            if (result.hasNext()) {
                Resource newIRI = Bindings.requiredResource(result.next(), SHAPES_GRAPH_IRI_BINDING);
                if (iri.isEmpty() || !newIRI.equals(iri.get())) {
                    assertShapesGraphIRIUniqueness(newIRI);
                    record.setShapesGraphIRI(newIRI);
                    catalogUtils.updateObject(record, conn);
                }
            }
        }
    }

    private void updateShapesGraphIRI(Resource recordId, Model additions, RepositoryConnection conn) {
        ShapesGraphRecord record = catalogUtils.getObject(recordId, shapesGraphRecordFactory, conn);
        Optional<Resource> iri = record.getShapesGraphIRI();

        Optional<Statement> ontStmt = additions
                .filter(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Ontology.TYPE))
                .stream()
                .findFirst();
        if (ontStmt.isPresent()) {
            Resource newIRI = ontStmt.get().getSubject();
            if (iri.isEmpty() || !newIRI.equals(iri.get())) {
                assertShapesGraphIRIUniqueness(newIRI);
                record.setShapesGraphIRI(newIRI);
                catalogUtils.updateObject(record, conn);
            }
        }
    }

    private void assertShapesGraphIRIUniqueness(Resource shapesGraphIRI) {
        if (shapesGraphManager.shapesGraphIriExists(shapesGraphIRI)) {
            throw new IllegalArgumentException("Shapes Graph already exists with IRI " + shapesGraphIRI);
        }
    }

    private boolean isMasterBranch(VersionedRDFRecord record, Branch branch) {
        Optional<Resource> optMasterBranch = record.getMasterBranch_resource();
        return optMasterBranch.isPresent() && optMasterBranch.get().equals(branch.getResource());
    }
}
