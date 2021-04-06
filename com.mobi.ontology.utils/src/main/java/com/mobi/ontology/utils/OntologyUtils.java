package com.mobi.ontology.utils;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.ontology.core.api.Ontology;

import java.util.Set;
import java.util.stream.Collectors;

public class OntologyUtils {

    /**
     * Gets the imported ontologies for the Ontology identified, excluding the base Ontology.
     *
     * @param baseOntology the base Ontology to retrieve imported ontologies from
     * @return the Set of imported Ontologies without the base Ontology.
     */
    public static Set<Ontology> getImportedOntologies(Ontology baseOntology) {
        Set<Ontology> importsClosure = baseOntology.getImportsClosure();
        return getImportedOntologies(importsClosure, baseOntology);
    }
    /**
     * Gets the imported ontologies for the Ontology identified, excluding the base Ontology.
     *
     * @param importedOntologies set of ontologies from the imports closure which includes the base ontology.
     * @param baseOntology the {@link Ontology} of the base Ontology to exclude from the {@link Set}.
     * @return the Set of imported Ontologies without the base Ontology.
     */
    public static Set<Ontology> getImportedOntologies(Set<Ontology> importedOntologies, Ontology baseOntology) {
        return importedOntologies.stream()
                .filter(ontology -> !ontology.equals(baseOntology))
                .collect(Collectors.toSet());
    }
}
