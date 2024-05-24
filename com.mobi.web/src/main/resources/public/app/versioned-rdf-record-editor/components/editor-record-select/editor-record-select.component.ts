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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { HttpResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { find, forEach, get, remove, isEmpty } from 'lodash';
import { Observable, from, of, throwError } from 'rxjs';
import { map, startWith, switchMap, catchError, finalize } from 'rxjs/operators';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { XACMLDecision } from '../../../shared/models/XACMLDecision.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { RecordSelectFiltered } from '../../models/record-select-filtered.interface';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DCTERMS, POLICY, RDF } from '../../../prefixes';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getBeautifulIRI, getDctermsValue } from '../../../shared/utility';
import { XACMLRequest } from '../../../shared/models/XACMLRequest.interface';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { NewRecordModalComponent } from '../new-record-modal/new-record-modal.component';
import { UploadRecordModalComponent } from '../upload-record-modal/upload-record-modal.component';
import { DownloadRecordModalComponent } from '../download-record-modal/download-record-modal.component';

export interface OptionGroup {
  title: string,
  options: string[] | RecordSelectFiltered[]
}

/**
 * @class versioned-rdf-record-editor.EditorRecordSelectComponent
 *
 * `editor-record-select` is a component which creates a `mat-autocomplete` with options to change which record is open,
 * create a record, close records, and search record.
 * 
 * @param {string} recordIri The IRI of the selected Record in the autocomplete
 */
@Component({
  selector: 'app-editor-record-select',
  templateUrl: './editor-record-select.component.html',
  styleUrls: ['./editor-record-select.component.scss']
})
export class EditorRecordSelectComponent<TData extends VersionedRdfListItem> implements OnInit, OnChanges, AfterViewInit {
  @Input() recordIri: string;
  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('textInput', { static: true }) textInput: ElementRef;
  @ViewChild('editorRecordSelectSpinner', { static: true }) editorRecordSelectSpinner: ElementRef;
  @ViewChild('recordSelectFileInput', { static: true }) fileInput: ElementRef;

  typeName = splitIRI(this._state.type).end;
  beautifulTypeName = getBeautifulIRI(this._state.type).replace(' Record', '');
  recordSearchControl: UntypedFormControl = new UntypedFormControl();
  catalogId: string = get(this._cm.localCatalog, '@id', '');

  opened: RecordSelectFiltered[] = [];
  unopened: RecordSelectFiltered[] = [];

  recordSearchConfig: PaginatedConfig = {
    sortOption: find(this._cm.sortOptions, {field: `${DCTERMS}title`, asc: true}),
    type: this._state.type
  };
  spinnerId = `${this.typeName}-editor-record-select`;

  filteredOptions: Observable<OptionGroup[]>
  disabledFlag = false;
  
  constructor(@Inject(stateServiceToken) private _state: VersionedRdfState<TData>,
        private _dialog: MatDialog,
        private _toast: ToastService,
        private _spinnerSrv: ProgressSpinnerService,
        private _cm: CatalogManagerService,
        private _pm: PolicyManagerService,
        protected pep: PolicyEnforcementService,
        private _viewContainerRef: ViewContainerRef) {}
 
  ngOnInit(): void {
    this.retrieveRecords();
    this.setFilteredOptions();
    this.resetSearch();
    this.permissionCheck();
  }
  /**
   * If the selected record changes, resets the control value.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.recordIri) {
      this.resetSearch();
    }
  }
  /**
   * Sets up the handler to reset the control value when the focus moves off of the input.
   */
  ngAfterViewInit(): void {
    this.autocompleteTrigger.panelClosingActions.subscribe(e => {
      if (!(e && e.source)) {
        this.textInput.nativeElement.blur();
        this.resetSearch();
        this.autocompleteTrigger.closePanel();
      }
    });
  }
  /**
   * Returns the filtered list of options based on the provided search text. Search is done case insensitive and not
   * exact match. Will always return an "Open" group and an "Unopened" group.
   * 
   * @param {string} val The text to search with
   * @returns {OptionGroup[]} An array of options to use in the control
   */
  filter(val: string): OptionGroup[] {
    const filteredOpen = this.opened.filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
    const filteredUnopen = this.unopened.filter(option => option.title.toLowerCase().includes(val.toString().toLowerCase()));
    return [
      { title: 'Open', options: filteredOpen },
      { title: 'Unopened', options: filteredUnopen }
    ];
  }
  /**
   * Starts the process of creating a new record. First closes the autocomplete panel, then fetches the appropriate
   * default namespace for the type of record and opens the {@link versioned-rdf-record-editor.NewRecordModalComponent}.
   * 
   * @param {Event} event The button click event
   */
  create(event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this.resetSearch();
    this._state.getDefaultNamespace().subscribe(namespace => {
      this._dialog.open(NewRecordModalComponent, { 
        viewContainerRef: this._viewContainerRef,
        data: { defaultNamespace: namespace },
        autoFocus: false
      });
    });
  }
  /**
   * Starts the process of uploading a new record. First closes the autocomplete panel, then clicks the hidden file
   * input.
   * 
   * @param {Event} event The button click event
   */
  upload(event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this.resetSearch();
    this.fileInput.nativeElement.value = null;
    this.fileInput.nativeElement.click();
  }
  /**
   * Handler for when the file input receives new selected files. Opens the
   * {@link versioned-rdf-record-editor.UploadRecordModalComponent} with the provided Files.
   * 
   * @param {FileList} files The list of selected files from the file input
   */
  updateFiles(files: FileList): void {
    if (files) {
      this._dialog.open(UploadRecordModalComponent, {
          viewContainerRef: this._viewContainerRef,
          data: { files: Array.from(files) }
      });
    }
  }
  /**
   * Handles selecting a record. If the record is already open, simply sets the State service `listItem`. Otherwise,
   * calls the State service `open` method. Updates the control value and closes the autocomplete panel.
   * 
   * @param {MatAutocompleteSelectedEvent} event The event from the option selection
   */
  selectRecord(event: MatAutocompleteSelectedEvent): void {
    const record = event.option.value;
    const item = this._state.list.find(item => item.versionedRdfRecord.recordId === record.recordId);
    let ob;
    if (item) {
      this._state.listItem = item;
      ob = of(null);
    } else {
      ob = this._state.open(record);
    }
    ob.subscribe(() => {
      this.opened.push(record);
      remove(this.unopened, {recordId: record.recordId});
      this.textInput.nativeElement.blur();
      this.recordSearchControl.setValue(record.title);
      this.autocompleteTrigger.closePanel();
    }, error => this._toast.createErrorToast(error));
  }
  /**
   * Resets the control value based on whether a record has been selected in the State service.
   */
  resetSearch(): void {
    if (this?._state?.listItem?.versionedRdfRecord?.title) {
      this.recordSearchControl.setValue(this._state.listItem.versionedRdfRecord.title);
    } else {
      this.recordSearchControl.setValue('');
    }
  }
  /**
   * Fetches the list of records to be used as the starting point for all filtering in the autocomplete. Determines
   * which are already opened and fetches all necessary permissions for display. Checks whether the selected record in
   * the State Service has been deleted at the end.
   */
  retrieveRecords(): void {
     // Clears out unopened list to avoid deleted records appearing for a few seconds due to slow network speeds
    this.unopened = [];
    // Resets the form control, marking it pristine and untouched, and resetting the value.
    this.recordSearchControl.reset();
    this._spinnerSrv.startLoadingForComponent(this.editorRecordSelectSpinner, 15);
    this._cm.getRecords(get(this._cm.localCatalog, '@id'), this.recordSearchConfig, true)
      .pipe(
        switchMap((response: HttpResponse<JSONLDObject[]>) => {
          const openTmp: RecordSelectFiltered[] = [];
          const unopenedTmp: RecordSelectFiltered[] = [];
          forEach(response.body, (recordJsonld: JSONLDObject) => {
            const listItem = this._state.list.find(item => item.versionedRdfRecord.recordId === recordJsonld['@id']);
            if (listItem) {
              openTmp.push(this.getRecordSelectFiltered(recordJsonld));
            } else {
              unopenedTmp.push(this.getRecordSelectFiltered(recordJsonld));
            }
          });
          
          this.opened = openTmp;
          this.unopened = unopenedTmp;
          if (this.unopened.length !== 0) {
            const deleteRequest: XACMLRequest = {
              resourceId: this.unopened.map(record => record['recordId']),
              actionId: [this._pm.actionDelete]
            };
            return from(this.pep.evaluateMultiDecisionRequest(deleteRequest, true));
          } else {
            return of(null);
          }
        }),
        catchError(errorMessage => {
          this._toast.createErrorToast(errorMessage);
          return throwError(errorMessage);
        }),
        finalize(() => {
          this._spinnerSrv.finishLoadingForComponent(this.editorRecordSelectSpinner);
        }))
      .subscribe((decisions: XACMLDecision[]) => {
        if (!isEmpty(decisions)) {
          const recordsForbiddenToDelete = decisions.filter(decision => decision.decision === this.pep.deny).map(decision => decision['urn:oasis:names:tc:xacml:3.0:attribute-category:resource']);
          this.unopened.filter(item => recordsForbiddenToDelete.includes(item.recordId)).map((canNotDelete: RecordSelectFiltered) => {
            return canNotDelete.canNotDelete = true;
          });
        }
        this.checkRecordDeleted();
        this.setFilteredOptions();
      });
  }
  /**
   * Closes a record that has been opened. If it if the selected record in the State service, unsets it.
   * 
   * @param {string} recordIri The IRI of the record to close
   */
  closeRecord(recordIri: string): void {
    const closed = remove(this.opened, {recordId: recordIri})[0];
    this.unopened.push(<RecordSelectFiltered> closed);
    if (recordIri === this.recordIri) {
      this._state.listItem = undefined;
    }
    this._state.close(recordIri);
    this.setFilteredOptions();
  }
  /**
   * Opens the {@link versioned-rdf-record-editor.DownloadRecordModalComponent} for the provided record. Also closes the
   * autocomplete panel.
   * 
   * @param {RecordSelectFiltered} record A record option from the autocomplete to open
   * @param {Event} event The button click event
   */
  showDownloadOverlay(record: RecordSelectFiltered, event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this._dialog.open(DownloadRecordModalComponent, {
      viewContainerRef: this._viewContainerRef,
      data: {
        recordId: record.recordId,
        title: record.title
      }
    });
  }
  /**
   * Opens a confirmation modal for deleting the provided record. Also closes the autocomplete panel. If the
   * confirmation modal is accepted, deletes the record.
   * 
   * @param {RecordSelectFiltered} record A record option from the autocomplete to open
   * @param {Event} event The button click event 
   */
  showDeleteConfirmationOverlay(record: RecordSelectFiltered, event: Event): void {
    this.autocompleteTrigger.closePanel();
    event.stopPropagation();
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `<p>Are you sure you want to delete <strong>${record.title}</strong>?</p>`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.deleteRecord(record.recordId);
      }
    });
  }
  /**
   * Deletes the record identified by the provided IRI using the State service `delete` method.
   * 
   * @param {string} recordIri The IRI of the record to delete
   */
  deleteRecord(recordIri: string): void {
    this._state.delete(recordIri)
      .subscribe(() => {
        this._toast.createSuccessToast(`${recordIri} deleted successfully!`);
      }, errorMessage => this._toast.createErrorToast(errorMessage));
  }
  /**
   * A method used to calculate the string to display for a selected option.
   * 
   * @param {RecordSelectFiltered|string} option The option to calculate a display value for. Might also be the search
   *    text entered
   * @returns {string} The string to display in the control
   */
  displayWith(option: RecordSelectFiltered|string): string {
    return option ? typeof option === 'string' ? option : option.title : '';
  }
  /**
   * Determines whether the provided option from the select is the currently selected record in the State service.
   * 
   * @param {RecordSelectFiltered} option The record to determine whether it is selected
   * @returns {boolean} True if the record is currently selected; false otherwise
   */
  isSelected(option: RecordSelectFiltered): boolean {
    return option.recordId === this._state.listItem?.versionedRdfRecord.recordId;
  }

  private getRecordSelectFiltered(record: JSONLDObject): RecordSelectFiltered {
    return {
      recordId: record['@id'],
      title: getDctermsValue(record, 'title'),
      identifierIRI: this._state.getIdentifierIRI(record),
      description: getDctermsValue(record, 'description')
    };
  }
  protected setFilteredOptions(): void {
    this.filteredOptions = this.recordSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(val => this.filter(val || ''))
      );
  }
  private checkRecordDeleted() {
    if (this?._state?.listItem?.versionedRdfRecord.recordId) {
      const record = find([...this.opened, ...this.unopened], {recordId: this._state.listItem.versionedRdfRecord.recordId});
      if (!record) {
        this._toast.createWarningToast(`Previously opened ${this.typeName} ${this._state.listItem.versionedRdfRecord.title} was removed.`);
        this._state.close(this._state.listItem.versionedRdfRecord.recordId);
        remove(this.opened, {recordId: this._state.listItem.versionedRdfRecord.recordId});
        this._state.listItem = undefined;
        this.resetSearch();
      }
    }
  }
  private permissionCheck(): void {
    const pepRequest = this.createPepRequest();
    this._spinnerSrv.startLoadingForComponent(this.editorRecordSelectSpinner, 15);
    this.pep.evaluateRequest(pepRequest, true).pipe(finalize(() => {
      this._spinnerSrv.finishLoadingForComponent(this.editorRecordSelectSpinner);
    })).subscribe(response => {
      const canRead = response !== this.pep.deny;
      if (!canRead) {
        this.disabledFlag = true;
      }
    }, () => {
      this._toast.createWarningToast(`Could not retrieve ${this.typeName} creation permissions`);
      this.disabledFlag = true;
    });
  }
  private createPepRequest() {
    return {
      resourceId: this.catalogId,
      actionId: `${POLICY}Create`,
      actionAttrs: {
        [`${RDF}type`]: this._state.type
      }
    };
  }
}
