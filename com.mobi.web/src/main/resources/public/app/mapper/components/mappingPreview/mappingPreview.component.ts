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
import { Component, Input, OnChanges } from '@angular/core';
import { some } from 'lodash';

import { DELIM } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingInvalidProp } from '../../../shared/models/mappingInvalidProp.interface';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { getDctermsValue, getPropertyId, getPropertyValue } from '../../../shared/utility';

/**
 * @class mapper.MappingPreviewComponent
 *
 * A component that creates a "boxed" div with a preview of a mapping with its description, source ontology, and all its
 * mapped classes and properties.
 */
interface PropMappingPreview {
    id: string,
    title: string,
    isInvalid: boolean,
    value: string
}

interface ClassMappingPreview {
    id: string,
    title: string,
    iriTemplate: string,
    propMappings: PropMappingPreview[]
}

@Component({
    selector: 'mapping-preview',
    templateUrl: './mappingPreview.component.html',
    styleUrls: ['./mappingPreview.component.scss']
})
export class MappingPreviewComponent implements OnChanges {
    classMappings: ClassMappingPreview[] = [];

    private _mapping: Mapping;

    @Input() invalidProps: MappingInvalidProp[];
    @Input() set mapping(value: Mapping) {
        this._mapping = value;
        this.setClassMappings();
    }

    get mapping(): Mapping {
        return this._mapping;
    }
    
    constructor(private mm: MappingManagerService) {}

    ngOnChanges(): void {
        this.updateInvalidList();
    }

    getIriTemplate(classMapping: JSONLDObject): string {
        const prefix = getPropertyValue(classMapping, `${DELIM}hasPrefix`);
        const localName = getPropertyValue(classMapping, `${DELIM}localName`);
        return prefix + localName;
    }
    getPropValue(propMapping: JSONLDObject): string {
        if (this.mm.isDataMapping(propMapping)) {
            return getPropertyValue(propMapping, `${DELIM}columnIndex`);
        } else {
            const classMapping = this.mapping.getClassMapping(getPropertyId(propMapping, `${DELIM}classMapping`));
            return getDctermsValue(classMapping, 'title');
        }
    }
    isInvalid(propMappingId: string): boolean {
        return some(this.invalidProps, {id: propMappingId});
    }
    setClassMappings(): void {
        this.classMappings = this.mapping.getAllClassMappings().map(originalClassMapping => ({
            id: originalClassMapping['@id'],
            title: getDctermsValue(originalClassMapping, 'title'),
            iriTemplate: this.getIriTemplate(originalClassMapping),
            propMappings: this.mapping.getPropMappingsByClass(originalClassMapping['@id']).map(originalPropMapping => ({
                id: originalPropMapping['@id'],
                title: getDctermsValue(originalPropMapping, 'title'),
                isInvalid: this.isInvalid(originalPropMapping['@id']),
                value: this.getPropValue(originalPropMapping)
            })).sort((propMapping1, propMapping2) => propMapping1.title.localeCompare(propMapping2.title))
        })).sort((classMapping1, classMapping2) => classMapping1.title.localeCompare(classMapping2.title));
    }
    private updateInvalidList() {
        this.setClassMappings();
    }
}
