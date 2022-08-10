/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PropertyDetails } from "../../../models/propertyDetails.interface";

/**
 * @ngdoc component
 * @name explore.component:newInstancePropertyOverlay
 * @requires shared.service:utilService
 * @requires explore.service:exploreUtilsService
 *
 * @description
 * `newInstancePropertyOverlay` is a component that creates contents for a modal that adds a property to the
 * provided instance from the provided list of properties. The modal contains a dropdown list of the properties
 * that is searchable. When submitted, the modal passes back the IRI of the added property. Meant to be used in
 * conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 * @param {Object} resolve An object with data provided to the modal
 * @param {Object[]} resolve.properties The list of properties to select from
 * @param {Object} resolve.instance The instance to add the property to.
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
                @Inject(MAT_DIALOG_DATA) public data,
                private eu: ExploreUtilsService, @Inject('utilService') private util) {
    }

    ngOnInit() {
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
    submit = function() {
        this.data.instance[this.selectedProperty.propertyIRI] = [];
        this.dialogRef.close(this.selectedProperty);
    }
}

export default NewInstancePropertyOverlayComponent;
