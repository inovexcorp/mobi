package org.matonto.rdf.core.utils;

/*-
 * #%L
 * org.matonto.rdf.impl.sesame
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

import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.openrdf.model.impl.LinkedHashModel;

import java.util.Set;
import java.util.stream.Collectors;

public class Values {

    private static final org.openrdf.model.ValueFactory SESAME_VF = org.openrdf.model.impl.SimpleValueFactory.getInstance();
    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();
    private static final ModelFactory MATONTO_MF = LinkedHashModelFactory.getInstance();

    private Values() {}

    public static org.openrdf.model.Statement sesameStatement(Statement statement) {
        if (statement.getContext().isPresent()) {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameIRI(statement.getPredicate()),
                    sesameValue(statement.getObject()), sesameResource(statement.getContext().get()));
        } else {
            return SESAME_VF.createStatement(sesameResource(statement.getSubject()), sesameIRI(statement.getPredicate()),
                    sesameValue(statement.getObject()));
        }
    }

    public static Statement matontoStatement(org.openrdf.model.Statement statement) {
        if (statement.getContext() != null) {
            return MATONTO_VF.createStatement(matontoResource(statement.getSubject()), matontoIRI(statement.getPredicate()),
                    matontoValue(statement.getObject()), matontoResource(statement.getContext()));
        } else {
            return MATONTO_VF.createStatement(matontoResource(statement.getSubject()), matontoIRI(statement.getPredicate()),
                    matontoValue(statement.getObject()));
        }
    }

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

    public static Model matontoModel(org.openrdf.model.Model model) {
        Set<Statement> statements = model.stream()
                .map(Values::matontoStatement)
                .collect(Collectors.toSet());
        return MATONTO_MF.createModel(statements);
    }

    public static org.openrdf.model.Model sesameModel(Model model) {
        Set<org.openrdf.model.Statement> statements = model.stream()
                .map(Values::sesameStatement)
                .collect(Collectors.toSet());
        org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
        sesameModel.addAll(statements);
        return sesameModel;
    }
}
