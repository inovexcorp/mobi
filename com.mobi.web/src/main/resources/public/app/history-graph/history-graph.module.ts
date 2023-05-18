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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { CommitHistoryGraphComponent } from './components/commit-history-graph/commit-history-graph.component';
import { GraphHelperService } from './services/graph-helper.service';
import { SVGElementHelperService } from './services/svgelement-helper.service';

/**
 * @namespace historyGraph
 *
 * The `historyGraph` module provides components that make up the graph for commit history of Mobi.
 */
@NgModule({
    imports: [
        CommonModule,
        MatDialogModule
    ],
    declarations: [
        CommitHistoryGraphComponent
    ],
    exports: [
        CommitHistoryGraphComponent
    ], 
    providers: [
        GraphHelperService,
        SVGElementHelperService
    ]
})
export class HistoryGraph {}
