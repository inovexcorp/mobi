package org.matonto.ontology.core.impl.owlapi;

import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;

public class SesameValues {

    private static final ValueFactory SESAME_VF = ValueFactoryImpl.getInstance();

    protected SesameValues() {}

    public static org.openrdf.model.Resource sesameResource(Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof IRI) {
            return sesameURI((IRI) resource);
        } else {
            return SESAME_VF.createBNode(((BNode) resource).getID());
        }
    }

    public static org.openrdf.model.URI sesameURI(IRI iri) {
        if (iri == null) {
            return null;
        } else {
            return SESAME_VF.createURI(iri.stringValue());
        }
    }
}
