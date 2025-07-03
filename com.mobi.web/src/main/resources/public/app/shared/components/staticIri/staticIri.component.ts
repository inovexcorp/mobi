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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { EditIriOverlayComponent } from '../editIriOverlay/editIriOverlay.component';
import { EditIriOverlayData } from '../../models/editIriOverlayData.interface';
import { OnEditEventI } from '../../models/onEditEvent.interface';
import { splitIRI } from '../../pipes/splitIRI.pipe';
import { VersionedRdfState } from '../../services/versionedRdfState.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';

/**
 * @class shared.StaticIriComponent
 * @requires MatDialog
 * 
 * A component that creates a `div` with a display of the provided IRI of an entity. If `duplicateCheck` is true, an
 * {@link shared.ErrorDisplayComponent} will be displayed if the IRI already exists in the current
 * {@link shared.VersionedRdfState#listItem selected VersionedRdfListItem}. The the IRI if for an entity that is not imported, an
 * edit button is displayed that will open the {@link shared.EditIriOverlayComponent}. The component accepts a method
 * that will be called when an edit of the IRI is completed. 
 *
 * @param {string} iri The IRI to be displayed and optionally edited
 * @param {boolean} isImported Indicates whether the entity is imported. Imported entities cannot be edited.
 * @param {boolean} canModify Indicates whether the user has permission to modify the IRI.
 * @param {boolean} readOnly Whether the IRI should be editable or not (Optional)
 * @param {boolean} duplicateCheck Whether the IRI should be checked for duplicates within the selected ontology (Optional)
 * @param {string} highlightText The optional text to highlight within the IRI (Optional)
 * @param {Function} onEdit A function to be called when the `editIriOverlay` is confirmed
 */
@Component({
  selector: 'static-iri',
  templateUrl: './staticIri.component.html',
  styleUrls: ['./staticIri.component.scss']
})
export class StaticIriComponent implements OnInit, OnChanges {
  @Input() stateService: VersionedRdfState<VersionedRdfListItem>;
  @Input() iri: string;
  @Input() isImported: boolean;
  @Input() canModify: boolean;
  @Input() readOnly?: boolean;
  @Input() duplicateCheck?: boolean;
  @Input() highlightText?: string;

  @Output() onEdit = new EventEmitter<OnEditEventI>();

  iriBegin: string;
  iriThen: string;
  iriEnd: string;
  iriExist: boolean;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.setVariables();
  }
  ngOnChanges(changesObj: SimpleChanges): void {
    if (!changesObj.iri || !changesObj.iri.isFirstChange()) {
      this.setVariables();
    }
  }
  /**
   * Splits the input IRI into its component parts (`iriBegin`, `iriThen`, `iriEnd`)
   * and checks whether it already exists in the ontology.
   */
  setVariables(): void {
    const splitIri = splitIRI(this.iri);
    this.iriBegin = splitIri.begin;
    this.iriThen = splitIri.then;
    this.iriEnd = splitIri.end;
    this.iriExist = this.stateService.checkIri(this.iriBegin + this.iriThen + this.iriEnd);
  }
  /**
   * Opens the Edit IRI overlay dialog. If `duplicateCheck` is enabled,
   * adds a custom validator to prevent saving a duplicate IRI.
   * Emits an `onEdit` event if the IRI is successfully edited.
   */
  showIriOverlay(): void {
    const dataObj: EditIriOverlayData = {
      iriBegin: this.iriBegin,
      iriThen: this.iriThen,
      iriEnd: this.iriEnd
    };
    if (this.duplicateCheck) {
      dataObj.validator = (g: UntypedFormGroup) => {
        const fullIRI = g.get('iriBegin').value + g.get('iriThen').value + g.get('iriEnd').value;
        // If the IRI doesn't exist in the ontology and isn't the original input IRI, then it's valid
        return fullIRI === this.iri || !this.stateService.checkIri(fullIRI) ? null : { iri: true };
      };
      dataObj.validatorMsg = 'This IRI already exists';
      dataObj.validatorKey = 'iri';
    }
    this.dialog.open(EditIriOverlayComponent, { data: dataObj }).afterClosed().subscribe((result: OnEditEventI) => {
      if (result) {
        this.onEdit.emit(result);
      }
    });
  }
}