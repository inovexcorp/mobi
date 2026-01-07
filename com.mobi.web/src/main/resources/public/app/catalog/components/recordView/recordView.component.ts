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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { find } from 'lodash';
import { Subject } from 'rxjs';

import { CATALOG, POLICY } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { getDate, getDctermsValue, getPropertyId, updateDctermsValue } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { Statistic } from '../../../shared/models/statistic.interface';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class catalog.RecordViewComponent
 *
 * A component which creates a div with a Bootstrap `row` containing columns displaying different
 * information about the currently {@link shared.CatalogStateService selected catalog Record}. The
 * first column just contains a button to go back to the {@link catalog.CatalogPageComponent}. The second column
 * contains a display of the Record's title, description, and {@link catalog.RecordIconComponent icon} along with a
 * {@link catalog.RecordViewTabset}. The third column contains the Record's
 * {@link catalog.EntityPublisher publisher}, modified date, issued date, and
 * {@link catalog.CatalogRecordKeywords keywords}. On initialization of the component, it will re-retrieve
 * the Record to ensure that it still exists.
 */
@Component({
    selector: 'record-view',
    templateUrl: './recordView.component.html',
    styleUrls: ['./recordView.component.scss']
})
export class RecordViewComponent implements OnInit, OnDestroy {
    record: JSONLDObject = undefined;
    completeRecord: JSONLDObject[] = undefined;
    title = '';
    description = '';
    modified = '';
    issued = '';
    canEdit = false;
    statistics: Statistic[] = [];
    private _destroySub$ = new Subject<void>();

    constructor(public state: CatalogStateService, public cm: CatalogManagerService, public os: OntologyStateService, 
        public pep: PolicyEnforcementService, private toast: ToastService) {}

    ngOnInit(): void {
        const selectedRecordId = this.state.selectedRecord['@id'];
        const catalogId = getPropertyId(this.state.selectedRecord, `${CATALOG}catalog`);
        this.cm.getRecord(selectedRecordId, catalogId)
            .subscribe((response: JSONLDObject[]) => {
                this.setInfo(response);
                this.setCanEdit();
            }, (errorMessage) => {
                this.toast.createErrorToast(errorMessage);
                this.state.selectedRecord = undefined;
            });
        this.cm.getRecordStatistics(selectedRecordId, catalogId)
            .subscribe((statistics: Statistic[]) => {
                if (statistics) {
                    statistics.forEach(metric => {
                        metric.name = this._convertToTitleCase(metric.name);
                    })
                    this.statistics = statistics;
                }
            });
    }
    ngOnDestroy(): void {
        this._destroySub$.next();
        this._destroySub$.complete();
    }
    goBack(): void {
        this.state.selectedRecord = undefined;
    }
    updateRecord(newRecord: JSONLDObject): void {
        const indexToUpdate = this.completeRecord.findIndex(oldRecord => oldRecord['@id'] === newRecord['@id']);
        if (indexToUpdate !== -1) {
            this.completeRecord[indexToUpdate] = newRecord;
        } else {
            this.toast.createErrorToast('Could not find record: ' + newRecord['@id']);
        }
        this.cm.updateRecord(newRecord['@id'], getPropertyId(this.state.selectedRecord, `${CATALOG}catalog`), this.completeRecord)
            .subscribe((response: JSONLDObject[]) => {
                this.setInfo(response);
                this.toast.createSuccessToast('Successfully updated the record');
                this.state.selectedRecord = newRecord;
            }, errorMessage => {
                this.toast.createErrorToast(errorMessage);
            });
    }
    updateTitle(newTitle: string): void {
        const openRecord = find(this.os.list, item => item.versionedRdfRecord.title === this.title);
        if (openRecord) {
            openRecord.versionedRdfRecord.title = newTitle;
        }
        updateDctermsValue(this.record, 'title', newTitle);
        this.updateRecord(this.record);
    }
    updateDescription(newDescription: string): void {
        updateDctermsValue(this.record, 'description', newDescription.trim());
        this.updateRecord(this.record);
    }
    setCanEdit(): void {
        const request = {
            resourceId: this.record['@id'],
            actionId: `${POLICY}Update`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                this.canEdit = response !== this.pep.deny;
            }, () => {
                this.toast.createWarningToast('Could not retrieve record permissions');
                this.canEdit = false;
            });
    }
    updatePermission(value: boolean):void {
        this.state.editPermissionSelectedRecord = value;
    }
    setInfo(record: JSONLDObject[]): void {
        this.completeRecord = record;
        const matchingRecord = find(record, ['@id', this.state.selectedRecord['@id']]);
        this.record = matchingRecord;
        this.title = getDctermsValue(this.record, 'title');
        this.description = getDctermsValue(this.record, 'description');
        this.modified = getDate(getDctermsValue(this.record, 'modified'), 'short');
        this.issued = getDate(getDctermsValue(this.record, 'issued'), 'short');
    }
    private _convertToTitleCase(str: string): string {
        return str.replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^./, str => str.toUpperCase());
    }
}
