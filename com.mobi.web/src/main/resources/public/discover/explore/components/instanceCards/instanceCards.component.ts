/*-
* #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { initial, chunk, orderBy, has, forEach, last } from 'lodash';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import {Datasource, IDatasource} from 'ngx-ui-scroll';

import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { POLICY } from '../../../../prefixes';
import { ConfirmModalComponent } from '../../../../shared/components/confirmModal/confirmModal.component';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { ClassDetails } from '../../../models/classDetails.interface';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../../shared/services/util.service';

import './instanceCards.component.scss';

/**
 * @class explore.InstanceCardsComponent
 *
 * A component that creates a div which contains a 3 column grid used to display the instance details for a class
 * associated with a dataset record.
 *
 * @param {InstanceDetails[]} instanceData the details about the instances to be present as cards
 */

@Component({
    selector: 'instance-cards',
    templateUrl: './instanceCards.component.html'
})
export class InstanceCardsComponent implements OnInit, OnChanges {
    classTitle = '';
    chunks: InstanceDetails[][] = [];
    datasource: IDatasource = new Datasource({
        get: (index, count, success) => {
            // Index seems to start at 1 instead of 0
            const data = this.chunks.slice(index - 1, (index - 1) + count);
            success(data);
        }
    });

    @Input() instanceData: InstanceDetails[];

    constructor(private ds: DiscoverStateService, private es: ExploreService, private eu: ExploreUtilsService,
                private dialog: MatDialog, private util: UtilService, private pep: PolicyEnforcementService) {
    }

    ngOnInit(): void {
        this.classTitle = last(this.ds.explore.breadcrumbs);
        this.chunks = this.getChunks(this.instanceData);
    }
    ngOnChanges(): void {
        this.chunks = this.getChunks(this.instanceData);
        const index = this.datasource.adapter.firstVisible.$index ? this.datasource.adapter.firstVisible.$index : this.datasource.adapter.lastVisible.$index
        this.datasource.adapter.reload(index);
    }
    view(item: InstanceDetails): void {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: POLICY + 'Read'
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canRead = response && (response!== this.pep.deny);
                if (canRead) {
                    this.es.getInstance(this.ds.explore.recordId, item.instanceIRI)
                        .pipe(switchMap(response => {
                            this.ds.explore.instance.entity = response;
                            this.ds.explore.instance.metadata = item;
                            this.ds.explore.breadcrumbs.push(item.title);
                            this.ds.explore.hasPermissionError = false;
                            return this.eu.getReferencedTitles(item.instanceIRI, this.ds.explore.recordId);
                        }))
                        .subscribe(response => {
                            this.ds.explore.instance.objectMap = {};
                            if (has(response, 'results')) {
                                forEach(response.results.bindings, binding => this.ds.explore.instance.objectMap[binding.object.value] = binding.title.value);
                            }
                        }, error => this.util.createErrorToast(error));
                } else {
                    this.util.createErrorToast('You don\'t have permission to read dataset');
                    this.ds.explore.breadcrumbs = initial(this.ds.explore.breadcrumbs);
                    this.ds.resetPagedInstanceDetails();
                    this.ds.explore.hasPermissionError = true;
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    delete(item: InstanceDetails): void {
        this.es.deleteInstance(this.ds.explore.recordId, item.instanceIRI)
            .pipe(switchMap(() => {
                this.util.createSuccessToast('Instance was successfully deleted.');
                this.ds.explore.instanceDetails.total--;
                if (this.ds.explore.instanceDetails.total === 0) {
                    return this.es.getClassDetails(this.ds.explore.recordId);
                }
                if (this.ds.explore.instanceDetails.data.length === 1) {
                    this.ds.explore.instanceDetails.currentPage--;
                }
                return this.es.getClassInstanceDetails(this.ds.explore.recordId, this.ds.explore.classId, {pageIndex: this.ds.explore.instanceDetails.currentPage, limit: this.ds.explore.instanceDetails.limit});
            }))
            .subscribe((details: HttpResponse<InstanceDetails[]> | ClassDetails[]) => {
                if (this.ds.explore.instanceDetails.total === 0) {
                    this.ds.explore.classDetails = details as ClassDetails[];
                    this.ds.clickCrumb(0);
                } else {
                    const resultsObject = this.es.createPagedResultsObject(details as HttpResponse<InstanceDetails[]>);
                    this.ds.explore.instanceDetails.data = resultsObject.data;
                }
            }, this.util.createErrorToast);
    }
    confirmDelete(item: InstanceDetails): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: 'Are you sure you want to delete <strong>' + item.title + '</strong>?'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.delete(item);
            }
        });
    }
    getChunks(data: InstanceDetails[]): InstanceDetails[][] {
        return chunk(orderBy(data, ['title']), 3);
    }
}
