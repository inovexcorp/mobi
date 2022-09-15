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

import { CATALOG } from '../../../prefixes';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { UtilService } from '../../../shared/services/util.service';

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

    constructor(public state: MapperStateService, private util: UtilService) {}

    ngOnInit(): void {
        if (!this.state.newMapping) {
            if (!this.state.selected.branch) {
                this.state.setMasterBranch().subscribe(() => {
                    this.commitId = this.util.getPropertyId(this.state.selected.branch, CATALOG + 'head');
                    this.branchTitle = this.util.getDctermsValue(this.state.selected.branch, 'title');
                }, error => {
                    this.util.createErrorToast(error);
                });
            } else {
                this.commitId = this.util.getPropertyId(this.state.selected.branch, CATALOG + 'head');
                this.branchTitle = this.util.getDctermsValue(this.state.selected.branch, 'title');
            }
        }
    }
}