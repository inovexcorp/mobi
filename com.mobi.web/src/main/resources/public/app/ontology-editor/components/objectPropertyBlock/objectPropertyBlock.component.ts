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

import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { has, sortBy } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ObjectPropertyOverlayComponent } from '../objectPropertyOverlay/objectPropertyOverlay.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

/**
 * @class ontology-editor.ObjectPropertyBlockComponent
 *
 * A component that creates a section that displays the object properties on the
 * {@link shared.OntologyStateService#listItem selected individual} using
 * {@link ontology-editor.PropertyValuesComponent}. The section header contains a button for adding an object property.
 * The component houses the methods for opening the modal for
 * {@link ontology-editor.ObjectPropertyOverlayComponent adding} and removing object property values.
 */

@Component({
    templateUrl: './objectPropertyBlock.component.html',
    selector: 'object-property-block'
})
export class ObjectPropertyBlockComponent implements OnChanges {
    @Input() selected;

    objectProperties: string[] = [];
    objectPropertiesFiltered: string[] = [];

    constructor(public os: OntologyStateService,
                private dialog: MatDialog) {}

    ngOnChanges(): void {
        this.updatePropertiesFiltered();
    }
    updatePropertiesFiltered(): void {
        if (this.os.listItem?.objectProperties?.iris) {
            this.objectProperties = Object.keys(this.os.listItem.objectProperties.iris);
        } else {
            this.objectProperties = [];
        }
        if (this.os.listItem?.selected) {
            this.objectPropertiesFiltered = sortBy(this.objectProperties.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityName(iri));
        } else {
            this.objectPropertiesFiltered = [];
        }
    }
    openAddObjectPropOverlay(): void {
        this.dialog.open(ObjectPropertyOverlayComponent).afterClosed().subscribe(() => {
            this.updatePropertiesFiltered();
        });
    }
    showRemovePropertyOverlay(input: {iri: string, index: number}): void {
        this.dialog.open(ConfirmModalComponent,{
            data: {
                content: `${this.os.getRemovePropOverlayMessage(input.iri, input.index)}</strong>?`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.os.removeProperty(input.iri, input.index).subscribe((res) => {
                    this.removeObjectProperty(input.iri, res as JSONLDId);
                    this.updatePropertiesFiltered();
                });
            }
        });
    }
    removeObjectProperty(axiom: string, axiomObject: JSONLDId): void {
        const types = this.os.listItem.selected['@type'];
        if (this.os.containsDerivedConcept(types) || this.os.containsDerivedConceptScheme(types)) {
            this.os.removeFromVocabularyHierarchies(axiom, axiomObject);
            this.updatePropertiesFiltered();
        }
    }
}
