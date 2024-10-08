/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, Input } from '@angular/core';
import { find, get } from 'lodash';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { RecordSelectFiltered } from '../../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { CATALOG, DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { getDctermsValue, getPropertyId, handleError } from '../../../shared/utility';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { WorkflowsStateService } from '../../../workflows/services/workflows-state.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { Difference } from '../../../shared/models/difference.class';
import { EntityNamesItem } from '../../../shared/models/entityNamesItem.interface';

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
export class OpenRecordButtonComponent {
  recordType = '';
  showButton = false;
  isEntityRecord: boolean;
  hasCommitInProgress: boolean;
  isOpened = false;

  @Input() flat: boolean;
  @Input() stopProp: boolean;

  constructor(private _router: Router,
              private _cm: CatalogManagerService,
              private _cs: CatalogStateService,
              private _ms: MapperStateService,
              private _os: OntologyStateService,
              private _pep: PolicyEnforcementService,
              private _pm: PolicyManagerService,
              private _sgs: ShapesGraphStateService,
              private _wss: WorkflowsStateService,
              private _toast: ToastService) {
  }

  private _record;

  get record(): JSONLDObject {
    return this._record;
  }

  @Input() set record(value: JSONLDObject) {
    this._record = value;
    this.update();
  }

  openRecord(event: MouseEvent): void {

    if (this.stopProp) {
      event.stopPropagation();
    }

    if (this.isEntityRecord) {
      this.updateEntityRecord();
    } else {
      this.navigateToRecord();
    }
  }

  /**
   * Navigates to the specified record type based on the value of this.recordType.
   * Opens the corresponding module or displays a warning if no module is available.
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
        this._toast.createWarningToast('No module for record type ' + this.recordType);
    }
  }

  openOntology(): void {
    this._router.navigate(['/ontology-editor']);
    const listItem: OntologyListItem = find(this._os.list, {versionedRdfRecord: {recordId: this.record['@id']}});
    if (listItem) {
      this._os.listItem = listItem;
      this._handleEntityRecords();
    } else {
      const recordSelect: RecordSelectFiltered = {
        recordId: this.record['@id'],
        title: getDctermsValue(this.record, 'title'),
        description: getDctermsValue(this.record, 'description'),
        identifierIRI: this._os.getIdentifierIRI(this.record)
      };
      this._os.open(recordSelect).subscribe(() => {
        this._handleEntityRecords();
      }, error => this._toast.createErrorToast(error));
    }
  }

  openMapping(): void {
    this._ms.paginationConfig.searchText = getDctermsValue(this.record, 'title');
    this._router.navigate(['/mapper']);
  }

  openDataset(): void {
    this._router.navigate(['/datasets']);
  }

  openShapesGraph(): void {
    this._router.navigate(['/shapes-graph-editor']);
    const listItem: ShapesGraphListItem = find(this._sgs.list, {versionedRdfRecord: {recordId: this.record['@id']}});
    if (listItem) {
      this._sgs.listItem = listItem;
    } else {
      const recordSelect: RecordSelectFiltered = {
        recordId: this.record['@id'],
        title: getDctermsValue(this.record, 'title'),
        description: getDctermsValue(this.record, 'description'),
        identifierIRI: this._sgs.getIdentifierIRI(this.record)
      };
      this._sgs.open(recordSelect).subscribe(() => {
      }, error => this._toast.createErrorToast(error));
    }
  }

  openWorkflow(): void {
    this._wss.convertJSONLDToWorkflowSchema(this.record).subscribe(schema => {
      this._wss.selectedRecord = schema;
      this._router.navigate(['/workflows']);
    });
  }

  update(): void {
    this.recordType = this._cs.getRecordType(this.record);
    this.isEntityRecord = Object.prototype.hasOwnProperty.call(this.record, 'entityIRI');
    if (this.recordType === `${ONTOLOGYEDITOR}OntologyRecord`) {
      const request = {
        resourceId: this.record['@id'],
        actionId: this._pm.actionRead
      };
      this._pep.evaluateRequest(request).subscribe(decision => {
        this.showButton = decision !== this._pep.deny;
      });
    } else {
      this.showButton = true;
    }
  }

  /**
   * Updates the entity record.
   */
  updateEntityRecord(): void {
    const recordId = this.record['@id'];
    const catalogId = this._getCatalogId();
    this._cm.getRecord(recordId, catalogId).pipe(
      switchMap((records) => {
        if (records && records.length > 0) {
          this.record = {...this.record, ...records[0]};
          return this._cm.getInProgressCommit(recordId, catalogId)
            .pipe(
              catchError((error) => this._handleCommitError(error))
            );
        } else {
          return of(null);
        }
      }),
      catchError((response: HttpErrorResponse) => {
        console.error('Error fetching record:');
        // Stop subsequent requests if fetching record fails
        return of(null);
      })
    ).subscribe(this._handleSuccess.bind(this));
  }

  private _handleCommitError(err: HttpErrorResponse): Observable<HttpErrorResponse> {
    if (err.status === 404) {
      this.hasCommitInProgress = false;
      this.navigateToRecord();
      return of(null);
    } else {
      return handleError(err);
    }
  }

  private _handleSuccess(data: Difference) {
    if (data && (data?.deletions.length > 0 || data.additions.length > 0)) {
      this.hasCommitInProgress = true;
      this.navigateToRecord();
    }
  }

  /**
   * Handles entity records.
   *
   * @private
   * @return {void}
   */
  private _handleEntityRecords(): void {
    if (this.isEntityRecord) {
      if (this.hasCommitInProgress) {
        this._commitInProgressNavigator();
      } else {
        this._navigateToEntity();
      }
    }
  }

  /**
   * Method to navigate to in-progress items and show error toast if pending changes exist.
   */
  private _commitInProgressNavigator(): void {
    this._os.goTo(this.record.entityIRI);
    this._toast.createWarningToast('Can not switch branches while there are uncommited changes');
  }

  /**
   * Navigates to the provided service's entity based on certain conditions.
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
   * @return {void}
   */
  private _switchToMasterBranch(): void {
    const recordId = this.record['@id'];
    const masterBranch = this._getRecordMasterBranchIri();
    this._cm.getRecordMasterBranch(this.record['@id'], this._getCatalogId()).pipe(
      switchMap((branch) => {
        return this._os.changeVersion(
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
    )
      .subscribe(() => {
        if (this._getEntityInformation()) {
          this._os.goTo(this.record.entityIRI);
          if (this.isOpened) {
            this._toast.createWarningToast('Master branch has been checked out.');
          }
        } else {
          this._toast.createWarningToast('The entity does not exist in master');
        }
      }, error => this._toast.createErrorToast(error));
  }

  /**
   * Confirms the existence of an entity based on the provided service.
   *
   * @return {EntityNamesItem} - The entity information if found.
   */
  private _getEntityInformation(): EntityNamesItem {
    return this._os.getEntityByRecordId(this.record['@id'], this.record.entityIRI);
  }

  /**
   * Gets the IRI of the master branch for the record.
   *
   * @private
   * @return {void} The IRI of the master branch.
   */
  private _getRecordMasterBranchIri(): string {
    return this.record[`${CATALOG}masterBranch`][0]['@id'];
  }

  private _getCatalogId() {
    return get(this._cm.localCatalog, '@id');
  }
}
