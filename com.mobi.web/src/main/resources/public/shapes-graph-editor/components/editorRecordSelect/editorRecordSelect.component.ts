/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatDialog } from '@angular/material';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { find, forEach, get, remove } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RecordSelectFiltered } from '../../models/recordSelectFiltered.interface';

import { NewShapesGraphRecordModalComponent } from '../newShapesGraphRecordModal/newShapesGraphRecordModal.component';

interface OptionGroup {
    title: string,
    options: string[] | RecordSelectFiltered[]
}

interface SearchConfig {
    sortOption: string,
    recordType: string
}

/**
 * @class shapes-graph-editor.EditorRecordSelectComponent
 *
 * `editor-record-select` is a component which creates a `mat-autocomplete` with options to change which record is open,
 * create a record, close records, and search record.
 */
@Component({
    selector: 'editor-record-select',
    templateUrl: './editorRecordSelect.component.html'
})
export class EditorRecordSelectComponent implements OnInit {
    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;

    recordSearchControl: FormControl = new FormControl();

    unopened: RecordSelectFiltered[] = [];
    createGroup: OptionGroup = {
        title: '',
        options: ['Create Shapes Graph']
    };

    shapesRecordSearchConfig: SearchConfig = {
        sortOption: find(this.cm.sortOptions, {field: this.prefixes.dcterms + 'title', asc: true}),
        recordType: this.prefixes.shapesGraphEditor + 'ShapesGraphRecord'
    };
    spinnerId = 'editor-record-select';

    filteredOptions: Observable<OptionGroup[]>
   
    constructor(private dialog: MatDialog, private state: ShapesGraphStateService, @Inject('catalogManagerService') private cm,
                @Inject('prefixes') private prefixes, @Inject('utilService') private util) {}

    ngOnInit(): void {
        this.setFilteredOptions();
        this.resetSearch();
    }

    filter(val: string): OptionGroup[] {
        const filteredOpen = this.state.openRecords.filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
        const filteredUnopen = this.unopened.filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
        return [
            { title: 'Open', options: filteredOpen },
            { title: 'Unopened', options: filteredUnopen }
        ];
    }

    createShapesGraph(event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        this.dialog.open(NewShapesGraphRecordModalComponent);
    }

    selectRecord(event: MatAutocompleteSelectedEvent): void {
        this.state.currentShapesGraphRecordIri = event.option.value.recordId;
        this.recordSearchControl.setValue(event.option.value.title);
        this.state.currentShapesGraphRecordTitle = event.option.value.title;
        if (!find(this.state.openRecords, {recordId: event.option.value.recordId})) {
            this.state.openRecords.push(event.option.value);
        }
        remove(this.unopened, {recordId: event.option.value.recordId});
    }

    resetSearch(): void {
        this.recordSearchControl.setValue(this.state.currentShapesGraphRecordTitle);
    }

    retrieveShapesGraphRecords(): void {
        this.cm.getRecords(get(this.cm.localCatalog, '@id'), this.shapesRecordSearchConfig, this.spinnerId)
            .then(response => {
                const openTmp: RecordSelectFiltered[] = [];
                const unopenedTmp: RecordSelectFiltered[] = [];
                forEach(response.data, (recordJsonld: JSONLDObject) => {
                    if (find(this.state.openRecords, ['recordId', recordJsonld['@id']])) {
                        openTmp.push(this.getRecordSelectFiltered(recordJsonld));
                    } else {
                        unopenedTmp.push(this.getRecordSelectFiltered(recordJsonld));
                    }
                });

                // TODO: test when delete functionality is added
                this.state.openRecords.forEach(value => {
                    if (find(openTmp, ['recordId', value.recordId]) === undefined) {
                        this.util.createWarningToast('Previously opened ShapesGraphRecord ' + value.title + ' was removed.');
                    }
                });

                this.state.openRecords = openTmp;
                this.unopened = unopenedTmp;
                this.setFilteredOptions();
            }, errorMessage => this.util.createErrorToast(errorMessage));
    }

    closeShapesGraphRecord(recordIri: string): void {
        const closed = remove(this.state.openRecords, {recordId: recordIri})[0];
        this.unopened.push(<RecordSelectFiltered> closed);
        if (recordIri === this.state.currentShapesGraphRecordIri) {
            this.state.currentShapesGraphRecordIri = '';
            this.state.currentShapesGraphRecordTitle = '';
        }
        this.setFilteredOptions();
    }

    private getRecordSelectFiltered(record: JSONLDObject): RecordSelectFiltered {
        return {
            recordId: record['@id'],
            title: this.util.getDctermsValue(record, 'title'),
            description: this.util.getDctermsValue(record, 'description')
        };
    }

    protected setFilteredOptions(): void {
        this.filteredOptions = this.recordSearchControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filter(val))
            );
    }
}
