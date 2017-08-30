package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.semanticweb.owlapi.formats.RDFXMLDocumentFormat;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyFactory;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public class MatOntoOntologyFactory implements OWLOntologyFactory {

    private static final Logger LOG = LoggerFactory.getLogger(MatOntoOntologyFactory.class);

    private OntologyManager ontologyManager;
    private OWLOntologyFactory ontologyFactory;
    private Map<IRI, OWLOntology> loadedOntologies;

    public MatOntoOntologyFactory(OntologyManager ontologyManager, OWLOntologyFactory factory) {
        this.ontologyManager = ontologyManager;
        this.ontologyFactory = factory;
        this.loadedOntologies = new HashMap<>();
    }

    @Override
    public boolean canCreateFromDocumentIRI(IRI documentIRI) {
        return documentIRI.getIRIString().startsWith(MatOntoOntologyIRIMapper.protocol);
    }

    @Override
    public boolean canAttemptLoading(OWLOntologyDocumentSource source) {
        return !source.hasAlredyFailedOnIRIResolution()
                && source.getDocumentIRI().getIRIString().startsWith(MatOntoOntologyIRIMapper.protocol);
    }

    @Override
    public OWLOntology createOWLOntology(OWLOntologyManager manager, OWLOntologyID ontologyID, IRI documentIRI,
                                         OWLOntologyCreationHandler handler) throws OWLOntologyCreationException {
        LOG.debug("createOWLOntology called with: {}", documentIRI);
        return ontologyFactory.createOWLOntology(manager, ontologyID, documentIRI, handler);
    }

    @Override
    public OWLOntology loadOWLOntology(OWLOntologyManager manager, OWLOntologyDocumentSource source,
                                       OWLOntologyCreationHandler handler, OWLOntologyLoaderConfiguration config)
            throws OWLOntologyCreationException {
        IRI iri = source.getDocumentIRI();
        LOG.debug("loadOWLOntology called with: {}", iri);
        // if (!loadedOntologies.containsKey(iri)) {
            IRI recordId = IRI.create(iri.getIRIString().replace(MatOntoOntologyIRIMapper.protocol,
                    MatOntoOntologyIRIMapper.standardProtocol));
            Ontology matOnt = ontologyManager.retrieveOntology(SimpleOntologyValues.matontoIRI(recordId))
                    .orElseThrow(() -> new OWLOntologyCreationException("Ontology " + recordId
                            + " could not be found"));
            OWLOntology ont = SimpleOntologyValues.owlapiOntology(matOnt);
            handler.ontologyCreated(ont);
            ont.importsDeclarations().forEach(manager::makeLoadImportRequest);
            OWLDocumentFormat format = new RDFXMLDocumentFormat();
            format.setAddMissingTypes(false);
            handler.setOntologyFormat(ont, format);
            loadedOntologies.put(iri, ont);
            return ont;
        /*}
        return loadedOntologies.get(iri);*/
    }
}
