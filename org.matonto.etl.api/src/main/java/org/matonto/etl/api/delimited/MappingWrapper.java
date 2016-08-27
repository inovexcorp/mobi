package org.matonto.etl.api.delimited;

import org.matonto.etl.api.ontologies.delimited.Mapping;

public interface MappingWrapper {

    MappingId getId();

    Mapping getMapping();
}
