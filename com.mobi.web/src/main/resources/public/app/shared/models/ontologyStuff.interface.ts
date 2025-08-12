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
import { EntityNames } from './entityNames.interface';
import { HierarchyResponse } from './hierarchyResponse.interface';
import { ImportedOntology } from './shapesGraphImports.interface';
import { IriList } from './iriList.interface';
import { PropertyToRanges } from './propertyToRanges.interface';
import { VocabularyStuff } from './vocabularyStuff.interface';

/**
 * @ngdoc interface
 * @name shared.models:OntologyStuff
 *
 * @description
 * Represents a response from the ontology-stuff endpoint
 */
export interface OntologyStuff extends VocabularyStuff, PropertyToRanges {
  ontologyIRI: string;
  iriList: IriList;
  importedOntologies: ImportedOntology[];
  failedImports: string[];
  classHierarchy: HierarchyResponse;
  classesWithIndividuals: { [key: string]: string[] };
  dataPropertyHierarchy: HierarchyResponse;
  objectPropertyHierarchy: HierarchyResponse;
  annotationHierarchy: HierarchyResponse;
  individuals: { [key: string]: string[] };
  classToAssociatedProperties: { [key: string]: string[] };
  noDomainProperties: string[];
  entityNames: EntityNames;
}
