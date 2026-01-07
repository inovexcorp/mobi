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
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { unset } from 'lodash';

import { addLanguageToAnnotations } from '../../../shared/utility';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { REGEX } from '../../../constants';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';

/**
 * @class CreateAnnotationPropertyOverlayComponent
 *
 * A component that creates content for a modal that creates an annotation property in the current
 * {@link OntologyStateService#listItem} selected ontology. The form in the modal contains a text input for the
 * property name (which populates the {@link StaticIriComponent} IRI), a field for the property
 * description, and an {@link AdvancedLanguageSelectComponent}. Meant to be used in conjunction with the
 * `MatDialog` service.
 */
@Component({
  selector: 'create-annotation-property-overlay',
  templateUrl: './createAnnotationPropertyOverlay.component.html'
})
export class CreateAnnotationPropertyOverlayComponent implements OnInit {
  iriHasChanged = false;
  duplicateCheck = true;
  iriPattern = REGEX.IRI;

  createForm = this.fb.group({
    iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]], // has prefix
    title: ['', [Validators.required]],
    description: [''],
    language: ['']
  });

  annotationType = DCTERMS;

  constructor(private fb: UntypedFormBuilder,
              private dialogRef: MatDialogRef<CreateAnnotationPropertyOverlayComponent>,
              public sm: SettingManagerService,
              public os: OntologyStateService,
              private camelCasePipe: CamelCasePipe) {
  }

  ngOnInit(): void {
    this.createForm.controls.iri.setValue(this.os.getDefaultPrefix());
    this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));

    this.sm.getAnnotationPreference().subscribe(preference => {
      this.annotationType = preference === 'DC Terms' ? DCTERMS : RDFS;
    }, error => {
      this.annotationType = DCTERMS;
      console.error(error);
    });
  }

  nameChanged(newName: string): void {
    if (!this.iriHasChanged) {
      const split = splitIRI(this.createForm.controls.iri.value);
      this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCasePipe.transform(newName, 'property'));
    }
  }

  onEdit(iriBegin: string, iriThen: string, iriEnd: string): void {
    this.iriHasChanged = true;
    this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
    this.os.setCommonIriParts(iriBegin, iriThen);
  }

  get property(): JSONLDObject {
    const labelIRI = this.annotationType === DCTERMS ? `${this.annotationType}title` : `${this.annotationType}label`;
    const descIRI = this.annotationType === DCTERMS ? `${this.annotationType}description` : `${this.annotationType}comment`;
    const property = {
      '@id': this.createForm.controls.iri.value,
      '@type': [`${OWL}AnnotationProperty`],
      [labelIRI]: [{ '@value': this.createForm.controls.title.value }],
      [descIRI]: [{ '@value': this.createForm.controls.description.value }]
    };
    if (property[descIRI][0]['@value'] === '') {
      unset(property, descIRI);
    }
    addLanguageToAnnotations(property, this.createForm.controls.language.value);
    return property;
  }

  create(): void {
    this.duplicateCheck = false;
    const property = this.property;
    this.os.updatePropertyIcon(property);
    // add the entity to the ontology
    this.os.addEntity(property);
    // update lists
    this.os.listItem.annotations.iris[property['@id']] = this.os.listItem.ontologyId;
    this.os.listItem.annotations.flat = this.os.flattenHierarchy(this.os.listItem.annotations);
    // Update InProgressCommit
    this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, property);
    // Save the changes to the ontology
    this.os.saveCurrentChanges().subscribe(() => {
      // Open snackbar
      this.os.openSnackbar(property['@id']);
    }, () => {
    });
    // hide the overlay
    this.dialogRef.close();
  }
}
