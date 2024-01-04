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
import { Component, Input } from '@angular/core';

import { OWL } from '../../../prefixes';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { getBeautifulIRI } from '../../../shared/utility';

interface RangeDisplay {
    iri: string,
    name: string,
    deprecated: boolean
}

/**
 * @class mapper.PropPreviewComponent
 *
 * A component that creates a div with a brief description of the passed property and its range. It displays the name of
 * the property, its IRI, its description, and its range datatype or class.
 *
 * @param {JSONLDObject} propObj the property object from an ontology to preview
 */
@Component({
    selector: 'prop-preview',
    templateUrl: './propPreview.component.html'
})
export class PropPreviewComponent {
    name = '';
    description = '';
    ranges: RangeDisplay[] = [];

    private _propDetails: MappingProperty;
    private _rangeClassDetails: MappingClass[];

    @Input() set propDetails(value: MappingProperty) {
        this._propDetails = value;
        this.name = value.name;
        this.description = value.description || '(None Specified)';
    }
    get propDetails(): MappingProperty {
        return this._propDetails;
    }

    @Input() set rangeClassDetails(value: MappingClass[]) {
        this._rangeClassDetails = value;
        if (this.propDetails.ranges.length) {
            if (this.propDetails.type === `${OWL}ObjectProperty`) {
                if (value && value.length) {
                    this.ranges = value.map(rangeClass => ({
                        iri: rangeClass.iri,
                        name: rangeClass.name,
                        deprecated: rangeClass.deprecated
                    }));
                } else { // Property has ranges set, but they could not be found in the imports closure
                    this.ranges = [];
                }
            } else {
                this.ranges = this.propDetails.ranges.map(range => ({
                    iri: range,
                    name: getBeautifulIRI(range) || 'String',
                    deprecated: false
                }));
            }
        } else { // Property has no ranges set
            this.ranges = [];
        }
    }
    get rangeClassDetails(): MappingClass[] {
        return this._rangeClassDetails;
    }

    constructor() {}
}
