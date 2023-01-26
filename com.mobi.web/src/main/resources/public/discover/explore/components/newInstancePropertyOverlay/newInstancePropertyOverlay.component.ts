/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { UtilService } from '../../../../shared/services/util.service';

import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { PropertyDetails } from '../../../models/propertyDetails.interface';
import { JSONLDObject } from '../../../../shared/models/JSONLDObject.interface';

/**
 * @class explore.NewInstancePropertyOverlayComponent
 *
 * A component that creates contents for a modal that adds a property to the provided instance from the provided list of
 * properties. The modal contains a dropdown list of the properties that is searchable. When submitted, the modal passes
 * back the IRI of the added property. Meant to be used in conjunction with the `MatDialog` service.
 *
 * @param {PropertyDetails[]} data.properties The list of properties to select from
 * @param {JSONLDObject} data.instance The instance to add the property to.
 */

@Component({
    selector: 'new-instance-property-overlay',
    templateUrl: './newInstancePropertyOverlay.component.html'
})
export class NewInstancePropertyOverlayComponent implements OnInit {
    searchText = '';
    selectedProperty: PropertyDetails = undefined;
    propertyControl = new FormControl();
    filteredProperties: Observable<PropertyDetails[]>;

    constructor(private dialogRef: MatDialogRef<NewInstancePropertyOverlayComponent>,
                @Inject(MAT_DIALOG_DATA) public data: {properties: PropertyDetails[], instance: JSONLDObject},
                private eu: ExploreUtilsService, public util: UtilService) {
    }

    ngOnInit(): void {
        this.filteredProperties = this.propertyControl.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | PropertyDetails>(''),
                map(val => {
                    if (!this.data.properties) {
                        return [];
                    }
                    const searchText = typeof val === 'string' ? val : val ? val.propertyIRI : '';
                    const list = this.eu.getNewProperties(this.data.properties, this.data.instance, searchText);
                    return list.slice(0, 101);
                })
            );
    }
    getDisplayText(value: PropertyDetails): string {
        return value ? value.propertyIRI : '';
    }
    selectProperty(event: MatAutocompleteSelectedEvent): void {
        if (event.option.value) {
            this.selectedProperty = event.option.value;
        }
    }
    submit(): void {
        this.data.instance[this.selectedProperty.propertyIRI] = [];
        this.dialogRef.close(this.selectedProperty);
    }
}
