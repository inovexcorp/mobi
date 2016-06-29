package org.matonto.etl.service.csv;

/*-
 * #%L
 * org.matonto.etl.csv
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

import org.matonto.rdf.api.IRI;

import java.util.LinkedHashMap;
import java.util.Map;

public class ClassMapping {

    private Map<Integer, String> dataProperties = new LinkedHashMap<>();
    private Map<ClassMapping, String> objectProperties = new LinkedHashMap<>();
    // isInstance determines whether this classMapping has been made into an individual
    private boolean isInstance = false;
    private String prefix;
    private String mapping;
    private String localName;
    private IRI iri;

    public String getPrefix() {
        return prefix;
    }

    public boolean isInstance() {
        return isInstance;
    }

    public String getMapping() {
        return mapping;
    }

    public Map<ClassMapping, String> getObjectProperties() {
        return new LinkedHashMap<>(objectProperties);
    }

    public Map<Integer, String> getDataProperties() {
        return new LinkedHashMap<>(dataProperties);
    }

    public String getLocalName() {
        return localName;
    }

    public IRI getIri() {
        return iri;
    }

    public void setInstance(boolean isInstance) {
        this.isInstance = isInstance;
    }

    public void addDataProperty(Integer index, String property) {
        dataProperties.put(index, property);
    }

    public void addObjectProperty(ClassMapping mapping, String property) {
        objectProperties.put(mapping, property);
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public void setMapping(String mapping) {
        this.mapping = mapping;
    }

    public void setLocalName(String localName) {
        this.localName = localName;
    }

    public void setIRI(IRI iri) {
        this.iri = iri;
    }


}
