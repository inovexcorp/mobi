package org.matonto.etl.api.delimited;

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.util.Optional;

public interface Mapping {
    MappingId getId();

    Optional<Resource> getSourceOntologyId();

    Model getEntities();

    Model asModel();
}
