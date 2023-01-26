package com.mobi.ontology.impl.core.versioning;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.owl.Ontology;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.cache.OntologyCache;
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
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferencePolicyOption;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Component(
        immediate = true,
        service = { VersioningService.class, OntologyRecordVersioningService.class }
)
public class OntologyRecordVersioningService extends BaseVersioningService<OntologyRecord> {
    private OntologyRecordFactory ontologyRecordFactory;
    private OntologyManager ontologyManager;
    private OntologyCache ontologyCache;
    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    private static final String ONTOLOGY_IRI_QUERY;
    private static final String ADDITION_ONTOLOGY_IRI_QUERY;
    private static final String BRANCH_BINDING = "branch";
    private static final String RECORD_BINDING = "record";
    private static final String REVISION_BINDING = "revision";
    private static final String ONTOLOGY_IRI_BINDING = "ontologyIRI";

    static {
        try {
            ONTOLOGY_IRI_QUERY = IOUtils.toString(
                    OntologyRecordVersioningService.class.getResourceAsStream("/record-with-master.rq"),
                    StandardCharsets.UTF_8
            );
            ADDITION_ONTOLOGY_IRI_QUERY = IOUtils.toString(
                    OntologyRecordVersioningService.class.getResourceAsStream("/get-ontology-iri-addition.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
    }

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

    @Reference(policyOption = ReferencePolicyOption.GREEDY)
    protected void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    protected void setOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    @Reference
    protected void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Override
    public String getTypeIRI() {
        return OntologyRecord.TYPE;
    }

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        Optional<Resource> recordOpt = getRecordIriIfMaster(branch, conn);
        recordOpt.ifPresent(recordId -> commit.getBaseCommit_resource().ifPresent(baseCommit ->
                updateOntologyIRI(recordId, commit, conn)));
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
                Difference diff = new Difference.Builder().additions(additions == null ? mf.createEmptyModel() : additions)
                        .deletions(deletions == null ? mf.createEmptyModel() : deletions).build();
                if (auxCommit != null) {
                    // If this is a merge, collect all the additions from the aux branch and provided models
                    List<Resource> sourceChain = catalogUtils.getCommitChain(auxCommit.getResource(), false, conn);
                    sourceChain.removeAll(catalogUtils.getCommitChain(baseCommit.getResource(), false, conn));
                    model = catalogUtils.applyDifference(catalogUtils.getCompiledResource(sourceChain, conn), diff);
                } else {
                    // Else, this is a regular commit. Make sure we remove duplicated add/del statements
                    model = catalogUtils.applyDifference(mf.createEmptyModel(), diff);
                }
                updateOntologyIRI(recordId, model, conn);
            }
        });
        catalogUtils.addCommit(branch, newCommit, conn);
        catalogUtils.updateCommit(newCommit, additions, deletions, conn);
        return newCommit.getResource();
    }

    private void updateOntologyIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
        OntologyRecord record = catalogUtils.getObject(recordId, ontologyRecordFactory, conn);
        Optional<Resource> iri = record.getOntologyIRI();
        iri.ifPresent(resource -> ontologyCache.clearCacheImports(resource));
        IRI generatedIRI = vf.createIRI(Activity.generated_IRI);
        Resource revisionIRI = (Resource) commit.getProperty(generatedIRI)
                .orElseThrow(() -> new IllegalStateException("Commit is missing revision."));
        TupleQuery query = conn.prepareTupleQuery(ADDITION_ONTOLOGY_IRI_QUERY);
        query.setBinding(REVISION_BINDING, revisionIRI);
        TupleQueryResult result = query.evaluate();
        if (result.hasNext()) {
            Resource newIRI = Bindings.requiredResource(result.next(), ONTOLOGY_IRI_BINDING);
            if (!iri.isPresent() || !newIRI.equals(iri.get())) {
                testOntologyIRIUniqueness(newIRI);
                record.setOntologyIRI(newIRI);
                catalogUtils.updateObject(record, conn);
                ontologyCache.clearCacheImports(newIRI);
            }
        }
    }

    private void updateOntologyIRI(Resource recordId, Model additions, RepositoryConnection conn) {
        OntologyRecord record = catalogUtils.getObject(recordId, ontologyRecordFactory, conn);
        Optional<Resource> iri = record.getOntologyIRI();
        iri.ifPresent(resource -> ontologyCache.clearCacheImports(resource));

        Optional<Statement> ontStmt = additions
                .filter(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Ontology.TYPE))
                .stream()
                .findFirst();
        if (ontStmt.isPresent()) {
            Resource newIRI = ontStmt.get().getSubject();
            if (!iri.isPresent() || !newIRI.equals(iri.get())) {
                testOntologyIRIUniqueness(newIRI);
                record.setOntologyIRI(newIRI);
                catalogUtils.updateObject(record, conn);
                ontologyCache.clearCacheImports(newIRI);
            }
        }
    }

    private void testOntologyIRIUniqueness(Resource ontologyIRI) {
        if (ontologyManager.ontologyIriExists(ontologyIRI)) {
            throw new IllegalArgumentException("Ontology already exists with IRI " + ontologyIRI);
        }
    }

    private Optional<Resource> getRecordIriIfMaster(Branch branch, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(ONTOLOGY_IRI_QUERY);
        query.setBinding(BRANCH_BINDING, branch.getResource());
        TupleQueryResult result = query.evaluate();
        if (!result.hasNext()) {
            result.close();
            return Optional.empty();
        }
        Optional<Resource> recordIriOpt = Optional.of(Bindings.requiredResource(result.next(), RECORD_BINDING));
        result.close();
        return recordIriOpt;
    }
}
