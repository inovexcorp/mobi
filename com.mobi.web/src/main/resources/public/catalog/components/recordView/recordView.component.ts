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
import { Component, OnInit } from '@angular/core';
import { find } from 'lodash';

import { CATALOG, POLICY } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../shared/services/util.service';

import './recordView.component.scss';

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
    templateUrl: './recordView.component.html'
})
export class RecordViewComponent implements OnInit {
    record: JSONLDObject = undefined;
    completeRecord: JSONLDObject[] = undefined;
    title = '';
    description = '';
    modified = '';
    issued = '';
    canEdit = false;

    constructor(public state: CatalogStateService, public cm: CatalogManagerService, public os: OntologyStateService, 
        public pep: PolicyEnforcementService, public util: UtilService) {}

    ngOnInit(): void {
        this.cm.getRecord(this.state.selectedRecord['@id'], this.util.getPropertyId(this.state.selectedRecord, CATALOG + 'catalog'))
            .subscribe((response: JSONLDObject[]) => {
                this.setInfo(response);
                this.setCanEdit();
            }, (errorMessage) => {
                this.util.createErrorToast(errorMessage);
                this.state.selectedRecord = undefined;
            });
    }
    goBack(): void {
        this.state.selectedRecord = undefined;
    }
    updateRecord(newRecord: JSONLDObject): void {
        const indexToUpdate = this.completeRecord.findIndex(oldRecord => oldRecord['@id'] === newRecord['@id']);
        if (indexToUpdate !== -1) {
            this.completeRecord[indexToUpdate] = newRecord;
        } else {
            this.util.createErrorToast('Could not find record: ' + newRecord['@id']);
        }
        
        this.cm.updateRecord(newRecord['@id'], this.util.getPropertyId(newRecord, CATALOG + 'catalog'), this.completeRecord)
            .subscribe((response: JSONLDObject[]) => {
                this.setInfo(response);
                this.util.createSuccessToast('Successfully updated the record');
                this.state.selectedRecord = newRecord;
            }, errorMessage => {
                this.util.createErrorToast(errorMessage);
            });
    }
    updateTitle(newTitle: string): void {
        const openRecord = find(this.os.list, item => item.versionedRdfRecord.title === this.title);
        if (openRecord) {
            openRecord.versionedRdfRecord.title = newTitle;
        }
        this.util.updateDctermsValue(this.record, 'title', newTitle);
        this.updateRecord(this.record);
    }
    updateDescription(newDescription: string): void {
        this.util.updateDctermsValue(this.record, 'description', newDescription.trim());
        this.updateRecord(this.record);
    }
    setCanEdit(): void {
        const request = {
            resourceId: this.record['@id'],
            actionId: POLICY + 'Update'
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                this.canEdit = response !== this.pep.deny;
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
                this.canEdit = false;
            });
    }
    updatePermission(value:boolean):void {
        this.state.editPermissionSelectedRecord = value;
    }
    setInfo(record: JSONLDObject[]): void {
        this.completeRecord = record;
        const matchingRecord = find(record, ['@id', this.state.selectedRecord['@id']]);
        this.record = matchingRecord;
        this.title = this.util.getDctermsValue(this.record, 'title');
        this.description = this.util.getDctermsValue(this.record, 'description');
        this.modified = this.util.getDate(this.util.getDctermsValue(this.record, 'modified'), 'short');
        this.issued = this.util.getDate(this.util.getDctermsValue(this.record, 'issued'), 'short');
    }

}
