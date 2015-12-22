package org.matonto.ontology.utils.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.*;
import org.openrdf.model.URI;
import org.openrdf.model.impl.ValueFactoryImpl;

@Component
public class SimpleSesameTransformer implements SesameTransformer {

    private static final org.openrdf.model.ValueFactory SESAME_VF = ValueFactoryImpl.getInstance();
    private ValueFactory matontoVF;

    @Reference
    protected void setMatontoVF(ValueFactory valueFactory) {
        matontoVF = valueFactory;
    }

    protected SimpleSesameTransformer() {}

    @Override
    public org.openrdf.model.Statement sesameStatement(Statement statement) {
        if (statement == null) {
            return null;
        } else if (!statement.getContext().isPresent()) {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameURI(statement.getPredicate()),
                    sesameValue(statement.getObject()));
        } else {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameURI(statement.getPredicate()),
                    sesameValue(statement.getObject()), sesameResource(statement.getContext().get()));
        }
    }

    @Override
    public Statement matontoStatement(org.openrdf.model.Statement statement) {
        if (statement == null) {
            return null;
        } else if (statement.getContext() == null) {
            return matontoVF.createStatement(matontoResource(statement.getSubject()), matontoIRI(statement.getPredicate()),
                    matontoValue(statement.getObject()));
        } else {
            return matontoVF.createStatement(matontoResource(statement.getSubject()), matontoIRI(statement.getPredicate()),
                    matontoValue(statement.getObject()), matontoResource(statement.getContext()));
        }
    }

    @Override
    public org.openrdf.model.Resource sesameResource(Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof IRI) {
            return sesameURI((IRI) resource);
        } else {
            return SESAME_VF.createBNode(((BNode) resource).getID());
        }
    }

    @Override
    public Resource matontoResource(org.openrdf.model.Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof URI) {
            return matontoIRI((URI) resource);
        } else {
            return matontoVF.createBNode(((org.openrdf.model.BNode) resource).getID());
        }
    }


    @Override
    public URI sesameURI(IRI iri) {
        if (iri == null) {
            return null;
        } else {
            return SESAME_VF.createURI(iri.stringValue());
        }
    }

    @Override
    public IRI matontoIRI(URI sesameURI) {
        if (sesameURI == null) {
            return null;
        } else {
            return matontoVF.createIRI(sesameURI.stringValue());
        }
    }

    @Override
    public org.openrdf.model.Value sesameValue(Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof URI) {
            return sesameURI((IRI) value);
        } else if (value instanceof BNode) {
            return sesameResource((BNode) value);
        } else {
            // Else it's a MatOnto Literal
            Literal literal = (Literal) value;
            if (literal.getLanguage().isPresent()) {
                return SESAME_VF.createLiteral(literal.stringValue(), literal.getLanguage().get());
            } else {
                URI datatype = SESAME_VF.createURI(literal.getDatatype().stringValue());
                return SESAME_VF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }

    @Override
    public Value matontoValue(org.openrdf.model.Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof URI) {
            return matontoIRI((URI) value);
        } else if (value instanceof org.openrdf.model.BNode) {
            return matontoResource((org.openrdf.model.BNode) value);
        } else {
            // Else it's a Sesame Literal
            org.openrdf.model.Literal literal = (org.openrdf.model.Literal) value;
            if (literal.getLanguage() != null) {
                return matontoVF.createLiteral(literal.stringValue(), literal.getLanguage());
            } else {
                IRI datatype = matontoVF.createIRI(literal.getDatatype().stringValue());
                return matontoVF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }
}
