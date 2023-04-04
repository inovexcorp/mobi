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
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { get, has, sortBy } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { RDF, XSD } from '../../../prefixes';
import { DatatypePropertyOverlayComponent } from '../datatypePropertyOverlay/datatypePropertyOverlay.component';

/**
 * @class ontology-editor.DatatypePropertyBlockComponent
 *
 * A component that creates a section that displays the data properties on the
 * {@link shared.OntologyStateService#listItem selected individual} using {@link ontology-editor.PropertyValuesComponent}.
 * The section header contains a button for adding a data property. The component houses the methods for opening the
 * modal for {@link ontology-editor.DatatypePropertyOverlayComponent editing, adding}, and removing data property
 * values.
 */
@Component({
    templateUrl: './datatypePropertyBlock.component.html',
    selector: 'datatype-property-block'
})
export class DatatypePropertyBlockComponent implements OnChanges {
    @Input() selected; // Here to trigger on changes

    dataProperties: string[] = [];
    dataPropertiesFiltered: string[] = [];

    constructor(public os: OntologyStateService,
                private dialog: MatDialog) {}

    ngOnChanges(): void  {
        this.updatePropertiesFiltered();
    }
    updatePropertiesFiltered(): void {
        this.dataProperties = Object.keys(this.os.listItem.dataProperties.iris);
        this.dataPropertiesFiltered = sortBy(this.dataProperties.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityNameByListItem(iri));
    }
    openAddDataPropOverlay(): void {
        const data = {
            editingProperty: false,
            propertySelect: undefined,
            propertyValue: '',
            propertyType: XSD + 'string',
            propertyIndex: 0,
            propertyLanguage: 'en'
        };
        this.dialog.open(DatatypePropertyOverlayComponent, { data }).afterClosed().subscribe(() => {
            this.updatePropertiesFiltered();
        });
    }
    editDataProp(input: {property: string, index: number}): void {
        const propertyObj = this.os.listItem.selected[input.property][input.index];
        const propertyType = get(propertyObj, '@type');
        const propertyLanguage = get(propertyObj, '@language');
        const data = {
            editingProperty: true,
            propertySelect: input.property,
            propertyValue: propertyObj['@value'],
            propertyIndex: input.index,
            propertyLanguage: propertyLanguage,
            propertyType: propertyType ? propertyType : (propertyLanguage ? RDF + 'langString' : '') 
        };
        this.dialog.open(DatatypePropertyOverlayComponent, {data: data}).afterClosed().subscribe(result => {
            if (result) {
                this.updatePropertiesFiltered();
            }
        });
    }
    showRemovePropertyOverlay(input: {key: string, index: number}): void {
        this.dialog.open(ConfirmModalComponent,{
            data: {
                content: 'Are you sure you want to clear <strong>' +  this.os.getRemovePropOverlayMessage(input.key, input.index)+ '</strong>?'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.os.removeProperty(input.key, input.index).subscribe();
                this.updatePropertiesFiltered();
            }
        });
    }
}
