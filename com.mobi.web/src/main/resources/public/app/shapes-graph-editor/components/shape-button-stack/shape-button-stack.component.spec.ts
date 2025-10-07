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
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, SimpleChange } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { CreateNodeShapeModalComponent } from '../create-node-shape-modal/create-node-shape-modal.component';
import { ShapeButtonStackComponent } from './shape-button-stack.component';

describe('Shape Button Stack component', function () {
  let component: ShapeButtonStackComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ShapeButtonStackComponent>;
  let matDialogStub: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
      ],
      declarations: [
        ShapeButtonStackComponent,
        MockComponent(CreateNodeShapeModalComponent)
      ],
      providers: [
        MockProvider(MatDialog),
      ]
    }).compileComponents();
  });

  beforeEach(function () {
    matDialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture = TestBed.createComponent(ShapeButtonStackComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.canModify = true;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogStub = null;
  });

  describe('ngOnChanges lifecycle', () => {
    it('should set the default tooltip when canModify is set to true', () => {
      component.canModify = true;
      component.ngOnChanges({ canModify: new SimpleChange(null, true, true) });
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipDefault);
    });
    it('should set the no permission tooltip when canModify is set to false', () => {
      component.canModify = false;
      component.ngOnChanges({canModify: new SimpleChange(null, false, true)});
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipNoPermission);
    });
    it('should update the tooltip when canModify changes from true to false', () => {
      component.canModify = true;
      component.ngOnChanges({ canModify: new SimpleChange(null, true, true) });
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipDefault);
      component.canModify = false;
      component.ngOnChanges({ canModify: new SimpleChange(true, false, false) });
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipNoPermission);
    });
    it('should update the tooltip when canModify changes from false to true', () => {
      component.canModify = false;
      component.ngOnChanges({ canModify: new SimpleChange(null, false, true) });
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipNoPermission);
      component.canModify = true;
      component.ngOnChanges({ canModify: new SimpleChange(false, true, false) });
      fixture.detectChanges();
      expect(component.tooltipText).toBe(component.tooltipDefault);
    });
  });
  describe('controller methods', function () {
    describe('showCreateNodeShapeOverlay()', function () {
      it('should open the createEntityModal', function () {
        fixture.detectChanges();
        matDialogStub.open.and.returnValue(null);
        component.showCreateNodeShapeOverlay();
        expect(matDialogStub.open).toHaveBeenCalledWith(CreateNodeShapeModalComponent);
      });
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.shape-button-stack')).length).toEqual(1);
    });
    it('with a button', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('button')).length).toEqual(1);
    });
    it('should call showCreateNodeShapeOverlay when the create entity button is clicked', function () {
      fixture.detectChanges();
      spyOn(component, 'showCreateNodeShapeOverlay');
      const button = element.query(By.css('.create-node-shape-overlay'));
      button.nativeElement.click();
      expect(component.showCreateNodeShapeOverlay).toHaveBeenCalledWith();
    });
    describe('create entity button', function () {
      it('is disabled when the user cannot modify the record', function () {
        component.canModify = false;
        fixture.detectChanges();
        const createEntityButton = element.query(By.css('.create-node-shape-overlay'));
        expect(createEntityButton.properties['disabled']).toBeTruthy();
      });
      it('is enabled when the user can modify the record', function () {
        component.canModify = true;
        fixture.detectChanges();
        const createEntityButton = element.query(By.css('.create-node-shape-overlay'));
        expect(createEntityButton.properties['disabled']).toBeFalsy();
      });
    });
  });
});
