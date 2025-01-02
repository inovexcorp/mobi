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
import { map, get, concat, reject, includes, findIndex, sortBy, pick } from 'lodash';
import { switchMap } from 'rxjs/operators';
import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OWL } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { ImportsOverlayComponent } from '../importsOverlay/importsOverlay.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { createJson } from '../../../shared/utility';
import { OntologyAction } from '../../../shared/models/ontologyAction';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

/**
 * @class ontology-editor.ImportsBlockComponent
 *
 * A component that creates a section that displays the imports on the ontology represented by the current
 * {@link shared.OntologyStateService#listItem}. The section contains buttons for adding an import and reloading the
 * imports. Each import is displayed as its IRI and with a remove button. The component houses the methods for opening
 * the modal for {@link ontology-editor.ImportsOverlayComponent adding} and removing imports.
 */
@Component({
    selector: 'imports-block',
    templateUrl: './importsBlock.component.html',
    styleUrls: ['./importsBlock.component.scss']
})
export class ImportsBlockComponent implements OnInit, OnDestroy, OnChanges {
    @Input() recordId: string;

    showRemoveOverlay = false;
    imports: JSONLDId[] = [];
    indirectImports: string[] = [];

    ontologyRecordActionSubscription: Subscription;

    constructor(private dialog: MatDialog, public os: OntologyStateService, private toast: ToastService, 
        private pm: PropertyManagerService, private _om: OntologyManagerService) {}

    ngOnInit(): void {
      this.ontologyRecordActionSubscription = this.os.ontologyRecordAction$.subscribe(action => {
        if (action.recordId === this.os.listItem?.versionedRdfRecord.recordId && action.action === OntologyAction.UPDATE_STATE) {
          this.setImports();
          this.setIndirectImports();
        }
      });
    }
    ngOnChanges(): void {
      this.setImports();
      this.setIndirectImports();
    }
    ngOnDestroy(): void {
      if (this.ontologyRecordActionSubscription) {
        this.ontologyRecordActionSubscription.unsubscribe();
      }
    }
    setupRemove(url: string): void {
        this.showRemoveOverlay = true;
        let msg = '';
        if (this.os.hasChanges(this.os.listItem)) {
            msg = `<p><strong>NOTE: You have some unsaved changes.</strong></p><p>Would you like to save those changes and remove the import: <strong>${url}</strong>?</p>`;
        } else {
            msg = `<p>Are you sure you want to remove the import: <strong>${url}</strong>?</p>`;
        }
        this.dialog.open(ConfirmModalComponent, { data: { content: msg } }).afterClosed().subscribe(result => {
            if (result) {
                this.remove(url);
            }
        });
    }
    remove(url: string): void {
        this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, createJson(this.os.listItem.selected['@id'], `${OWL}imports`, {'@id': url}));
        this.pm.remove(this.os.listItem.selected, `${OWL}imports`, findIndex(this.os.listItem.selected[`${OWL}imports`], {'@id': url}));
        this.os.saveCurrentChanges(this.os.listItem).pipe(
            switchMap(() => this.os.changeVersion(this.os.listItem.versionedRdfRecord.recordId, 
              this.os.listItem.versionedRdfRecord.branchId, 
              this.os.listItem.versionedRdfRecord.commitId, 
              undefined, 
              this.os.listItem.currentVersionTitle, 
              this.os.listItem.upToDate, 
              false, 
              false
            ))
        ).subscribe(() => {
            this.setImports();
            this.setIndirectImports();
        }, () => {});
    }
    failed(iri: string): boolean {
        return includes(this.os.listItem.failedImports, iri);
    }
    refresh(): void {
        this._om.clearCache(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.commitId)
          .pipe(switchMap(() => this.os.changeVersion(this.os.listItem.versionedRdfRecord.recordId, 
            this.os.listItem.versionedRdfRecord.branchId, 
            this.os.listItem.versionedRdfRecord.commitId, 
            this.os.listItem.versionedRdfRecord.tagId,
            this.os.listItem.currentVersionTitle,
            this.os.listItem.upToDate, 
            false,
            false
          ))
        ).subscribe(() => {
            this.os.listItem.hasPendingRefresh = true;
            this.setImports();
            this.setIndirectImports();
            this.toast.createSuccessToast('Refreshed Imports');
        }, error => this.toast.createErrorToast(error));
    }
    setImports(): void {
        this.imports = sortBy(this.os.listItem.selected[`${OWL}imports`], '@id');
    }
    setIndirectImports(): void {
        const directImports = map(get(this.os.listItem.selected, `${OWL}imports`), '@id');
        const goodImports = map(this.os.listItem.importedOntologies, item => pick(item, 'id', 'ontologyId'));
        const failedImports = map(this.os.listItem.failedImports, iri => ({ id: iri, ontologyId: iri }));
        const allImports = concat(goodImports, failedImports);
        const filtered = reject(allImports, item => includes(directImports, item.id) || includes(directImports, item.ontologyId));
        // TODO: currently a new filter was added in order to support situations where the back-end cannot set an ontologyIRI to ontologyID. Long term, changes will be made on the backend to properly support these scenarios.
        this.indirectImports = sortBy(map(filtered, item => item.ontologyId || item.id));
    }
    showNewOverlay(): void {
        this.dialog.open(ImportsOverlayComponent).afterClosed().subscribe(result => {
            if (result) {
                this.setImports();
                this.setIndirectImports();
            }
        });
    }
}
