package com.mobi.etl.api.ontology;

import com.mobi.catalog.api.builder.Difference;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;

public interface OntologyImportService {

    /**
     * Commits mapped data to an ontology without creating duplicate statements. If removal of duplicate
     * statements would result in an empty commit, no commit is made. Allows for optional update operation
     * that will determine differences between provided ontology data and existing ontology data. When
     * calculating differences, triples on owl:Ontology entities are ignored.
     *
     * @param ontologyRecord The target ontology record
     * @param branch The branch for the target ontology record
     * @param update Whether or not to calculate differences with existing ontology data
     * @param ontologyData The new ontology data to commit to the ontology record
     * @param user The user for the commit metadata
     * @param commitMsg The message for the commit metadata
     * @return The Difference representing the data included in the commit
     */
    Difference importOntology(IRI ontologyRecord, IRI branch, boolean update, Model ontologyData, User user, String commitMsg);
}
