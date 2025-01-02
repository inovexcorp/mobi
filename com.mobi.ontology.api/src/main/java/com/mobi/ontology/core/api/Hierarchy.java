package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
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

import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.OutputStream;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A POJO that represents hierarchical relationships within an {@link Ontology}. Contains a {@link Map} of IRI Strings
 * of parents to IRI strings of their children and a {@link Map} of IRI Strings of children to IRI strings of their
 * parents. If an entity does not have a parent, it will not be in the parentMap. If an entity does not have a child,
 * it will not be in the childMap. The POJO also contains a {@link Model} of statements representing the hierarchy.
 */
public class Hierarchy {
    private static final Logger LOG = LoggerFactory.getLogger(Hierarchy.class);

    private Model model;
    private Set<Resource> iris = ConcurrentHashMap.newKeySet();
    private Map<String, Set<String>> parentMap = new ConcurrentHashMap<>();
    private Map<String, Set<String>> childMap = new ConcurrentHashMap<>();
    private Map<String, Map<String, Set<String>>> circularMap = new ConcurrentHashMap<>();

    private IRI type;
    private IRI nodeType;
    private IRI childProp;
    private ValueFactory vf;

    /**
     * Creates an empty {@link Hierarchy}.
     *
     * @param vf A {@link ValueFactory} to use in initialization
     * @param mf A {@link ModelFactory} to use in initialization
     */
    public Hierarchy(ValueFactory vf, ModelFactory mf) {
        model = mf.createEmptyModel();
        type = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        nodeType = vf.createIRI("http://mobi.com/hierarchy#Node");
        childProp = vf.createIRI("http://mobi.com/hierarchy#child");
        this.vf = vf;
    }

    public Map<String, Set<String>> getChildMap() {
        return childMap;
    }

    public Map<String, Set<String>> getParentMap() {
        return parentMap;
    }

    public Map<String, Map<String, Set<String>>> getCircularMap() {
        return circularMap;
    }

    public Model getModel() {
        model.clear();
        iris.forEach(iri -> model.add(iri, type, nodeType));
        childMap.forEach((childStr, parentStrSet) -> {
            IRI child = vf.createIRI(childStr);
            model.add(child, type, nodeType);

            parentStrSet.forEach(parentStr -> {
                IRI parent = vf.createIRI(parentStr);
                model.add(parent, type, nodeType);
                model.add(parent, childProp, child);
            });
        });
        return model;
    }

    /**
     * Adjusts the internal {@link Map Maps} and {@link Model} to represent a parent-child relationship between the
     * provided {@link Resource Resources}.
     *
     * @param parent A parent entity's {@link Resource}
     * @param child A child entity's {@link Resource}
     */
    public void addParentChild(Resource parent, Resource child) {
        String childStr = child.stringValue();
        String parentStr = parent.stringValue();
        if (childMap.containsKey(childStr)) {
            childMap.get(childStr).add(parentStr);
        } else {
            Set<String> set = ConcurrentHashMap.newKeySet();
            set.add(parentStr);
            childMap.put(childStr, set);
        }
        if (parentMap.containsKey(parentStr)) {
            parentMap.get(parentStr).add(childStr);
        } else {
            Set<String> set = ConcurrentHashMap.newKeySet();
            set.add(childStr);
            parentMap.put(parentStr, set);
        }
    }

    /**
     * Adjusts the internal {@link Map Maps} and {@link Model} to represent a circular relationship between the
     * provided {@link Resource Resources}.
     *
     * @param parent entity that would cause a circular relationship if it were subclassed
     * @param child entity already currently being subclassed by the parent entity
     * @param path A set of entities that are included in list of links to the parent entity
     */
    public void addCircularRelationship(Resource parent, Resource child, HashSet<String> path) {
        String parentString = parent.stringValue();
        String childString = child.stringValue();

        if (circularMap.containsKey(parentString)) {
            circularMap.get(parentString).put(childString, path);
        } else {
            Map<String, Set<String>> childObject = new ConcurrentHashMap<>();
            childObject.put(childString, path);
            circularMap.put(parentString, childObject);
        }
    }

    public void addIRI(Resource iri) {
        iris.add(iri);
    }

    /**
     * Writes the {@link Model} of hierarchy relationships as JSON-LD in a hierarchical view to the provided
     * {@link OutputStream}.
     *
     * @param outputStream The {@link OutputStream} to write the hierarchy string to
     */
    public void writeHierarchyString(OutputStream outputStream) {
        StopWatch watch = new StopWatch();
        LOG.trace("Start writing hierarchy JSON-LD");
        watch.start();
        RDFWriter writer = Rio.createWriter(RDFFormat.JSONLD, outputStream);
        writer.getWriterConfig().set(JSONLDSettings.HIERARCHICAL_VIEW, true);
        Rio.write(getModel(), writer);
        watch.stop();
        LOG.trace("End writing hierarchy JSON-LD: " + watch.getTime() + "ms");
    }
}
