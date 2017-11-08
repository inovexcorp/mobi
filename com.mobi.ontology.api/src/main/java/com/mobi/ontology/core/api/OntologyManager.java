package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.ontology.core.api.builder.OntologyRecordConfig;
import com.mobi.ontology.core.utils.MobiOntologyCreationException;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Optional;
import javax.annotation.Nonnull;

public interface OntologyManager {

    /**
     * Creates a new OntologyRecord using the provided OntologyRecordConfig.
     *
     * @param config the configuration to use when creating the OntologyRecord
     * @return a OntologyRecord
     */
    OntologyRecord createOntologyRecord(OntologyRecordConfig config);

    /**
     * Creates a new Ontology Object using the provided OntologyId.
     *
     * @param ontologyId the ontology id for the Ontology you want to create.
     * @return an Ontology with the desired recordId.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(OntologyId ontologyId);

    /**
     * Creates a new Ontology Object using the provided File.
     *
     * @param file the File that contains the data to make up the Ontology.
     * @return an Ontology created with the provided File.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     * @throws FileNotFoundException            - if the file path is invalid.
     */
    Ontology createOntology(File file) throws FileNotFoundException;

    /**
     * Creates a new Ontology Object using the provided IRI.
     *
     * @param iri the IRI of the Ontology you want to create.
     * @return an Ontology resolved from the provided IRI.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(IRI iri);

    /**
     * Creates a new Ontology Object using the provided InputStream.
     *
     * @param inputStream the InputStream which contains the ontology data.
     * @return an Ontology created with the provided InputStream.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(InputStream inputStream);

    /**
     * Creates a new Ontology Object using the provided JSON-LD String.
     *
     * @param json the JSON-LD of the ontology you want to create.
     * @return an Ontology created with the provided JSON-LD String.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(String json);

    /**
     * Creates a new Ontology Object using the provided Model.
     *
     * @param model the Model of the ontology you want to create.
     * @return an Ontology created with the provided Model.
     * @throws MobiOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(Model model);

    /**
     * Tests whether an OntologyRecord with the provided OntologyIRI Resource exists in the Catalog.
     *
     * @param ontologyIRI An ontology IRI
     * @return True if the ontology exists; false otherwise
     */
    boolean ontologyIriExists(Resource ontologyIRI);

    /**
     * Gets the Record id of the OntologyRecord with the passed ontology IRI if found in the Catalog.
     *
     * @param ontologyIRI An ontology IRI that should be set on an OntologyRecord in the Catalog.
     * @return An Optional of the Record Resource id if found, otherwise Optional.empty()
     * @throws IllegalStateException - the system Repository could not be found.
     */
    Optional<Resource> getOntologyRecordResource(@Nonnull Resource ontologyIRI);

    /**
     * Retrieves an Ontology using an ontology IRI.
     *
     * @param ontologyIRI The IRI of the ontology the OntologyRecord represents.
     * @return Returns an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws IllegalStateException - the system Repository could not be found.
     */
    Optional<Ontology> retrieveOntologyByIRI(@Nonnull Resource ontologyIRI);

    /**
     * Retrieves an Ontology using a record id and the head commit of its MASTER branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @return Returns an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MobiOntologyCreationException - the ontology can't be created.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId);

    /**
     * Retrieves an Ontology using a record id and the head commit of the specified branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MobiOntologyCreationException - the ontology can't be created.
     * @throws IllegalArgumentException - the branch cannot be found.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Retrieves an Ontology using a record id, branch id, and the id of a commit on that branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @param commitId the commit id for the Commit you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MobiOntologyCreationException - the ontology can't be created.
     * @throws IllegalArgumentException - the branch or commit cannot be found.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                        @Nonnull Resource commitId);

    /**
     * Deletes the OntologyRecord and all associated Catalog elements with the given recordId, and returns true if
     * successfully removed.
     *
     * @param recordId the record id for the OntologyRecord you want to delete.
     * @return The OntologyRecord that was deleted.
     * @throws IllegalArgumentException - the OntologyRecord can't be retrieved.
     */
    OntologyRecord deleteOntology(@Nonnull Resource recordId);

