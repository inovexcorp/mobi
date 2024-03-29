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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { find, forEach, get, remove, isEmpty } from 'lodash';
import { Observable, from, of, throwError } from 'rxjs';
import { map, startWith, switchMap, catchError, finalize } from 'rxjs/operators';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { XACMLDecision } from '../../../shared/models/XACMLDecision.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RecordSelectFiltered } from '../../models/recordSelectFiltered.interface';
import { NewShapesGraphRecordModalComponent } from '../newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { DCTERMS, SHAPESGRAPHEDITOR, POLICY, RDF } from '../../../prefixes';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue } from '../../../shared/utility';
import { XACMLRequest } from '../../../shared/models/XACMLRequest.interface';

export interface OptionGroup {
    title: string,
    options: string[] | RecordSelectFiltered[]
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
    @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;
    @ViewChild('textInput', { static: true }) textInput: ElementRef;
    @ViewChild('editorRecordSelectSpinner', { static: true }) editorRecordSelectSpinner: ElementRef;

    recordSearchControl: UntypedFormControl = new UntypedFormControl();
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    opened: RecordSelectFiltered[] = [];
    unopened: RecordSelectFiltered[] = [];
    createGroup: OptionGroup = {
        title: '',
        options: ['Create Shapes Graph']
    };

    shapesRecordSearchConfig: PaginatedConfig = {
        sortOption: find(this.cm.sortOptions, {field: `${DCTERMS}title`, asc: true}),
        type: `${SHAPESGRAPHEDITOR}ShapesGraphRecord`
    };
    spinnerId = 'editor-record-select';

    filteredOptions: Observable<OptionGroup[]>
    disabledFlag = false;
   
    constructor(private dialog: MatDialog,
                private state: ShapesGraphStateService,
                private toast: ToastService,
                private spinnerSrv: ProgressSpinnerService,
                private cm: CatalogManagerService,
                private pm: PolicyManagerService,
                protected pep: PolicyEnforcementService) {}

    ngOnInit(): void {
        this.retrieveShapesGraphRecords();
        this.setFilteredOptions();
        this.resetSearch();
        this.permissionCheck();
    }
    ngOnChanges(changes: SimpleChanges): void {
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
    selectRecord(event: MatAutocompleteSelectedEvent): void {
        const record = event.option.value;
        this.state.openShapesGraph(record)
            .subscribe(() => {
                this.recordSearchControl.setValue(record.title);
                this.opened.push(record);
                remove(this.unopened, {recordId: record.recordId});
            }, error => this.toast.createErrorToast(error));
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
        this.spinnerSrv.startLoadingForComponent(this.editorRecordSelectSpinner, 15);
        this.cm.getRecords(get(this.cm.localCatalog, '@id'), this.shapesRecordSearchConfig, true)
            .pipe(
                switchMap((response: HttpResponse<JSONLDObject[]>) => {
                    const openTmp: RecordSelectFiltered[] = [];
                    const unopenedTmp: RecordSelectFiltered[] = [];
                    forEach(response.body, (recordJsonld: JSONLDObject) => {
                        const listItem = this.state.list.find(item => item.versionedRdfRecord.recordId === recordJsonld['@id']);
                        if (listItem) {
                            openTmp.push(this.getRecordSelectFiltered(recordJsonld));
                        } else {
                            unopenedTmp.push(this.getRecordSelectFiltered(recordJsonld));
                        }
                    });
                    
                    this.opened = openTmp;
                    this.unopened = unopenedTmp;
                    if (this.unopened.length !== 0) {
                        const deleteRequest: XACMLRequest = {
                            resourceId: this.unopened.map(record => record['recordId']),
                            actionId: [this.pm.actionDelete]
                        };
                        return from(this.pep.evaluateMultiDecisionRequest(deleteRequest, true));
                    } else {
                        return of(null);
                    }
                }),
                catchError(errorMessage => {
                    this.toast.createErrorToast(errorMessage);
                    return throwError(errorMessage);
                }),
                finalize(() => {
                    this.spinnerSrv.finishLoadingForComponent(this.editorRecordSelectSpinner);
                }))
            .subscribe((decisions: XACMLDecision[]) => {
                if (!isEmpty(decisions)) {
                    const recordsForbiddenToDelete = decisions.filter(decision => decision.decision === this.pep.deny).map(decision => decision['urn:oasis:names:tc:xacml:3.0:attribute-category:resource']);
                    this.unopened.filter(item => recordsForbiddenToDelete.includes(item.recordId)).map((canNotDelete: RecordSelectFiltered) => {
                        return canNotDelete.canNotDelete = true;
                    });
                }
                this.checkRecordDeleted();
                this.setFilteredOptions();
            });
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
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete <strong>${record.title}</strong>?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteShapesGraphRecord(record.recordId);
            }
        });
    }
    deleteShapesGraphRecord(recordIri: string): void {
        this.state.deleteShapesGraph(recordIri)
            .subscribe(() => {
                this.toast.createSuccessToast(`${recordIri} deleted successfully!`);
            }, errorMessage => this.toast.createErrorToast(errorMessage));
    }

    private getRecordSelectFiltered(record: JSONLDObject): RecordSelectFiltered {
        return {
            recordId: record['@id'],
            title: getDctermsValue(record, 'title'),
            description: getDctermsValue(record, 'description')
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
                this.toast.createWarningToast(`Previously opened ShapesGraphRecord ${this.state.listItem.versionedRdfRecord.title} was removed.`);
                this.state.closeShapesGraph(this.state.listItem.versionedRdfRecord.recordId);
                remove(this.opened, {recordId: this.state.listItem.versionedRdfRecord.recordId});
                this.state.listItem = new ShapesGraphListItem();
            }
            this.resetSearch();
        }
    }
    private permissionCheck(): void {
        const pepRequest = this.createPepRequest();
        this.spinnerSrv.startLoadingForComponent(this.editorRecordSelectSpinner, 15);
        this.pep.evaluateRequest(pepRequest, true).pipe(finalize(() => {
            this.spinnerSrv.finishLoadingForComponent(this.editorRecordSelectSpinner);
        }))
            .subscribe(response => {
                const canRead = response !== this.pep.deny;
                if (!canRead) {
                    this.disabledFlag = true;
                }
            }, () => {
                this.toast.createWarningToast('Could not retrieve shapes graph record creation permissions');
                this.disabledFlag = true;
            });
    }
    isDisabled(): boolean {
        return this.disabledFlag;
    }
    private createPepRequest() {
        return {
            resourceId: this.catalogId,
            actionId: `${POLICY}Create`,
            actionAttrs: {
                [`${RDF}type`]: `${SHAPESGRAPHEDITOR}ShapesGraphRecord`
            }
        };
    }
}
