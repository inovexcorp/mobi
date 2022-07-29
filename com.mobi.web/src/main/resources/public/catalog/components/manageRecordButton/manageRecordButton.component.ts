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

import { Component, Inject, Input, OnChanges, OnInit, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';

/**
 * @ngdoc component
 * @name catalog.component:manageRecordButton
 * @requires shared.service:policyEnforcementService
 * @requires shared.service:policyManagerService
 *
 * @description
 * `manageRecordButton` is a component which creates an Open Record button that will open the provided record in the
 * appropriate module.
 * 
 * @param {Object} record The record to open
 * @param {string} flat Whether the button should be flat. The presence of the attribute is enough to set it
 * @param {string} stopProp Whether propagation should be stopped on click event. The presence of the attribute is enough to set it
 */

@Component({
    selector: 'manage-record-button',
    templateUrl: './manageRecordButton.component.html'
})

export class ManageRecordButtonComponent implements OnInit, OnChanges {
    @Input() record = undefined;
    @Input() flat = false;
    @Input() stopPropagation = false;
    @Output() manageEvent = new EventEmitter<any>();
   
    recordType = '';
    isFlat = false;
    showButton = false;

    constructor(public pm: PolicyManagerService, @Inject('policyEnforcementService') public pe) {}

    ngOnInit():void {
        this.update();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.update();
    }

    public manageRecord(event):void {
        if (this.stopPropagation) {
            event.stopPropagation();
        }
        this.trigerManageEvent();
    }

    private trigerManageEvent(): void {
        this.manageEvent.emit(true);
    }

    private update():void {
        this.stopPropagation = this.stopPropagation !== undefined;
        this.isFlat = this.flat !== undefined;
        if (this.record !== undefined){
            const managePermissionRequest = {
                resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(this.record['@id']),
                actionId: this.pm.actionUpdate
            }

            this.pe.evaluateRequest(managePermissionRequest).then(decision => {
                this.showButton = decision === this.pe.permit;
            }, () => { 
                this.showButton = false;
            });
        } else {
            this.showButton = false;
        }
    }
}