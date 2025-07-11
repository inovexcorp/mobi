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
import { Component, Input, OnChanges } from '@angular/core';

import { Constraint } from '../../models/constraint.interface';
import { EntityNames } from '../../../shared/models/entityNames.interface';
import { isBlankNodeId, getPropertyId, rdfListToValueArrayWithMap, getBeautifulIRI } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PathNode, PropertyShape } from '../../models/property-shape.interface';
import { RDF, SH } from '../../../prefixes';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

export interface ResolvedPath {
  asString: string;
  asHtmlString: string;
  asStructure: PathNode;
}

/**
 * @class shapes-graph-editor.NodeShapesDisplayComponent
 * @requires shared.ShapesGraphStateService
 * 
 * A component that displays a list of all the Property Shapes attached to the provided Node Shape, represented as a
 * {@link JSONLDObject}. Handles parsing through the sh:path of each property shape recursively and representing all
 * constraints set on each property shape.
 * 
 * @param {JSONLDObject} nodeShape - The JSON-LD representation of the selected SHACL Node Shape.
 */
@Component({
  selector: 'app-property-shapes-display',
  templateUrl: './property-shapes-display.component.html',
  styleUrls: ['./property-shapes-display.component.scss']
})
export class PropertyShapesDisplayComponent implements OnChanges {
  // See specification for description of constraints: https://www.w3.org/TR/shacl/#core-components
  private readonly _supportedConstraints = [
    `${SH}class`,
    `${SH}datatype`,
    `${SH}nodeKind`,
    `${SH}minCount`,
    `${SH}maxCount`,
    `${SH}minExclusive`,
    `${SH}minInclusive`,
    `${SH}maxExclusive`,
    `${SH}maxInclusive`,
    `${SH}minLength`,
    `${SH}maxLength`,
    `${SH}pattern`,
    `${SH}flags`,
    `${SH}languageIn`,
    `${SH}uniqueLang`,
    `${SH}equals`,
    `${SH}disjoint`,
    `${SH}lessThan`,
    `${SH}lessThanOrEquals`,
    `${SH}hasValue`,
    `${SH}in`
  ];

  propertyShapes: PropertyShape[] = [];

  @Input() nodeShape: JSONLDObject;
  
  constructor(private _sgs: ShapesGraphStateService) {}

  ngOnChanges(): void {
    if (this.nodeShape) {
      this.setPropertyShapes(this.nodeShape, this._sgs.listItem.selectedBlankNodes, this._sgs.listItem.entityInfo);
    }
  }

