package org.matonto.etl.service.delimited;

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
