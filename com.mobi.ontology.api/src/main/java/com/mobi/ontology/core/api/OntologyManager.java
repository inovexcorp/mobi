package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import javax.annotation.Nonnull;

public interface OntologyManager {

    /**
     * Applies the Difference to the provided Ontology and returns a new Ontology object.
     *
     * @param ontology the Ontology to apply the Difference to
     * @param difference the Difference with changes made to the ontology
     * @return An Ontology with the applied changes
     */
    Ontology applyChanges(Ontology ontology, Difference difference);

    /**
     * Applies the changes in the InProgressCommit to the provided Ontology and returns a new Ontology object.
     *
     * @param ontology the Ontology to apply the Difference to
     * @param inProgressCommit the InProgressCommit with changes made to the ontology
     * @return An Ontology with the applied changes
     */
    Ontology applyChanges(Ontology ontology, InProgressCommit inProgressCommit);

    /**
     * Tests whether an OntologyRecord with the provided OntologyIRI Resource exists in the Catalog.
     *
     * @param ontologyIRI An ontology IRI
     * @return True if the ontology exists; false otherwise
     */
    boolean ontologyIriExists(Resource ontologyIRI);

    /**
     * Retrieves an Ontology using a record id and the head commit of its MASTER branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @return Returns an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws IllegalArgumentException If the record is not an OntologyRecord.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId);

    /**
     * Retrieves an Ontology using a record id and the head commit of the specified branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws IllegalArgumentException If the branch cannot be found or the record is not an OntologyRecord.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Retrieves an Ontology using a record id, branch id, and the id of a commit on that branch.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param branchId the branch id for the Branch you want to retrieve.
     * @param commitId the commit id for the Commit you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws IllegalArgumentException Id the branch or commit cannot be found or the record is not an OntologyRecord.
     */
    Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                        @Nonnull Resource commitId);

    /**
     * Retrieves an Ontology using a record id and the id of a commit on a branch in that record.
     *
     * @param recordId the record id for the OntologyRecord you want to retrieve.
     * @param commitId the commit id for the Commit you want to retrieve.
     * @return an Optional of the Ontology if found, otherwise Optional.empty().
     * @throws IllegalArgumentException If the record cannot be found or the record is not an OntologyRecord.
     */
    Optional<Ontology> retrieveOntologyByCommit(@Nonnull Resource recordId, @Nonnull Resource commitId);

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
     * Creates a new OntologyId using the provided Model to extract the OntologyIRI and VersionIRI to determine the
     * identifier. If no OntologyIRI is on the Model, one is created and added to it.
     *
     * @param model the ontology Model you want to create the recordId for.
     * @return an OntologyId using the ontologyIRI and/or versionIRI from the model to determine the proper identifier.
     */
    OntologyId createOntologyId(Model model);

    /**
     * Gets the compiled resource of the head Commit on the master Branch for the OntologyRecord specified by the
     * provided Resource.
     *
     * @param recordId the record id for the OntologyRecord you want to get the Model for.
     * @param branchId the branch id for the OntologyRecord you want to get the Model for.
     * @return a Model containing the Ontology Statements.
     * @throws IllegalArgumentException If the Catalog could not be found, the OntologyRecord could not be found, or the
     *      Branch does not belong to the OntologyRecord
     */
    Model getOntologyModel(Resource recordId, Resource branchId);
}
