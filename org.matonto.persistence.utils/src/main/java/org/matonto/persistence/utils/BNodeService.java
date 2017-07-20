package org.matonto.persistence.utils;

/*-
 * #%L
 * org.matonto.persistence.utils
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
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;

@Component(provide = org.matonto.persistence.utils.BNodeService.class)
public class BNodeService {

    private ValueFactory vf;
    private ModelFactory mf;

    public static final String PATH_COMPONENT = "/.well-known/genid/";
    public static final String BNODE_NAMESPACE = "http://matonto.org" + PATH_COMPONENT;

    public BNodeService() {}

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    /**
     * Skolemizes the provided BNode.
     *
     * @param bnode BNode to skolemize.
     * @return IRI which is a skolemized representation of the provided BNode.
     */
    public IRI skolemize(BNode bnode) {
        return vf.createIRI(BNODE_NAMESPACE, bnode.getID());
    }

    /**
     * Skolemizes the provided Value if it is a BNode.
     *
     * @param value Value to attempt to skolemize.
     * @return Value which is a skolemized representation of the provided Value if it is a BNode; otherwise, returns the
     *         provided Value.
     */
    public Value skolemize(Value value) {
        return value instanceof BNode ? skolemize((BNode) value) : value;
    }

    /**
     * Skolemizes any BNodes found in the provided Statement.
     *
     * @param statement Statement to search for BNodes to skolemize.
     * @return Statement which contains skolemized BNodes if that is required.
     */
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
        return skolemized ? vf.createStatement(subject, statement.getPredicate(), object) : statement;
    }

    /**
     * Skolemizes all BNodes found in every Statement within the provided Model.
     *
     * @param model Model to search for BNodes to skolemize.
     * @return Model which contains the skolemized BNodes.
     */
    public Model skolemize(Model model) {
        Model result = mf.createModel();
        model.forEach(statement -> result.add(skolemize(statement)));
        return result;
    }

    /**
     * Deskolemizes the provided IRI.
     *
     * @param iri IRI to deskolemize.
     * @return BNode containing the deskolemized BNode.
     */
    public BNode deskolemize(IRI iri) {
        return vf.createBNode(iri.getLocalName());
    }

    /**
     * Deskolemizes the provided value if it is a skolemized IRI.
     *
     * @param value Value to deskolemize.
     * @return Value which is the BNode if the Value is a skolemized IRI; otherwise, returns the provided Value.
     */
    public Value deskolemize(Value value) {
        return isSkolemized(value) ? deskolemize((IRI) value) : value;
    }

    /**
     * Deskolemizes the skolemized IRIs withing the provided Statement.
     *
     * @param statement Statement to search for skolemized IRIs.
     * @return Statement which contains the newly created BNodes.
     */
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
        return deskolemized ? vf.createStatement(subject, statement.getPredicate(), object) : statement;
    }

    /**
     * Deskolemizes all skolemized IRIs found in every Statement within the provided Model.
     *
     * @param model Model to search for skolemized IRIs.
     * @return Model which contains the newly created BNodes.
     */
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
