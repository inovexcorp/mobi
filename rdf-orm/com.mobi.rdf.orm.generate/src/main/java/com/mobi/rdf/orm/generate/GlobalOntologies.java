package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * com.mobi.rdf.orm.generate
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Created by bdgould on 11/2/16.
 */
public interface GlobalOntologies {

    String PACKAGE_BASE = "com.mobi.ontologies";

//     final String DC_ELEMENTS_PACKAGE = PACKAGE_BASE + ".dcterms";

    String[] DC_TERMS = {"/dcterms.ttl", PACKAGE_BASE + ".dcterms", "dcterms"};

    String[] RDFS = {"/rdfs.owl", PACKAGE_BASE + ".rdfs", "rdfs"};

    String[] CUSTOM = {"/global_properties.trig", "com.mobi.global_properties", null};

    static void addGlobalReferenceOntologies(final List<ReferenceOntology> referenceOntologies) throws OntologyToJavaException {
        try {
            referenceOntologies.add(new ReferenceOntology(DC_TERMS[1], DC_TERMS[1], getModelResource(DC_TERMS[0])));
            referenceOntologies.add(new ReferenceOntology(RDFS[1], RDFS[1], getModelResource(RDFS[0])));
            referenceOntologies.add(new ReferenceOntology(CUSTOM[1], CUSTOM[1], getModelResource(CUSTOM[0])));
        } catch (IOException e) {
            throw new OntologyToJavaException("Issue reading global ontology: " + e.getMessage(), e);
        }


    }

    static Model getModelResource(final String name) throws IOException {
        final Optional<RDFFormat> format = Rio.getParserFormatForFileName(name);
        if (format.isPresent()) {
            return GraphReadingUtility.readOntology(format.get(), GlobalOntologies.class.getResourceAsStream(name), "file:" + name);
        } else {
            throw new IOException("Issue reading in ontology file: " + name);
        }
    }
}
