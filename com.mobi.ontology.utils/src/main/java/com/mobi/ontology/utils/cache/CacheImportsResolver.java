package com.mobi.ontology.utils.cache;

import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.Repository;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface CacheImportsResolver {

    Map<String, Set<Resource>> loadOntologyIntoCache(OntologyId ontologyId, String key, Model ontModel,
                                                     Repository cacheRepo, OntologyManager ontologyManager);

    Optional<Model> retrieveOntologyFromWeb(Resource ontologyIRI) throws IOException;

    Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager);
}
