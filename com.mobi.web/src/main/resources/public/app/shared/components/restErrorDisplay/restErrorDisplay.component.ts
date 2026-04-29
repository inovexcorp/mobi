/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, Input } from '@angular/core';

import { RESTError } from '../../models/RESTError.interface';

/**
 * @class shared.RestErrorDisplayComponent
 *
 * @description
 * `rest-error-display` is a component that displays a RESTError object using the error-display component.
 * It shows the error message and, if present, a list of error details. If there are no details, it renders
 * identically to a plain error-display with just the message text.
 */
@Component({
    selector: 'rest-error-display',
    templateUrl: './restErrorDisplay.component.html'
})
export class RestErrorDisplayComponent {
    @Input() error: RESTError;
}
