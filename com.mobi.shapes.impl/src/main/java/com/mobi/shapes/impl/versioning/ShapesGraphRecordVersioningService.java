package com.mobi.shapes.impl.versioning;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Bindings;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecordFactory;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Component(
        immediate = true,
        service = { VersioningService.class, ShapesGraphRecordVersioningService.class }
)
public class ShapesGraphRecordVersioningService extends BaseVersioningService<ShapesGraphRecord> {

    private static final String SHAPES_GRAPH_IRI_QUERY;
    private static final String BRANCH_BINDING = "branch";
    private static final String RECORD_BINDING = "record";

    static {
        try {
            SHAPES_GRAPH_IRI_QUERY = IOUtils.toString(
                    ShapesGraphRecordVersioningService.class.getResourceAsStream("/record-with-master.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

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

    @Reference
    ValueFactory vf;

    @Reference
    ModelFactory mf;

    @Override
    public String getTypeIRI() {
        return ShapesGraphRecord.TYPE;
    }

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        Optional<Resource> recordOpt = getRecordIriIfMaster(branch, conn);
        recordOpt.ifPresent(recordId -> commit.getBaseCommit_resource().ifPresent(baseCommit ->
                updateShapesGraphIRI(recordId, commit, conn)));
        catalogUtils.addCommit(branch, commit, conn);
    }

    @Override
    public Resource addCommit(Branch branch, User user, String message, Model additions, Model deletions,
                                               Commit baseCommit, Commit auxCommit, RepositoryConnection conn) {
        Commit newCommit = createCommit(catalogManager.createInProgressCommit(user), message, baseCommit, auxCommit);
        // Determine if branch is the master branch of a record
        Optional<Resource> recordOpt = getRecordIriIfMaster(branch, conn);
        recordOpt.ifPresent(recordId -> {
            if (baseCommit != null) {
                // If this is not the initial commit
                Model model;
                Difference diff = new Difference.Builder().additions(additions == null ? mf.createModel() : additions)
                        .deletions(deletions == null ? mf.createModel() : deletions).build();
                if (auxCommit != null) {
                    // If this is a merge, collect all the additions from the aux branch and provided models
                    List<Resource> sourceChain = catalogUtils.getCommitChain(auxCommit.getResource(), false, conn);
                    sourceChain.removeAll(catalogUtils.getCommitChain(baseCommit.getResource(), false, conn));
                    model = catalogUtils.applyDifference(catalogUtils.getCompiledResource(sourceChain, conn), diff);
                } else {
                    // Else, this is a regular commit. Make sure we remove duplicated add/del statements
                    model = catalogUtils.applyDifference(mf.createModel(), diff);
                }
                updateShapesGraphIRI(recordId, model.stream(), conn);
            }
        });
        catalogUtils.addCommit(branch, newCommit, conn);
        catalogUtils.updateCommit(newCommit, additions, deletions, conn);
        return newCommit.getResource();
    }

    private void updateShapesGraphIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
        updateShapesGraphIRI(recordId, catalogUtils.getAdditions(commit, conn), conn);
    }

    private void updateShapesGraphIRI(Resource recordId, Stream<Statement> additions, RepositoryConnection conn) {
        ShapesGraphRecord record = catalogUtils.getObject(recordId, shapesGraphRecordFactory, conn);
        Optional<Resource> iri = record.getShapesGraphIRI();
        getNewShapesGraphIRI(additions).ifPresent(newIRI -> {
            if (!iri.isPresent() || !newIRI.equals(iri.get())) {
                assertShapesGraphIRIUniqueness(newIRI);
                record.setShapesGraphIRI(newIRI);
                catalogUtils.updateObject(record, conn);
            }
        });
    }

    private Optional<Resource> getNewShapesGraphIRI(Stream<Statement> additions) {
        return additions.filter(statement ->
                statement.getPredicate().equals(vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI)) &&
                        statement.getObject().equals(vf.createIRI(OWL.ONTOLOGY.stringValue())))
                .findFirst()
                .flatMap(statement -> Optional.of(statement.getSubject()));
    }

    private void assertShapesGraphIRIUniqueness(Resource shapesGraphIRI) {
        if (shapesGraphManager.shapesGraphIriExists(shapesGraphIRI)) {
            throw new IllegalArgumentException("Shapes Graph already exists with IRI " + shapesGraphIRI);
        }
    }

    private Optional<Resource> getRecordIriIfMaster(Branch branch, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(SHAPES_GRAPH_IRI_QUERY);
        query.setBinding(BRANCH_BINDING, branch.getResource());
        TupleQueryResult result = query.evaluateAndReturn();
        if (!result.hasNext()) {
            return Optional.empty();
        }
        return Optional.of(Bindings.requiredResource(result.next(), RECORD_BINDING));
    }
}
