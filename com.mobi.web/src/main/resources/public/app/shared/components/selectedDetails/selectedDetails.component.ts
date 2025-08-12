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

import { getEntityName } from '../../utility';
import { IndividualTypesModalComponent } from '../../../ontology-editor/components/individualTypesModal/individualTypesModal.component';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { ToastService } from '../../services/toast.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../services/versionedRdfState.service';

/**
 * @class shared.SelectedDetailsComponent
 * 
 * A component that creates a div displaying detailed information about an entity passed in
 * through the `@Input` properties.
 * This includes the entity's name, a {@link shared.StaticIriComponent}, and a display of the types of the
 * entity along with a button to {@link ontology-editor.IndividualTypesModalComponent edit the individual types}.
 * The display is optionally `readOnly` and can optionally highlight text in the `staticIri` matching the provided `highlightText`.
 *
 * @param {VersionedRdfState<VersionedRdfListItem>} stateService - Service managing state for RDF versioned records.
 * @param {JSONLDObject} entity The JSON-LD object representing the selected entity.
 * @param {string} entityIri The IRI of the selected entity.
 * @param {boolean} isImported Indicates whether the entity was imported from another source.
 * @param {boolean} canModify Indicates if the user has permission to modify the entity's IRI.
 * @param {boolean} [readOnly] Optional flag to render the component in read-only mode.
 * @param {string} [highlightText] Optional text to pass along to the `staticIri` for highlighting.
 */
@Component({
  selector: 'selected-details',
  templateUrl: './selectedDetails.component.html',
  styleUrls: ['./selectedDetails.component.scss']
})
export class SelectedDetailsComponent implements OnChanges {
  @Input() stateService: VersionedRdfState<VersionedRdfListItem>;
  @Input() entity: JSONLDObject;
  @Input() entityIri: string;
  @Input() isImported: boolean
  @Input() canModify: boolean;
  @Input() warningText = undefined;

  @Input() readOnly?: boolean;
  @Input() highlightText?: string;

  duplicateCheck = true;

  readonly getEntityName = getEntityName;

  importedSource: string;
  entityHasTypes: boolean;
  canModifyTypes: boolean;

  constructor(
    private _dialog: MatDialog,
    private _toast: ToastService
  ) { }

  ngOnChanges(): void {
    this.importedSource = this.getImportedSource();
    this.entityHasTypes = this.entity && this.entity['@type'] && this.entity['@type'].length > 0;
    this.canModifyTypes = this.stateService.canModifyEntityTypes(this.entity) && !this.readOnly && !this.isImported &&
      this.canModify;
  }

  getImportedSource(): string {
    return this.stateService.getImportedSource();
  }

  getTypes(): string {
    return this.stateService.getTypesLabel(this.entity);
  }

  onEdit(iriBegin: string, iriThen: string, iriEnd: string): void {
    this.stateService.onIriEdit(iriBegin, iriThen, iriEnd)
      .pipe(
        switchMap(() => this.stateService.saveCurrentChanges())
      ).subscribe(() => {
        this.stateService.updateLabel();
      }, error => this._toast.createErrorToast(error));
  }

  showTypesOverlay(): void {
    this._dialog.open(IndividualTypesModalComponent);
  }
}