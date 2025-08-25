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
import { MatDialog } from '@angular/material/dialog';

import { AddPropertyShapeModalComponent } from '../add-property-shape-modal/add-property-shape-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Constraint } from '../../models/constraint.interface';
import { EntityNames } from '../../../shared/models/entityNames.interface';
import { isBlankNodeId, getPropertyId, rdfListToValueArrayWithMap, getBeautifulIRI, deskolemizeIRI, getPropertyValue } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PathNode, PropertyShape } from '../../models/property-shape.interface';
import { RDF, SH } from '../../../prefixes';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';

export interface ResolvedPath {
  asString: string;
  asHtmlString: string;
  asStructure: PathNode;
  referencedIds: Set<string> // All the referenced blank node ids from the path
}

/**
 * @class NodeShapesDisplayComponent
 * @requires ShapesGraphStateService
 * @requires ToastService
 * @requires MatDialog
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
  @Input() canModify: boolean;
  @Input() isImported: boolean;
  
  constructor(private _sgs: ShapesGraphStateService, private _dialog: MatDialog, private _toast: ToastService) {}

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
    jsonld.forEach((item: JSONLDObject) => {
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
        message: getPropertyValue(propertyShape, `${SH}message`),
        jsonld: propertyShape,
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: '',
        referencedNodeIds: undefined
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
      propertyShapeObj.referencedNodeIds = resolvedPath.referencedIds;

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
          asStructure: { type: 'Inverse', path: inner.asStructure },
          referencedIds: inner.referencedIds.add(iri)
        };
      }
      if (node[`${SH}alternativePath`]) {
        const startingId = getPropertyId(node, `${SH}alternativePath`);
        const bnodeIds = [];
        const items = rdfListToValueArrayWithMap(jsonldMap, startingId, [], '', bnodeIds)
          .map((item: string) => this.resolvePath(item, jsonldMap, entityNames, visited))
          .filter(item => !!item);
        if (items.length === 0) {
          return;
        }
        const refIdSets = items.map(i => i.referencedIds).concat([new Set<string>(bnodeIds)]);
        return {
          asString: items.map(i => i.asString).join(' | '),
          asHtmlString: items.map(i => i.asHtmlString).join(' | '),
          asStructure: { type: 'Alternative', items: items.map(i => i.asStructure) },
          referencedIds: this._mergeSetsWithReduce(refIdSets).add(iri)
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
          asStructure: { type: 'ZeroOrMore', path: inner.asStructure },
          referencedIds: inner.referencedIds.add(iri)
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
          asStructure: { type: 'OneOrMore', path: inner.asStructure },
          referencedIds: inner.referencedIds.add(iri)
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
          asStructure: { type: 'ZeroOrOne', path: inner.asStructure },
          referencedIds: inner.referencedIds.add(iri)
        };
      }
      // Fallback to a SHACL property path sequence
      const bnodeIds = [];
      const items = rdfListToValueArrayWithMap(jsonldMap, iri, [], '', bnodeIds)
        .map((item: string) => this.resolvePath(item, jsonldMap, entityNames, visited))
        .filter(item => !!item);
      if (items.length === 0) {
        return;
      }
      const refIdSets = items.map(i => i.referencedIds).concat([new Set<string>(bnodeIds)]);
      return {
        asString: items.map(i => i.asString).join(' / '),
        asHtmlString: items.map(i => i.asHtmlString).join(' / '),
        asStructure: { type: 'Sequence', items: items.map(i => i.asStructure) },
        referencedIds: this._mergeSetsWithReduce(refIdSets).add(iri)
      };
    } else {
      const propLabel = this._getLabel(iri, entityNames);
      return {
        asString: propLabel,
        asHtmlString: `<span title="${iri}">${propLabel}</span>`,
        asStructure: { type: 'IRI', iri, label: propLabel },
        referencedIds: new Set<string>()
      };
    }
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
            // If the values are IRIs, we need to fetch the entity name
            const valuesAreIris = !!getPropertyId(jsonldMap[value['@id']], `${RDF}first`);
            const bnodeIds = [];
            const constraintValues = rdfListToValueArrayWithMap(jsonldMap, value['@id'], [], '', bnodeIds)
              .map(val => ({ 
                chosenValue: val, 
                label: valuesAreIris ? this._getLabel(val, entityNames) : val
              }));
            // Include all blank nodes in the Property Shape's referencedNodeIds list
            propertyShape.referencedNodeIds = new Set([...propertyShape.referencedNodeIds, ...bnodeIds]);
            // Include all constraint values from the rdf:List
            constraint.value = constraint.value.concat(constraintValues);
          } else {
            constraint.value.push({ chosenValue: value['@id'], label: this._getLabel(value['@id'], entityNames) });
          }
        }
      });
      propertyShape.constraints.push(constraint);
    });
  }

  /**
   * Opens the AddPropertyShapeModal to add a new Property Shape to the current Node Shape. If the modal returns a new
   * PropertyShape, adds to the list and sorts.
   */
  openAddOverlay(): void {
    this._dialog.open(AddPropertyShapeModalComponent).afterClosed().subscribe((result: PropertyShape) => {
      if (result) {
        this.propertyShapes.push(result);
        this.propertyShapes.sort((a, b) => a.id.localeCompare(b.id));
      }
    });
  }

  /**
   * Opens a confirmation modal to delete the provided PropertyShape.
   * 
   * @param {PropertyShape} propertyShape The Property Shape to remove from the Node Shape
   */
  confirmPropertyShapeDeletion(propertyShape: PropertyShape): void {
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to delete <strong>${propertyShape.label}</strong> with path <strong>${propertyShape.pathString}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.deletePropertyShape(propertyShape);
      }
    });
  }

  /**
   * Calls the state service method to delete the provided PropertyShape. If successful, removes the PropertyShape from
   * the component's `propertyShapes` list. Otherwise throws an error toast.
   * 
   * @param {PropertyShape} propertyShape The Property Shape to remove from the selected Node Shape
   */
  deletePropertyShape(propertyShape: PropertyShape): void {
    this._sgs.removePropertyShape(propertyShape).subscribe(() => {
      const idx = this.propertyShapes.findIndex(ps => ps.id === propertyShape.id);
      if (idx >= 0) {
        this.propertyShapes.splice(idx, 1);
      }
    }, (error: string) => {
      this._toast.createErrorToast(`Property Shape unable to be deleted: ${error}`);
    });
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
      return deskolemizeIRI(id);
    }
    const entity = entityNames[id];
    if (entity) {
      return entity.label || getBeautifulIRI(id);
    }
    return getBeautifulIRI(id);
  }

  /**
   * Merges an array of Sets into a single set, making sure there are no duplicates.
   * 
   * @param {Set<T>[]} sets An array of Sets to merge together
   * @returns {Set<T>} A single Set of the merged values
   */
  private _mergeSetsWithReduce<T>(sets: Set<T>[]): Set<T> {
    return sets.reduce((accumulator, currentSet) => {
      return new Set([...accumulator, ...currentSet]); // Combines the accumulator and currentSet using the spread operator into a new Set in each iteration
    }, new Set<T>()); // Starts with an empty set as the initial accumulator
  }
}
