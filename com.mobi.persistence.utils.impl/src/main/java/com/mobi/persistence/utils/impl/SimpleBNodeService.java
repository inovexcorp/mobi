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
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component(provide = BNodeService.class)
public class SimpleBNodeService implements BNodeService {

    private ValueFactory vf;
    private ModelFactory mf;

    private static final String PATH_COMPONENT = "/.well-known/genid/";
    public static final String SKOLEMIZED_NAMESPACE = "http://mobi.com" + PATH_COMPONENT;

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
    public Model deterministicSkolemize(Model model) {
        final Model result = mf.createModel();
        final Map<BNode, IRI> skolemizedBNodes = new HashMap<>();
        final Map<Long, Integer> hashCount = new HashMap<>();

        // Process every blank node chain that begins with an IRI
        model.subjects().stream()
                .filter(resource -> resource instanceof IRI)
                .sorted(Comparator.comparing(Value::stringValue))
                .forEach(resource -> {
                    model.filter(resource, null, null, (Resource) null).stream()
                            // Sort attached nodes to handle attached blank nodes pointing to isomorphic blank nodes
                            .sorted(new ModelStatementComparator(model))
                            .forEach(statement -> {
                        if (statement.getObject() instanceof BNode) {
                            // If object is a BNode
                            if (!skolemizedBNodes.containsKey(statement.getObject())) {
                                Set<BNode> visited = new HashSet<>();
                                Model cycleStmts = mf.createModel();
                                result.addAll(deterministicSkolemize((BNode) statement.getObject(), model, skolemizedBNodes, hashCount, visited, cycleStmts));
                            }
                            if (statement.getContext().isPresent()) {
                                result.add(statement.getSubject(), statement.getPredicate(), skolemizedBNodes.get(statement.getObject()), statement.getContext().get());
                            } else {
                                result.add(statement.getSubject(), statement.getPredicate(), skolemizedBNodes.get(statement.getObject()));
                            }
                        } else {
                            // Else object is an IRI or Literal
                            result.add(statement);
                        }
                    });
                });

        // Then process every other blank node chain
        model.subjects().stream()
                .filter(resource -> resource instanceof BNode && !skolemizedBNodes.containsKey(resource))
                .forEach(resource -> {
                    Set<BNode> visited = new HashSet<>();
                    Model cycleStmts = mf.createModel();
                    result.addAll(deterministicSkolemize((BNode) resource, model, skolemizedBNodes, hashCount, visited, cycleStmts));
                });

        return result;
    }

