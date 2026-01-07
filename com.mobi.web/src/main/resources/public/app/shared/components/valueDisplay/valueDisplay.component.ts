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

import { DiscoverStateService } from '../../services/discoverState.service';
import { getBeautifulIRI } from '../../utility';
import { JSONLDId } from '../../models/JSONLDId.interface';
import { JSONLDValue } from '../../models/JSONLDValue.interface';

/**
 * @class shared.ValueDisplayComponent
 *
 * A component which creates a span element for displaying json-ld values. It is meant to be used to display a json-ld
 * object in a readable format.
 *
 * @param {JSONLDObject} value the json-ld value to display to a user.
 */
@Component({
    selector: 'value-display',
    templateUrl: './valueDisplay.component.html',
    styleUrls: ['./valueDisplay.component.scss']
})
export class ValueDisplayComponent {

    @Input() value: JSONLDId|JSONLDValue;
    @Input() highlightText: string;

    constructor(private ds: DiscoverStateService) {}

    getDisplay(str: string): string {
      return this.ds.explore.instance.objectMap[str] || getBeautifulIRI(str);
    }
}
