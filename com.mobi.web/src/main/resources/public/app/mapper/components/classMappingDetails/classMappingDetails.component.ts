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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { find, get } from 'lodash';

import { DELIM, XSD } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { IriTemplateOverlayComponent } from '../iriTemplateOverlay/iriTemplateOverlay.component';
import { PropMappingOverlayComponent } from '../propMappingOverlay/propMappingOverlay.component';
import { getBeautifulIRI, getDctermsValue, getPropertyId, getPropertyValue } from '../../../shared/utility';

interface DataMappingInfo {
    value: string,
    preview: string,
    datatype: string
}

interface ObjectMappingInfo {
    value: string
}

export interface PropMappingPreview {
    jsonld: JSONLDObject,
    title: string,
    isInvalid: boolean,
    dataMappingInfo?: DataMappingInfo
    objectMappingInfo?: ObjectMappingInfo,
    language?: {
        tag: string,
        preview: string
    }
}

/**
 * @class mapper.ClassMappingDetailsComponent
 *
 * A component that creates a div with sections to view and edit information about a Class Mapping identified by the
 * provided ID. One section is for viewing and editing the {@link mapper.IriTemplateOverlayComponent IRI template} of the class
 * mapping. Another section is for viewing the list of property mappings associated with the class mapping, adding to
 * that list, editing items in the list, and removing from that list. The component houses methods for opening the
 * modals for {@link mapper.PropMappingOverlayComponent editing, adding}, and removing PropertyMappings.
 */
@Component({
    selector: 'class-mapping-details',
    templateUrl: './classMappingDetails.component.html',
    styleUrls: ['./classMappingDetails.component.scss']
})
export class ClassMappingDetailsComponent {
    propMappings: PropMappingPreview[] = [];
    iriTemplate = '';
    singleClick = false;

    private _classMappingId: string;

    @Input() set classMappingId(value: string) {
        this._classMappingId = value;
        this.setPropMappings();
        this.setIriTemplate();
    }

    get classMappingId(): string {
        return this._classMappingId;
    }
    @Output() classMappingIdChange = new EventEmitter<string>();
    @Output() updateClassMappings = new EventEmitter<void>();
    
    constructor(private dialog: MatDialog, private mm: MappingManagerService, public state: MapperStateService,
        private dm: DelimitedManagerService, private pm: PropertyManagerService) {}

