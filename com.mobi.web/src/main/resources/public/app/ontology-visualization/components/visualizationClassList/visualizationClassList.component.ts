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
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MAT_CHECKBOX_DEFAULT_OPTIONS, MatCheckboxChange } from '@angular/material/checkbox';

import { Observable } from 'rxjs';

import { ControlRecordI, GroupedRecord } from '../../classes/controlRecords';
import { OnClassToggledEvent } from '../../interfaces/classList.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class VisualizationClassListComponent
 *
 * Dump Component for displaying the classes for an ontology
 * Emits events to the parent class
 */
@Component({
  selector: 'visualization-class-list',
  templateUrl: './visualizationClassList.component.html',
  styleUrls: ['./visualizationClassList.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    {provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations'},
    {provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: {color: 'accent', clickAction: 'check-indeterminate'}}
  ]
})
export class VisualizationClassListComponent {
  @Input() ontology: GroupedRecord;
  @Input() selectedRecord: Observable<string>;
  /** Event emitted every time a class is checked/unchecked. */
  @Output() onClassToggled = new EventEmitter<OnClassToggledEvent>();
  /** Event emitted every time a class is right-clicked */
  @Output() onRightClickElement = new EventEmitter<ControlRecordI>();
  /** Event emitted every time a class is selected. */
  @Output() onClickRecordSelect = new EventEmitter<ControlRecordI>();

  constructor(private cf: ChangeDetectorRef, public os: OntologyStateService) {
  }

  toggleClass(event: MatCheckboxChange, record: ControlRecordI): void {
    const {checked} = event;
    record.isChecked = checked;
    this.cf.markForCheck();
    this.onClassToggled.emit({
      ontology: this.ontology,
      checked,
      record
    });
  }

  /**
   * Track function
   * @param _index
   * @param cName
   * @returns id
   */
  trackByClassId(_index: number, cName: any): unknown {
    return cName.id;
  }

  recordSelected(event: any, record: ControlRecordI): void {
    if (!event.target.classList.contains('mat-checkbox-inner-container')
      && !record.disabled) {
      this.onClickRecordSelect.emit(record);
    }
  }

  onRightClickRecordSelect(event: any, record: ControlRecordI): void {
    event.preventDefault();
    this.onRightClickElement.emit(record);
  }
}
