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
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import './classBlockHeader.component.scss';
import { Component, Inject } from '@angular/core';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { NewInstanceClassOverlayComponent } from '../newInstanceClassOverlay/newInstanceClassOverlay.component';
import { MatDialog } from '@angular/material/dialog';
import policyEnforcementService from '../../../../shared/services/policyEnforcement.service';
import prefixes from '../../../../shared/services/prefixes.service';

/**
 * @ngdoc component
 * @name explore.component:classBlockHeader
 * @requires shared.service:discoverStateService
 * @requires discover.service:exploreService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:utilService
 * @requires shared.service:modalService
 * @requires shared.service:prefixes
 * @requires shared.service:policyEnforcementService
 *
 * @description
 * `classBlockHeader` is a component that creates a {@link discover.component:datasetSelect} to select a dataset to explore.
 * It also provides buttons to refresh the view of the dataset and to create an instance.
 */

@Component({
    selector: 'class-block-header',
    templateUrl: './classBlockHeader.component.html'
})
export class ClassBlockHeaderComponent {
    constructor(private es: ExploreService, @Inject('utilService') private util,
                @Inject('policyEnforcementService') private pep, public ds: DiscoverStateService,
                private eu: ExploreUtilsService, @Inject('prefixes') private prefixes, private dialog: MatDialog) {}

    showCreate(): void {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: this.prefixes.catalog + 'Modify'
        };
        this.pep.evaluateRequest(pepRequest)
            .then(response => {
                const canEdit = response !== this.pep.deny;
                if (canEdit) {
                    this.eu.getClasses(this.ds.explore.recordId)
                        .subscribe(classes => {
                            this.dialog.open(NewInstanceClassOverlayComponent, {
                                data: {
                                    content: classes
                                }});
                        }, this.util.createErrorToast);
                } else {
                    this.util.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    onSelect(value): void {
        this.ds.explore.recordId = value;
        if (this.ds.explore.recordId !== '') {
            this.refresh();
        }
    }
    refresh(): void {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: this.prefixes.policy + 'Read'
        };
        this.pep.evaluateRequest(pepRequest)
            .then(response => {
                const canRead = response !== this.pep.deny;
                if (canRead) {
                    this.ds.explore.hasPermissionError = false;
                    this.es.getClassDetails(this.ds.explore.recordId)
                        .subscribe(details => {
                            this.ds.explore.classDetails = details;
                        }, errorMessage => {
                            this.ds.explore.classDetails = [];
                            this.util.createErrorToast(errorMessage);
                        });
                } else {
                    this.util.createErrorToast('You don\'t have permission to read dataset');
                    this.ds.explore.recordId = '';
                    this.ds.explore.breadcrumbs = ['Classes'];
                    this.ds.explore.hasPermissionError = true;
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
}