package com.mobi.etl.api.ontology;

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;

public interface OntologyImportService {

    Model importOntology(IRI ontologyRecord, IRI branch, boolean update, Model ontologyData, User user, String commitMsg);
}
