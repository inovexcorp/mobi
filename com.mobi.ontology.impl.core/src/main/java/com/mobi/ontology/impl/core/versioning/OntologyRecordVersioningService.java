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

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.cache.OntologyCache;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.EventAdmin;

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
    protected void updateMasterRecordIRI(Resource recordId, Commit commit, RepositoryConnection conn) {
        Resource headGraph = branchManager.getHeadGraph(
                branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId, conn));
        Model currentIRIs = QueryResults.asModel(
                conn.getStatements(null, RDF.TYPE, OWL.ONTOLOGY, headGraph));
        if (currentIRIs.isEmpty()) {
            throw new IllegalStateException("Ontology does not contain an ontology definition");
        }
        OntologyRecord record = thingManager.getObject(recordId, ontologyRecordFactory, conn);
        Resource existingOntologyIRI = record.getOntologyIRI()
                .orElseThrow(() -> new IllegalStateException("OntologyRecord " + recordId.stringValue()
                        + " does not have an ontologyIRI"));
        Model ontologyDefinitions = mf.createEmptyModel();
        currentIRIs.subjects().stream()
                .map(iri -> QueryResults.asModel(conn.getStatements(iri, null, null, headGraph)))
                .forEach(ontologyDefinitions::addAll);
        OntologyId ontologyId = ontologyManager.createOntologyId(ontologyDefinitions);
        Resource currentOntologyIRI = ontologyId.getOntologyIRI().orElse((IRI) ontologyId.getOntologyIdentifier());

        if (!currentOntologyIRI.equals(existingOntologyIRI)) {
            ontologyCache.clearCacheImports(existingOntologyIRI);
            testOntologyIRIUniqueness(currentOntologyIRI);
            record.setOntologyIRI(currentOntologyIRI);
            thingManager.updateObject(record, conn);
            ontologyCache.clearCacheImports(currentOntologyIRI);
        }
    }

    private void testOntologyIRIUniqueness(Resource ontologyIRI) {
        if (ontologyManager.ontologyIriExists(ontologyIRI)) {
            throw new IllegalArgumentException("Ontology already exists with IRI " + ontologyIRI);
        }
    }
}
