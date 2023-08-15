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
import { HttpResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { isEmpty, find, filter, includes, get } from 'lodash';

import { CATALOG, DCTERMS, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { UtilService } from '../../../shared/services/util.service';

/**
 * @class catalog.BranchList
 *
 * A component which creates a list of expansion panels for all the Branches in the provided catalog Record. If the
 * provided Record is not a VersionedRDFRecord, no branches will be shown. The panel for each Branch shows the title,
 * description, and {@link shared.component:commitHistoryTable}. Only one panel can be open at a time.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 */
@Component({
    selector: 'branch-list',
    templateUrl: './branchList.component.html',
    styleUrls: ['./branchList.component.scss']
})
export class BranchListComponent {
    catalogPrefix = CATALOG;
    totalSize = 0;
    branches: JSONLDObject[] = [];
    catalogId = '';
    increment = 10;
    limit = this.increment;
    recordId: string|undefined = undefined;

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        if (this._record && !isEmpty(this._record)) {
            this.catalogId = this.util.getPropertyId(this._record, CATALOG + 'catalog');
            this.setBranches();
        }
    }

    get record(): JSONLDObject {
        return this._record;
    }
    constructor(public cm: CatalogManagerService, public om: OntologyManagerService, public util: UtilService) {}

    loadMore(): void {
        this.limit += this.increment;
        this.setBranches();
    }
    setBranches(): void {
        this.recordId = this.isOntOrShapes() ? this.record['@id'] : undefined;
        if (this.cm.isVersionedRDFRecord(this.record)) {
            const paginatedConfig: PaginatedConfig = {
                pageIndex: 0,
                limit: this.limit,
                sortOption: find(this.cm.sortOptions, {field: DCTERMS + 'modified', asc: false})
            };
            this.cm.getRecordBranches(this.record['@id'], this.catalogId, paginatedConfig)
                .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                    this.branches = filter(response.body, branch => !this.cm.isUserBranch(branch));
                    this.totalSize = Number(response.headers.get('x-total-count')) || 0 - (response.body.length - this.branches.length);
                }, this.util.createErrorToast);
        }
    }

    private isOntOrShapes(): boolean {
        return this.om.isOntologyRecord(this.record)
            || includes(get(this.record, '@type', []), SHAPESGRAPHEDITOR + 'ShapesGraphRecord');
    }
}
