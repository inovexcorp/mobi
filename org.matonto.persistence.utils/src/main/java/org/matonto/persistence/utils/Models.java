package org.matonto.persistence.utils;

import org.matonto.rdf.api.*;

import java.util.*;

public class Models {

    protected Models(){}

    public static Optional<Value> object(Model m) {
        return m.stream().map(Statement::getObject).findAny();
    }

    public static Optional<Literal> objectLiteral(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Literal).map(l -> (Literal) l).findAny();
    }

    public static Optional<IRI> objectIRI(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof IRI).map(r -> (IRI) r).findAny();
    }

    public static Optional<Resource> objectResource(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Resource).map(r -> (Resource) r).findAny();
    }

    public static Optional<String> objectString(Model m) {
        return m.stream().map(st -> st.getObject().stringValue()).findAny();

    }

    public static Optional<Resource> subject(Model m) {
        return m.stream().map(Statement::getSubject).findAny();
    }


    public static Optional<IRI> subjectIRI(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof IRI).map(s -> (IRI) s).findAny();

    }

    public static Optional<BNode> subjectBNode(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof BNode).map(s -> (BNode) s).findAny();
    }

    public static Optional<IRI> predicate(Model m) {
        return m.stream().map(Statement::getPredicate).findAny();
    }

    public static boolean isomorphic(Iterable<? extends Statement> model1,
                                     Iterable<? extends Statement> model2) {
        //TODO Implement
        return false;
    }

    public static boolean isSubset(Iterable<? extends Statement> model1,
                                   Iterable<? extends Statement> model2) {
        //TODO Implement
        return false;
    }

    public static boolean isSubset(Set<? extends Statement> model1, Set<? extends Statement> model2) {
        //TODO Implement
        return false;
    }

    private static boolean isSubsetInternal(Set<? extends Statement> model1, Set<? extends Statement> model2) {
        //TODO Implement
        return false;
    }

    private static boolean matchModels(Set<? extends Statement> model1, Set<? extends Statement> model2) {
        //TODO Implement
        return false;
    }

    private static boolean matchModels(List<? extends Statement> model1, Iterable<? extends Statement> model2,
                                       Map<BNode, BNode> bNodeMapping, int idx) {
        //TODO Implement
        return false;
    }

    private static List<Statement> findMatchingStatements(Statement st, Iterable<? extends Statement> model,
                                                          Map<BNode, BNode> bNodeMapping) {
        //TODO Implement
        return new ArrayList<Statement>();
    }

    private static boolean statementsMatch(Statement st1, Statement st2, Map<BNode, BNode> bNodeMapping) {
        //TODO Implement
        return false;
    }

}