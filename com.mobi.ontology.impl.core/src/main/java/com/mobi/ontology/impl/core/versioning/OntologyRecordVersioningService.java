package com.mobi.ontology.impl.core.versioning;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
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
        service = { VersioningService.class, OntologyRecordVersioningService.class }
)
public class OntologyRecordVersioningService extends BaseVersioningService<OntologyRecord> {
    @Reference
    protected OntologyRecordFactory ontologyRecordFactory;

    @Reference
    protected OntologyManager ontologyManager;

    @Reference
    protected OntologyCache ontologyCache;
    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    private static final String ADDITION_ONTOLOGY_IRI_QUERY;
    private static final String REVISION_BINDING = "revision";
    private static final String ONTOLOGY_IRI_BINDING = "ontologyIRI";

    static {
        try {
            ADDITION_ONTOLOGY_IRI_QUERY = IOUtils.toString(
                    Objects.requireNonNull(OntologyRecordVersioningService.class
                            .getResourceAsStream("/get-ontology-iri-addition.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
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
        return OntologyRecord.TYPE;
    }

    @Override
    public void addCommit(VersionedRDFRecord record, Branch branch, Commit commit, RepositoryConnection conn) {
        if (isMasterBranch(record, branch)) {
            commit.getBaseCommit_resource()
                    .ifPresent(baseCommit -> updateOntologyIRI(record.getResource(), commit, conn));
        }
        commitManager.addCommit(branch, commit, conn);
        commit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri -> sendCommitEvent(record.getResource(), branch.getResource(), userIri,
                        commit.getResource()));
    }

    @Override
    public Resource addCommit(VersionedRDFRecord record, Branch branch, User user, String message, Model additions,
                              Model deletions, Commit baseCommit, Commit auxCommit, RepositoryConnection conn) {
        InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
        Commit newCommit = commitManager.createCommit(inProgressCommit, message, baseCommit, auxCommit);
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
                    List<Resource> sourceChain = commitManager.getCommitChain(auxCommit.getResource(), false, conn);
                    sourceChain.removeAll(commitManager.getCommitChain(baseCommit.getResource(), false, conn));
                    model = differenceManager.applyDifference(compiledResourceManager.getCompiledResource(sourceChain, conn), diff);
                } else {
                    // Else, this is a regular commit. Make sure we remove duplicated add/del statements
                    model = differenceManager.applyDifference(mf.createEmptyModel(), diff);
                }
                updateOntologyIRI(record.getResource(), model, conn);
            }
        }
        commitManager.addCommit(branch, newCommit, conn);
        commitManager.updateCommit(newCommit, additions, deletions, conn);
        sendCommitEvent(record.getResource(), branch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
    }

    private void updateOntologyIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
        OntologyRecord record = thingManager.getObject(recordId, ontologyRecordFactory, conn);
        Optional<Resource> iri = record.getOntologyIRI();
        iri.ifPresent(resource -> ontologyCache.clearCacheImports(resource));
        IRI generatedIRI = vf.createIRI(Activity.generated_IRI);
        Resource revisionIRI = (Resource) commit.getProperty(generatedIRI)
                .orElseThrow(() -> new IllegalStateException("Commit is missing revision."));
        TupleQuery query = conn.prepareTupleQuery(ADDITION_ONTOLOGY_IRI_QUERY);
        query.setBinding(REVISION_BINDING, revisionIRI);
        try (TupleQueryResult result = query.evaluate()) {
            if (result.hasNext()) {
                Resource newIRI = Bindings.requiredResource(result.next(), ONTOLOGY_IRI_BINDING);
                if (iri.isEmpty() || !newIRI.equals(iri.get())) {
                    testOntologyIRIUniqueness(newIRI);
                    record.setOntologyIRI(newIRI);
                    thingManager.updateObject(record, conn);
                    ontologyCache.clearCacheImports(newIRI);
                }
            }
        }
    }

    private void updateOntologyIRI(Resource recordId, Model additions, RepositoryConnection conn) {
        OntologyRecord record = thingManager.getObject(recordId, ontologyRecordFactory, conn);
        Optional<Resource> iri = record.getOntologyIRI();
        iri.ifPresent(resource -> ontologyCache.clearCacheImports(resource));

        Optional<Statement> ontStmt = additions
                .filter(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Ontology.TYPE))
                .stream()
                .findFirst();
        if (ontStmt.isPresent()) {
            Resource newIRI = ontStmt.get().getSubject();
            if (iri.isEmpty() || !newIRI.equals(iri.get())) {
                testOntologyIRIUniqueness(newIRI);
                record.setOntologyIRI(newIRI);
                thingManager.updateObject(record, conn);
                ontologyCache.clearCacheImports(newIRI);
            }
        }
    }

    private void testOntologyIRIUniqueness(Resource ontologyIRI) {
        if (ontologyManager.ontologyIriExists(ontologyIRI)) {
            throw new IllegalArgumentException("Ontology already exists with IRI " + ontologyIRI);
        }
    }
}
