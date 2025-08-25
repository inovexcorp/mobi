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
import { getPropertyId, getPropertyIds, getPropertyValue } from '../../shared/utility';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import {
  TARGET_NODE,
  TARGET_CLASS,
  TARGET_OBJECTS_OF,
  TARGET_SUBJECTS_OF,
  IMPLICIT_REFERENCE,
  IMPLICIT_TYPES
} from './constants';

export interface BaseTargetTypeData {
  multiSelect: boolean;
  targetType: string;
}

export interface MultiTargetTypeData extends BaseTargetTypeData {
  multiSelect: true;
  values: string[];
}

export interface SingleTargetTypeData extends BaseTargetTypeData {
  multiSelect: false;
  value: string;
}
/**
 * Represents a SHACL target type mapping, such as sh:targetNode or sh:targetClass,
 * along with its corresponding IRI or literal value.
 */
export type TargetTypeData = MultiTargetTypeData | SingleTargetTypeData;

/**
 * Represents a strategy for targeting nodes in a SHACL NodeShape.
 * Each strategy corresponds to a SHACL core target predicate.
 *
 * getTargetValue returns the target value for the given node shape.
 * - string: for single-value input fields
 * - string[]: for multi-value chip lists
 */
type SingleTargetPayload = { value: string };
type MultiTargetPayload = { values: string[] };

interface SingleTargetStrategy {
  targetIri: string;
  multiSelect: false;
  getTargetValue: (nodeShape: JSONLDObject) => SingleTargetPayload;
}

interface MultiTargetStrategy {
  targetIri: string;
  multiSelect: true;
  getTargetValue: (nodeShape: JSONLDObject) => MultiTargetPayload;
}

type TargetStrategy = SingleTargetStrategy | MultiTargetStrategy;

/**
 * @class ShaclTargetDetector
 *
 * @description
 * A utility class responsible for inspecting a JSON-LD node representation of a SHACL Shape
 * and determining which SHACL target is being used (sh:targetClass, sh:targetNode).
 *
 * It operates by checking for a special-cased implicit target (rdfs:Class or owl:Class)
 * and then iterating through a list of predefined target strategies to find a match.
 */
export class ShaclTargetDetector {
  readonly targetStrategies: TargetStrategy[] = [
    {
      targetIri: TARGET_NODE,
      multiSelect: false,
      getTargetValue: (nodeShape: JSONLDObject): SingleTargetPayload => ({
        value:
          getPropertyId(nodeShape, TARGET_NODE) || getPropertyValue(nodeShape, TARGET_NODE) || ''
      })
    },
    {
      targetIri: TARGET_CLASS,
      multiSelect: false,
      getTargetValue: (nodeShape: JSONLDObject): SingleTargetPayload => ({
        value: getPropertyId(nodeShape, TARGET_CLASS) || ''
      })
    },
    {
      targetIri: TARGET_OBJECTS_OF,
      multiSelect: true,
      getTargetValue: (nodeShape: JSONLDObject): MultiTargetPayload => ({
        values: this._getMultiTargetValues(nodeShape, TARGET_OBJECTS_OF)
      })
    },
    {
      targetIri: TARGET_SUBJECTS_OF,
      multiSelect: true,
      getTargetValue: (nodeShape: JSONLDObject): MultiTargetPayload => ({
        values: this._getMultiTargetValues(nodeShape, TARGET_SUBJECTS_OF)
      })
    },
    {
      targetIri: IMPLICIT_REFERENCE,
      multiSelect: false,
      getTargetValue: (nodeShape: JSONLDObject): SingleTargetPayload => ({
        value: nodeShape['@id'] || ''
      })
    }
  ];

  private _getMultiTargetValues(nodeShape: JSONLDObject, key: string): string[] {
    const propertyOptions: string[] = [];
    if (nodeShape[key] === null) {
      return propertyOptions;
    }
    const propertyIds = getPropertyIds(nodeShape, key);
    if (propertyIds) {
      propertyIds.forEach((iri) => propertyOptions.push(iri));
    }
    return propertyOptions;
  }

  /**
   * Detects the SHACL target type and its corresponding value from a given JSON-LD node.
   *
   * @param {JSONLDObject} nodeShape The JSON-LD node object representing the SHACL Shape.
   * @returns {TargetTypeData | null} The detected TargetTypeData object, or null if no target is found.
   */
  public detect(nodeShape: JSONLDObject): TargetTypeData | null {
    const nodeShapeTypes = nodeShape['@type'] || [];
    const isImplicitReference = IMPLICIT_TYPES.some((implicitType) =>
      nodeShapeTypes.includes(implicitType)
    );
    if (isImplicitReference) {
      return {
        multiSelect: false,
        targetType: IMPLICIT_REFERENCE,
        value: nodeShape['@id'] || ''
      };
    }
    for (const strategy of this.targetStrategies) {
      if (strategy.targetIri in nodeShape) {
        const targetPayload = strategy.getTargetValue(nodeShape);
        if (strategy.multiSelect) {
          return {
            multiSelect: true,
            targetType: strategy.targetIri,
            values: (targetPayload as MultiTargetPayload).values
          } as MultiTargetTypeData;
        } else {
          return {
            multiSelect: false,
            targetType: strategy.targetIri,
            value: (targetPayload as SingleTargetPayload).value
          } as SingleTargetTypeData;
        }
      }
    }
    return null; // Return null if no target was found
  }
}
