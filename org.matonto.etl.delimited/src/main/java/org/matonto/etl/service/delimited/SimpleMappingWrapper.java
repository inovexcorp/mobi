package org.matonto.etl.service.delimited;

import org.matonto.etl.api.delimited.MappingId;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.api.ontologies.delimited.Mapping;

public class SimpleMappingWrapper implements MappingWrapper {

    private MappingId mappingId;
    private Mapping mapping;

    public SimpleMappingWrapper(MappingId mappingId, Mapping mapping) {
        this.mappingId = mappingId;
        this.mapping = mapping;
    }

    @Override
    public MappingId getId() {
        return mappingId;
    }

    @Override
    public Mapping getMapping() {
        return mapping;
    }
}
