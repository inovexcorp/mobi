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
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import {initial, merge, head, last, set} from 'lodash';
import { v4 } from 'uuid';

import { CATALOG, POLICY } from '../../../../prefixes';
import { splitIRI } from '../../../../shared/pipes/splitIRI.pipe';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ExploreService } from '../../../services/explore.service';

/**
 * @class explore.InstancesDisplayComponent
 *
 * Creates a list of the instances associated with the selected class. Has a bread crumb trail to get back to early
 * pages and pagination controls at the bottom of the page.
 */
@Component({
    selector: 'instances-display',
    templateUrl: './instancesDisplay.component.html',
    styleUrls: ['./instancesDisplay.component.scss']
})
export class InstancesDisplayComponent implements OnInit {
    className = '';

    constructor(public state: DiscoverStateService, private es: ExploreService, private pep: PolicyEnforcementService, 
        private toast: ToastService) {}
    
    ngOnInit(): void {
        this.className = last(this.state.explore.breadcrumbs);
    }
    setPage(pageEvent: PageEvent): void {
        const pepRequest = {
            resourceId: this.state.explore.recordId,
            actionId: `${POLICY}Read`
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canRead = response !== this.pep.deny;
                if (canRead) {
                    this.state.explore.instanceDetails.currentPage = pageEvent.pageIndex;
                    const pagingObj = {
                        limit: this.state.explore.instanceDetails.limit,
                        offset: (this.state.explore.instanceDetails.currentPage) * this.state.explore.instanceDetails.limit
                    };
                    this.es.getClassInstanceDetails(this.state.explore.recordId, this.state.explore.classId, pagingObj)
                        .subscribe(response => {
                            this.state.explore.hasPermissionError = false;
                            this.state.explore.instanceDetails.data = [];
                            merge(this.state.explore.instanceDetails, this.es.createPagedResultsObject(response));
                        }, error => this.toast.createErrorToast(error)); 
                } else {
                    this.toast.createErrorToast('You don\'t have permission to read dataset');
                    this.state.explore.instanceDetails.data = [];
                    this.state.explore.breadcrumbs = initial(this.state.explore.breadcrumbs);
                    this.state.explore.hasPermissionError = true;
                }
            }, () => {
                this.toast.createWarningToast('Could not retrieve record permissions');
            });
    }
    create(): void {
        const pepRequest = {
            resourceId: this.state.explore.recordId,
            actionId: `${CATALOG}Modify`
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canModify = response !== this.pep.deny;
                if (canModify) {
                    this.state.explore.creating = true;
                    const details = head(this.state.explore.instanceDetails.data);
                    const split = splitIRI(details.instanceIRI);
                    const iri = split.begin + split.then + v4();
                    this.state.explore.instance.entity = [{
                        '@id': iri,
                        '@type': [this.state.explore.classId]
                    }];
                    set(this.state.explore.instance, 'metadata.instanceIRI', iri);
                    this.state.explore.breadcrumbs.push('New Instance');
                } else {
                    this.toast.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                this.toast.createWarningToast('Could not retrieve record permissions');
            });
    }
}
