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

import './circleButtonStack.component.scss';

/**
 * @class shared.CircleButtonStackComponent
 * 
 * A component that creates a Material Fab button (`mat-fab`) which reveals transcluded content on hover. The
 * transcluded content is expected to be a series of `mat-mini-fab` buttons with icons inside that perform a variety of
 * actions on click ending with a `mat-fab` button to replace the main button. Best practice is color each button
 * differently and to also use `matTooltip` on each button to provide context as to what the button will do.
 * 
 * @usage
 * <circle-button-stack>
 *     <button mat-mini-fab color="accent" [matTooltip]="Secondary Action"><mat-icon>local_offer</mat-icon></button>
 *     <button mat-mini-fab color="primary" [matTooltip]="Main Action"><mat-icon>add</mat-icon></button>
 * </circle-button-stack>
 */
import { Component } from '@angular/core';

@Component({
    selector: 'circle-button-stack',
    templateUrl: './circleButtonStack.component.html',
})
export class CircleButtonStackComponent {}