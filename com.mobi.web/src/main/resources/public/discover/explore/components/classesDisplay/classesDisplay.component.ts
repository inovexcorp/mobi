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

import { Component } from '@angular/core';
import {FormBuilder, FormControl} from '@angular/forms';
import { MatDialog } from '@angular/material';

import { CATALOG, POLICY } from '../../../../prefixes';
import { DatasetManagerService } from '../../../../shared/services/datasetManager.service';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../../shared/services/util.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { NewInstanceClassOverlayComponent } from '../newInstanceClassOverlay/newInstanceClassOverlay.component';

import './classesDisplay.component.scss';

/**
 * @class explore.ClassesDisplayComponent
 *
 * A component that provides a form with a {@link shared.DatasetSelectComponent}, a button to create a new instance in
 * the selected dataset, and a {@link explore.ClassCardsComponent} to display the class details associated
 * with a selected dataset.
 */
@Component({
    selector: 'classes-display',
    templateUrl: './classesDisplay.component.html'
})
export class ClassesDisplayComponent {
    datasetSearchForm = this.fb.group({
        datasetSelect: new FormControl(),
        formName: 'classesDisplay'
    });

    constructor(private fb: FormBuilder, public state: DiscoverStateService, public dm: DatasetManagerService,
        private eu: ExploreUtilsService, private es: ExploreService, private matDialog: MatDialog,
        private pep: PolicyEnforcementService, private util: UtilService) {}

    showCreate(): void {
        const pepRequest = {
            resourceId: this.state.explore.recordId,
            actionId: CATALOG + 'Modify'
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canEdit = response !== this.pep.deny;
                if (canEdit) {
                    this.eu.getClasses(this.state.explore.recordId)
                        .subscribe(classes => {
                            this.matDialog.open(NewInstanceClassOverlayComponent, {
                                data: {
                                    classes
                                }
                            });
                        }, error => this.util.createErrorToast(error));
                } else {
                    this.util.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    onSelect(recordObject): void {
        this.state.explore.recordId = recordObject.recordId;
        this.state.explore.recordTitle = recordObject.recordTitle;
        this.refresh();
    }
    refresh(): void {
        const pepRequest = {
            resourceId: this.state.explore.recordId,
            actionId: POLICY + 'Read'
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canRead = response !== this.pep.deny;
                if (canRead) {
                    this.state.explore.hasPermissionError = false;
                    this.es.getClassDetails(this.state.explore.recordId)
                        .subscribe(details => {
                            this.state.explore.classDetails = details;
                        }, errorMessage => {
                            this.state.explore.classDetails = [];
                            this.util.createErrorToast(errorMessage);
                        });
                } else {
                    this.util.createErrorToast('You don\'t have permission to read dataset');
                    this.state.explore.recordId = '';
                    this.state.explore.breadcrumbs = ['Classes'];
                    this.state.explore.hasPermissionError = true;
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
}
