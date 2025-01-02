package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class BNodeUtils {
    
    /**
     * Creates a new {@link Model} with Blank Nodes restored from their deterministic skolemization form.
     *
     * @param model The {@link Model} to restore BNodes.
     * @param bNodeIRIBase A {@link Map} of the {@link BNode}'s to their deterministic {@link IRI}.
     * @param mf A {@link ModelFactory} used to create the return {@link Model}.
     * @return A {@link Model} with blank nodes restored.
     */
    public static Model restoreBNodes(Model model, Map<BNode, IRI> bNodeIRIBase, ModelFactory mf) {
        return restoreBNodes(model, bNodeIRIBase, new HashMap<>(), mf);
    }

    /**
     * Creates a new {@link Model} with Blank Nodes restored from their deterministic skolemization form.
     *
     * @param model The {@link Model} to restore BNodes.
     * @param bNodeIRIBase A {@link Map} of the {@link BNode}'s to their deterministic {@link IRI}.
     * @param bNodeIRISystem A {@link Map} of the {@link BNode}'s to their deterministic {@link IRI} from the system.
     *                       Used as a fallback to restore to the correct blank node ID.
     * @param mf A {@link ModelFactory} used to create the return {@link Model}.
     * @return A {@link Model} with blank nodes restored.
     */
    public static Model restoreBNodes(Model model, Map<BNode, IRI> bNodeIRIBase, Map<BNode, IRI> bNodeIRISystem,
                                      ModelFactory mf) {
        Set<IRI> iriSet = new HashSet<>(bNodeIRIBase.values());
        Set<IRI> iriSet2 = new HashSet<>(bNodeIRISystem.values());
        Model result = mf.createEmptyModel();

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
                subjectBNodes.addAll(getKeys(bNodeIRIBase, subject));
            }

            if (object instanceof IRI && !hasAddedBNode(model, (IRI) object) && iriSet2.contains(object)) {
                // Handles when BNode is tied to an IRI that was changed in an external tool and then uploaded as
                // changes. Deterministic skolemization will result in erroneous addition of statement pointing to a
                // new blank node identifier after BNode ID restoration.
                // https://inovexirad.atlassian.net/jira/servicedesk/projects/MCS/queues/custom/1/MCS-167
                objectBNodes.addAll(getKeys(bNodeIRISystem, (IRI) object));
            } else if (object instanceof IRI && iriSet.contains(object)) {
                objectBNodes.addAll(getKeys(bNodeIRIBase, (IRI) object));
            }

            // Case where both the subject and object are BNodes. Can have multiple BNodes with the same
            // deterministically skolemized value. Must handle every possible case when restoring.
            if (!subjectBNodes.isEmpty() && !objectBNodes.isEmpty()) {
                for (Resource subjectBNode : subjectBNodes) {
                    for (Resource objectBNode : objectBNodes) {
                        addStatement(result, subjectBNode, statement.getPredicate(), objectBNode,
                                statement.getContext());
                    }
                }
            } else if (!subjectBNodes.isEmpty()) { // Only the subject is a BNode
                for (Resource subjectBNode : subjectBNodes) {
                    addStatement(result, subjectBNode, statement.getPredicate(), object, statement.getContext());
                }
            } else if (!objectBNodes.isEmpty()) { // Only the object is a BNode
                for (Resource objectBNode : objectBNodes) {
                    addStatement(result, subject, statement.getPredicate(), objectBNode, statement.getContext());
                }
            } else { // Non BNode statement
                addStatement(result, subject, statement.getPredicate(), object, statement.getContext());
            }
        }
        return result;
    }

    /**
     * Checks to see if the deterministically skolemized BNode exists as a subject in the model.
     * @param model The {@link Model} to restore BNodes.
     * @param iri The IRI of the deterministically skolemized BNode.
     * @return boolean indicating if the blank node definition is present.
     */
    private static boolean hasAddedBNode(Model model, IRI iri) {
        return !model.filter(iri, null, null).isEmpty();
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
     * @param context An nullable {@link Resource} of the context to add.
     */
    private static void addStatement(Model model, Resource subject, IRI predicate, Value object, Resource context) {
        if (context != null) {
            model.add(subject, predicate, object, context);
        } else {
            model.add(subject, predicate, object);
        }
    }
}
