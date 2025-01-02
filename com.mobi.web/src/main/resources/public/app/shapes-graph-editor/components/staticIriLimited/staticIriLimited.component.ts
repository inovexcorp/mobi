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
import { OnChanges, OnInit, Component, Input, SimpleChanges } from '@angular/core';

import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';

/**
 * @class shapes-graph-editor.StaticIriLimitedComponent
 * 
 * A component that creates a `div` with a display of the provided IRI of an entity.
 *
 * @param {string} iri The IRI to be displayed
 */

@Component({
    selector: 'static-iri-limited',
    templateUrl: './staticIriLimited.component.html'
})
export class StaticIriLimitedComponent implements OnInit, OnChanges {

    @Input() iri;

    iriBegin;
    iriThen;
    iriEnd;

    constructor() {}

    ngOnInit(): void {
        this.setVariables();
    }

    ngOnChanges(changesObj: SimpleChanges): void {
        if (!changesObj.iri || !changesObj.iri.isFirstChange()) {
            this.setVariables();
        }
    }

    setVariables(): void {
        const splitIri = splitIRI(this.iri);
        this.iriBegin = splitIri.begin;
        this.iriThen = splitIri.then;
        this.iriEnd = splitIri.end;
    }
}
