package org.matonto.etl.api.delimited;

import org.matonto.rdf.api.Model;

public interface Mapping {
    MappingId getId();

    Model getModel();
}
