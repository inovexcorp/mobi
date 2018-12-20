package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
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

public class MobiOntologyFactory implements OWLOntologyFactory {

    private static final Logger LOG = LoggerFactory.getLogger(MobiOntologyFactory.class);

    private OntologyManager ontologyManager;
    private OWLOntologyFactory ontologyFactory;
    private SesameTransformer sesameTransformer;

    public MobiOntologyFactory(OntologyManager ontologyManager, OWLOntologyFactory factory,
                               SesameTransformer sesameTransformer) {
        this.ontologyManager = ontologyManager;
        this.ontologyFactory = factory;
        this.sesameTransformer = sesameTransformer;
    }

    @Override
    public boolean canCreateFromDocumentIRI(IRI documentIRI) {
        return documentIRI.getIRIString().startsWith(MobiOntologyIRIMapper.protocol);
    }

    @Override
    public boolean canAttemptLoading(OWLOntologyDocumentSource source) {
        return !source.hasAlredyFailedOnIRIResolution()
                && source.getDocumentIRI().getIRIString().startsWith(MobiOntologyIRIMapper.protocol);
    }

    @Override
    public OWLOntology createOWLOntology(OWLOntologyManager manager, OWLOntologyID ontologyID, IRI documentIRI,
                                         OWLOntologyCreationHandler handler) throws OWLOntologyCreationException {
        LOG.trace("Enter createOWLOntology()");
        long start = System.currentTimeMillis();
        if (!ontologyID.isAnonymous()) {
            LOG.debug("createOWLOntology: {}", ontologyID.toString());
        }
        OWLOntology owlOntology = ontologyFactory.createOWLOntology(manager, ontologyID, documentIRI, handler);
        LOG.trace("Exit createOWLOntology() {} ms", System.currentTimeMillis() - start);
        return owlOntology;
    }

    @Override
    public OWLOntology loadOWLOntology(OWLOntologyManager manager, OWLOntologyDocumentSource source,
                                       OWLOntologyCreationHandler handler, OWLOntologyLoaderConfiguration config)
            throws OWLOntologyCreationException {
        LOG.trace("Enter loadOWLOntology()");
        long start = System.currentTimeMillis();
        OWLOntology existingOntology = null;
        IRI documentIRI = source.getDocumentIRI();
        if (manager.contains(documentIRI)) {
            existingOntology = manager.getOntology(documentIRI);
        }
        OWLOntologyID ontologyID = new OWLOntologyID();
        OWLOntology ont = createOWLOntology(manager, ontologyID, documentIRI, handler);
        if (existingOntology == null && !ont.isEmpty()) {
            // Junk from a previous parse. We should clear the ont
            LOG.trace("Clearing extraneous ontology");
            manager.removeOntology(ont);
            ont = createOWLOntology(manager, ontologyID, documentIRI, handler);
        }
        IRI recordId = IRI.create(documentIRI.getIRIString().replace(MobiOntologyIRIMapper.protocol,
                MobiOntologyIRIMapper.standardProtocol));
        Model ontologyModel = ontologyManager.getOntologyModel(SimpleOntologyValues.mobiIRI(recordId));
        RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
        org.eclipse.rdf4j.model.Model sesameModel = sesameTransformer.sesameModel(ontologyModel);
        OWLDocumentFormat format = parser.parse(new RioMemoryTripleSource(sesameModel), ont, config);
        handler.setOntologyFormat(ont, format);
        LOG.debug("Loaded imported Ontology: {}", ont.getOntologyID().toString());
        LOG.trace("Exit loadOWLOntology() {} ms", System.currentTimeMillis() - start);
        return ont;
    }
}
