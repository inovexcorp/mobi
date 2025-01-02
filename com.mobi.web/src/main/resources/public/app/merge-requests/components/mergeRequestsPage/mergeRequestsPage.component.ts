/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Component } from '@angular/core';

import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';

/**
 * A component which creates a div containing the main parts of the Merge Requests tool. If no request is being viewed
 * or created, the page displays the {@link merge-requests.MergeRequestListComponent}. Displays the
 * {@link merge-requests.MergeRequestViewComponent} if a request is selected and the 
 * {@link merge-requests.CreateRequestComponent} if a request being created.
 */
@Component({
    selector: 'merge-requests-page',
    templateUrl: './mergeRequestsPage.component.html',
    styleUrls: ['./mergeRequestsPage.component.scss']
})
export class MergeRequestsPageComponent{

    constructor(public state: MergeRequestsStateService) {}
}
