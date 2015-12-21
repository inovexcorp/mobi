package org.matonto.persistence.utils;

import org.jetbrains.annotations.NotNull;
import org.matonto.rdf.api.*;

import java.util.*;

public class Models {


    public static Optional<Value> object(Model m) {
        Value o = null;
        for (Statement s : m) {
            o = s.getObject();
        }
        return Optional.ofNullable(o);
    }

    public static Optional<IRI> objectIRI(Model m) {
        return m.stream().map(st -> st.getObject()).filter(o -> o instanceof IRI).map(r -> (IRI) r).findAny();
    }

    public static Optional<String> objectString(Model m) {
        //TODO Implement
        return Optional.empty();
    }

    public static Optional<IRI> subjectIRI(Model m) {
        //TODO Implement
        return Optional.empty();
    }

    public static Optional<BNode> subjectBNode(Model m) {
        return Optional.empty();
    }

    public static Optional<IRI> predicate(Model m) {
        return Optional.empty();
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