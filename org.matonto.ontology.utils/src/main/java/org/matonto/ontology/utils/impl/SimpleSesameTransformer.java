package org.matonto.ontology.utils.impl;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;

import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.*;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.model.*;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.stream.Collectors;


@Component (immediate=true, provide = SesameTransformer.class)
public class SimpleSesameTransformer implements SesameTransformer {

    private static final org.openrdf.model.ValueFactory SESAME_VF = ValueFactoryImpl.getInstance();
    private ValueFactory matontoVF;
    private ModelFactory matontoMF;
    private static final Logger LOG = LoggerFactory.getLogger(SimpleSesameTransformer.class);
    
    @Activate
    public void activate() {
        LOG.info("Activating the SimpleSesameTransformer");
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating the SimpleSesameTransformer");
    }

    @Reference
    protected void setMatontoVF(ValueFactory valueFactory) {
        matontoVF = valueFactory;
    }

    @Reference
    protected void setMatontoMF(ModelFactory modelFactory) {
        matontoMF = modelFactory;
    }

    public SimpleSesameTransformer() {}

    @Override
    public org.openrdf.model.Model sesameModel(Model m){
        Set<org.openrdf.model.Statement> stmts = m.stream()
                .map(this::sesameStatement)
                .collect(Collectors.toSet());

        org.openrdf.model.Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(stmts);

        return sesameModel;
    }

    @Override
    public Model matontoModel(org.openrdf.model.Model m) {
        Set<Statement> stmts = m.stream()
                .map(this::matontoStatement)
                .collect(Collectors.toSet());

        return matontoMF.createModel(stmts);
    }

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
        } else if (value instanceof IRI) {
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
                if(literal.getDatatype()!=null) {
                    IRI datatype = matontoVF.createIRI(literal.getDatatype().stringValue());
                    return matontoVF.createLiteral(literal.stringValue(), datatype);
                } else {
                    return matontoVF.createLiteral(literal.stringValue());
                }
            }
        }
    }
}
