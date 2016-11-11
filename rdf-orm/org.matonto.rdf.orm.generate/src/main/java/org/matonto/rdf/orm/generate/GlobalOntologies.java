package org.matonto.rdf.orm.generate;

import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Created by bdgould on 11/2/16.
 */
public interface GlobalOntologies {

    String PACKAGE_BASE = "org.matonto.ontologies";

//     final String DC_ELEMENTS_PACKAGE = PACKAGE_BASE + ".dcterms";

    String[] DC_TERMS = {"/dcterms.ttl", PACKAGE_BASE + ".dcterms", "dcterms"};

    String[] RDFS = {"/rdfs.owl", PACKAGE_BASE + ".rdfs", "rdfs"};

    String[] CUSTOM = {"/global_properties.trig", "org.matonto.global_properties", null};

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
