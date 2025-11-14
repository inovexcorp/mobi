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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

import { ControlRecordI, ControlRecordType, GroupedRecord } from '../../classes/controlRecords';
import { MockProvider } from 'ng-mocks';
import { OnClassToggledEvent } from '../../interfaces/classList.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { Subject } from 'rxjs';
import { VisualizationClassListComponent } from './visualizationClassList.component';

describe('Visualization Class List component', () => {
  let component: VisualizationClassListComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<VisualizationClassListComponent>;

  let cru1: ControlRecordI;
  let cr1: ControlRecordI;
  let cru2: ControlRecordI;
  let cr21: ControlRecordI;
  let cr22: ControlRecordI;
  let cr41: ControlRecordI;
  let cr410: ControlRecordI;
  let groupedRecord1: GroupedRecord;

  beforeEach(async () => {
    cru1 = {
      type: ControlRecordType.NODE,
      id: '0.0',
      name: 'A',
      isImported: undefined,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cru2 = {
      type: ControlRecordType.NODE,
      id: '0.1',
      name: undefined,
      isImported: undefined,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cr1 = {
      type: ControlRecordType.NODE,
      id: '1.1',
      name: 'A',
      isImported: false,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cr21 = {
      type: ControlRecordType.NODE,
      id: '2.1',
      name: 'A',
      isImported: true,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cr22 = {
      type: ControlRecordType.NODE,
      id: '2.2',
      name: 'B',
      isImported: true,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cr41 = {
      type: ControlRecordType.NODE,
      id: '4.1',
      name: 'A',
      isImported: true,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false
    };
    cr410 = {
      type: ControlRecordType.NODE,
      id: '4.10',
      name: 'Z',
      isImported: true,
      ontologyId: 'ontologyId',
      onGraph: true,
      disabled: false,
      isChecked: false
    };
    groupedRecord1 = new GroupedRecord({
      ontologyId: 'ontologyId',
      classes: [cru1, cr21, cru2, cr22, cr41, cr410, cr1],
      allClasses: [],
      isImported: false,
      name: 'name',
      ontologyColor: 'blue',
    });
    await TestBed.configureTestingModule({
      declarations: [
        VisualizationClassListComponent,
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatListModule,
      ],
      providers: [
        MockProvider(OntologyStateService),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizationClassListComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.ontology = groupedRecord1;
    component.selectedRecord = new Subject();
  });
  afterEach(() => {
    element = null;
    fixture = null;
    component = null;
  });
  describe('component html should initialize with the right values', () => {
    it('successfully', fakeAsync(() => {
      fixture.detectChanges();
      expect(element.nativeElement.querySelectorAll('mat-list').length).toEqual(1);
      expect(element.nativeElement.querySelectorAll('mat-list-item').length).toEqual(7);
      expect(element.nativeElement.querySelectorAll('div.ontologyClass__info').length).toEqual(7);
      expect(element.nativeElement.querySelectorAll('div.ontologyClass__actions').length).toEqual(7);
    }));
  });
  describe('component methods', () => {
    it('toggleClass', fakeAsync(() => {
      const matCheckboxChangeStub: any = jasmine.createSpyObj('MatCheckboxChange', {}, {checked: true});
      let onClassToggledEvent: OnClassToggledEvent | undefined;
      component.onClassToggled.subscribe((event: OnClassToggledEvent) => onClassToggledEvent = event);
      component.ontology = groupedRecord1;
      component.toggleClass(matCheckboxChangeStub, cr410);
      expect(onClassToggledEvent).toEqual({
        ontology: groupedRecord1,
        checked: true,
        record: cr410
      });
    }));
    it('trackByClassId', fakeAsync(() => {
      const cName = {id: 4};
      expect(component.trackByClassId(1, cName)).toEqual(4);
    }));
    it('recordSelected', fakeAsync(() => {
      const event = jasmine.createSpyObj('recordSelected', {}, {
        target: {
          classList: {contains: (value) => false}
        }
      });
      let onClickRecordSelectEvent: ControlRecordI | undefined;
      component.onClickRecordSelect.subscribe((event: ControlRecordI) => onClickRecordSelectEvent = event);
      component.recordSelected(event, cr1);
      expect(onClickRecordSelectEvent).toEqual(cr1);
    }));
    it('onRightClickRecordSelect', fakeAsync(() => {
      const event: any = jasmine.createSpyObj('Event', {preventDefault: jasmine.createSpy()});
      let onRightClickElementEvent: ControlRecordI | undefined;
      component.onRightClickElement.subscribe((event: ControlRecordI) => onRightClickElementEvent = event);
      component.onRightClickRecordSelect(event, cr410);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(onRightClickElementEvent).toEqual(cr410);
    }));
  });
});
