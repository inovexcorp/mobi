/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OWL } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { ImportsOverlayComponent } from '../importsOverlay/importsOverlay.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { createJson } from '../../../shared/utility';

/**
 * @class ontology-editor.ImportsBlockComponent
 *
 * A component that creates a section that displays the imports on the ontology represented by the provided
 * {@link OntologyListItem}. The section contains buttons for adding an import and reloading the imports. Each import is
 * displayed as its IRI and with a remove button. The component houses the methods for opening the modal for
 * {@link ontology-editor.ImportsOverlayComponent adding} and removing imports.
 * 
 * @param {OntologyListItem} listItem A {@link OntologyListItem} representing an ontology
 */
@Component({
    selector: 'imports-block',
    templateUrl: './importsBlock.component.html',
    styleUrls: ['./importsBlock.component.scss']
})
export class ImportsBlockComponent implements OnChanges {
    showRemoveOverlay = false;
    imports: JSONLDId[] = [];
    indirectImports: string[] = [];

    @Input() listItem: OntologyListItem;

    constructor(private dialog: MatDialog, public os: OntologyStateService, private toast: ToastService, 
        private pm: PropertyManagerService) {}

    ngOnChanges(): void {
        this.setImports();
        this.setIndirectImports();
    }
    setupRemove(url: string): void {
        this.showRemoveOverlay = true;
        let msg = '';
        if (this.os.hasChanges(this.listItem)) {
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
        this.os.addToDeletions(this.listItem.versionedRdfRecord.recordId, createJson(this.listItem.selected['@id'], `${OWL}imports`, {'@id': url}));
        this.pm.remove(this.listItem.selected, `${OWL}imports`, findIndex(this.listItem.selected[`${OWL}imports`], {'@id': url}));
        this.os.saveCurrentChanges(this.listItem).pipe(
            switchMap(() => this.os.updateOntology(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId, this.listItem.upToDate, this.listItem.inProgressCommit))
        ).subscribe(() => {
            this.setImports();
            this.setIndirectImports();
        }, () => {});
    }
    failed(iri: string): boolean {
        return includes(this.listItem.failedImports, iri);
    }
    refresh(): void {
        this.os.updateOntology(this.listItem.versionedRdfRecord.recordId, this.listItem.versionedRdfRecord.branchId, this.listItem.versionedRdfRecord.commitId, this.listItem.upToDate, this.listItem.inProgressCommit, true)
            .subscribe(() => {
                this.listItem.hasPendingRefresh = true;
                this.setImports();
                this.setIndirectImports();
                this.toast.createSuccessToast('Refreshed Imports');
            }, error => this.toast.createErrorToast(error));
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
