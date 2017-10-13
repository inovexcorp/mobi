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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;

import java.util.Optional;


public interface OntologyId {

    Optional<IRI> getOntologyIRI();

    Optional<IRI> getVersionIRI();

    /**
     * The Resource that uniquely identifies this ontology. OWL2 Specifications state that an ontology
     * <i>may</i> have an Ontology IRI, and, if present, <i>may</i> additionally have a Version IRI.
     * The behavior of the ontology identifier is as follows:
     *
     * <ol>
     *     <li>If a Version IRI is present, the ontology identifier will match the Version IRI</li>
     *     <li>Else if an Ontology IRI is present, the ontology identifier will match the Ontology IRI</li>
     *     <li>Else if neither are present, the ontology identifier will be a system generated IRI</li>
     * </ol>
     *
     * @return The Resource that represents the ontology identifier.
     */
    Resource getOntologyIdentifier();

}
