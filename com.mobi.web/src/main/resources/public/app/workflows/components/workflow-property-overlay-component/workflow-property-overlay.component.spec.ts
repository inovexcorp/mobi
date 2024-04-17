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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MockComponent, MockProvider } from 'ng-mocks';

import { find } from 'lodash';

import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { workflowRDF } from '../../models/mock_data/workflow-mocks';
import { WorkflowPropertyOverlayComponent } from './workflow-property-overlay.component';

describe('WorkflowPropertyOverlayComponentComponent', () => {
  let component: WorkflowPropertyOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowPropertyOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<WorkflowPropertyOverlayComponent>>;

  const triggerId = 'http://example.com/workflows/LEDControl/trigger';
  const entity = find(workflowRDF, {'@id': triggerId} );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
          WorkflowPropertyOverlayComponent,
          MockComponent(InfoMessageComponent),
      ],
      providers: [
        MockProvider(MatDialogRef),
        MockProvider(MAT_DIALOG_DATA),
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ],
      imports: [
        MatDialogModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowPropertyOverlayComponent);
    component = fixture.componentInstance;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<WorkflowPropertyOverlayComponent>>;
    element = fixture.debugElement;
    fixture.detectChanges();
  });
  afterEach(() => {
    component = null;
    fixture = null;
    element = null;
    matDialogRef = null;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('component methods', () => {
    beforeEach(() => {
        component.data = {entity};
    });
    it('should call close method', () => {
        const button = element.query(By.css('button'));
        button.triggerEventHandler('click', undefined);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith();
    });
    it('should call getEntityValues method', () => {
        spyOn(component, 'setEntityValues');
        component.setEntityValues();
        expect(component.setEntityValues).toHaveBeenCalled();
    });
    it('should call buildEntityValues method', () => {
        spyOn(component, 'buildEntityValues');
        const entity = [];
        component.buildEntityValues(entity);
        expect(component.buildEntityValues).toHaveBeenCalledWith(entity);
    });
    it('should initialize displayData', () => {
        component.ngOnInit();
        expect(component.displayData[0].value).toEqual([entity]);
    });
    it('should set message', () => {
        expect(component.message).toEqual('No data to display.');
    });
    it('should inject MAT_DIALOG_DATA and MatDialogRef', () => {
        expect(component.data).toBeDefined();
        expect(component.dialogRef).toBeDefined();
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
        component.data = {entity};
        component.setEntityValues();
        fixture.detectChanges();
        expect(element.queryAll(By.css('.workflow-entity-dialog')).length).toEqual(1);
        expect(element.queryAll(By.css('.overflow-properties')).length).toEqual(1);
        expect(element.queryAll(By.css('button')).length).toEqual(1);
        expect(element.queryAll(By.css('h5')).length).toEqual(1);
    });
    it('when no component data', async () => {
        component.data = { entity: undefined };
        fixture.detectChanges();
        component.setEntityValues();
        await fixture.whenStable();
        expect(element.queryAll(By.css('info-message')).length).toEqual(1);
        expect(element.queryAll(By.css('.overflow-properties')).length).toEqual(0);
    });
  });
});