    /**
     * Skolemizes a BNode and any attached BNode chains.
     *
     * @param bNode The BNode to skolemize.
     * @param model The Model containing data for the BNode and any attached BNode chain.
     * @param skolemizedBNodes The Map tracking previously skolemized BNodes.
     * @param hashCount The Map tracking the usage count of hashes to handle equal (but distinct) BNodes
     * @return The Model containing all skolemized statements for the bNode and any attached BNode chains.
     */
    private Model deterministicSkolemize(BNode bNode, Model model, Map<BNode, IRI> skolemizedBNodes,
                                         Map<Long, Integer> hashCount, Set<BNode> visited, Model cycleStmts) {
        Model result = mf.createModel();
        visited.add(bNode);

        List<String> valuesToHash = new ArrayList<>();
        model.filter(bNode, null, null, (Resource) null).stream()
                // Sort attached nodes to handle attached blank nodes pointing to isomorphic blank nodes
                .sorted(new ModelStatementComparator(model))
                .forEach(statement -> {
                    IRI predicate = statement.getPredicate();
                    Value value = statement.getObject();
                    if (value instanceof BNode) {
                        // If object is a BNode
                        if (visited.contains(value)) {
                            // Cycle detected
                            cycleStmts.add(statement);
                        } else {
                            // No cycle
                            if (!skolemizedBNodes.containsKey(value)) {
                                result.addAll(deterministicSkolemize((BNode) value, model, skolemizedBNodes, hashCount, visited, cycleStmts));
                            }
                            valuesToHash.add(predicate.stringValue());
                            valuesToHash.add(skolemizedBNodes.get(value).stringValue());
                        }
                    } else {
                        // Else object is an IRI or Literal
                        valuesToHash.add(predicate.stringValue());
                        valuesToHash.add(value.stringValue());
                    }
                });
        Collections.sort(valuesToHash);
        long idHash = hash(String.join("", valuesToHash));

        String hashString;
        if (hashCount.containsKey(idHash)) {
            int nextValue = hashCount.get(idHash) + 1;
            hashString = idHash + "-" + nextValue;
            hashCount.put(idHash, nextValue);
        } else {
            hashString = String.valueOf(idHash);
            hashCount.put(idHash, 1);
        }

        IRI skolemizedIRI = vf.createIRI(SKOLEMIZED_NAMESPACE + hashString + "/", bNode.getID());

        // Add skolemized statements
        model.filter(bNode, null, null, (Resource) null).stream()
                .filter(statement -> !cycleStmts.contains(statement))
                .forEach(statement -> {
                    Value value = statement.getObject() instanceof BNode ? skolemizedBNodes.get(statement.getObject()) : statement.getObject();
                    if (statement.getContext().isPresent()) {
                        result.add(skolemizedIRI, statement.getPredicate(), value, statement.getContext().get());
                    } else {
                        result.add(skolemizedIRI, statement.getPredicate(), value);
                    }
        });

        // Add cycles targeting this node
        cycleStmts.filter(null, null, bNode, (Resource) null).forEach(statement -> {
            if (statement.getContext().isPresent()) {
                result.add(skolemizedBNodes.get(statement.getSubject()), statement.getPredicate(), skolemizedIRI, statement.getContext().get());
            } else {
                result.add(skolemizedBNodes.get(statement.getSubject()), statement.getPredicate(), skolemizedIRI);
            }
        });

        skolemizedBNodes.put(bNode, skolemizedIRI);
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

    /**
     * A comparator that sorts statements based on predicate and object values and attached blank nodes
     */
    private static class ModelStatementComparator implements Comparator<Statement>{
        private Model model;

        public ModelStatementComparator(Model model) {
            this.model = model;
        }

        public ModelStatementComparator compareBy(Model model) {
            this.model = model;
            return this;
        }

        public int compare(Statement o1, Statement o2) {
            long o1Score = scoreValue(o1.getObject());
            long o2Score = scoreValue(o2.getObject());
            return Long.compare(o1Score, o2Score);
        }

        /**
         * Returns a long representing the comparator score for the Value. Score value is based on the hash of
         * the String value of the Value or on the hash of all the non-blank node triples of an attached blank node.
         *
         * @param value the v
         * @return the long representing the comparator score for the Value.
         */
        private long scoreValue(Value value) {
            if (value instanceof BNode) {
                List<String> o1Values = new ArrayList<>();
                model.filter((BNode) value, null, null, (Resource) null).forEach(statement -> {
                    if (statement.getObject() instanceof BNode) {
                        o1Values.add(statement.getPredicate().stringValue());
                    } else {
                        o1Values.add(statement.getPredicate().stringValue());
                        o1Values.add(statement.getObject().stringValue());
                    }
                });
                Collections.sort(o1Values);
                return hash(String.join("", o1Values));
            } else {
                return hash(value.stringValue());
            }
        }
    }

    /**
     * Hashing algorithm for strings adapted from String.hashCode(). Uses a 64-bit hash (long) rather than the
     * standard 32-bit hash (int).
     */
    private static long hash(String string) {
        long h = 1125899906842597L; // prime
        int len = string.length();

        for (int i = 0; i < len; i++) {
            h = 31*h + string.charAt(i);
        }
        return h;
    }
}
