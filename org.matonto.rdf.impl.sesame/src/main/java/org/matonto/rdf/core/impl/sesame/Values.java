package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.*;

public class Values {

    private static final org.openrdf.model.ValueFactory SESAME_VF = org.openrdf.model.impl.SimpleValueFactory.getInstance();
    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();

    private Values() {}

    public static org.openrdf.model.Resource sesameResource(Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof IRI) {
            return sesameIRI((IRI) resource);
        } else {
            return SESAME_VF.createBNode(((BNode) resource).getID());
        }
    }

    public static Resource matontoResource(org.openrdf.model.Resource resource) {
        if (resource == null) {
          return null;
        } else if (resource instanceof org.openrdf.model.IRI) {
            return matontoIRI((org.openrdf.model.IRI) resource);
        } else {
            return MATONTO_VF.createBNode(((org.openrdf.model.BNode) resource).getID());
        }
    }

    public static org.openrdf.model.IRI sesameIRI(IRI iri) {
        if (iri == null) {
            return null;
        } else {
            return SESAME_VF.createIRI(iri.stringValue());
        }
    }

    public static IRI matontoIRI(org.openrdf.model.IRI iri) {
        if (iri == null) {
            return null;
        } else {
            return MATONTO_VF.createIRI(iri.stringValue());
        }
    }

    public static org.openrdf.model.Value sesameValue(Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof IRI) {
            return sesameIRI((IRI) value);
        } else if (value instanceof BNode) {
            return sesameResource((BNode) value);
        } else {
            // Else it's a MatOnto Literal
            Literal literal = (Literal) value;
            if (literal.getLanguage().isPresent()) {
                return SESAME_VF.createLiteral(literal.stringValue(), literal.getLanguage().get());
            } else {
                org.openrdf.model.IRI datatype = SESAME_VF.createIRI(literal.getDatatype().stringValue());
                return SESAME_VF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }

    public static Value matontoValue(org.openrdf.model.Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof org.openrdf.model.IRI) {
            return matontoIRI((org.openrdf.model.IRI) value);
        } else if (value instanceof org.openrdf.model.BNode) {
            return matontoResource((org.openrdf.model.BNode) value);
        } else {
            // Else it's a Sesame Literal
            org.openrdf.model.Literal literal = (org.openrdf.model.Literal) value;
            if (literal.getLanguage().isPresent()) {
                return MATONTO_VF.createLiteral(literal.stringValue(), literal.getLanguage().get());
            } else {
                IRI datatype = MATONTO_VF.createIRI(literal.getDatatype().stringValue());
                return MATONTO_VF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }

    public static org.openrdf.model.Resource[] sesameResources(Resource... resources) {
        if (resources == null) {
            return null;
        } else {
            org.openrdf.model.Resource[] sesameContexts = new org.openrdf.model.Resource[resources.length];

            for (int i = 0; i < resources.length; i++) {
                sesameContexts[i] = Values.sesameResource(resources[i]);
            }

            return sesameContexts;
        }
    }
}
