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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { distinctUntilChanged, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { union, unionBy } from 'lodash';

import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { DCTERMS, RDFS, SH } from '../../../prefixes';
import { EXPLICIT_TARGETS } from '../../models/constants';
import { FormState } from '../shacl-target/shacl-target.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { REGEX } from '../../../constants';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';

/**
 * Form controls for creating a SHACL NodeShape.
 *
 * @property {FormControl<string>} iri IRI of the NodeShape.
 * @property {FormControl<string>} title Title of the NodeShape.
 * @property {FormControl<string>} description Description of the NodeShape.
 * @property {FormControl<string>} isTargetValid Validity state of the target component (Virtual Control).
 */
interface CreateFormControls {
  iri: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  isTargetValid: FormControl<boolean>;
}

/**
 * @class CreateNodeShapeModalComponent
 * @requires CamelCasePipe
 * @requires MatDialogRef
 * @requires FormBuilder
 * @requires ShapesGraphStateService
 * 
 * Represents a modal dialog component used to create new SHACL NodeShape entities.
 * It provides form fields for the IRI, title, and description of the NodeShape,
 * and integrates with a child component for defining the SHACL target.
 */
@Component({
  selector: 'app-create-node-shape-modal',
  templateUrl: './create-node-shape-modal.component.html'
})
export class CreateNodeShapeModalComponent implements OnInit, OnDestroy {
  createForm: FormGroup<CreateFormControls>;
  iriHasChanged = false;
  iriBegin = '';
  iriThen = '';
  /** The current JSON-LD representation of the node shape being built. */
  currentNodeShape?: JSONLDObject;
  /** The JSON-LD representation of the target, received from the child component. */
  targetJsonLd?: JSONLDObject;
  isImported = true;
  canModify = false;
  versionedRdfRecord: VersionedRdfRecord;
  annotationType = DCTERMS;

  private _destroySub$ = new Subject<void>();

  constructor(
    private _camelCasePipe: CamelCasePipe,
    private _fb: FormBuilder,
    private _dialogRef: MatDialogRef<CreateNodeShapeModalComponent>,
    public sm: SettingManagerService,
    public stateService: ShapesGraphStateService
  ) {
    const validators = [
      Validators.required,
      Validators.pattern(REGEX.IRI),
      this.stateService.getDuplicateValidator()
    ];
    this.createForm = this._fb.group({
      iri: ['', validators],
      title: ['', Validators.required],
      description: [''],
      isTargetValid: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.isImported = this.stateService.isSelectedImported();
    this.canModify = this.stateService.canModify();
    this.versionedRdfRecord = this.stateService.listItem.versionedRdfRecord;
    this.createForm.controls.iri.setValue(
      this.stateService.getDefaultPrefix(this.iriBegin, this.iriThen)
    );
    this.currentNodeShape = this.generateNodeShape();
    this.createForm.controls.title.valueChanges
      .pipe(
        takeUntil(this._destroySub$),
        distinctUntilChanged(),
        filter((newTitle: string) => newTitle !== null)
      ).subscribe((newTitle: string) => {
        this.updateIriBasedOnTitle(newTitle);
      });
    this.sm.getAnnotationPreference().subscribe(preference => {
      this.annotationType = preference === 'DC Terms' ? DCTERMS : RDFS;
    }, error => {
      this.annotationType = DCTERMS;
      console.error(error);
    });
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /**
   * Updates the IRI form control based on the provided title, but only if the user
   * has not manually edited the IRI field.
   * @param title The new title to base the IRI on.
   */
  updateIriBasedOnTitle(title: string): void {
    if (!this.iriHasChanged && title) {
      const split = splitIRI(this.createForm.controls.iri.value);
      const newIri = split.begin + split.then + this._camelCasePipe.transform(title, 'class');
      this.createForm.controls.iri.setValue(newIri, { emitEvent: false });
      this.currentNodeShape = this.generateNodeShape();
    }
  }

  /**
   * Handles state changes from the child shacl-target component.
   * Updates the internal state with the validity and JSON-LD representation of the target.
   * @param formState The new state of the target form.
   */
  onTargetChanges(formState: FormState): void {
    this.targetJsonLd = formState.value;
    this.currentNodeShape = this.generateNodeShape();
    this.createForm.controls.isTargetValid.setValue(formState.isValid);
  }

  /**
   * Generates the JSON-LD representation of the node shape based on the current form values
   * and merges it with the target shape if available.
   * @returns The generated JSONLDObject for the node shape.
   */
  generateNodeShape(): JSONLDObject {
    const { iri, title, description } = this.createForm.value;
    const labelIRI = this.annotationType === DCTERMS ? `${this.annotationType}title` : `${this.annotationType}label`;
    const descIRI = this.annotationType === DCTERMS ? `${this.annotationType}description` : `${this.annotationType}comment`;
    const nodeShapeJsonLd: JSONLDObject = {
      '@id': iri,
      '@type': [`${SH}NodeShape`],
      [labelIRI]: [{ '@value': title }]
    };
    if (description) {
      nodeShapeJsonLd[descIRI] = [{ '@value': description }];
    }
    if (this.targetJsonLd) {
      return this.mergeTargetJsonLd(nodeShapeJsonLd, this.targetJsonLd);
    } else {
      return nodeShapeJsonLd;
    }
  }

  /**
   * Merges properties from the addition object into the source object by mutation.
   *
   * @param source The JSON-LD object to be updated (will be mutated).
   * @param addition The JSON-LD object containing the new data to merge.
   */
  mergeTargetJsonLd(source: JSONLDObject, addition: JSONLDObject): JSONLDObject {
    const result: JSONLDObject = { ...source };
    for (const prop of EXPLICIT_TARGETS) {
      if (Array.isArray(addition[prop])) {
        result[prop] = unionBy(source[prop] || [], addition[prop], '@id');
      }
    }
    if (Array.isArray(addition['@type'])) {
      result['@type'] = union(source['@type'] || [], addition['@type']);
    }
    return result;
  }

  /**
   * Callback for when the user manually edits the IRI in a child component.
   * Disables automatic IRI generation and updates the form.
   * @param iriBegin - The base part of the IRI.
   * @param iriThen - The main part of the IRI.
   * @param iriEnd - The local name of the IRI.
   */
  onIriEdit(iriBegin: string, iriThen: string, iriEnd: string): void {
    this.iriHasChanged = true;
    this.iriBegin = iriBegin;
    this.iriThen = iriThen;
    this.createForm.controls.iri.setValue(iriBegin + iriThen + iriEnd);
    this.currentNodeShape = this.generateNodeShape();
  }

  /**
   * Saves the newly created node shape.
   */
  save(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const versionedRdfRecord: VersionedRdfRecord = this.stateService.listItem.versionedRdfRecord;
    const nodeShape = this.generateNodeShape();
    this.stateService.addEntity(nodeShape);
    this.stateService.addToAdditions(versionedRdfRecord.recordId, nodeShape);
    this.stateService.saveCurrentChanges().subscribe(() => {
      this.stateService.openSnackbar(nodeShape['@id']);
      this._dialogRef.close(nodeShape);
    });
  }
}
