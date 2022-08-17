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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { trim, map, uniq } from 'lodash';

import { REGEX } from '../../../constants';
import { DCTERMS, OWL } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.NewOntologyOverlayComponent
 *
 * A component that creates content for a modal that creates a new ontology. The form in the modal contains a field for
 * the name, a field for the IRI, a field for the description, an
 * {@link ontology-editor.AdvancedLanguageSelectComponent}, and a {@link shared.KeywordSelectComponent}. The value
 * of the name field will populate the IRI field unless the IRI value is manually changed. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'new-ontology-overlay',
    templateUrl: './newOntologyOverlay.component.html'
})
export class NewOntologyOverlayComponent implements OnInit {
    error: string|RESTError;
    iriPattern = REGEX.IRI;
    iriHasChanged = false;

    newOntologyForm = this.fb.group({
        title: ['', [ Validators.required]],
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
        description: [''],
        keywords: [[]],
        language: ['']
    });

    constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<NewOntologyOverlayComponent>, 
        @Inject(MAT_DIALOG_DATA) public data: {defaultNamespace: string}, public os: OntologyStateService,
        private camelCase: CamelCasePipe, private splitIRI: SplitIRIPipe) {}

    ngOnInit(): void {
        this.newOntologyForm.controls.iri.setValue(this.data.defaultNamespace);
        this.newOntologyForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
    }
    manualIRIEdit(): void {
        this.iriHasChanged = true;
    }
    nameChanged(newName: string): void {
        if (!this.iriHasChanged) {
            const split = this.splitIRI.transform(this.newOntologyForm.controls.iri.value);
            this.newOntologyForm.controls.iri.setValue(split.begin + split.then + this.camelCase.transform(newName, 'class'));
        }
    }
    create(): void {
        const newOntology: JSONLDObject = {
            '@id': this.newOntologyForm.controls.iri.value,
            '@type': [OWL + 'Ontology'],
            [DCTERMS + 'title']: [{'@value': this.newOntologyForm.controls.title.value}],
        };
        if (this.newOntologyForm.controls.description.value) {
            newOntology[DCTERMS + 'description'] = [{'@value': this.newOntologyForm.controls.description.value}];
        }
        this.os.addLanguageToNewEntity(newOntology, this.newOntologyForm.controls.language.value);
        this.os.createOntology([newOntology], this.newOntologyForm.controls.title.value, this.newOntologyForm.controls.description.value, uniq(map(this.newOntologyForm.controls.keywords.value, trim)))
            .subscribe(() => {
                this.dialogRef.close();
            }, error => {
                this.error = error;
            });
    }
}