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
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { GraphState } from '../../classes';
import { ControlRecordUtilsService } from '../../services/controlRecordUtils.service';

/**
 * @class VisualizationSidebarSearch
 * Enable searching sidebar
 */
@Component({
    selector: 'visualization-sidebar-search',
    templateUrl: './visualizationSidebarSearch.component.html',
    styleUrls: ['./visualizationSidebarSearch.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class VisualizationSidebarSearch implements OnChanges {
    @Input() graphState: GraphState;

    constructor(
        public fb: UntypedFormBuilder,
        private controlRecordUtils: ControlRecordUtilsService
    ) {}

    searchForm: UntypedFormGroup = this.fb.group({
        searchText: [''],
        importOption: ['', [Validators.required]]
    })
    importOptions = [
        {'value': 'all', 'text': 'All'},
        {'value': 'local', 'text': 'Local'},
        {'value': 'imported', 'text': 'Imported'}
    ];
    searchFormDefaults = { 
        searchText: '',
        importOption: this.importOptions[0].value 
    }
    limit = 0;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.graphState?.currentValue) {
            this.limit = this.graphState.nodeLimit;
            if (this.graphState.searchForm === undefined) {
                this.searchForm.patchValue(this.searchFormDefaults);
            } else {
                this.searchForm.patchValue(this.graphState.searchForm);
            }
        }
    }
    searchRecords(): void {
        const searchForm = this.searchForm.value;
        this.graphState.searchForm = searchForm;
        const controlRecordSearch = this.controlRecordUtils.getControlRecordSearch(searchForm, this.limit);
        this.controlRecordUtils.emitGraphData(this.graphState, controlRecordSearch);
    }
    loadMoreRecords(): void{
        this.limit += this.graphState.nodeLimit;
        this.searchRecords();
    }
}
