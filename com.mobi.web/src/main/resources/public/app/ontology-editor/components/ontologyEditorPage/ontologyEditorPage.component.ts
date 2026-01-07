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
import { ActivatedRoute, Router } from '@angular/router';
import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { catchError, switchMap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { getDctermsValue } from '../../../shared/utility';
import { ONTOLOGYEDITOR } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class OntologyEditorPageComponent
 *
 * A component that creates a `div` containing the main components of the Ontology Editor.
 * These components are {@link EditorTopBarComponent}, {@link MergePageComponent}, {@link ChangesPageComponent},
 * and {@link OntologyTabComponent} with the {@link shared.OntologyStateService#listItem currently selected open
 * ontology}.
 */
@Component({
  selector: 'ontology-editor-page',
  templateUrl: './ontologyEditorPage.component.html',
  styleUrls: ['./ontologyEditorPage.component.scss'],
  providers: [
    {
      provide: stateServiceToken,
      useExisting: OntologyStateService
    }
  ]
})
export class OntologyEditorPageComponent implements OnInit, OnDestroy, DoCheck {
  private previousRecordIRI: string | undefined;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _cm: CatalogManagerService,
    private _toast: ToastService,
    private _location: Location,
    public state: OntologyStateService) {
  }

  /**
   * Initializes the component by subscribing to query parameters from the route.
   *
   * Will attempt to open the linked ontology record if a record id has been passed in as a query parameter. If no id has been
   * passed in, the record id stored in the {@link OntologyStateService#listItem} will be used.
   * If no matching record is found, it navigates to the ontology editor page and creates an error notification.
   */
  ngOnInit() {
    this._route.queryParams.subscribe(params => {
      const recordIRI = params['id'];
      if (recordIRI) {
        const item = this.state.list.find(record => record.versionedRdfRecord.recordId === recordIRI);
        let openingObservable: Observable<any>;
        if (item) {
          if (this.state.listItem?.versionedRdfRecord.recordId !== recordIRI) {
            this.state.listItem = item;
          }
          openingObservable = of(null);
        } else {
          openingObservable = this.openRecord(recordIRI);
        }
        openingObservable.subscribe(
          () => {},
          error => {
            this._toast.createErrorToast(error);
            this._router.navigate(['/ontology-editor']);
            this.state.listItem = undefined;
          });
      } else if (this.state.listItem?.versionedRdfRecord.recordId) {
        this._location.replaceState('/ontology-editor', `id=${encodeURIComponent(this.state.listItem?.versionedRdfRecord.recordId)}`);
      }
    });
  }

  /**
   * A lifecycle hook that Angular calls during every change detection run.
   *
   * Currently, runs a check to see if the selected ontology in the {@link OntologyStateService#listItem} has changed.
   * If it has, the component updates the URL to reflect the new record id.
   */
  ngDoCheck(): void {
    if (this.state.listItem && this.state.listItem.versionedRdfRecord.recordId !== this.previousRecordIRI) {
      this.previousRecordIRI = this.state.listItem.versionedRdfRecord.recordId;
      this._location.replaceState('/ontology-editor', `id=${encodeURIComponent(this.state.listItem?.versionedRdfRecord.recordId)}`);
    }
  }

  ngOnDestroy(): void {
    this.state.snackBar.dismiss();
  }

  private openRecord(recordId: string): Observable<any> {
    return this._cm.getRecord(recordId, this._cm.localCatalog['@id']).pipe(
      switchMap(record => {
        if (!record || record.length === 0) {
          throw new Error('Record not found');
        } else if (!record[0]['@type'].includes(`${ONTOLOGYEDITOR}OntologyRecord`)) {
          throw new Error('Could not open record as it is not an ontology.');
        }
        const transformedRecord = {
          recordId: record[0]['@id'],
          title: getDctermsValue(record[0], 'title'),
          identifierIRI: this.state.getIdentifierIRI(record[0]),
          description: getDctermsValue(record[0], 'description')
        };
        return this.state.open(transformedRecord);
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }
}
