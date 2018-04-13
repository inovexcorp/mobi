package com.mobi.persistence.utils.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValueFactoryImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.stream.Collectors;


@Component (provide = SesameTransformer.class)
public class SimpleSesameTransformer implements SesameTransformer {

    private static final org.eclipse.rdf4j.model.ValueFactory SESAME_VF = ValueFactoryImpl.getInstance();
    private ValueFactory mobiVF;
    private ModelFactory mobiMF;
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
    protected void setMobiVF(ValueFactory valueFactory) {
        mobiVF = valueFactory;
    }

    @Reference
    protected void setMobiMF(ModelFactory modelFactory) {
        mobiMF = modelFactory;
    }

    public SimpleSesameTransformer() {}

    @Override
    public org.eclipse.rdf4j.model.Model sesameModel(Model m) {
        Set<org.eclipse.rdf4j.model.Statement> stmts = m.stream()
                .map(this::sesameStatement)
                .collect(Collectors.toSet());

        org.eclipse.rdf4j.model.Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(stmts);

        return sesameModel;
    }

    @Override
    public Model mobiModel(org.eclipse.rdf4j.model.Model m) {
        Set<Statement> stmts = m.stream()
                .map(this::mobiStatement)
                .collect(Collectors.toSet());

        return mobiMF.createModel(stmts);
    }

    @Override
    public org.eclipse.rdf4j.model.Statement sesameStatement(Statement statement) {
        if (statement == null) {
            return null;
        } else if (!statement.getContext().isPresent()) {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameIRI(statement.getPredicate()),
                    sesameValue(statement.getObject()));
        } else {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameIRI(statement.getPredicate()),
                    sesameValue(statement.getObject()), sesameResource(statement.getContext().get()));
        }
    }

    @Override
    public Statement mobiStatement(org.eclipse.rdf4j.model.Statement statement) {
        if (statement == null) {
            return null;
        } else if (statement.getContext() == null) {
            return mobiVF.createStatement(mobiResource(statement.getSubject()), mobiIRI(statement.getPredicate()),
                    mobiValue(statement.getObject()));
        } else {
            return mobiVF.createStatement(mobiResource(statement.getSubject()), mobiIRI(statement.getPredicate()),
                    mobiValue(statement.getObject()), mobiResource(statement.getContext()));
        }
    }

    @Override
    public org.eclipse.rdf4j.model.Resource sesameResource(Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof IRI) {
            return sesameIRI((IRI) resource);
        } else {
            return SESAME_VF.createBNode(((BNode) resource).getID());
        }
    }

    @Override
    public Resource mobiResource(org.eclipse.rdf4j.model.Resource resource) {
        if (resource == null) {
            return null;
        } else if (resource instanceof org.eclipse.rdf4j.model.IRI) {
            return mobiIRI((org.eclipse.rdf4j.model.IRI) resource);
        } else {
            return mobiVF.createBNode(((org.eclipse.rdf4j.model.BNode) resource).getID());
        }
    }


    @Override
    public org.eclipse.rdf4j.model.IRI sesameIRI(IRI iri) {
        if (iri == null) {
            return null;
        } else {
            return SESAME_VF.createIRI(iri.stringValue());
        }
    }

    @Override
    public IRI mobiIRI(org.eclipse.rdf4j.model.IRI sesameIRI) {
        if (sesameIRI == null) {
            return null;
        } else {
            return mobiVF.createIRI(sesameIRI.stringValue());
        }
    }

    @Override
    public org.eclipse.rdf4j.model.Value sesameValue(Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof IRI) {
            return sesameIRI((IRI) value);
        } else if (value instanceof BNode) {
            return sesameResource((BNode) value);
        } else {
            // Else it's a Mobi Literal
            Literal literal = (Literal) value;
            if (literal.getLanguage().isPresent()) {
                return SESAME_VF.createLiteral(literal.stringValue(), literal.getLanguage().get());
            } else {
                org.eclipse.rdf4j.model.IRI datatype = SESAME_VF.createIRI(literal.getDatatype().stringValue());
                return SESAME_VF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }

    @Override
    public Value mobiValue(org.eclipse.rdf4j.model.Value value) {
        if (value == null) {
            return null;
        } else if (value instanceof org.eclipse.rdf4j.model.IRI) {
            return mobiIRI((org.eclipse.rdf4j.model.IRI) value);
        } else if (value instanceof org.eclipse.rdf4j.model.BNode) {
            return mobiResource((org.eclipse.rdf4j.model.BNode) value);
        } else {
            // Else it's a Sesame Literal
            org.eclipse.rdf4j.model.Literal literal = (org.eclipse.rdf4j.model.Literal) value;
            if (literal.getLanguage().isPresent()) {
                return mobiVF.createLiteral(literal.stringValue(), literal.getLanguage().get());
            } else {
                IRI datatype = mobiVF.createIRI(literal.getDatatype().stringValue());
                return mobiVF.createLiteral(literal.stringValue(), datatype);
            }
        }
    }
}
