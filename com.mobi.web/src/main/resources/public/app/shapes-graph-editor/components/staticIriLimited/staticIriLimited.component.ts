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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EditIriOverlayComponent } from '../../../shared/components/editIriOverlay/editIriOverlay.component';
import { EditIriOverlayData } from '../../../shared/models/editIriOverlayData.interface';
import { OnEditEventI } from '../../../shared/models/onEditEvent.interface';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';

/**
 * @class shapes-graph-editor.StaticIriLimitedComponent
 * 
 * A component that creates a `div` with a display of the provided IRI of an entity.
 *
 * @param {string} iri The IRI to be displayed
 */

@Component({
    selector: 'static-iri-limited',
    templateUrl: './staticIriLimited.component.html'
})
export class StaticIriLimitedComponent {
  private _iri = '';

  iriBegin = '';
  iriThen = '';
  iriEnd = '';

  @Input() canModify = false;
  @Input() readOnly = false;

  @Input() set iri(value: string) {
    this._iri = value;
    this.setVariables();
  }

  get iri(): string {
    return this._iri;
  }

  @Output() onEdit = new EventEmitter<OnEditEventI | boolean>();

  constructor(private _dialog: MatDialog) {}

  setVariables(): void {
    if (this.iri) {
      const splitIri = splitIRI(this.iri);
      this.iriBegin = splitIri.begin;
      this.iriThen = splitIri.then;
      this.iriEnd = splitIri.end;
    }
  }

  showEditIriOverlay(): void {
    const dataObj: EditIriOverlayData = {
      iriBegin: this.iriBegin,
      iriThen: this.iriThen,
      iriEnd: this.iriEnd,
    };
    this._dialog.open(EditIriOverlayComponent, { data: dataObj }).afterClosed().subscribe((result: OnEditEventI) => {
      if (result) {
        this.onEdit.emit(result);
      }
    });
  }
}
