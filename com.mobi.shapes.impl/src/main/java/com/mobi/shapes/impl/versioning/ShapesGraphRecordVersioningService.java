package com.mobi.shapes.impl.versioning;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecordFactory;
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
        service = { VersioningService.class, ShapesGraphRecordVersioningService.class }
)
public class ShapesGraphRecordVersioningService extends BaseVersioningService<ShapesGraphRecord> {
    @Reference
    ShapesGraphRecordFactory shapesGraphRecordFactory;

    @Reference
    ShapesGraphManager shapesGraphManager;

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
    protected void updateMasterRecordIRI(VersionedRDFRecord record, Commit commit, RepositoryConnection conn) {
        Resource headGraph = branchManager.getHeadGraph(
                branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), record.getResource(), conn));
        Model currentIRIs = QueryResults.asModel(
                conn.getStatements(null, RDF.TYPE, OWL.ONTOLOGY, headGraph));
        if (currentIRIs.isEmpty()) {
            throw new IllegalStateException("Ontology does not contain an ontology definition");
        }
        ShapesGraphRecord shapesGraphRecord = shapesGraphRecordFactory.getExisting(record.getResource(),
                record.getModel()).orElseThrow(() ->
                new IllegalStateException("Record expected to be of type ShapesGraphRecord"));
        Resource existingOntologyIRI = record.getTrackedIdentifier()
                .orElseThrow(() -> new IllegalStateException("ShapesGraphRecord " + record.getResource()
                        + " does not have an ontologyIRI"));
        Model ontologyDefinitions = mf.createEmptyModel();
        currentIRIs.subjects().stream()
                .map(iri -> QueryResults.asModel(conn.getStatements(iri, null, null, headGraph)))
                .forEach(ontologyDefinitions::addAll);
        Resource currentOntologyIRI = OntologyModels.findFirstOntologyIRI(ontologyDefinitions)
                .orElse((IRI) existingOntologyIRI);

        if (!currentOntologyIRI.equals(existingOntologyIRI)) {
            assertShapesGraphIRIUniqueness(currentOntologyIRI);
            record.setTrackedIdentifier(currentOntologyIRI);
            thingManager.updateObject(record, conn);
        }
    }

    private void assertShapesGraphIRIUniqueness(Resource shapesGraphIRI) {
        if (shapesGraphManager.shapesGraphIriExists(shapesGraphIRI)) {
            throw new IllegalArgumentException("A Record already exists with tracked IRI " + shapesGraphIRI);
        }
    }
}
