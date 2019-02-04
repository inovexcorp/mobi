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

public class Hierarchy {
    private static final Logger LOG = LoggerFactory.getLogger(Hierarchy.class);

    private Model model;
    private Map<String, Set<String>> parentMap = new HashMap<>();
    private Map<String, Set<String>> childMap = new HashMap<>();

    private IRI type;
    private IRI nodeType;
    private IRI childProp;

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
        childMap.put(iri.stringValue(), new HashSet<>());
        parentMap.put(iri.stringValue(), new HashSet<>());
        model.add(iri, type, nodeType);
    }

    public void getHierarchyString(SesameTransformer transformer, OutputStream outputStream) {
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
