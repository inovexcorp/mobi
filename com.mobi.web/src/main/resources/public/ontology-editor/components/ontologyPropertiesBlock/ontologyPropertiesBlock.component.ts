/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatDialog } from '@angular/material';
import { union, sortBy, has, get } from 'lodash';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { OntologyPropertyOverlayComponent } from '../ontologyPropertyOverlay/ontologyPropertyOverlay.component';

/**
 * @class ontology-editor.OntologyPropertiesBlockComponent
 *
 * A component that creates a section that displays the ontology properties (and annotations) on the provided ontology
 * using {@link ontology-editor.PropertyValuesComponent}. The section header contains a button for adding a property.
 * The component houses the methods for opening the modal for
 * {@link ontology-editor.OntologyPropertyOverlayComponent editing, adding}, and removing ontology properties.
 * 
 * @param {JSONLDObject} ontology A JSON-LD object representing an ontology 
 */
@Component({
    selector: 'ontology-properties-block',
    templateUrl: './ontologyPropertiesBlock.component.html'
})
export class OntologyPropertiesBlockComponent implements OnChanges {
    @Input() ontology: JSONLDObject;

    properties = [];
    propertiesFiltered = [];

    constructor(private dialog: MatDialog, public os: OntologyStateService, private pm: PropertyManagerService) {}
    
    ngOnChanges(): void {
        this.updatePropertiesFiltered();
    }
    updatePropertiesFiltered(): void {
        this.properties = union(this.pm.ontologyProperties, this.pm.defaultAnnotations, this.pm.owlAnnotations, Object.keys(this.os.listItem.annotations.iris));
        this.propertiesFiltered = sortBy(this.properties.filter(prop => has(this.ontology, prop)), iri => this.os.getEntityNameByListItem(iri));
    }
    openAddOverlay(): void {
        this.dialog.open(OntologyPropertyOverlayComponent, {data: { editing: false }}).afterClosed()
            .subscribe(result => {
                if (result) {
                    this.updatePropertiesFiltered();
                }
            });
    }
    openRemoveOverlay(input: {iri: string, index: number}): void {
        this.dialog.open(ConfirmModalComponent, {
            data: { content: this.os.getRemovePropOverlayMessage(input.iri, input.index)}
        }).afterClosed().subscribe(result => {
            if (result) {
                this.os.removeProperty(input.iri, input.index).subscribe();
                this.updatePropertiesFiltered();
            }
        });
    }
    editClicked(input: {property: string, index: number}): void {
        const propertyObj = this.ontology[input.property][input.index];
        this.dialog.open(OntologyPropertyOverlayComponent, {data: {
            editing: true,
            property: input.property,
            value: propertyObj['@value'] || propertyObj['@id'],
            type: get(propertyObj, '@type', ''),
            index: input.index,
            language: get(propertyObj, '@language', '')
        }}).afterClosed().subscribe(result => {
            if (result) {
                this.updatePropertiesFiltered();
            }
        });
    }
}