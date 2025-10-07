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
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { map, get, sortBy, remove, difference, includes, forEach, concat, find, cloneDeep } from 'lodash';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';

import { CATALOG, DATASET } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Repository } from '../../../shared/models/repository.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyDetails } from '../../models/ontologyDetails.interface';
import { getDctermsValue, getPropertyId, getPropertyValue, getSkolemizedIRI, setPropertyId, setPropertyValue, updateDctermsValue } from '../../../shared/utility';

/**
 * @class datasets.EditDatasetOverlayComponent
 *
 * A component that creates content for a modal with a form containing fields for editing an existing Dataset Record.
 * The form contains fields for the title, description, keywords, and
 * {@link datasets.DatasetsOntologyPickerComponent ontologies to be linked} to the Dataset Record. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
  selector: 'edit-dataset-overlay',
  templateUrl: './editDatasetOverlay.component.html',
  styleUrls: ['./editDatasetOverlay.component.scss']
})
export class EditDatasetOverlayComponent implements OnInit {
  // If an error is detected, then emits event. Use to cancel inprogress requests in init phase
  private _initErrorDetectionSub$ = new Subject<void>();
  // Flag is used to let child components that component finished init phase
  readyFlag = false;
  catalogId = '';
  error = '';
  datasetIRI = '';
  repositoryId = '';
  repository: Repository;
  keywords = [];
  selectedOntologies: OntologyDetails[] = [];
  editDatasetForm: UntypedFormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    keywords: [[]]
  });

  constructor(private dialogRef: MatDialogRef<EditDatasetOverlayComponent>, private fb: UntypedFormBuilder,
    public state: DatasetStateService, public dm: DatasetManagerService, public cm: CatalogManagerService,
    private toast: ToastService, private rm: RepositoryManagerService) { }

  ngOnInit(): void {
    this.datasetIRI = getPropertyId(this.state.selectedDataset.record, `${DATASET}dataset`);
    this.repositoryId = getPropertyValue(this.state.selectedDataset.record, `${DATASET}repository`);
    this.catalogId = get(this.cm.localCatalog, '@id');
    const keywords: string[] = map(this.state.selectedDataset.record[`${CATALOG}keyword`], '@value');
    keywords.sort();

    this.editDatasetForm.patchValue({
      title: getDctermsValue(this.state.selectedDataset.record, 'title'),
      description: getDctermsValue(this.state.selectedDataset.record, 'description'),
      keywords: keywords
    });

    let nextCalled = false;
    let requestErrorFlag = false;
    this.rm.getRepository(this.repositoryId).subscribe({
      next: (repo: Repository) => {
        nextCalled = true;
        this.repository = repo;
        this.readyFlag = true;
      },
      error: () => {
        requestErrorFlag = true;
        console.warn('Could not retrieve repository');
      },
      complete: () => {
        if (!(nextCalled || requestErrorFlag)) {
          this.closeDialog(false);
          this._initErrorDetectionSub$.next();
          this._initErrorDetectionSub$.complete();
        }
      }
    }
    );

    const selectedOntologies = this.state.selectedDataset.identifiers
      .map(identifier => getPropertyId(identifier, `${DATASET}linksToRecord`));
    forkJoin(selectedOntologies.map(id => this.cm.getRecord(id, this.catalogId).pipe(
      takeUntil(this._initErrorDetectionSub$),
      catchError(error => of(error))
    ))).subscribe((responses: (JSONLDObject[] | string)[]) => {
      this.readyFlag = true;
      const foundRecords = responses.filter((res): res is JSONLDObject[] => typeof res !== 'string');
      const matchingRecords = foundRecords.map(response => find(response, mr => selectedOntologies.includes(mr['@id'])));
      this.selectedOntologies = sortBy(matchingRecords.map(record => ({
        recordId: record['@id'],
        ontologyIRI: this.getOntologyIRI(record),
        title: getDctermsValue(record, 'title'),
        selected: true,
        jsonld: record
      })), 'title');
    });
  }
  getOntologyIRI(record: JSONLDObject): string {
    return getPropertyId(record, `${CATALOG}trackedIdentifier`);
  }
  update(): void {
    const newRecord = cloneDeep(this.state.selectedDataset.record);
    updateDctermsValue(newRecord, 'title', this.editDatasetForm.controls.title.value.trim());
    updateDctermsValue(newRecord, 'description', this.editDatasetForm.controls.description.value.trim());
    newRecord[`${CATALOG}keyword`] = [];
    this.editDatasetForm.controls.keywords.value
      .forEach(kw => setPropertyValue(newRecord, `${CATALOG}keyword`, kw.trim()));

    const curOntologies = map(this.selectedOntologies, 'recordId');
    const oldOntologies = this.state.selectedDataset.identifiers
      .map(identifier => getPropertyId(identifier, `${DATASET}linksToRecord`));

    const newIdentifiers = Object.assign([], this.state.selectedDataset.identifiers);
    const added = difference(curOntologies, oldOntologies);
    const deleted = remove(newIdentifiers, identifier =>
      !includes(curOntologies, getPropertyId(identifier, `${DATASET}linksToRecord`)));

    forEach(deleted, identifier => {
      remove(newRecord[`${DATASET}ontology`], { '@id': identifier['@id'] });
    });

    let update$: Observable<null>;
    if (added.length > 0) {
      update$ = forkJoin(added.map(recordId => this.cm.getRecordBranch('master', recordId, this.catalogId)))
        .pipe(
          tap(responses => {
            responses.forEach((branch, idx) => {
              const id = getSkolemizedIRI();
              newIdentifiers.push(this._createBlankNode(id, added[idx], branch['@id'],
                getPropertyId(branch, `${CATALOG}head`)));
              setPropertyId(newRecord, `${DATASET}ontology`, id);
            });
          }),
          switchMap(() => {
            setPropertyId(newRecord, `${DATASET}ontology`, newIdentifiers[0]['@id']);
            return this._triggerUpdate(newRecord, newIdentifiers);
          })
        );
    } else {
      update$ = this._triggerUpdate(newRecord, newIdentifiers);
    }
    update$.pipe(
      tap(() => this.closeDialog(true)),
      catchError(error => {
        this.error = error;
        return of(null);
      })
    ).subscribe();
  }

  private _createBlankNode(id: string, recordId: string, branchId: string, commitId: string): JSONLDObject {
    return {
      '@id': id,
      [`${DATASET}linksToRecord`]: [{ '@id': recordId }],
      [`${DATASET}linksToBranch`]: [{ '@id': branchId }],
      [`${DATASET}linksToCommit`]: [{ '@id': commitId }]
    };
  }
  private _triggerUpdate(newRecord: JSONLDObject, newIdentifiers): Observable<null> {
    const jsonld = concat(newIdentifiers, newRecord);
    // Send unparsed object to the update endpoint.
    return this.dm.updateDatasetRecord(newRecord['@id'], this.catalogId, jsonld).pipe(
      tap(() => {
        this.toast.createSuccessToast('Dataset successfully updated');
        this.state.selectedDataset.identifiers = newIdentifiers;
        this.state.selectedDataset.record = newRecord;
      })
    );
  }
  closeDialog(closeFlag: boolean): void {
    if (closeFlag) {
      this.readyFlag = false;
      this.dialogRef.close(closeFlag);
    }
  }
}
