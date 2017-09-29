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

import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyFactory;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MatOntoOntologyFactory implements OWLOntologyFactory {

    private static final Logger LOG = LoggerFactory.getLogger(MatOntoOntologyFactory.class);

    private OntologyManager ontologyManager;
    private OWLOntologyFactory ontologyFactory;
    private SesameTransformer sesameTransformer;

    public MatOntoOntologyFactory(OntologyManager ontologyManager, OWLOntologyFactory factory,
                                  SesameTransformer sesameTransformer) {
        this.ontologyManager = ontologyManager;
        this.ontologyFactory = factory;
        this.sesameTransformer = sesameTransformer;
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
        if (!ontologyID.isAnonymous()) {
            LOG.debug("createOWLOntology: {}", ontologyID.toString());
        }
        return ontologyFactory.createOWLOntology(manager, ontologyID, documentIRI, handler);
    }

    @Override
    public OWLOntology loadOWLOntology(OWLOntologyManager manager, OWLOntologyDocumentSource source,
                                       OWLOntologyCreationHandler handler, OWLOntologyLoaderConfiguration config)
            throws OWLOntologyCreationException {
        OWLOntology existingOntology = null;
        IRI documentIRI = source.getDocumentIRI();
        if (manager.contains(documentIRI)) {
            existingOntology = manager.getOntology(documentIRI);
        }
        OWLOntologyID ontologyID = new OWLOntologyID();
        OWLOntology ont = createOWLOntology(manager, ontologyID, documentIRI, handler);
        if (existingOntology == null && !ont.isEmpty()) {
            manager.removeOntology(ont);
            ont = createOWLOntology(manager, ontologyID, documentIRI, handler);
        }
        IRI recordId = IRI.create(documentIRI.getIRIString().replace(MatOntoOntologyIRIMapper.protocol,
                MatOntoOntologyIRIMapper.standardProtocol));
        Model ontologyModel = ontologyManager.getOntologyModel(SimpleOntologyValues.matontoIRI(recordId));
        RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
        org.openrdf.model.Model sesameModel = sesameTransformer.sesameModel(ontologyModel);
        OWLDocumentFormat format = parser.parse(new RioMemoryTripleSource(sesameModel), ont, config);
        handler.setOntologyFormat(ont, format);
        LOG.debug("loadOWLOntology: {}", ont.getOntologyID().toString());
        return ont;
    }
}
