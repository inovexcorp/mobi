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

import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
     * @return an Ontology with the desired OntologyId.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException;

    /**
     * Creates a new Ontology Object using the provided File.
     *
     * @param file the File that contains the data to make up the Ontology.
     * @return an Ontology created with the provided File.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(File file) throws MatontoOntologyException, FileNotFoundException;

    /**
     * Creates a new Ontology Object using the provided IRI.
     *
     * @param iri the IRI of the Ontology you want to create.
     * @return an Ontology resolved from the provided IRI.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(IRI iri) throws MatontoOntologyException;

    /**
     * Creates a new Ontology Object using the provided InputStream.
     *
     * @param inputStream the InputStream which contains the ontology data.
     * @return an Ontology created with the provided InputStream.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(InputStream inputStream) throws MatontoOntologyException;

    /**
     * Creates a new Ontology Object using the provided JSON-LD String.
     *
     * @param json the JSON-LD of the ontology you want to create.
     * @return an Ontology created with the provided JSON-LD String.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(String json) throws MatontoOntologyException;

    /**
     * Creates a new Ontology Object using the provided Model.
     *
     * @param model the Model of the ontology you want to create.
     * @return an Ontology created with the provided Model.
     * @throws MatontoOntologyException - if the ontology can't be created.
     */
    Ontology createOntology(Model model) throws MatontoOntologyException;

    /**
     * Retrieves an Ontology using an ontology id and the head commit of its MASTER branch. Returns an Optional with
     * Ontology object or an empty Optional instance if the ontology id is not found or any owlapi exception or sesame
     * exception is caught.
     *
     * @param ontologyId the ontology id for the Ontology you want to retrieve.
     * @return an Optional with Ontology if ontology id is found, or an empty Optional instance if not found.
     * @throws MatontoOntologyException - if the repository connection fails or the ontology can't be created.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId) throws MatontoOntologyException;

    /**
     * Retrieves an Ontology using an ontology id and the head commit of a Branch identified by the provided branch id.
     * Returns an Optional with Ontology object or an empty Optional instance if the ontology id is not found or any
     * owlapi exception or sesame exception is caught.
     *
     * @param ontologyId the ontology id for the Ontology you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @return an Optional with Ontology if ontology id is found, or an empty Optional instance if not found.
     * @throws MatontoOntologyException - if the repository connection fails or the ontology can't be created.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId, @Nonnull Resource branchId) throws
            MatontoOntologyException;

    /**
     * Retrieves an Ontology using an ontology id, a branch id, and the id of a commit on that branch from the
     * repository. Returns an Optional with Ontology object or an empty Optional instance if the ontology id is not
     * found or any owlapi exception or sesame exception is caught.
     *
     * @param ontologyId the ontology id for the Ontology you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @param commitId the commit id for the Commit you want to retrieve.
     * @return an Optional with Ontology if ontology id is found, or an empty Optional instance if not found.
     * @throws MatontoOntologyException - if the repository connection fails or the ontology can't be created.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource ontologyId, @Nonnull Resource branchId,
                                        @Nonnull Resource commitId) throws MatontoOntologyException;

    /**
     * Deletes the ontology and all associated Catalog elements with the given OntologyId, and returns true if
     * successfully removed. The identifier used matches the rules for OntologyId.getOntologyIdentifier():
     *
     * <ol>
     *     <li>If a Version IRI is present, the ontology identifier will match the Version IRI</li>
     *     <li>Else if an Ontology IRI is present, the ontology identifier will match the Ontology IRI</li>
     *     <li>Else if neither are present, the ontology identifier will be a system generated blank node</li>
     * </ol>
     *
     * @param ontologyId the ontology id for the Ontology you want to delete.
     * @throws MatontoOntologyException - if the repository is null
     */
    void deleteOntology(@Nonnull Resource ontologyId) throws MatontoOntologyException;

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
     * @param ontologyIRI the IRI for the ontology you want to create the OntologyId for.
     * @param versionIRI the version IRI for the ontology you want to create the OntologyId for.
     * @return an OntologyId using the ontologyIRI and versionIRI to determine the proper identifier.
     */
    OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI);

    /**
     * Gets the subClassOf relationships for classes in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getSubClassesOf(Ontology ontology) throws MatontoOntologyException;

    /**
     * Gets the subPropertyOf relationships for datatype properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getSubDatatypePropertiesOf(Ontology ontology) throws MatontoOntologyException;

    /**
     * Gets the subPropertyOf relationships for object properties in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getSubObjectPropertiesOf(Ontology ontology) throws MatontoOntologyException;

    /**
     * Gets the classes with individuals in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getClassesWithIndividuals(Ontology ontology) throws MatontoOntologyException;

    /**
     * Gets the entity usages for the provided Resource in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @param entity the Resource for the entity you want to get the usages of.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getEntityUsages(Ontology ontology, Resource entity) throws MatontoOntologyException;

    /**
     * Gets the concept relationships in the provided Ontology.
     *
     * @param ontology the Ontology you wish to query.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getConceptRelationships(Ontology ontology) throws MatontoOntologyException;

    /**
     * Searches the provided Ontology using the provided searchText.
     *
     * @param ontology the Ontology you wish to query.
     * @param searchText the String for the text you want to search for in the Ontology.
     * @return a Set with the query results.
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<BindingSet> getSearchResults(Ontology ontology, String searchText) throws MatontoOntologyException;
}
