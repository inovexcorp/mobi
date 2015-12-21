package org.matonto.ontology.utils.impl;

import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;

public class SimpleSesameTransformer implements SesameTransformer {

    private static final ValueFactory SESAME_VF = ValueFactoryImpl.getInstance();

    protected SimpleSesameTransformer() {}

    @Override
    public org.openrdf.model.Resource sesameResource(Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof IRI) {
            return sesameURI((IRI) resource);
        } else {
            return SESAME_VF.createBNode(((BNode) resource).getID());
        }    }

    @Override
    public URI sesameURI(IRI iri) {
        return null;
    }
}
