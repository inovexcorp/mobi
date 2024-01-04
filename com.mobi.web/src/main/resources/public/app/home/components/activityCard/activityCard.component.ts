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
import { Component } from '@angular/core';

import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @class home.ActivityCardComponent
 *
 * A component which creates a `mat-card` containing infinite scrolled lists of the activities in the application. The 
 * activity lists are Recent across the application and those targeted to the currently logged in 
 * {@link shared.LoginManagerService#currentUserIri user} and are displayed with {@link shared.ActivityListComponent}.
 */
@Component({
    selector: 'activity-card',
    templateUrl: './activityCard.component.html'
})
export class ActivityCardComponent {
    tabIndex = 0;
    
    constructor(public lm: LoginManagerService) {}
}
