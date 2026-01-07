/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
 * Represents a summary of a SHACL Node Shape.
 *
 * @property {string} iri The IRI of the Node Shape.
 * @property {string} name A human-readable name or label for the Node Shape.
 * @property {string} targetType The SHACL target type (e.g., `sh:targetClass`, `sh:targetNode`).
 * @property {string} targetTypeLabel (Optional) A display-friendly label for the target type.
 * @property {string} targetValue The value associated with the SHACL target (e.g., a class IRI).
 * @property {string} targetValueLabel (Optional) A display-friendly label for the target value.
 * @property {boolean} imported Whether this Node Shape was imported from another ontology.
 * @property {string} sourceOntologyIRI The IRI of the source ontology where this Node Shape is defined.
 */
export interface NodeShapeSummary {
  iri: string;
  name: string;
  targetType: string; 
  targetTypeLabel?: string; // Used to display the target type IRI
  targetValue: string;
  targetValueLabel?: string; // Used to display the value of the target IRI
  imported: boolean;
  sourceOntologyIRI: string;
}
