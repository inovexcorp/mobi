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
import { Component, Input } from '@angular/core';
import { isEmpty, find, includes, get } from 'lodash';

import { CATALOG, DCTERMS, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDate, getDctermsValue, getPropertyId } from '../../../shared/utility';

interface BranchDisplay {
    branch: JSONLDObject,
    title: string,
    description: string,
    date: string,
    head: string
}

/**
 * @class catalog.BranchList
 *
 * A component which creates a list of expansion panels for all the Branches in the provided catalog Record. If the
 * provided Record is not a VersionedRDFRecord, no branches will be shown. The panel for each Branch shows the title,
 * description, and {@link shared.CommitHistoryTableComponent}. Only one panel can be open at a time.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 */
@Component({
    selector: 'branch-list',
    templateUrl: './branchList.component.html',
    styleUrls: ['./branchList.component.scss']
})
export class BranchListComponent {
    totalSize = 0;
    branches: BranchDisplay[] = [];
    catalogId = '';
    increment = 10;
    limit = this.increment;

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        if (this._record && !isEmpty(this._record)) {
            this.catalogId = getPropertyId(this._record, `${CATALOG}catalog`);
            this.setBranches();
        }
    }

    get record(): JSONLDObject {
        return this._record;
    }
    constructor(public cm: CatalogManagerService, public om: OntologyManagerService, private toast: ToastService) {}

    loadMore(): void {
        this.limit += this.increment;
        this.setBranches();
    }
    setBranches(): void {
        if (this.cm.isVersionedRDFRecord(this.record)) {
            const paginatedConfig: PaginatedConfig = {
                pageIndex: 0,
                limit: this.limit,
                sortOption: find(this.cm.sortOptions, {field: `${DCTERMS}modified`, asc: false})
            };
            this.cm.getRecordBranches(this.record['@id'], this.catalogId, paginatedConfig)
                .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                    this.branches = response.body
                      .filter(branch => !this.cm.isUserBranch(branch))
                      .map(branch => ({
                        branch,
                        title: getDctermsValue(branch, 'title'),
                        description: getDctermsValue(branch, 'description'),
                        date: getDate(getDctermsValue(branch, 'modified'), 'short'),
                        head: getPropertyId(branch, `${CATALOG}head`)
                      }));
                    this.totalSize = Number(response.headers.get('x-total-count')) || 
                      0 - (response.body.length - this.branches.length);
                }, error => this.toast.createErrorToast(error));
        }
    }
}
