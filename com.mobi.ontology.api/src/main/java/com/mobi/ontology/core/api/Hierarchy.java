package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.JSONLDSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.OutputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * A POJO that represents hierarchical relationships within an {@link Ontology}. Contains a {@link Map} of IRI Strings
 * of parents to IRI strings of their children and a {@link Map} of IRI Strings of children to IRI strings of their
 * parents. If an entity does not have a parent, it will not be in the parentMap. If an entity does not have a child,
 * it will not be in the childMap. The POJO also contains a {@link Model} of statements representing the hierarchy.
 */
public class Hierarchy {
    private static final Logger LOG = LoggerFactory.getLogger(Hierarchy.class);

    private Model model;
    private Map<String, Set<String>> parentMap = new HashMap<>();
    private Map<String, Set<String>> childMap = new HashMap<>();

    private IRI type;
    private IRI nodeType;
    private IRI childProp;

    /**
     * Creates an empty {@link Hierarchy}.
     *
     * @param vf A {@link ValueFactory} to use in initialization
     * @param mf A {@link ModelFactory} to use in initialization
     */
    public Hierarchy(ValueFactory vf, ModelFactory mf) {
        model = mf.createModel();
        type = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        nodeType = vf.createIRI("http://mobi.com/hierarchy#Node");
        childProp = vf.createIRI("http://mobi.com/hierarchy#child");
    }

    public Map<String, Set<String>> getChildMap() {
        return childMap;
    }

    public Map<String, Set<String>> getParentMap() {
        return parentMap;
    }

    public Model getModel() {
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
        model.add(parent, type, nodeType);
        model.add(child, type, nodeType);
        model.add(parent, childProp, child);
        String childStr = child.stringValue();
        String parentStr = parent.stringValue();
        if (childMap.containsKey(childStr)) {
            childMap.get(childStr).add(parentStr);
        } else {
            Set<String> set = new HashSet<>();
            set.add(parentStr);
            childMap.put(childStr, set);
        }
        if (parentMap.containsKey(parentStr)) {
            parentMap.get(parentStr).add(childStr);
        } else {
            Set<String> set = new HashSet<>();
            set.add(childStr);
            parentMap.put(parentStr, set);
        }
    }

    public void addIRI(Resource iri) {
        model.add(iri, type, nodeType);
    }

    /**
     * Writes the {@link Model} of hierarchy relationships as JSON-LD in a hierarchical view to the provided
     * {@link OutputStream}.
     *
     * @param transformer A {@link SesameTransformer} to utilize when writing the JSON-LD
     * @param outputStream The {@link OutputStream} to write the hierarchy string to
     */
    public void writeHierarchyString(SesameTransformer transformer, OutputStream outputStream) {
        StopWatch watch = new StopWatch();
        LOG.trace("Start writing hierarchy JSON-LD");
        watch.start();
        RDFWriter writer = Rio.createWriter(RDFFormat.JSONLD, outputStream);
        writer.getWriterConfig().set(JSONLDSettings.HIERARCHICAL_VIEW, true);
        Rio.write(transformer.sesameModel(model), writer);
        watch.stop();
        LOG.trace("End writing hierarchy JSON-LD: " + watch.getTime() + "ms");
    }
}
