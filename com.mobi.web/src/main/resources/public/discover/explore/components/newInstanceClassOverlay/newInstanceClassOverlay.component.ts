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
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { merge, head, filter, set } from 'lodash';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { v4 } from 'uuid';

import { SplitIRIPipe } from '../../../../shared/pipes/splitIRI.pipe';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { ExploreService } from '../../../services/explore.service';

/**
 * @class explore.component:newInstanceClassOverlay
 *
 * A component that creates contents for a modal that adds an instance of a class
 * selected from the provided list to the currently {@link shared.DiscoverStateService selected dataset}. The modal
 * contains a dropdown list of the classes that is searchable. For creation, an IRI is generated with a random UUID and
 * the new instance is added to the breadcrumbs to be edited.
 */
@Component({
    selector: 'new-instance-class-overlay',
    templateUrl: './newInstanceClassOverlay.component.html'
})
export class NewInstanceClassOverlayComponent implements OnInit {
    searchText = '';
    selectedClass: {id: string, title: string, deprecated: boolean} = undefined;
    classControl = new FormControl();
    filteredClasses: Observable<{id: string, title: string, deprecated: boolean}[]>;

    constructor(private dialogRef: MatDialogRef<NewInstanceClassOverlayComponent>,
        private state: DiscoverStateService, private es: ExploreService, 
        private splitIRI: SplitIRIPipe, @Inject('utilService') public util,
        @Inject(MAT_DIALOG_DATA) public data: {classes: {id: string, title: string, deprecated: boolean}[]}
    ) {}

    ngOnInit(): void {
        this.filteredClasses = this.classControl.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | {id: string, title: string, deprecated: boolean}>(''),
                map(val => {
                    if (!this.data.classes) {
                        return [];
                    }
                    const searchText = typeof val === 'string' ?
                        val :
                        val ?
                            val.id :
                            '';
                    const list = searchText ? filter(this.data.classes, clazz => {
                        const matchesId = clazz.id.toLowerCase().includes(searchText.toLowerCase());
                        const matchesTitle = clazz.title.toLowerCase().includes(searchText.toLowerCase());
                        return matchesId || matchesTitle;
                    }) : this.data.classes;
                    return list.slice(0, 101);
                })
            );
    }
    getDisplayText(value: {id: string, title: string, deprecated: boolean}): string {
        return value ? value.id : '';
    }
    selectClass(event: MatAutocompleteSelectedEvent): void {
        if (event.option.value) {
            this.selectedClass = event.option.value;
        }
    }
    submit(): void {
        this.es.getClassInstanceDetails(this.state.explore.recordId, this.selectedClass.id, {pageIndex: 0, limit: this.state.explore.instanceDetails.limit})
            .subscribe(response => {
                this.state.explore.creating = true;
                this.state.explore.classId = this.selectedClass.id;
                this.state.explore.classDeprecated = this.selectedClass.deprecated;
                this.state.resetPagedInstanceDetails();
                merge(this.state.explore.instanceDetails, this.es.createPagedResultsObject(response));
                let iri;
                if (this.state.explore.instanceDetails.data.length) {
                    const instanceDetails: InstanceDetails = head(this.state.explore.instanceDetails.data);
                    const split = this.splitIRI.transform(instanceDetails.instanceIRI);
                    iri = split.begin + split.then + v4();
                } else {
                    const split = this.splitIRI.transform(this.selectedClass.id);
                    iri = 'http://mobi.com/data/' + split.end.toLowerCase() + '/' + v4();
                }
                this.state.explore.instance.entity = [{
                    '@id': iri,
                    '@type': [this.selectedClass.id]
                }];
                set(this.state.explore.instance, 'metadata.instanceIRI', iri);
                this.state.explore.breadcrumbs.push(this.selectedClass.title);
                this.state.explore.breadcrumbs.push('New Instance');
                this.dialogRef.close();
            }, error => this.util.createErrorToast(error));
    }
}