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
import { Component, ElementRef, Inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';

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
export class EditorRecordSelectComponent implements OnInit, OnChanges {
    @Input() recordIri: string;
    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('textInput') textInput: ElementRef;

    recordSearchControl: FormControl = new FormControl();
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    opened: RecordSelectFiltered[] = [];
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
    disabledFlag: boolean = false;
   
    constructor(private dialog: MatDialog, private state: ShapesGraphStateService,
                @Inject('catalogManagerService') private cm, private sm: ShapesGraphManagerService,
                @Inject('modalService') private modalService, @Inject('prefixes') private prefixes,
                @Inject('utilService') private util,
                @Inject('policyEnforcementService') private policyEnforcementService) {}

    ngOnInit(): void {
        this.retrieveShapesGraphRecords();
        this.setFilteredOptions();
        this.resetSearch();
        this.permissionCheck();
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes?.recordIri) {
            this.resetSearch();
        }
    }
    filter(val: string): OptionGroup[] {
        const filteredOpen = this.opened.filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
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
    selectRecord(event: MatAutocompleteSelectedEvent): Promise<any> {
        const record = event.option.value;
        return this.state.openShapesGraph(record)
            .then(() => {
                this.recordSearchControl.setValue(record.title);
                this.opened.push(record);
                remove(this.unopened, {recordId: record.recordId});
            }, this.util.createErrorToast);
    }
    close(): void {
        this.textInput.nativeElement.blur();
        this.resetSearch();
    }
    resetSearch(): void {
        if (this?.state?.listItem?.versionedRdfRecord?.title) {
            this.recordSearchControl.setValue(this.state.listItem.versionedRdfRecord.title);
        } else {
            this.recordSearchControl.setValue('');
        }
    }
    retrieveShapesGraphRecords(): void {
        this.cm.getRecords(get(this.cm.localCatalog, '@id'), this.shapesRecordSearchConfig, this.spinnerId)
            .then(response => {
                const openTmp: RecordSelectFiltered[] = [];
                const unopenedTmp: RecordSelectFiltered[] = [];
                forEach(response.data, (recordJsonld: JSONLDObject) => {
                    const listItem = this.state.list.find(item => item.versionedRdfRecord.recordId === recordJsonld['@id']);
                    if (listItem) {
                        openTmp.push(this.getRecordSelectFiltered(recordJsonld));
                    } else {
                        unopenedTmp.push(this.getRecordSelectFiltered(recordJsonld));
                    }
                });

                this.opened = openTmp;
                this.unopened = unopenedTmp;
                this.checkRecordDeleted();
                this.setFilteredOptions();
            }, errorMessage => this.util.createErrorToast(errorMessage));
    }
    closeShapesGraphRecord(recordIri: string): void {
        const closed = remove(this.opened, {recordId: recordIri})[0];
        this.unopened.push(<RecordSelectFiltered> closed);
        if (recordIri === this.recordIri) {
            this.state.listItem = new ShapesGraphListItem();
        }
        this.state.closeShapesGraph(recordIri);
        this.setFilteredOptions();
    }
    showDeleteConfirmationOverlay(record: RecordSelectFiltered, event: Event): void {
        this.autocompleteTrigger.closePanel();
        event.stopPropagation();
        this.modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + record.title + '</strong>?</p>', () => this.deleteShapesGraphRecord(record.recordId));
    }
    deleteShapesGraphRecord(recordIri: string): void {
        this.state.deleteShapesGraph(recordIri)
            .then(() => {
                this.util.createSuccessToast(recordIri + ' deleted successfully!');
            }, errorMessage => this.util.createErrorToast(errorMessage));
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
    private checkRecordDeleted() {
        if (this?.state?.listItem?.versionedRdfRecord.recordId) {
            const record = find([...this.opened, ...this.unopened], {recordId: this.state.listItem.versionedRdfRecord.recordId});
            if (!record) {
                this.util.createWarningToast('Previously opened ShapesGraphRecord ' + this.state.listItem.versionedRdfRecord.title + ' was removed.');
                this.state.closeShapesGraph(this.state.listItem.versionedRdfRecord.recordId);
                remove(this.opened, {recordId: this.state.listItem.versionedRdfRecord.recordId});
                this.state.listItem = new ShapesGraphListItem();
            }
            this.resetSearch();
        }
    }
    private permissionCheck(): void {
        const pepRequest = this.createPepRequest();
        this.policyEnforcementService.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== this.policyEnforcementService.deny;
                if (!canRead) {
                    this.disabledFlag = true;
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve shapes graph record creation permissions');
                this.disabledFlag = true;
            });
    }
    isDisabled() {
        return this.disabledFlag;
    }
    private createPepRequest() {
        return {
            resourceId: 'http://mobi.com/catalog-local',
            actionId: this.prefixes.policy + 'Create',
            actionAttrs: {
                         "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":"http://mobi.com/ontologies/shapes-graph-editor#ShapesGraphRecord"
            }
        }
    }
}
