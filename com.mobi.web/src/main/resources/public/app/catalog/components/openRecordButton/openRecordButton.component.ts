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
import { Component, Inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { find, get } from 'lodash';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { CATALOG, DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { Difference } from '../../../shared/models/difference.class';
import { EntityNamesItem } from '../../../shared/models/entityNamesItem.interface';
import { getDctermsValue, getPropertyId, handleError } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { RecordSelectFiltered } from '../../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { WorkflowsStateService } from '../../../workflows/services/workflows-state.service';

/**
 * @class catalog.OpenRecordButtonComponent
 *
 * A component which creates an Open Record button that will open the provided record in the appropriate module.
 *
 * @param {JSONLDObject} record The record to open
 * @param {boolean} flat Whether the button should be flat
 * @param {boolean} stopProp Whether propagation should be stopped on click event
 */
@Component({
  selector: 'open-record-button',
  templateUrl: './openRecordButton.component.html'
})
export class OpenRecordButtonComponent <TData extends VersionedRdfListItem>{
  recordType = '';
  showButton = false;
  isEntityRecord: boolean;
  hasCommitInProgress: boolean;
  isOpened = false;
  inProgressMsg = 'Cannot switch branches while there are uncommitted changes';

  @Input() flat: boolean;
  @Input() stopProp: boolean;

  constructor(private _router: Router,
              private _cm: CatalogManagerService,
              private _cs: CatalogStateService,
              private _ds: DatasetStateService,
              private _ms: MapperStateService,
              private _os: OntologyStateService,
              private _pep: PolicyEnforcementService,
              private _pm: PolicyManagerService,
              private _sgs: ShapesGraphStateService,
              private _wss: WorkflowsStateService,
              private _toast: ToastService,
              @Inject(stateServiceToken) public state: VersionedRdfState<TData>
  ) {}

  private _record;

  get record(): JSONLDObject {
    return this._record;
  }

  @Input() set record(value: JSONLDObject) {
    this._record = value;
    this.handleRecordUpdate();
  }

  /**
   * Method that gets called when the button is clicked. Handles if the button should stop propagation. Checks record
   * read permission before attempting to open and calls different methods depending on whether the button is used in 
   * the Catalog or Entity Search pages.
   * 
   * @param {MouseEvent} event The click event.
   */
  openRecord(event: MouseEvent): void {
    if (this.stopProp) {
      event.stopPropagation();
    }

    this._canRead().subscribe(canRead => {
      if (canRead) {
        if (this.isEntityRecord) {
          if (this.state.listItem) {
            this.state.listItem.changesPageOpen = false;
          }
          this.updateEntityRecord();
        } else {
          this.navigateToRecord();
        }
      } else {
        this._toast.createErrorToast('You do not have permission to read this record. Please refresh your search '
          + 'results');
      }
    });
  }

  /**
   * Navigates to the module for the record based on the value of recordType. Displays a warning if no module is
   * available.
   */
  navigateToRecord(): void {
    switch (this.recordType) {
      case `${ONTOLOGYEDITOR}OntologyRecord`:
        this.openOntology();
        break;
      case `${DELIM}MappingRecord`:
        this.openMapping();
        break;
      case `${DATASET}DatasetRecord`:
        this.openDataset();
        break;
      case `${SHAPESGRAPHEDITOR}ShapesGraphRecord`:
        this.openShapesGraph();
        break;
      case `${WORKFLOWS}WorkflowRecord`:
        this.openWorkflow();
        break;
      default:
        this._toast.createWarningToast(`No module for record type ${this.recordType}`);
    }
  }

  /**
   * Opens an Ontology Record by navigating to the module and either opening the record or just selecting it if already
   * opened.
   */
  openOntology(): void {
    this._router.navigate(['/ontology-editor']);
    const listItem: OntologyListItem = find(this._os.list, {versionedRdfRecord: {recordId: this.record['@id']}});
    if (listItem) {
      this._os.listItem = listItem;
      this._handleOntologyRecord();
    } else {
      const recordSelect: RecordSelectFiltered = {
        recordId: this.record['@id'],
        title: getDctermsValue(this.record, 'title'),
        description: getDctermsValue(this.record, 'description'),
        identifierIRI: this._os.getIdentifierIRI(this.record)
      };
      this._os.open(recordSelect).subscribe(() => {
        this._handleOntologyRecord();
      }, error => this._toast.createErrorToast(error));
    }
  }

  /**
   * Opens a MappingRecord by navigating to the module and searching for the record's title.
   */
  openMapping(): void {
    this._ms.paginationConfig.searchText = getDctermsValue(this.record, 'title');
    this._router.navigate(['/mapper']);
  }

  /**
   * Opens a DatasetRecord by navigating to the module and searching for the record's title.
   */
  openDataset(): void {
    this._ds.paginationConfig.searchText = getDctermsValue(this.record, 'title');
    this._router.navigate(['/datasets']);
  }

  /**
   * Opens a Shapes Graph Record by navigating to the module and either opening the record or just selecting it if
   * already opened.
   */
  openShapesGraph(): void {
    this._router.navigate(['/shapes-graph-editor']);
    const listItem: ShapesGraphListItem = find(this._sgs.list, {versionedRdfRecord: {recordId: this.record['@id']}});
    if (listItem) {
      this._sgs.listItem = listItem;
      this._handleShapesGraphRecord();
    } else {
      const recordSelect: RecordSelectFiltered = {
        recordId: this.record['@id'],
        title: getDctermsValue(this.record, 'title'),
        description: getDctermsValue(this.record, 'description'),
        identifierIRI: this._sgs.getIdentifierIRI(this.record)
      };
      this._sgs.open(recordSelect).subscribe(
        () => {
          this._handleShapesGraphRecord();
        },
        error => this._toast.createErrorToast(error));
    }
  }

  /**
   * Opens a WorkflowRecord by navigating to the module and selecting the record.
   */
  openWorkflow(): void {
    this._wss.convertJSONLDToWorkflowSchema(this.record).subscribe(schema => {
      this._wss.selectedRecord = schema;
      this._router.navigate(['/workflows']);
    });
  }

  /**
   * Updates variables on the component based on the provided record. Meant to be called when the input record changes.
   */
  handleRecordUpdate(): void {
    this.recordType = this._cs.getRecordType(this.record);
    if (this.record) {
      this.isEntityRecord = Object.prototype.hasOwnProperty.call(this.record, 'entityIRI');
      this._canRead().subscribe(canRead => {
        this.showButton = canRead;
      });
    } else {
      this.isEntityRecord = false;
      this.showButton = false;
    }
  }

  /**
   * Updates the record provided by the Entity Search page with the rest of the Record metadata from the backend then
   * proceeds with opening the record in the appropriate module.
   */
  updateEntityRecord(): void {
    const recordId = this.record['@id'];
    const catalogId = this._getCatalogId();
    this._cm.getRecord(recordId, catalogId).pipe(
      switchMap(recordArr => {
        if (recordArr && recordArr.length > 0) {
          this.record = {...this.record, ...recordArr[0]};
          return this._cm.getInProgressCommit(recordId, catalogId)
            .pipe(
              catchError((error) => this._handleCommitError(error))
            );
        } else {
          this._toast.createErrorToast('Fetched record data was empty. Please refresh your search results and '
            + 'try again');
          return EMPTY;
        }
      })
    ).subscribe({
      next: diff => this._handleUpdateEntityRecordSuccess(diff),
      error: errorMsg => {
        this._toast.createErrorToast(`Error fetching record: ${errorMsg}`);
      }
    });
  }

  /**
   * Handle the HTTP error response when trying to commit data. If there is no In Progress Commit, navigates to the
   * record.
   *
   * @param {HttpErrorResponse} err - The HTTP error response object.
   * @return {Observable} An Observable that errors with the HTTP error response or an EMPTY Observable.
   */
  private _handleCommitError(err: HttpErrorResponse): Observable<never> {
    if (err.status === 404) {
      this.hasCommitInProgress = false;
      this.navigateToRecord();
      // Stop subsequent requests
      return EMPTY;
    } else {
      return handleError(err);
    }
  }

  /**
   * Handles the success response from the updateEntityRecord observables given a nullable Difference object.
   * A null Difference indicates no further processing is necessary, either due to an error or because the record has
   * already been opened. If the Difference is not null and has changes, opens the record.
   *
   * @private
   * @param {Difference} data - The response data containing deletions and additions.
   */
  private _handleUpdateEntityRecordSuccess(data: Difference): void {
    if (data.deletions.length > 0 || data.additions.length > 0) {
      this.hasCommitInProgress = true;
      this.navigateToRecord();
    }
  }

  /**
   * Handles opening an OntologyRecord based on whether the component is in the Catalog or Entity Search page.
   * If on the Entity Search page, it checks for specific conditions and performs actions accordingly.
   * If on the Catalog page, it does nothing.
   *
   * @private
   */
  private _handleOntologyRecord(): void {
    if (this.isEntityRecord) {
      if (this.hasCommitInProgress) {
        this._commitInProgressNavigator();
      } else {
        this._navigateToEntity();
      }
    }
  }

  /**
   * Handles opening a ShapesGraphRecord based whether the component is in the Catalog or Entity Search page.
   * If on the Entity Search page, it checks for specific conditions and performs actions accordingly.
   * If on the Catalog page, it does nothing.
   * 
   * @private
   */
  private _handleShapesGraphRecord(): void {
    if (this.isEntityRecord) {
      const isMaster = this._sgs.listItem?.versionedRdfRecord.branchId === this._getRecordMasterBranchIri();
      this.isOpened = !!this._sgs?.listItem?.currentVersionTitle;
      if (!isMaster && !this.hasCommitInProgress) {
        this._switchToMasterBranch();
      } else {
        if (this.hasCommitInProgress) {
          this._toast.createWarningToast(this.inProgressMsg);
        }
      }
    }
  }

  /**
   * Method to navigate to in-progress items and show error toast if pending changes exist.
   * 
   * @private
   */
  private _commitInProgressNavigator(): void {
    this._os.goTo(this.record.entityIRI);
    this._toast.createWarningToast(this.inProgressMsg);
  }

  /**
   * Navigates to the provided service's entity based on certain conditions.
   * 
   * @private
   */
  private _navigateToEntity(): void {
    const isMaster = this._os.listItem?.versionedRdfRecord.branchId === this._getRecordMasterBranchIri();
    this.isOpened = !!this._os?.listItem?.currentVersionTitle;

    if (this._getEntityInformation()) {
      isMaster ?
        this._os.goTo(this.record.entityIRI) :
        this._switchToMasterBranch();
    } else {
      this._toast.createErrorToast('The entity does not exist anymore');
    }
  }

  /**
   * Switches the current record to the master branch version using the specified service.
   * 
   * @private
   */
  private _switchToMasterBranch(): void {
    const recordId = this.record['@id'];
    const masterBranch = this._getRecordMasterBranchIri();
    this._cm.getRecordBranch('master', this.record['@id'], this._getCatalogId()).pipe(
      switchMap((branch) => {
        return this._getService().changeVersion(
          recordId,
          masterBranch,
          getPropertyId(branch, `${CATALOG}head`),
          null,
          'MASTER',
          true,
          false,
          false
        );
      })
    ).subscribe(() => {
      this._resolveDestination();
    }, error => this._toast.createErrorToast(error));
  }

  /**
   * Retrieves information about the entity on the record using the OntologyStateService.
   *
   * @private
   * @return {EntityNamesItem} - The entity information if found.
   */
  private _getEntityInformation(): EntityNamesItem {
    return this._os.getEntityByRecordId(this.record['@id'], this.record.entityIRI);
  }

  /**
   * Gets the IRI of the master branch for the record.
   *
   * @private
   * @return {string} The IRI of the master branch.
   */
  private _getRecordMasterBranchIri(): string {
    return this.record[`${CATALOG}masterBranch`][0]['@id'];
  }

  /**
   * Gets the ID of the local catalog from the CatalogManagerService.
   * 
   * @private
   * @return {string} The IRI of the local catalog.
   */
  private _getCatalogId(): string {
    return get(this._cm.localCatalog, '@id');
  }

  /**
   * Checks whether the record type is an OntologyRecord.
   *
   * @private
   * @return {boolean} true if the record type is an OntologyRecord, false otherwise
   */
  private _isOntologyRecord(): boolean {
    return this.recordType === `${ONTOLOGYEDITOR}OntologyRecord`;
  }

  /**
   * Retrieves the appropriate state service based on the type of record.
   *
   * @private
   * @returns {OntologyStateService|ShapesGraphStateService} The service instance.
   */
  private _getService(): OntologyStateService | ShapesGraphStateService {
    return this._isOntologyRecord() ? this._os : this._sgs;
  }

  /**
   * ONLY USED FOR ONTOLOGY RECORDS AND SHAPES GRAPH RECORDS.
   * Resolves the destination based on whether the current record is an ontology record or not.
   * If it is an ontology record, navigates to the entity. Otherwise, opens the shapes graph.
   * Displays a warning toast if the destination is successfully resolved and the page is opened.
   *
   * @private
   */
  private _resolveDestination(): void {
    if (!this._isOntologyRecord()) {
      this._displayWarningIfEntityOpened();
    } else if (this._getEntityInformation()) {
        this._os.goTo(this.record.entityIRI);
        this._displayWarningIfEntityOpened();
    } else {
      this._toast.createWarningToast('The selected entity no longer exists in MASTER');
    }
  }

  /**
   * Method to display a warning toast if entity is opened.
   * 
   * @private
   */
  private _displayWarningIfEntityOpened(): void {
    if (this.isOpened) {
      this._toast.createWarningToast('Switching to MASTER.');
    }
  }

  /**
   * Checks whether the current user can read the record and returns an Observable with the boolean result.
   * 
   * @private
   * @returns {Observable} Resolves to true if the user can read the record or false if otherwise.
   */
  private _canRead(): Observable<boolean> {
    const request = {
      resourceId: this.record['@id'],
      actionId: this._pm.actionRead
    };
    return this._pep.evaluateRequest(request)
      .pipe(map(decision => decision !== this._pep.deny));
  }
}
