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
  message?: string;
  jsonld: JSONLDObject
  constraints: Constraint[],
  path: PathNode,
  pathString: string,
  pathHtmlString: string,
  referencedNodeIds: Set<string>
}

type PathNodeType = 'IRI' | 'Inverse' | 'Sequence' | 'Alternative' | 'ZeroOrMore' | 'OneOrMore' | 'ZeroOrOne';

interface PathNodeBase {
  type: PathNodeType
}

export interface IRIPathNode extends PathNodeBase {
  type: 'IRI',
  iri: string,
  label: string
}

export interface InversePathNode extends PathNodeBase {
  type: 'Inverse',
  path: PathNode
}

export interface SequencePathNode extends PathNodeBase {
  type: 'Sequence',
  items: PathNode[]
}

export interface AlternativePathNode extends PathNodeBase {
  type: 'Alternative',
  items: PathNode[]
}

export interface ZeroOrMorePathNode extends PathNodeBase {
  type: 'ZeroOrMore',
  path: PathNode
}

export interface OneOrMorePathNode extends PathNodeBase {
  type: 'OneOrMore',
  path: PathNode
}

export interface ZeroOrOnePathNode extends PathNodeBase {
  type: 'ZeroOrOne',
  path: PathNode
}

/**
 * Represents a component of a property path on a Property Shape. Properties are always represented as a IRI type node
 * with the different path types (Inverse, Sequence, Alternative, ZeroOrMore, OneOrMore, ZeroOrOne) combining the
 * properties in different ways.
 */
export type PathNode = 
  | IRIPathNode 
  | InversePathNode
  | SequencePathNode 
  | AlternativePathNode
  | ZeroOrMorePathNode
  | OneOrMorePathNode
  | ZeroOrOnePathNode;