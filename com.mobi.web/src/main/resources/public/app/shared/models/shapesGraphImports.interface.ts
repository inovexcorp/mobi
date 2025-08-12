/*-
 * #%L
 * com.mobi.web
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

/**
 * @ngdoc interface
 * @name shared.models:ImportedOntology
 *
 * Represents metadata for an ontology that was successfully imported into the shapes graph.
 *
 * @property {string} id - The unique identifier of the import entry (e.g., internal DB or UUID).
 * @property {string} ontologyId - The IRI or identifier of the imported ontology.
 * @property {string[]} iris - A list of all distinct subject IRIs used in the ontology.
 */
export interface ImportedOntology {
  id: string;
  ontologyId: string;
  iris?: string[];
}

/**
 * @ngdoc interface
 * @name shared.models:ShapesGraphImports
 *
 * Represents a response from the shapeGraph imports endpoint
 */
export interface ShapesGraphImports {
  nonImportedIris: string[];
  importedOntologies: ImportedOntology[];
  failedImports: string[];
}
