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

import { Component, OnInit } from '@angular/core';

import { CATALOG } from '../../../prefixes';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class mapper.MappingCommitsTabComponent
 *
 * A component that creates a Bootstrap `row` for viewing the {@link shared.CommitHistoryTableComponent commit history}
 * of the current {@link shared.MapperStateService#selected mapping}.
 */
@Component({
    selector: 'mapping-commits-tab',
    templateUrl: './mappingCommitsTab.component.html'
})
export class MappingCommitsTabComponent implements OnInit {
    commitId = '';
    branchTitle = '';
    branchList = [];
    constructor(public state: MapperStateService, private toast: ToastService) {}

    ngOnInit(): void {
        if (!this.state.newMapping) {
            if (!this.state.selected.branch) {
                this.branchList.push(this.state.selected.branch);
                this.state.setMasterBranch().subscribe(() => {
                    this.commitId = getPropertyId(this.state.selected.branch, `${CATALOG}head`);
                    this.branchTitle = getDctermsValue(this.state.selected.branch, 'title');
                }, error => {
                    this.toast.createErrorToast(error);
                });
            } else {
                this.commitId = getPropertyId(this.state.selected.branch, `${CATALOG}head`);
                this.branchTitle = getDctermsValue(this.state.selected.branch, 'title');
            }
        }
    }
}
