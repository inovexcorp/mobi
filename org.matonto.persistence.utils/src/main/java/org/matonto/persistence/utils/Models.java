package org.matonto.persistence.utils;

/*-
 * #%L
 * org.matonto.persistence.utils
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

import java.util.*;

public class Models {

    protected Models(){}

    /**
     * Retrieves an Object (Value) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the value from
     * @return an object value from a model or an empty Optional.
     */
    public static Optional<Value> object(Model m) {
        return m.stream().map(Statement::getObject).findAny();
    }

    /**
     * Retrieves an Object (Literal) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object literal from
     * @return an object literal from a model or an empty Optional.
     */
    public static Optional<Literal> objectLiteral(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Literal).map(l -> (Literal) l).findAny();
    }

    /**
     * Retrieves an Object (IRI) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object iri from
     * @return an object iri from a model or an empty Optional.
     */
    public static Optional<IRI> objectIRI(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof IRI).map(r -> (IRI) r).findAny();
    }

    /**
     * Retrieves an Object (Resource) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object resource from
     * @return an object resource from a model or an empty Optional.
     */
    public static Optional<Resource> objectResource(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Resource).map(r -> (Resource) r).findAny();
    }

    /**
     * Retrieves an Object (String) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object string from
     * @return an object string from a model or an empty Optional.
     */
    public static Optional<String> objectString(Model m) {
        return m.stream().map(st -> st.getObject().stringValue()).findAny();

    }

    /**
     * Retrieves an Subject (Resource) from the statements in a model.
     * Only one resource is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject resource from a model or an empty Optional.
     */
    public static Optional<Resource> subject(Model m) {
        return m.stream().map(Statement::getSubject).findAny();
    }

    /**
     * Retrieves an Subject (IRI) from the statements in a model.
     * Only one IRI is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject IRI from a model or an empty Optional.
     */
    public static Optional<IRI> subjectIRI(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof IRI).map(s -> (IRI) s).findAny();

    }

    /**
     * Retrieves an Subject (BNode) from the statements in a model.
     * Only one BNode is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject BNode from a model or an empty Optional.
     */
    public static Optional<BNode> subjectBNode(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof BNode).map(s -> (BNode) s).findAny();
    }

    /**
     * Retrieves an Predicate (IRI) from the statements in a model.
     * Only one predicate is picked from the model and returned.
     *
     * @param m The model to retrieve the predicate from
     * @return a predicate IRI from a model or an empty Optional.
     */
    public static Optional<IRI> predicate(Model m) {
        return m.stream().map(Statement::getPredicate).findAny();
    }

//    public static boolean isomorphic(Iterable<? extends Statement> model1,
//                                     Iterable<? extends Statement> model2) {
//          }
//
//    public static boolean isSubset(Iterable<? extends Statement> model1,
//                                   Iterable<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    public static boolean isSubset(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean isSubsetInternal(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean matchModels(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean matchModels(List<? extends Statement> model1, Iterable<? extends Statement> model2,
//                                       Map<BNode, BNode> bNodeMapping, int idx) {
//        //TODO Implement
//        return false;
//    }
//
//    private static List<Statement> findMatchingStatements(Statement st, Iterable<? extends Statement> model,
//                                                          Map<BNode, BNode> bNodeMapping) {
//        //TODO Implement
//        return new ArrayList<Statement>();
//    }
//
//    private static boolean statementsMatch(Statement st1, Statement st2, Map<BNode, BNode> bNodeMapping) {
//        //TODO Implement
//        return false;
//    }


}