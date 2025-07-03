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
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { switchMap } from 'rxjs/operators';
import { map, get, concat, reject, includes, findIndex, sortBy, pick } from 'lodash';

import { ConfirmModalComponent } from '../confirmModal/confirmModal.component';
import { createJson } from '../../utility';
import { ImportsOverlayComponent } from '../importsOverlay/importsOverlay.component';
import { JSONLDId } from '../../models/JSONLDId.interface';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { OWL } from '../../../prefixes';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { ToastService } from '../../services/toast.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../services/versionedRdfState.service';
import { VersionedRdfRecord } from '../../models/versionedRdfRecord.interface';
/**
 * @class shared.ImportsBlockComponent
 * @requires MatDialog
 * @requires shared.ToastService
 * @requires shared.PropertyManagerService
 * @requires shared.OntologyManagerService
 * 
 * A component that creates a section that displays the imports on the ontology represented by the current
 * {@link shared.VersionedRdfState#listItem}. The section contains buttons for adding an import and reloading the
 * imports. Each import is displayed as its IRI and with a remove button. The component houses the methods for opening
 * the modal for {@link shared.ImportsOverlayComponent } adding and removing imports.
 * 
 * @param {VersionedRdfRecord} versionedRdfRecord - The RDF record representing the ontology's content.
 * @param {VersionedRdfState<VersionedRdfListItem>} stateService - The service managing the versioned RDF state.
 * @param {VersionedRdfListItem} listItem - The selected list item representing the ontology being edited.
 * @param {string[]} targetRecordTypes - The types of records used for searching for imports.
 * @param {string} noImportMessage - A message to display when there are no imports to show.
 * @param {boolean} canModify - Whether the user has permission to modify the imports.
 */
@Component({
  selector: 'imports-block',
  templateUrl: './importsBlock.component.html',
  styleUrls: ['./importsBlock.component.scss']
})
export class ImportsBlockComponent implements OnChanges {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() stateService: VersionedRdfState<VersionedRdfListItem>;
  @Input() listItem: VersionedRdfListItem;
  @Input() targetRecordTypes: string[];
  @Input() noImportMessage: string;
  @Input() canModify: boolean;

  imports: JSONLDId[] = [];
  indirectImports: string[] = [];

  constructor(
    private _dialog: MatDialog,
    private _toast: ToastService,
    private _pm: PropertyManagerService,
    private _om: OntologyManagerService
  ) {}

  ngOnChanges(): void {
    this.setImports();
    this.setIndirectImports();
  }
  setupRemove(url: string): void {
    let msg = '';
    if (this.stateService.hasChanges(this.listItem)) {
      msg = `<p><strong>NOTE: You have some unsaved changes.</strong></p><p>Would you like to save those changes and remove the import: <strong>${url}</strong>?</p>`;
    } else {
      msg = `<p>Are you sure you want to remove the import: <strong>${url}</strong>?</p>`;
    }
    this._dialog.open(ConfirmModalComponent, { data: { content: msg } }).afterClosed().subscribe(result => {
      if (result) {
        this.remove(url);
      }
    });
  }
  remove(url: string): void {
    this.stateService.addToDeletions(
      this.versionedRdfRecord.recordId,
      createJson(this.listItem.selected['@id'], `${OWL}imports`, {'@id': url})
    );
    this._pm.remove(this.listItem.selected, `${OWL}imports`, findIndex(this.listItem.selected[`${OWL}imports`], {'@id': url}));
    this.stateService.saveCurrentChanges(this.listItem).pipe(
      switchMap(() => this.stateService.changeVersion(this.versionedRdfRecord.recordId,
        this.versionedRdfRecord.branchId,
        this.versionedRdfRecord.commitId,
        undefined,
        this.listItem.currentVersionTitle,
        this.listItem.upToDate,
        false,
        false
      ))
    ).subscribe(() => {
        this.setImports();
        this.setIndirectImports();
    }, () => {});
  }
  failed(iri: string): boolean {
    return includes(this.listItem.failedImports, iri);
  }
  refresh(): void {
    this._om.clearCache(this.versionedRdfRecord.recordId, this.versionedRdfRecord.commitId)
      .pipe(switchMap(() => this.stateService.changeVersion(this.versionedRdfRecord.recordId,
        this.versionedRdfRecord.branchId,
        this.versionedRdfRecord.commitId,
        this.versionedRdfRecord.tagId,
        this.listItem.currentVersionTitle,
        this.listItem.upToDate, 
        false,
        false
      ))
    ).subscribe(() => {
        this.listItem.hasPendingRefresh = true;
        this.setImports();
        this.setIndirectImports();
        this._toast.createSuccessToast('Refreshed Imports');
    }, error => this._toast.createErrorToast(error));
  }
  setImports(): void {
    this.imports = sortBy(this.listItem.selected[`${OWL}imports`], '@id');
  }
  setIndirectImports(): void {
    const directImports = map(get(this.listItem.selected, `${OWL}imports`), '@id');
    const goodImports = map(this.listItem.importedOntologies, item => pick(item, 'id', 'ontologyId'));
    const failedImports = map(this.listItem.failedImports, iri => ({ id: iri, ontologyId: iri }));
    const allImports = concat(goodImports, failedImports);
    const filtered = reject(allImports, item => includes(directImports, item.id) || includes(directImports, item.ontologyId));
    // TODO: currently a new filter was added in order to support situations where the back-end cannot set an 
    // ontologyIRI to ontologyID. Long term, changes will be made on the backend to properly support these scenarios.
    this.indirectImports = sortBy(map(filtered, item => item.ontologyId || item.id));
  }
  showNewOverlay(): void {
    this._dialog.open(ImportsOverlayComponent, {
      data: {
        stateService: this.stateService,
        listItem: this.listItem,
        targetRecordTypes: this.targetRecordTypes
      }
    }).afterClosed().subscribe(result => {
      if (result) {
          this.setImports();
          this.setIndirectImports();
      }
    });
  }
}