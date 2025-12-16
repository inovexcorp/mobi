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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { trim, map, uniq } from 'lodash';

import { REGEX } from '../../../constants';
import { DCTERMS, OWL } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { addLanguageToAnnotations, getBeautifulIRI } from '../../../shared/utility';
import { RdfUpload } from '../../../shared/models/rdfUpload.interface';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class NewRecordModalComponent
 *
 * A component that creates content for a modal that creates a new VersionedRDFRecord. The form in the modal contains a
 * field for the name, a field for the IRI, a field for the description, an
 * {@link AdvancedLanguageSelectComponent}, and a {@link KeywordSelectComponent}. The value
 * of the name field will populate the IRI field unless the IRI value is manually changed. Meant to be used in
 * conjunction with the `MatDialog` service.
 * 
 * NOTE: Eventually this will need to be more modular as not all versioned RDF records will create an ontology object
 */
@Component({
  selector: 'app-new-record-modal',
  templateUrl: './new-record-modal.component.html'
})
export class NewRecordModalComponent<TData extends VersionedRdfListItem> implements OnInit {
  error: string|RESTError;
  iriPattern = REGEX.IRI;
  iriHasChanged = false;

  beautifulTypeName = getBeautifulIRI(this._state.type).replace(' Record', '');

  newRecordForm = this._fb.group({
    title: ['', [ Validators.required]],
    iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
    description: [''],
    keywords: [[]],
    language: ['']
  });

  constructor(private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<NewRecordModalComponent<TData>>, 
    @Inject(MAT_DIALOG_DATA) public data: { defaultNamespace: string }, private _camelCase: CamelCasePipe, 
    @Inject(stateServiceToken) private _state: VersionedRdfState<TData>, private _toast: ToastService) {}

  ngOnInit(): void {
    this.newRecordForm.controls.iri.setValue(this.data.defaultNamespace);
    this.newRecordForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
  }
  manualIRIEdit(): void {
    this.iriHasChanged = true;
  }
  nameChanged(newName: string): void {
    if (!this.iriHasChanged) {
      const split = splitIRI(this.newRecordForm.controls.iri.value);
      this.newRecordForm.controls.iri.setValue(split.begin + split.then + this._camelCase.transform(newName, 'class'));
    }
  }
  create(): void {
    this.error = undefined;
    const newOntology: JSONLDObject = {
      '@id': this.newRecordForm.controls.iri.value,
      '@type': [`${OWL}Ontology`],
      [`${DCTERMS}title`]: [{'@value': this.newRecordForm.controls.title.value}],
    };
    if (this.newRecordForm.controls.description.value) {
      newOntology[`${DCTERMS}description`] = [{'@value': this.newRecordForm.controls.description.value}];
    }
    const rdfUpload: RdfUpload = {
      title: this.newRecordForm.controls.title.value,
      description: this.newRecordForm.controls.description.value,
      keywords: uniq(map(this.newRecordForm.controls.keywords.value, trim)),
      jsonld: [newOntology]
    };
    addLanguageToAnnotations(newOntology, this.newRecordForm.controls.language.value);
    this._state.createAndOpen(rdfUpload)
      .subscribe(response => {
        this._toast.createSuccessToast(`Record ${response.recordId} successfully created.`);
        this._dialogRef.close(response.recordId);
      }, error => {
        if (typeof error === 'string') {
          this.error = {
            errorMessage: error,
            error: '',
            errorDetails: []
          };
        } else {
          this.error = error;
        }
      });
  }
}
