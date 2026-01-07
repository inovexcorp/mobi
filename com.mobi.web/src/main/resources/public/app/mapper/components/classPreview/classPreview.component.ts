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
import { isEqual } from 'lodash';

import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingClass } from '../../../shared/models/mappingClass.interface';

/**
 * @class mapper.ClassPreviewComponent
 *
 * A component that creates a div with a brief description of the passed class and its properties. It displays the name
 * of the class, its IRI, its description, and the list of its properties.
 *
 * @param {MappingClass} classDetails The metadata object about the OWL class to preview
 * from.
 */
@Component({
    selector: 'class-preview',
    templateUrl: './classPreview.component.html',
    styleUrls: ['./classPreview.component.scss']
})
export class ClassPreviewComponent {
    name = '';
    description = '';
    props: MappingProperty[] = [];

    private _classDetails: MappingClass;

    @Input() set classDetails(value: MappingClass) {
        const previousValue = this._classDetails;
        this._classDetails = value;
        this.name = this._classDetails.name;
        this.description = value.description || '(None Specified)';
        if (!isEqual(value, previousValue)) {
            this.state.retrieveProps(this.state.selected.mapping.getSourceOntologyInfo(), value.iri, '', 10)
                .subscribe(results => {
                    this.props = results;
                }, () => {
                    this.props = [];
                });
        }
    }

    get classDetails(): MappingClass {
        return this._classDetails;
    }

    constructor(private state: MapperStateService) {}
}
