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
import java.util.List;
import java.util.Map;
import java.util.Objects;

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
        final Map<Integer, Integer> hashCount = new HashMap<>();

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
                                result.addAll(deterministicSkolemize((BNode) statement.getObject(), model, skolemizedBNodes, hashCount));
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
                    result.addAll(deterministicSkolemize((BNode) resource, model, skolemizedBNodes, hashCount));
                });

        return result;
    }

    /**
     * Skolemizes a BNode and any attached BNode chains.
     *
     * @param bNode The BNode to skolemize.
     * @param model The Model containing data for the BNode and any attached BNode chain.
     * @param skolemizedBNodes The Map tracking previously skolemized BNodes.
     * @return The Model containing all skolemized statements for the bNode and any attached BNode chains.
     */
    private Model deterministicSkolemize(BNode bNode, Model model, Map<BNode, IRI> skolemizedBNodes, Map<Integer, Integer> hashCount) {
        Model result = mf.createModel();

        List<String> valuesToHash = new ArrayList<>();
        model.filter(bNode, null, null, (Resource) null).stream()
                // Sort attached nodes to handle attached blank nodes pointing to isomorphic blank nodes
                .sorted(new ModelStatementComparator(model))
                .forEach(statement -> {
                    if (statement.getObject() instanceof BNode) {
                        // If object is a BNode
                        if (!skolemizedBNodes.containsKey(statement.getObject())) {
                            result.addAll(deterministicSkolemize((BNode) statement.getObject(), model, skolemizedBNodes, hashCount));
                        }
                        valuesToHash.add(statement.getPredicate().stringValue());
                        valuesToHash.add(skolemizedBNodes.get(statement.getObject()).stringValue());
                    } else {
                        // Else object is an IRI or Literal
                        valuesToHash.add(statement.getPredicate().stringValue());
                        valuesToHash.add(statement.getObject().stringValue());
                    }
                });
        Collections.sort(valuesToHash);
        int idHash = String.join("", valuesToHash).hashCode();

        String hashString;
        if (hashCount.containsKey(idHash)) {
            int nextValue = hashCount.get(idHash)+1;
            hashString = idHash + "-" + nextValue;
            hashCount.put(idHash, nextValue);
        } else {
            hashString = String.valueOf(idHash);
            hashCount.put(idHash, 1);
        }

        IRI skolemizedIRI = vf.createIRI(SKOLEMIZED_NAMESPACE, hashString);

        model.filter(bNode, null, null, (Resource) null).forEach(statement -> {
            Value value = statement.getObject() instanceof BNode ? skolemizedBNodes.get(statement.getObject()) : statement.getObject();
            if (statement.getContext().isPresent()) {
                result.add(skolemizedIRI, statement.getPredicate(), value, statement.getContext().get());
            } else {
                result.add(skolemizedIRI, statement.getPredicate(), value);
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
     * A comparator that sorts statements based on predicate and object values ignoring blank nodes
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
            int o1Score = scoreValue(o1.getObject());
            int o2Score = scoreValue(o2.getObject());
            return Integer.compare(o1Score, o2Score);
        }

        private int scoreValue(Value value) {
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
                int o1Hash = Objects.hash(o1Values.toArray());
                return o1Hash;
            } else {
                return value.stringValue().hashCode();
            }
        }
    }
}
