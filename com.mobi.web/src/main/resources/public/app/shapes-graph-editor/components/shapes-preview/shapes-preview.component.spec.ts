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
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as YATE from 'perfectkb-yate';

import { By } from '@angular/platform-browser';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DebugElement } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ShapesPreviewComponent } from './shapes-preview.component';

describe('Shapes Preview component', function() {
  let component: ShapesPreviewComponent;
  let fixture: ComponentFixture<ShapesPreviewComponent>;
  let element: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatTabsModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [ShapesPreviewComponent],
      providers: []
    }).compileComponents();

    fixture = TestBed.createComponent(ShapesPreviewComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;

    component.content = 'content to display';
    component.format = 'turtle';
    fixture.detectChanges();
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  describe('should initialize', function() {
    describe('the yate editor with content', function() {
      it('successfully', fakeAsync(function() {
        fixture.autoDetectChanges();
        fixture.whenStable();
        jasmine.createSpy(YATE.getPrefixesFromDocument).and.resolveTo();
        const nativeEle = fixture.elementRef.nativeElement.querySelectorAll('.shapes-preview');
        expect(nativeEle.length).toEqual(1);
        flush();
      }));
    });
    it('the serialization form with the correct value', function() {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.serializationForm.value.serialization).toEqual('turtle');
    });
    describe('with the correct html', function() {
      ['serialization-select', 'form', 'mat-card-header', 'mat-card-content', 'div.CodeMirror', 'button.refresh-button']
        .forEach(test => {
          it('containing a ' + test, function() {
            expect(element.queryAll(By.css(test)).length).toEqual(1);
          });
      });
    });
  });
  it('should emit the correct format value', function() {
    spyOn(component.contentTypeChange, 'emit');
    component.serializationForm.setValue({serialization: 'jsonld'});
    component.setContent();
    expect(component.contentTypeChange.emit).toHaveBeenCalledWith('jsonld');
    expect(component.serializationForm.value.serialization).toEqual('jsonld');
  });
});
