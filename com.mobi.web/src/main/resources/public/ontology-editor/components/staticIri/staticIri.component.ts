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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { EditIriOverlayComponent } from '../../../shared/components/editIriOverlay/editIriOverlay.component';
import { OnEditEventI } from '../../../shared/models/onEditEvent.interface';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

import './staticIri.component.scss';

/**
 * @class ontology-editor.StaticIriComponent
 *
 * A component that creates a `div` with a display of the provided IRI of an entity. If `duplicateCheck` is true, an
 * {@link shared.ErrorDisplayComponent} will be displayed if the IRI already exists in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The the IRI if for an entity that is not imported, an
 * edit button is displayed that will open the {@link shared.EditIriOverlayComponent}. The component accepts a method
 * that will be called when an edit of the IRI is completed. 
 *
 * @param {string} iri The IRI to be displayed and optionally edited
 * @param {boolean} readOnly Whether the IRI should be editable or not
 * @param {boolean} duplicateCheck Whether the IRI should be checked for duplicates within the selected ontology
 * @param {string} highlightText The optional text to highlight within the IRI
 * @param {Function} onEdit A function to be called when the `editIriOverlay` is confirmed
 */
@Component({
    selector: 'static-iri',
    templateUrl: './staticIri.component.html'
})
export class StaticIriComponent implements OnInit, OnChanges {
    @Input() iri: string;
    @Input() readOnly: boolean;
    @Input() duplicateCheck: boolean;
    @Input() highlightText: string;

    @Output() onEdit = new EventEmitter<OnEditEventI | boolean>();

    iriBegin: string;
    iriThen: string;
    iriEnd: string;

    constructor(private splitIRI: SplitIRIPipe, private dialog: MatDialog, public os: OntologyStateService) {}
    
    ngOnInit(): void {
        this.setVariables();
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (!changesObj.iri || !changesObj.iri.isFirstChange()) {
            this.setVariables();
        }
    }
    setVariables(): void {
        const splitIri = this.splitIRI.transform(this.iri);
        this.iriBegin = splitIri.begin;
        this.iriThen = splitIri.then;
        this.iriEnd = splitIri.end;
    }
    showIriOverlay(): void {
        const dataObj: any = {
            iriBegin: this.iriBegin,
            iriThen: this.iriThen,
            iriEnd: this.iriEnd,
        };
        if (this.duplicateCheck) {
            dataObj.validator = (g: FormGroup) => 
                this.os.checkIri(g.get('iriBegin').value + g.get('iriThen').value + g.get('iriEnd').value) ? null 
                : { iri: true };
            dataObj.validatorMsg = 'This IRI already exists';
            dataObj.validatorKey = 'iri';
        }

        this.dialog.open(EditIriOverlayComponent, { data: dataObj }).afterClosed().subscribe((result: OnEditEventI) => {
            if (result) {
                this.onEdit.emit(result);
            }
        });
    }
}