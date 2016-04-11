package org.matonto.etl.api.csv;

import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

public interface MappingManager {

    Map<Resource, String> getMappingRegistry();

    Model createMapping(File mapping) throws IOException;

    Model createMapping(String jsonld) throws IOException;

    Model createMapping(InputStream in, RDFFormat format) throws IOException;

    Optional<Model> retrieveMapping(Resource resource) throws MatOntoException;

    boolean storeMapping(Model mappingModel, Resource mappingIRI) throws MatOntoException;

    Resource createMappingIRI();

    Resource createMappingIRI(String localName);
}
