package org.matonto.ontology.core.api;

/*-
 * #%L
 * org.matonto.ontology.api
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

import org.matonto.ontology.core.utils.MatontoOntologyCreationException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.query.TupleQueryResult;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Optional;
import java.util.StringJoiner;
import javax.annotation.Nonnull;

public interface OntologyManager {

    /**
     * Returns the SesameTransformer used by the OntologyManager.
     *
     * @return the SesameTransformer used by the OntologyManager.
     */
    SesameTransformer getTransformer();

    /**
     * Creates a new Ontology Object using the provided OntologyId.
     *
     * @param ontologyId the ontology id for the Ontology you want to create.
     * @return an Ontology with the desired recordId.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(OntologyId ontologyId);

    /**
     * Creates a new Ontology Object using the provided File.
     *
     * @param file the File that contains the data to make up the Ontology.
     * @return an Ontology created with the provided File.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     * @throws FileNotFoundException - if the file path is invalid.
     */
    Ontology createOntology(File file) throws FileNotFoundException;

    /**
     * Creates a new Ontology Object using the provided IRI.
     *
     * @param iri the IRI of the Ontology you want to create.
     * @return an Ontology resolved from the provided IRI.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(IRI iri);

    /**
     * Creates a new Ontology Object using the provided InputStream.
     *
     * @param inputStream the InputStream which contains the ontology data.
     * @return an Ontology created with the provided InputStream.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(InputStream inputStream);

    /**
     * Creates a new Ontology Object using the provided JSON-LD String.
     *
     * @param json the JSON-LD of the ontology you want to create.
     * @return an Ontology created with the provided JSON-LD String.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(String json);

    /**
     * Creates a new Ontology Object using the provided Model.
     *
     * @param model the Model of the ontology you want to create.
     * @return an Ontology created with the provided Model.
     * @throws MatontoOntologyCreationException - if the ontology can't be created.
     */
    Ontology createOntology(Model model);

    /**
     * Retrieves an Ontology using a record id and the head commit of its MASTER branch. Returns an Optional of the
     * Ontology if found, otherwise Optional.empty().
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @return Returns an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MatontoOntologyCreationException - the ontology can't be created.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId);

    /**
     * Retrieves an Ontology using a record id and the head commit of the specified branch. Returns an Optional of the
     * Ontology if found, otherwise Optional.empty().
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MatontoOntologyCreationException - the ontology can't be created.
     * @throws IllegalArgumentException if the branch cannot be found.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Retrieves an Ontology using a record id, branch id, and the id of a commit on that branch. Returns an Optional
     * of the Ontology if found, otherwise Optional.empty().
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @param commitId the commit id for the Commit you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws MatontoOntologyCreationException - the ontology can't be created.
     * @throws IllegalArgumentException if the branch or commit cannot be found.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                        @Nonnull Resource commitId);

    /**
     * Deletes the OntologyRecord and all associated Catalog elements with the given recordId, and returns true if
     * successfully removed.
     *
     * @param recordId the record id for the OntologyRecord you want to delete.
     * @throws IllegalArgumentException - the OntologyRecord can't be retrieved.
     */
    void deleteOntology(@Nonnull Resource recordId);

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
     * @param versionIRI the version IRI for the ontology you want to create the recordId for.
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
     * Gets the subPropertyOf relationships for datatype properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     */
    TupleQueryResult getSubDatatypePropertiesOf(Ontology ontology);

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
     * @param entity the Resource for the entity you want to get the usages of.
     * @return a Set with the query results.
     */
    TupleQueryResult getEntityUsages(Ontology ontology, Resource entity);

    /**
     * Constructs the entity usages for the provided Resource in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @param entity the Resource for the entity you want to get the usages of.
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
     * Searches the provided Ontology using the provided searchText.
     *
     * @param ontology the Ontology you wish to query.
     * @param searchText the String for the text you want to search for in the Ontology.
     * @return a Set with the query results.
     */
    TupleQueryResult getSearchResults(Ontology ontology, String searchText);

    static String getOntologyCacheKey(String recordIri, String branchIri, String commitIri) {
        StringBuilder sb = new StringBuilder(recordIri);

        if (branchIri != null && !branchIri.trim().isEmpty()) {
            sb.append("&" + branchIri);
        }
        if (commitIri != null && !commitIri.trim().isEmpty()) {
            sb.append("&" + commitIri);
        }

        return sb.toString();
    }
}
