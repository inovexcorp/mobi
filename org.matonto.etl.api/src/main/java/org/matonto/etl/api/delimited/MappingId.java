package org.matonto.etl.api.delimited;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;

import java.util.Optional;

public interface MappingId {
    Optional<IRI> getMappingIRI();

    Optional<IRI> getVersionIRI();

    Resource getMappingIdentifier();
}
