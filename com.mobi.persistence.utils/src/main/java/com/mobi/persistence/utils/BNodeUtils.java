package com.mobi.persistence.utils;

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class BNodeUtils {
    
    /**
     * Creates a new {@link Model} with Blank Nodes restored from their deterministic skolemization form.
     *
     * @param model The {@link Model} to resotre BNodes.
     * @param bNodeIRIMap A {@link Map} of the {@link BNode}'s to their deterministic {@link IRI}.
     * @return A {@link Model} with blank nodes restored.
     */
    public static Model restoreBNodes(Model model, Map<BNode, IRI> bNodeIRIMap, ModelFactory mf, ValueFactory vf) {
        Set<IRI> iriSet = new HashSet<>(bNodeIRIMap.values());
        Model result = mf.createModel();

        // Iterate over each statement
        for (Statement statement : model) {
            Set<Resource> subjectBNodes = new HashSet<>();
            Set<Resource> objectBNodes = new HashSet<>();
            Resource subject = statement.getSubject();
            Value object = statement.getObject();

            // Check to see if subject/object are in the bNodeIRIMap's set of values.
            // Indicates it is a deterministically skolemized IRI that needs to be transformed back.
            // Retrieve all keys (BNodes) in the map where the value is the deterministically skolemized IRI.
            if (subject instanceof IRI && iriSet.contains(subject)) {
                subjectBNodes.addAll(getKeys(bNodeIRIMap, subject));
            }
            if (object instanceof IRI && iriSet.contains(object)) {
                objectBNodes.addAll(getKeys(bNodeIRIMap, (IRI) object));
            }

            // Case where both the subject and object are BNodes. Can have multiple BNodes with the same
            // deterministically skolemized value. Must handle every possible case when restoring.
            if (subjectBNodes.size() > 0 && objectBNodes.size() > 0) {
                for (Resource subjectBNode : subjectBNodes) {
                    for (Resource objectBNode : objectBNodes) {
                        addStatement(result, subjectBNode, statement.getPredicate(), objectBNode,
                                statement.getContext(), vf);
                    }
                }
            }
            // Only the subject is a BNode
            else if (subjectBNodes.size() > 0) {
                for (Resource subjectBNode : subjectBNodes) {
                    addStatement(result, subjectBNode, statement.getPredicate(), object, statement.getContext(), vf);
                }
            }
            // Only the object is a BNode
            else if (objectBNodes.size() > 0) {
                for (Resource objectBNode : objectBNodes) {
                    addStatement(result, subject, statement.getPredicate(), objectBNode, statement.getContext(), vf);
                }
            }
            // Non BNode statement
            else {
                addStatement(result, subject, statement.getPredicate(), object, statement.getContext(), vf);
            }
        }
        return result;
    }

    /**
     * Retrieves a {@link Set} of all the BNode keys where the value is the provided {@link Resource}.
     *
     * @param map A {@link Map} of the {@link BNode}'s to their deterministic {@link IRI}.
     * @param value A {@link Resource} to get the {@link BNode} keys for.
     * @return A {@link Set} of {@link BNode}s.
     */
    private static Set<BNode> getKeys(Map<BNode, IRI> map, Resource value) {
        return map.entrySet()
                .stream()
                .filter(entry -> value.equals(entry.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    /**
     * Constructs a statement and adds to the provided {@link Model}. If a context is present, adds the statement with
     * the context.
     *
     * @param model The {@link Model} to add the resulting statement to.
     * @param subject The {@link Resource} subject to add.
     * @param predicate The {@link IRI} predicate to add.
     * @param object The {@link Value} object to add.
     * @param context An {@link Optional} of {@link Resource} of the context to add.
     * @param vf A {@link ValueFactory} for creating statements.
     */
    private static void addStatement(Model model, Resource subject, IRI predicate, Value object,
                                     Optional<Resource> context, ValueFactory vf) {
        if (context.isPresent()) {
            model.add(vf.createStatement(subject, predicate, object, context.get()));
        } else {
            model.add(vf.createStatement(subject, predicate, object));
        }
    }
}
