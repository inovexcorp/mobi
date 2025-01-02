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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { isObject } from 'lodash';

//local
import { getBeautifulIRI } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';

/**
 * @class workflows.WorkflowPropertyOverlayComponent
 * 
 * A component that creates content for a modal to display all the properties on an entity in a Workflow. Displays the
 * type of the entity and each property on the entity with its values. Meant to be used in conjunction with the
 * `MatDialog` service.
 *
 * @implements {OnInit}
 */
@Component({
  selector: 'app-workflow-property-overlay-component',
  templateUrl: './workflow-property-overlay.component.html',
  styleUrls: ['./workflow-property-overlay.component.scss']
})
export class WorkflowPropertyOverlayComponent implements OnInit {
  displayData: { key: string, value: string[] }[] = []
  message = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { entityIRI: string, entity: JSONLDObject[] },
              public dialogRef: MatDialogRef<WorkflowPropertyOverlayComponent>) { }

  ngOnInit(): void {
    this.setDisplayValues();
  }

  /**
   * Sets the display values
   */
  setDisplayValues(): void | null {
    if (!this.data.entity) {
      this.message = 'No data to display.';
      return;
    }
    const mainEntity = this.data.entity.find(obj => obj['@id'] === this.data.entityIRI);
    if (!mainEntity) {
      this.message = 'No data to display.';
      return;
    }
    const keys = Object.keys(mainEntity);
    for (const key of keys) {
      if (key === '@id') {
        continue;
      }
      const propValues: (string|JSONLDId|JSONLDValue)[] = mainEntity[key];

      if (propValues) {
        const displayKey = getBeautifulIRI(key).replace('@','');
        const valueStrings: string[] = this.buildEntityValues(propValues);
        if (valueStrings) {
          this.displayData.push({ key: displayKey, value: valueStrings });
        }
      }
    }
  }
  /**
   * Builds an array of values from the given entity array based on the displayKey provided.
   *
   * @param {(string|JSONLDId|JSONLDValue)[]} entity - The entity array.
   * @return {string[]} - An array of values.
   */
  buildEntityValues(entity: (string|JSONLDId|JSONLDValue)[]): string[] {
    const values: string[] = [];
    for (const item of entity) {
      if (isObject(item)) {
        if (item['@value']) {
          values.push(item['@value']);
        } else {
          values.push(this._getObjectPropertyDisplay(item as JSONLDId));
        }
      } else {
        values.push(getBeautifulIRI(item));
      }
    }
    return this.filterEntityValues(values);
  }

  /**
   * Closes the current dialog.
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Filters out specific items from the given values.
   * @private
   *
   * @param {string[]} values Array of values to be filtered.
   * @return {string[]} Filtered values.
   */
  private filterEntityValues(values: string[]): string[] {
    return values.filter(item => item !== 'Action' && item !== 'Trigger' && item !== 'Event Trigger');
  }
  /**
   * Creates a display string for an object property value on the entity represented by the provided JSONLDId. If the
   * object with the IRI is found in the entity JSON-LD array, generates a display of the properties on that object.
   * @private
   * 
   * @param {JSONLDId} val The value of an object property on the entity
   * @returns {string} A string representation of the object property value
   */
  private _getObjectPropertyDisplay(val: JSONLDId): string {
    const associatedObject = this.data.entity.find(obj => obj['@id'] === val['@id']);
    if (associatedObject) {
      return Object.keys(associatedObject).filter(key => key !== '@id' && key !== '@type').map(key => {
        const prop = getBeautifulIRI(key);
        const values = associatedObject[key]
          .map(value => value['@id'] || value['@value'])
          .join(', ');
        return `${prop}: ${values}`;
      }).join(' | ');
    } else {
      return val['@id'];
    }
  }
}
