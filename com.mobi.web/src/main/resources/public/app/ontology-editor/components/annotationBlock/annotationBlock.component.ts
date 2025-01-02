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
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { get, has, sortBy, union } from 'lodash';
import { RDF } from '../../../prefixes';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { AnnotationOverlayComponent } from '../annotationOverlay/annotationOverlay.component';

/**
 * @class ontology-editor.AnnotationBlockComponent
 *
 * A component that creates a section that displays the annotations on the
 * {@link shared.OntologyStateService selected entity} using {@link ontology-editor.PropertyValuesComponent}. The
 * section header contains a button for adding an annotation. The component houses the methods for opening the modal for
 * {@link ontology-editor.AnnotationOverlayComponent editing, adding}, and removing annotations.
 */
@Component({
    selector: 'annotation-block',
    templateUrl: './annotationBlock.component.html'
})
export class AnnotationBlockComponent implements OnChanges {
    annotations = [];
    annotationsFiltered = [];

    @Input() highlightIris: string[] = [];
    @Input() highlightText: string;
    @Input() selected: JSONLDObject;

    constructor(private dialog: MatDialog, public os: OntologyStateService, private pm: PropertyManagerService) {}

    ngOnChanges(): void {
        this.updatePropertiesFiltered();
    }
    updatePropertiesFiltered(): void {
        this.annotations = union(Object.keys(this.os.listItem.annotations.iris), this.pm.defaultAnnotations, this.pm.owlAnnotations);
        this.annotationsFiltered = sortBy(this.annotations.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityName(iri));
    }
    openAddOverlay(): void {
        this.dialog.open(AnnotationOverlayComponent, {data: { editing: false }}).afterClosed().subscribe(result => {
            if (result) {
                this.updatePropertiesFiltered();
            }
        });
    }
    openRemoveOverlay(input: {iri: string, index: number}): void {
        this.dialog.open(ConfirmModalComponent, {
            data: { content: this.os.getRemovePropOverlayMessage(input.iri, input.index) }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.os.removeProperty(input.iri, input.index).subscribe();
                this.updatePropertiesFiltered();
                this.os.annotationModified(this.os.listItem.selected['@id'], input.iri, null);
            }
        });
    }
    editClicked(input: {property: string, index: number}): void {
        const annotationObj = this.os.listItem.selected[input.property][input.index];
        const propertyType = get(annotationObj, '@type');
        const propertyLanguage = get(annotationObj, '@language');
        this.dialog.open(AnnotationOverlayComponent, {data: {
            editing: true,
            annotation: input.property,
            value: annotationObj['@value'] ||  annotationObj['@id'],
            type: propertyType ? propertyType : (propertyLanguage ? `${RDF}langString` : ''),
            index: input.index,
            language: propertyLanguage,
            isIRIProperty: !annotationObj['@value'] && annotationObj['@id'] ? true : false
        }}).afterClosed().subscribe(result => {
            if (result) {
                this.updatePropertiesFiltered();
            }
        });
    }
}
