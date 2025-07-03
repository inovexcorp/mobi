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
//Angular imports
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
// 3rd Party imports
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
//Mobi + Local imports
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SHACL } from '../../../prefixes';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

/**
 * @class shapes-graph-editor.NodeShapesDisplayComponent
 * @requires shared.ShapesGraphStateService
 * @requires shared.ShapesGraphManagerService
 * 
 * A component responsible for rendering the full detail view of a selected SHACL Node Shape.
 * 
 * @param {JSONLDObject} nodeShape - The JSON-LD representation of the selected SHACL Node Shape.
 * @param {string} selectedEntityIRI - The IRI of the selected SHACL Node Shape to display.
 * @param {boolean} canModify - Indicates whether the user has permission to modify the node shape.
 */
@Component({
  selector: 'app-node-shapes-display',
  templateUrl: './node-shapes-display.component.html',
})
export class NodeShapesDisplayComponent implements OnChanges, OnDestroy {
  @Input() nodeShape: JSONLDObject;
  @Input() selectedEntityIRI: string;
  @Input() canModify: boolean;

  nodeShapeProperties: string[] = [];
  propertyShapes: JSONLDObject[] = [];
  readOnly = true; // TODO Edit Node Shape IRI will modify this variable

  private readonly _protectedKeys = [
    '@id',
    '@type'
  ];
  // https://www.w3.org/TR/shacl/#core-components-logical
  private readonly _logicalConstraintPredicates = [
    `${SHACL}or`,   // Logical OR between multiple shapes 
    `${SHACL}and`,  // Logical AND between multiple shapes
    `${SHACL}not`,  // Logical NOT (negation of a shape)
    `${SHACL}xone`, // Exclusive OR: exactly one shape must match
  ];
  // https://www.w3.org/TR/shacl/#targets
  private readonly _targetPredicates = [
    `${SHACL}targetClass`, // Applies shape to all instances of a given class
    `${SHACL}targetNode`, // Applies to a specific node (IRI or blank node)
    `${SHACL}targetSubjectsOf`, // Applies to all subjects of a specific property
    `${SHACL}targetObjectsOf`, // Applies to all objects of a specific property
  ];
  private readonly _nestedPredicates = [
    `${SHACL}property`, // Declares Property shapes constraints on specific properties of the focus node
  ];
  private readonly excludedKeys = [
    ...this._protectedKeys,
    ...this._targetPredicates,
    ...this._nestedPredicates,
    ...this._logicalConstraintPredicates
  ]

  private _destroySub$ = new Subject<void>();

  constructor(
    public stateService: ShapesGraphStateService
  ) { }

  ngOnChanges(): void {
    this._setNodeShapeEntity();
  }

  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  private _setNodeShapeEntity() {
    if (!this.nodeShape) {
      return;
    }
    this.nodeShapeProperties = Object.keys(this.nodeShape).filter(key => !this.excludedKeys.includes(key));
    this.propertyShapes = this.stateService.listItem.selectedBlankNodes || [];
    this.stateService.listItem.nodeTab.selectedEntity = this.nodeShape;
  }
}