  /**
   * Set the array of PropertyShapes for the given NodeShape. Uses the provided JSON-LD array to resolve paths and
   * constraints and the provided EntityNames to generate labels for referenced entities.
   * 
   * @param {JSONLDObject} nodeShape The JSON-LD of the NodeShape to process.
   * @param {JSONLDObject[]} jsonld An array of JSON-LD objects referenced transitively by the NodeShape.
   *    This is used to resolve paths and constraints.
   * @param {EntityNames} entityNames A lookup map of entity IRIs to their names.
   */
  setPropertyShapes(nodeShape: JSONLDObject, jsonld: JSONLDObject[], entityNames: EntityNames): void {
    // Create a map of JSON-LD objects by their @id for quick access
    const jsonldMap: Record<string, JSONLDObject> = {};
    jsonld.forEach((item) => {
      if (item['@id']) {
        jsonldMap[item['@id']] = item;
      }
    });
    // Start processing only the property shapes referenced by sh:property (not by things like sh:not)
    const propertyShapeIds: string[] = nodeShape[`${SH}property`]?.map(prop => prop['@id']) || [];
    const propertyShapes: PropertyShape[] = [];
    for (const propertyShapeId of propertyShapeIds) {
      const propertyShape = jsonldMap[propertyShapeId];
      // Don't create a PropertyShape if the property shape is not defined in the JSON-LD map
      if (!propertyShape) {
        continue; // Skip if no property shape is defined
      }
      
      const propertyShapeObj: PropertyShape = {
        id: propertyShapeId,
        label: this._getLabel(propertyShapeId, entityNames),
        jsonld: propertyShape,
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: ''
      };

      // Handle Path
      const path = getPropertyId(propertyShape, `${SH}path`);
      if (!path) {
        continue; // Skip if no path is defined
      }
      const resolvedPath = this.resolvePath(path, jsonldMap, entityNames);
      if (!resolvedPath) {
        continue; // Skip if path resolution failed
      }
      propertyShapeObj.pathString = resolvedPath.asString;
      propertyShapeObj.pathHtmlString = resolvedPath.asHtmlString;
      propertyShapeObj.path = resolvedPath.asStructure;

      // Handle Constraints
      this.setConstraints(propertyShapeObj, jsonldMap, entityNames);
      
      // Add Property Shape
      propertyShapes.push(propertyShapeObj);
    }
    this.propertyShapes = propertyShapes.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * A recursive function that resolves a path from a given IRI in the JSON-LD map. The starting IRI is generally the
   * value of a sh:property on a NodeShape. Uses a depth-first search approach to resolve paths, handling
   * inverse paths, alternatives, sequences, and cardinality characteristics (zeroOrMore, oneOrMore, zeroOrOne). Keeps
   * track of visited IRIs to avoid cycles. Uses the provided EntityNames to generate labels for IRIs. The ResolvedPath
   * contains both a string representation of the path and a structured representation that can be used for
   * post-processing.
   *
   * @param {string} iri The IRI to resolve, which can be an entity IRI or a blank node ID.
   * @param {Record<string, JSONLDObject>} jsonldMap A look up map of JSON-LD objects by their @id.
   * @param {EntityNames} entityNames A lookup map of entity IRIs to their names.
   * @param {Set<string>} visited A set of visited IRIs to avoid cycles in the path resolution.
   * @returns {ResolvedPath} An object containing the resolved path as a string and as a structured representation.
   */
  resolvePath(iri: string, jsonldMap: Record<string, JSONLDObject>, entityNames: EntityNames, 
    visited = new Set<string>()): ResolvedPath {
    if (visited.has(iri)) {
      return; // Avoid cycles
    }
    visited.add(iri);
    if (isBlankNodeId(iri)) {
      const node = jsonldMap[iri];
      if (!node) {
        return; // Node not found in JSON-LD
      }
      if (node[`${SH}inversePath`]) {
        const inner = this.resolvePath(getPropertyId(node, `${SH}inversePath`), jsonldMap, entityNames, visited);
        if (!inner) {
          return;
        }
        return {
          asString: '^' + this._parenthesize(inner.asString),
          asHtmlString: '^' + this._parenthesize(inner.asHtmlString),
          asStructure: { type: 'Inverse', path: inner.asStructure }
        };
      }
      if (node[`${SH}alternativePath`]) {
        const items = rdfListToValueArrayWithMap(jsonldMap, getPropertyId(node, `${SH}alternativePath`))
          .map((item: string) => this.resolvePath(item, jsonldMap, entityNames, visited))
          .filter(item => !!item);
        if (items.length === 0) {
          return;
        }
        return {
          asString: items.map(i => i.asString).join(' | '),
          asHtmlString: items.map(i => i.asHtmlString).join(' | '),
          asStructure: { type: 'Alternative', items: items.map(i => i.asStructure) }
        };
      }
      if (node[`${SH}zeroOrMorePath`]) {
        const inner = this.resolvePath(getPropertyId(node, `${SH}zeroOrMorePath`), jsonldMap, entityNames, visited);
        if (!inner) {
          return;
        }
        return {
          asString: this._parenthesize(inner.asString) + '*',
          asHtmlString: this._parenthesize(inner.asHtmlString) + '*',
          asStructure: { type: 'ZeroOrMore', path: inner.asStructure }
        };
      }
      if (node[`${SH}oneOrMorePath`]) {
        const inner = this.resolvePath(getPropertyId(node, `${SH}oneOrMorePath`), jsonldMap, entityNames, visited);
        if (!inner) {
          return;
        }
        return {
          asString: this._parenthesize(inner.asString) + '+',
          asHtmlString: this._parenthesize(inner.asHtmlString) + '+',
          asStructure: { type: 'OneOrMore', path: inner.asStructure }
        };
      }
      if (node[`${SH}zeroOrOnePath`]) {
        const inner = this.resolvePath(getPropertyId(node, `${SH}zeroOrOnePath`), jsonldMap, entityNames, visited);
        if (!inner) {
          return;
        }
        return {
          asString: this._parenthesize(inner.asString) + '?',
          asHtmlString: this._parenthesize(inner.asHtmlString) + '?',
          asStructure: { type: 'ZeroOrOne', path: inner.asStructure }
        };
      }
      const items = rdfListToValueArrayWithMap(jsonldMap, iri)
        .map((item: string) => this.resolvePath(item, jsonldMap, entityNames, visited))
        .filter(item => !!item);
      if (items.length === 0) {
        return;
      }
      return {
        asString: items.map(i => i.asString).join(' / '),
        asHtmlString: items.map(i => i.asHtmlString).join(' / '),
        asStructure: { type: 'Sequence', items: items.map(i => i.asStructure) }
      };
    } else {
      const propLabel = this._getLabel(iri, entityNames);
      return {
        asString: propLabel,
        asHtmlString: `<span title="${iri}">${propLabel}</span>`,
        asStructure: { type: 'IRI', iri, label: propLabel }
      };
    }
  }

  /**
   * Wraps a string in parentheses if it is longer than one character. This is used to format paths in a more readable
   * way, especially for complex paths that involve sequences or alternatives.
   * 
   * @param {string} s The string to be parenthesized.
   * @returns {string} The parenthesized string if its length is greater than 1, otherwise returns the original string.
   */
  private _parenthesize(s: string): string {
    return s.length > 1 ? `( ${s} )` : s;
  }

  /**
   * Sets the constraints for a given PropertyShape based on its JSON-LD representation. It filters the JSON-LD
   * properties to include only those that are supported constraints, and then maps each constraint to a Constraint object with its label and values.
   * 
   * @param {PropertyShape} propertyShape The PropertyShape object to set constraints for.
   * @param {Record<string, JSONLDObject>} jsonldMap A lookup map of JSON-LD objects by their @id,
   *    used to resolve values for constraints.
   * @param {EntityNames} entityNames A lookup map of entity IRIs to their names, used to generate labels for values.
   */
  setConstraints(propertyShape: PropertyShape, jsonldMap: Record<string, JSONLDObject>, entityNames: EntityNames): void {
    Object.keys(propertyShape.jsonld).filter(key => this._supportedConstraints.includes(key)).forEach(key => {
      const constraint: Constraint = {
        constraintProp: key,
        constraintLabel: getBeautifulIRI(key),
        value: []
      };
      propertyShape.jsonld[key].forEach(value => {
        if (value['@value']) {
          constraint.value.push({ chosenValue: value['@value'], label: value['@value'] });
        } else if (value['@id']) {
          if (isBlankNodeId(value['@id'])) {
            const valuesAreIris = !!getPropertyId(jsonldMap[value['@id']], `${RDF}first`);
            constraint.value = constraint.value.concat(rdfListToValueArrayWithMap(jsonldMap, value['@id'])
              .map(val => ({ 
                chosenValue: val, 
                label: valuesAreIris ? this._getLabel(val, entityNames) : val
              })));
          } else {
            constraint.value.push({ chosenValue: value['@id'], label: this._getLabel(value['@id'], entityNames) });
          }
        }
      });
      propertyShape.constraints.push(constraint);
    });
  }

  /**
   * Returns the label of a given ID based on the provided entity names. If the ID is a blank node ID, it returns the
   * ID itself. If the ID is found in the entity names, it returns the label of that entity. If the ID is not found,
   * it returns a "beautiful" representation of the IRI.
   * 
   * @param {string} id The ID to get the label for.
   * @param {EntityNames} entityNames A lookup map of entity IRIs to their names.
   * @returns {string} The label of the ID, or a "beautiful" representation of the IRI if not found.
   */
  private _getLabel(id: string, entityNames: EntityNames): string {
    if (isBlankNodeId(id)) {
      return id;
    }
    const entity = entityNames[id];
    if (entity) {
      return entity.label || getBeautifulIRI(id);
    }
    return getBeautifulIRI(id);
  }
}
