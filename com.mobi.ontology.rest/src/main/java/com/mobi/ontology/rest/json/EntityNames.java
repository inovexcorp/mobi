package com.mobi.ontology.rest.json;

import com.fasterxml.jackson.annotation.JsonAnyGetter;

import java.util.List;
import java.util.Map;

public class EntityNames {
    public String label;
    private Map<String, List<String>> names;

    @JsonAnyGetter
    public Map<String, List<String>> getNames() {
        return names;
    }
}