    editIriTemplate(): void {
        this.dialog.open(IriTemplateOverlayComponent).afterClosed().subscribe(() => {
            this.setIriTemplate();
        });
    }
    isInvalid(propMapping: JSONLDObject): boolean {
        return !!find(this.state.invalidProps, {id: propMapping['@id']});
    }
    handleSingleClick(propMapping: JSONLDObject): void {
        this.singleClick = true;
        setTimeout(() => {
            if (this.singleClick) {
                this.clickProperty(propMapping);
            }
        });
    }
    handleDoubleClick(propMapping: JSONLDObject): void {
        this.singleClick = false;
        this.switchClass(propMapping);
    }
    clickProperty(propMapping: JSONLDObject): void {
        if (this.state.selectedPropMappingId === propMapping['@id']) {
            this.state.selectedPropMappingId = '';
            this.state.highlightIndexes = [];
        } else {
            this.state.selectedPropMappingId = propMapping['@id'];
            this.state.highlightIndexes = [this.getLinkedColumnIndex(propMapping)];
        }
    }
    setIriTemplate(): void {
        const classMapping = this.state.selected.mapping.getClassMapping(this.classMappingId);
        const prefix = getPropertyValue(classMapping, `${DELIM}hasPrefix`);
        const localName = getPropertyValue(classMapping, `${DELIM}localName`);
        this.iriTemplate = prefix + localName;
    }
    getPropValue(propMapping: JSONLDObject): string {
        if (this.mm.isDataMapping(propMapping)) {
            return this.dm.getHeader(this.getLinkedColumnIndex(propMapping));
        } else {
            const classMapping = this.state.selected.mapping.getClassMapping(this.getLinkedClassId(propMapping));
            return getDctermsValue(classMapping, 'title');
        }
    }
    getDataValuePreview(propMapping: JSONLDObject): string {
        const firstRowIndex = this.dm.containsHeaders ? 1 : 0;
        return get(this.dm.dataRows, `[${firstRowIndex}][${this.getLinkedColumnIndex(propMapping)}]`, '(None)');
    }
    getDatatypePreview(propMapping: JSONLDObject): string {
        const datatypeIRI = getPropertyId(propMapping, `${DELIM}datatypeSpec`) || `${XSD}string`;
        return getBeautifulIRI(datatypeIRI);
    }
    getLanguagePreview(propMapping: JSONLDObject): string {
        const languageObj = find(this.pm.languageList, {value: this.getLanguageTag(propMapping)});
        return languageObj ? languageObj.label : '';
    }
    getLanguageTag(propMapping: JSONLDObject): string {
        return getPropertyValue(propMapping, `${DELIM}languageSpec`);
    }
    getLinkedClassId(propMapping: JSONLDObject): string {
        return getPropertyId(propMapping, `${DELIM}classMapping`);
    }
    getLinkedColumnIndex(propMapping: JSONLDObject): string {
        return getPropertyValue(propMapping, `${DELIM}columnIndex`);
    }
    switchClass(propMapping: JSONLDObject): void {
        if (this.mm.isObjectMapping(propMapping)) {
            this.classMappingIdChange.emit(this.getLinkedClassId(propMapping));
            this.state.selectedPropMappingId = '';
        }
    }
    addProp(): void {
        this.state.newProp = true;
        this.dialog.open(PropMappingOverlayComponent, { panelClass: 'medium-dialog' }).afterClosed().subscribe(() => {
            this.setPropMappings();
            // In case the added prop added a class mapping
            this.updateClassMappings.emit();
        });
    }
    editProp(propMapping: PropMappingPreview): void {
        this.state.selectedPropMappingId = propMapping.jsonld['@id'];
        this.state.newProp = false;
        this.dialog.open(PropMappingOverlayComponent, { panelClass: 'medium-dialog' }).afterClosed().subscribe(() => {
            this.setPropMappings();
        });
    }
    confirmDeleteProp(propMapping: PropMappingPreview): void {
        const classMapping = this.state.selected.mapping.getClassMapping(this.classMappingId);
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete <strong>${propMapping.title}</strong> from <strong>${getDctermsValue(classMapping, 'title')}</strong>?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteProp(propMapping.jsonld['@id']);
            }
        });
    }
    deleteProp(propMappingId: string): void {
        this.state.deleteProp(propMappingId, this.classMappingId);
        this.state.selectedPropMappingId = '';
        this.state.highlightIndexes = [];
        this.setPropMappings();
    }
    setPropMappings(): void {
        if (this.state.selected) {
            this.propMappings = this.state.selected.mapping.getPropMappingsByClass(this.classMappingId).map(propMapping => {
                const propMappingPreview: PropMappingPreview = {
                    jsonld: propMapping,
                    isInvalid: this.isInvalid(propMapping),
                    title: getDctermsValue(propMapping, 'title')
                };
                if (this.mm.isDataMapping(propMapping)) {
                    propMappingPreview.dataMappingInfo = {
                        value: this.getPropValue(propMapping),
                        preview: this.getDataValuePreview(propMapping),
                        datatype: this.getDatatypePreview(propMapping),
                    };
                    const languageTag = this.getLanguageTag(propMapping);
                    if (languageTag) {
                        propMappingPreview.language = {
                            preview: this.getLanguagePreview(propMapping),
                            tag: languageTag
                        };
                    }
                } else if (this.mm.isObjectMapping(propMapping)) {
                    propMappingPreview.objectMappingInfo = {
                        value: this.getPropValue(propMapping)
                    };
                }
                return propMappingPreview;
            });
            this.propMappings.sort((propMapping1, propMapping2) => propMapping1.title.localeCompare(propMapping2.title));
        }
    }
}
