/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { isArray, isObject } from 'lodash';

//local
import { getBeautifulIRI } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

/**
 * @class WorkflowPropertyOverlayComponent
 * 
 * A component that creates content for a modal to display the properties of an entity within a Workflow. Displays the
 * type of the entity and each property on the entity with its values. Meant to be used in conjunction with the
 * `MatDialog` service.
 * @implements OnInit
 */
@Component({
  selector: 'app-workflow-property-overlay-component',
  templateUrl: './workflow-property-overlay.component.html',
  styleUrls: ['./workflow-property-overlay.component.scss']
})
export class WorkflowPropertyOverlayComponent implements OnInit {
  displayData: { key: string, value: any[] }[] = []
  message = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { entity: JSONLDObject },
              public dialogRef: MatDialogRef<WorkflowPropertyOverlayComponent>) { }

  ngOnInit(): void {
    this.setEntityValues();
  }

  /**
   * Retrieves the values
   */
  setEntityValues(): void | null {
    if (!this.data) {
      this.message = 'No data to display.';
      return;
    }
    const keys = Object.keys(this.data);
    for (const key of keys) {
      if (key === '@id') {
        continue;
      }
      const entity = this.data[key];

      if (entity) {
        const displayKey = getBeautifulIRI(key).replace('@','');
        let values: string[];
        if (isArray(entity)) {
          values = this.buildEntityValues(entity);
        } else {
          values = [entity];
        }
        if (values) {
          this.displayData.push({ key: displayKey, value: values });
        }
      }
    }
  }
  /**
   * Builds an array of values from the given entity array based on the displayKey provided.
   *
   * @param {any[]} entity - The entity array.
   * @return {any[]} - An array of values.
   */
  buildEntityValues(entity: JSONLDObject[] | string[]): string[] {
    let values: string[] = [];
    for (const item of entity) {
      if (isObject(item)) {
        values = this.getValueFromEntityObject(item);
      } else {
        values.push((getBeautifulIRI(item)));
      }
    }
    return this.filterEntityValues(values);
  }

  /**
   * closes the current dialog.
   *
   * @return {void}
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Process an item if it is of type object.
   *
   * @param item An object type entity item.
   * @return Array of processed values.
   */
  private getValueFromEntityObject(item: JSONLDObject): string[] {
    let objectValues: string[] = [];

    Object.keys(item).forEach(key => {
      objectValues = [item[key]];
    });
    return objectValues;
  }

  /**
   * Filters out specific items from the given values.
   *
   * @param values Array of values to be filtered.
   * @return Filtered values.
   */
  private filterEntityValues(values: string[]): string[] {
    return values.filter(item => item !== 'Action' && item !== 'Trigger' && item !== 'Event Trigger');
  }
}
