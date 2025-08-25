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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { AddPathNodeHoverButtonComponent } from './add-path-node-hover-button.component';

describe('AddPathNodeHoverButtonComponent', () => {
  let component: AddPathNodeHoverButtonComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<AddPathNodeHoverButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatIconModule,
        MatButtonModule
      ],
      declarations: [AddPathNodeHoverButtonComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AddPathNodeHoverButtonComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize the title properly', () => {
    expect(component.title).toEqual('Add to Sequence');

    component.onBottom = false;
    component.ngOnInit();
    expect(component.title).toEqual('Add to Alternative');
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.add-path-node-hover-button')).length).toEqual(1);
    });
    it('depending on whether the button should be on the bottom', () => {
      expect(element.queryAll(By.css('.add-path-node-hover-button.card-bottom-hover-zone')).length).toEqual(1);
      expect(element.queryAll(By.css('.add-path-node-hover-button.card-right-hover-zone')).length).toEqual(0);

      component.onBottom = false;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.add-path-node-hover-button.card-bottom-hover-zone')).length).toEqual(0);
      expect(element.queryAll(By.css('.add-path-node-hover-button.card-right-hover-zone')).length).toEqual(1);
    });
    it('depending on whether the button should be visible', () => {
      expect(element.queryAll(By.css('button.visible')).length).toEqual(0);
      component.isPlusVisible = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('button.visible')).length).toEqual(1);
    });
  });
  it('should call the event emitter on button click', () => {
    spyOn(component.onClick, 'emit');
    component.isPlusVisible = true;
    fixture.detectChanges();
    const button = element.queryAll(By.css('button.visible'))[0];
    expect(button).toBeDefined();
    button.triggerEventHandler('click', null);
    expect(component.onClick.emit).toHaveBeenCalledWith();
  });
});
