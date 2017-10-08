package com.mobi.persistence.utils.impl;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;

@Component(provide = BNodeService.class)
public class SimpleBNodeService implements BNodeService {

    private ValueFactory vf;
    private ModelFactory mf;

    private static final String PATH_COMPONENT = "/.well-known/genid/";
    public static final String SKOLEMIZED_NAMESPACE = "http://mobi.com" + PATH_COMPONENT;
    public static final String BNODE_PREFIX = "matonto-bnode-";

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    @Override
    public IRI skolemize(BNode bnode) {
        return vf.createIRI(SKOLEMIZED_NAMESPACE, bnode.getID());
    }

    @Override
    public Value skolemize(Value value) {
        return value instanceof BNode ? skolemize((BNode) value) : value;
    }

    @Override
    public Statement skolemize(Statement statement) {
        boolean skolemized = false;
        Resource subject = statement.getSubject();
        if (subject instanceof BNode) {
            subject = skolemize((BNode) subject);
            skolemized = true;
        }
        Value object = statement.getObject();
        if (object instanceof BNode) {
            object = skolemize((BNode) object);
            skolemized = true;
        }
        Resource context = statement.getContext().orElse(null);
        if (context instanceof BNode) {
            context = skolemize((BNode) context);
            skolemized = true;
        }
        return skolemized ? vf.createStatement(subject, statement.getPredicate(), object, context) : statement;
    }

    @Override
    public Model skolemize(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(skolemize(statement)));
        return result;
    }

    @Override
    public BNode deskolemize(IRI iri) {
        return vf.createBNode(iri.getLocalName());
    }

    @Override
    public Value deskolemize(Value value) {
        return isSkolemized(value) ? deskolemize((IRI) value) : value;
    }

    @Override
    public Statement deskolemize(Statement statement) {
        boolean deskolemized = false;
        Resource subject = statement.getSubject();
        if (isSkolemized(subject)) {
            subject = deskolemize((IRI) subject);
            deskolemized = true;
        }
        Value object = statement.getObject();
        if (isSkolemized(object)) {
            object = deskolemize((IRI) object);
            deskolemized = true;
        }
        Resource context = statement.getContext().orElse(null);
        if (isSkolemized(context)) {
            context = deskolemize((IRI) context);
            deskolemized = true;
        }
        return deskolemized ? vf.createStatement(subject, statement.getPredicate(), object, context) : statement;
    }

    @Override
    public Model deskolemize(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(deskolemize(statement)));
        return result;
    }

    /**
     * Checks to see if the provided Value is a skolemized IRI.
     *
     * @param value Value to check whether it is a skolemized IRI or not.
     * @return Boolean indicating if the Value is a skolemized IRI.
     */
    private boolean isSkolemized(Value value) {
        return value instanceof IRI && ((IRI) value).getNamespace().contains(PATH_COMPONENT);
    }
}
