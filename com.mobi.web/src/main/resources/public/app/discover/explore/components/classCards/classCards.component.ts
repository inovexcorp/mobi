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
import { Component, Input, OnChanges } from '@angular/core';
import { merge, chunk, orderBy } from 'lodash';
import { Datasource, IDatasource } from 'ngx-ui-scroll';

import { POLICY } from '../../../../prefixes';
import { ExploreService } from '../../../services/explore.service';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ClassDetails } from '../../../models/classDetails.interface';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../../shared/services/util.service';

/**
 * @class explore.ClassCardsComponent
 *
 * A component that creates a div which contains a 3 column grid used to display the class details associated with a
 * dataset record.
 *
 * @param {ClassDetails[]} classDetails the details about the classes to be presented as cards
 */
@Component({
    selector: 'class-cards',
    templateUrl: './classCards.component.html',
    styleUrls: ['./classCards.component.scss']
})
export class ClassCardsComponent implements OnChanges {
    @Input() classDetails: ClassDetails[];

    chunks: ClassDetails[][] = [];
    datasource: IDatasource = new Datasource({
        get: (index, count, success) => {
            // Index seems to start at 1 instead of 0
            const data = this.chunks.slice(index - 1, (index - 1) + count);
            success(data);
        }
    });

    constructor(private state: DiscoverStateService, private es: ExploreService, private pep: PolicyEnforcementService,
        private util: UtilService) {}

    ngOnChanges(): void {
        this.chunks = this._getChunks(this.classDetails);
        const index = this.datasource.adapter.firstVisible.$index ? this.datasource.adapter.firstVisible.$index : this.datasource.adapter.lastVisible.$index;
        this.datasource.adapter.reload(index);
    }
    exploreData(item: ClassDetails): void {
        const pepRequest = {
            resourceId: this.state.explore.recordId,
            actionId: POLICY + 'Read'
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canRead = response !== this.pep.deny;
                if (canRead) {
                    this.es.getClassInstanceDetails(this.state.explore.recordId, item.classIRI, {pageIndex: 0, limit: this.state.explore.instanceDetails.limit})
                        .subscribe(response => {
                            this.state.explore.classId = item.classIRI;
                            this.state.explore.classDeprecated = item.deprecated;
                            this.state.resetPagedInstanceDetails();
                            merge(this.state.explore.instanceDetails, this.es.createPagedResultsObject(response));
                            this.state.explore.breadcrumbs.push(item.classTitle);
                        }, error => this.util.createErrorToast(error));
                } else {
                    this.util.createErrorToast('You don\'t have permission to read dataset');
                    this.state.resetPagedInstanceDetails();
                    this.state.explore.classDetails = [];
                    this.state.explore.hasPermissionError = true;
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }

    private _getChunks(data: ClassDetails[]): ClassDetails[][] {
        return chunk(orderBy(data, ['instancesCount', 'classTitle'], ['desc', 'asc']), 3);
    }
}
