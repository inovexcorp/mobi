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
import { Component, Input } from '@angular/core';
import { find } from 'lodash';

import { RDFS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { UtilService } from '../../../shared/services/util.service';

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
    rangeId = '';
    rangeName = '';
    rangeIsDeprecated = false;

    private _propObj: JSONLDObject;

    @Input() set propObj(value: JSONLDObject) {
        this._propObj = value;
        this.name = this.om.getEntityName(value);
        this.description = this.om.getEntityDescription(value) || '(None Specified)';
        const newRangeId = this.util.getPropertyId(value, RDFS + 'range');
        if (this.om.isObjectProperty(value)) {
            if (newRangeId !== this.rangeId) {
                const availableClass = find(this.state.availableClasses, {classObj: {'@id': newRangeId}});
                if (availableClass) {
                    this.rangeName = availableClass.name;
                    this.rangeIsDeprecated = availableClass.isDeprecated;
                } else {
                    this.rangeName = '(No range)';
                    this.rangeIsDeprecated = false;
                }
            }
        } else {
            this.rangeName = this.split.transform(newRangeId).end || 'string';
            this.rangeIsDeprecated = false;
        }
        this.rangeId = newRangeId;
    }
    get propObj(): JSONLDObject {
        return this._propObj;
    }

    constructor(private state: MapperStateService, private split: SplitIRIPipe, 
        private om: OntologyManagerService, private util: UtilService) {}
}
