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
import { Component } from '@angular/core';

/**
 * @class home.HomePageComponent
 *
 * `home-page` is a component which creates the main page of the Home module. The page contains a welcome banner image
 * along with a {@link home.QuickActionGridComponent grid of quick actions} and a
 * {@link home.ActivityCardComponent list of activities} within the Mobi instance.
 */
@Component({
    selector: 'home-page',
    templateUrl: './homePage.component.html',
    styleUrls: ['./homePage.component.scss']
})
export class HomePageComponent {
    constructor() {}
}
