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
import { Constraint } from './constraint.interface';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';

/**
 * Represents a SHACL Property Shape, which defines constraints on a property of a node shape.
 * https://www.w3.org/TR/shacl/#property-shapes
 */
export interface PropertyShape {
  id: string,
  label: string,
  jsonld: JSONLDObject
  constraints: Constraint[],
  path: PathNode ,
  pathString: string,
  pathHtmlString: string,
  referencedNodeIds: Set<string>
}

/**
 * Represents a component of a property path on a Property Shape. Properties are always represented as a IRI type node
 * with the different path types (Inverse, Sequence, Alternative, ZeroOrMore, OneOrMore, ZeroOrOne) combining the
 * properties in different ways.
 */
export type PathNode =
  | { type: 'IRI'; iri: string, label: string }
  | { type: 'Inverse'; path: PathNode }
  | { type: 'Sequence'; items: PathNode[] }
  | { type: 'Alternative'; items: PathNode[] }
  | { type: 'ZeroOrMore'; path: PathNode }
  | { type: 'OneOrMore'; path: PathNode }
  | { type: 'ZeroOrOne'; path: PathNode };