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
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL } from '../../../prefixes';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { noWhitespaceValidator } from '../../../shared/validators/noWhitespace.validator';

/**
 * @class ontology-editor.CreateIndividualOverlayComponent
 *
 * A component that creates content for a modal that creates an individual in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a text input for the
 * individual name (which populates the {@link ontology-editor.StaticIriComponent IRI}) and a
 * {@link ontology-editor.OntologyClassSelectComponent} for the classes this individual will be an instance of. Meant to
 * be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-individual-overlay',
    templateUrl: './createIndividualOverlay.component.html'
})
export class CreateIndividualOverlayComponent implements OnInit {
    iriHasChanged = false;
    duplicateCheck = true;
    iriPattern = REGEX.IRI;
    classes: string[] = [];
    
    createForm = this.fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern), this.os.getDuplicateValidator()]],
        title: ['', [ Validators.required, noWhitespaceValidator()]],
    });
    
    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateIndividualOverlayComponent>,
        public os: OntologyStateService,
        private camelCasePipe: CamelCasePipe,
        private splitIRIPipe: SplitIRIPipe) {}

    ngOnInit(): void {
        this.createForm.controls.iri.setValue(this.os.getDefaultPrefix());
        this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
    }
    nameChanged(newName: string): void  {
        if (!this.iriHasChanged) {
            const split = this.splitIRIPipe.transform(this.createForm.controls.iri.value);
            this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCasePipe.transform(newName, 'class'));
        }
    }
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): void  {
        this.iriHasChanged = true;
        this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
        this.os.setCommonIriParts(iriBegin, iriThen);
    }
    get individual(): JSONLDObject {
        return {
            '@id': this.createForm.controls.iri.value,
            '@type': [OWL + 'NamedIndividual'].concat(this.classes),
            [DCTERMS + 'title']: [{
                '@value': this.createForm.controls.title.value
            }],
        };
    }
    create(): void  {
        this. duplicateCheck = false;
        const newIndividual = this.individual;
        // add the entity to the ontology
        this.os.addEntity(newIndividual);
        this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, newIndividual);
        // update relevant lists
        this.os.addIndividual(newIndividual);
        // add to concept hierarchy if an instance of a derived concept
        if (this.os.containsDerivedConcept(newIndividual['@type'])) {
            this.os.addConcept(newIndividual);
        } else if (this.os.containsDerivedConceptScheme(newIndividual['@type'])) {
            this.os.addConceptScheme(newIndividual);
        }
        // Save the changes to the ontology
        this.os.saveCurrentChanges().subscribe(() => {
            // Open snackbar
            this.os.openSnackbar(newIndividual['@id']);
        }, () => {});
        // hide the overlay
        this.dialogRef.close();
    }
}
