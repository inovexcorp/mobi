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
//Angular imports
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
//Mobi + Local imports
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { EXPLICIT_TARGETS } from '../../models/constants';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertyShape } from '../../models/property-shape.interface';
import { SH } from '../../../prefixes';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class NodeShapesDisplayComponent
 * @requires ShapesGraphStateService
 * 
 * A component responsible for rendering the full detail view of a selected SHACL Node Shape.
 * 
 * @param {JSONLDObject} nodeShape The JSON-LD representation of the selected SHACL Node Shape.
 * @param {string} selectedEntityIRI The IRI of the selected SHACL Node Shape to display.
 * @param {boolean} canModify Indicates whether the user has permission to modify the node shape.
 */
@Component({
  selector: 'app-node-shapes-display',
  templateUrl: './node-shapes-display.component.html'
})
export class NodeShapesDisplayComponent implements OnChanges {
  @Input() nodeShape: JSONLDObject;
  @Input() selectedEntityIRI: string;
  @Input() canModify: boolean;

  nodeShapeProperties: string[] = [];
  predicateWarningText: string;

  private readonly _protectedKeys = [
    '@id',
    '@type'
  ];
  // https://www.w3.org/TR/shacl/#core-components-logical
  private readonly _logicalConstraintPredicates = [
    `${SH}or`,   // Logical OR between multiple shapes 
    `${SH}and`,  // Logical AND between multiple shapes
    `${SH}not`,  // Logical NOT (negation of a shape)
    `${SH}xone`, // Exclusive OR: exactly one shape must match
  ];
  private readonly _nestedPredicates = [
    `${SH}property`, // Declares Property shapes constraints on specific properties of the focus node
  ];
  private readonly _excludedKeys = [
    ...this._protectedKeys, // Keys handled by selected-details
    ...EXPLICIT_TARGETS, // Keys handled by app-shacl-target
    ...this._nestedPredicates,
    ...this._logicalConstraintPredicates
  ];

  private _propertyShapes: PropertyShape[] = [];

  constructor(
    public stateService: ShapesGraphStateService,
    private _dialog: MatDialog,
    private _toast: ToastService
  ) { }

  ngOnChanges(): void {
    this._setNodeShapeEntity();
    this.stateService.checkForExcludedPredicates(this.nodeShape['@id']).subscribe(results => {
      if (parseInt(results) > 0) {
        this.predicateWarningText = '<p>Unsupported SHACL predicates present within the graph for this node shape. ' +
          'Please see <a href="https://inovexcorp.github.io/mobi-docs/latest/index.html#shapes-editor-guide" ' +
          'target="_blank">docs</a> for more details.</p>';
      } else {
        this.predicateWarningText = undefined;
      }
    });
  }

  /**
   * Receives the {@link PropertyShape} list from the inner {@link PropertyShapesDisplayComponent}. The variable is
   * chiefly used for deleting the Node Shape.
   * 
   * @param {PropertyShape[]} value The latest list of Property Shapes for this selected Node Shape
   */
  setPropertyShapes(value: PropertyShape[]): void {
    this._propertyShapes = value;
  }

  /**
   * Opens a {@link ConfirmModalComponent} asking the user to confirm whether to delete the selected Node Shape. If
   * confirmed, calls the appropriate {@link ShapesGraphStateService} method and displays an error toast if it failed.
   */
  showDeleteConfirmation(): void {
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to delete <strong>${this.nodeShape['@id']}</strong>?</p>`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.stateService.removeNodeShape(this.nodeShape, this._propertyShapes).subscribe({
          error: error => {
            this._toast.createErrorToast(`Error deleting node shape: ${error}`);
          }
        });
      }
    });
  }

  private _setNodeShapeEntity(): void {
    if (!this.nodeShape) {
      return;
    }
    this.nodeShapeProperties = Object.keys(this.nodeShape).filter(key => !this._excludedKeys.includes(key));
  }
}
