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
import { isEqual } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

/**
 * @class mapper.ClassPreviewComponent
 *
 * A component that creates a div with a brief description of the passed class and its properties. It displays the name
 * of the class, its IRI, its description, and the list of its properties.
 *
 * @param {Object} classObj the class object from an ontology to preview
 * @param {Object[]} ontologies A list of ontologies containing the class and to pull properties
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
    total = 0;

    private _classObj: JSONLDObject;

    @Input() ontologies: MappingOntology[] = [];
    @Input() set classObj(value: JSONLDObject) {
        const previousValue = this._classObj;
        this._classObj = value;
        this.name = this.om.getEntityName(value);
        this.description = this.om.getEntityDescription(value) || '(None Specified)';
        if (!isEqual(value, previousValue)) {
            const props = this.state.getClassProps(this.ontologies, value['@id']);
            this.total = props.length;
            this.props = props.slice(0, 10);
        }
    }

    get classObj(): JSONLDObject {
        return this._classObj;
    }

    constructor(public state: MapperStateService, public om: OntologyManagerService) {}
}