    /**
     * Deletes a branch associated with an OntologyRecord.
     *
     * @param recordId The record id for the OntologyRecord which contains the Branch you want to delete.
     * @param branchId The branch id of the ontology branch you want to delete.
     * @throws IllegalArgumentException - the OntologyRecord can't be retrieved.
     */
    void deleteOntologyBranch(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Creates a new OntologyId with a generated identifier.
     *
     * @return an OntologyId with a generated identifier.
     */
    OntologyId createOntologyId();

    /**
     * Creates a new OntologyId using the provided Resource as the identifier.
     *
     * @param resource the Resource that you want to be your identifier.
     * @return an OntologyId with the provided Resource as the identifier.
     */
    OntologyId createOntologyId(Resource resource);

    /**
     * Creates a new OntologyId using the provided IRI as the identifier.
     *
     * @param ontologyIRI the IRI that you want to be your identifier.
     * @return an OntologyId with the provided IRI as the identifier.
     */
    OntologyId createOntologyId(IRI ontologyIRI);

    /**
     * Creates a new OntologyId using the provided version IRI as the identifier.
     *
     * @param ontologyIRI the IRI for the ontology you want to create the recordId for.
     * @param versionIRI  the version IRI for the ontology you want to create the recordId for.
     * @return an OntologyId using the ontologyIRI and versionIRI to determine the proper identifier.
     */
    OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI);

    /**
     * Gets the subClassOf relationships for classes in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getSubClassesOf(Ontology ontology);

    /**
     * Gets the subClassOf relationships for a particular {@link IRI} in the provided {@link Ontology}. It will provide
     * <em>all</em> classes that can be traced back to the provided class IRI, even if nested.
     *
     * @param ontology The {@link Ontology} you wish to query.
     * @param iri      The {@link IRI} of the class for which you want the list of subclasses.
     * @return a {@link TupleQueryResult} with the query results.
     */
    TupleQueryResult getSubClassesFor(Ontology ontology, IRI iri);

    TupleQueryResult getSubPropertiesFor(Ontology ontology, IRI iri);

    /**
     * Gets the subPropertyOf relationships for datatype properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getSubDatatypePropertiesOf(Ontology ontology);

    /**
     * Gets the subPropertyOf relationships for annotation properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getSubAnnotationPropertiesOf(Ontology ontology);

    /**
     * Gets the subPropertyOf relationships for object properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getSubObjectPropertiesOf(Ontology ontology);

    /**
     * Gets the classes with individuals in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getClassesWithIndividuals(Ontology ontology);

    /**
     * Gets the entity usages for the provided Resource in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @param entity   the Resource for the entity you want to get the usages of.
     * @return a Set with the query results.
     */
    TupleQueryResult getEntityUsages(Ontology ontology, Resource entity);

    /**
     * Constructs the entity usages for the provided Resource in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @param entity   the Resource for the entity you want to get the usages of.
     * @return a Model with the constructed statements.
     */
    Model constructEntityUsages(Ontology ontology, Resource entity);

    /**
     * Gets the concept relationships in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getConceptRelationships(Ontology ontology);

    /**
     * Gets the concept scheme relationships in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getConceptSchemeRelationships(Ontology ontology);

    /**
     * Searches the provided Ontology using the provided searchText.
     *
     * @param ontology   the Ontology you wish to query.
     * @param searchText the String for the text you want to search for in the Ontology.
     * @return a Set with the query results.
     */
    TupleQueryResult getSearchResults(Ontology ontology, String searchText);

    /**
     * Gets the compiled resource of the head Commit on the master Branch for the OntologyRecord specified by the
     * provided Resource.
     *
     * @param recordId the record id for the OntologyRecord you want to get the Model for.
     * @return a Model containing the Ontology Statements.
     */
    Model getOntologyModel(Resource recordId);
}
