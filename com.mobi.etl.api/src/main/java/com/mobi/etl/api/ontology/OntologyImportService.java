package com.mobi.etl.api.ontology;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;

public interface OntologyImportService {

    /**
     * Commits provided data to the master branch of an ontology without creating duplicate statements. If removal of
     * duplicate statements would result in an empty commit, no commit is made. Allows for optional update operation
     * that will determine differences between provided ontology data and existing ontology data. When
     * calculating differences, triples on owl:Ontology entities are ignored.
     *
     * @param ontologyRecord The target ontology record
     * @param update Whether or not to calculate differences with existing ontology data
     * @param ontologyData The new ontology data to commit to the ontology record
     * @param user The user for the commit metadata
     * @param commitMsg The message for the commit metadata
     * @return The Difference representing the data included in the commit
     * @throws IllegalArgumentException If the Catalog could not be found, the OntologyRecord could not be found, or the
     *      Branch does not belong to the OntologyRecord
     */
    Difference importOntology(Resource ontologyRecord, boolean update, Model ontologyData, User user, String commitMsg);

    /**
     * Commits provided data to the provided branch of an ontology without creating duplicate statements. If removal of
     * duplicate statements would result in an empty commit, no commit is made. Allows for optional update operation
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
     * @throws IllegalArgumentException If the Catalog could not be found, the OntologyRecord could not be found, or the
     *      Branch does not belong to the OntologyRecord
     */
    Difference importOntology(Resource ontologyRecord, Resource branch, boolean update, Model ontologyData, User user, String commitMsg);
}
