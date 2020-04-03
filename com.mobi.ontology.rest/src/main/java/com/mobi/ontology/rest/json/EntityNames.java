package com.mobi.ontology.rest.json;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonSetter;

import java.util.Map;
import java.util.Set;

public class EntityNames {
    public String label;
    private Map<String, Set<String>> names;

    public EntityNames() {
    }

    public EntityNames(String label) {
        this.label = label;
    }

    @JsonGetter("names")
    public Map<String, Set<String>> getNames() {
        return names;
    }

    @JsonSetter("names")
    public void setNames(Map<String, Set<String>> names) {
        this.names = names;
    }
}
