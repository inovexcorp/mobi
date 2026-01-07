/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { FormsModule } from '@angular/forms';

import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ShaclValidationReportComponent } from './shacl-validation-report.component';

describe('ShaclValidationReportComponent', () => {
  let component: ShaclValidationReportComponent;
  let fixture: ComponentFixture<ShaclValidationReportComponent>;
  let element: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        ShaclValidationReportComponent,
        MockComponent(CodemirrorComponent)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShaclValidationReportComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize the turtle string correctly', () => {
    const errorObject: RESTError = {
      error: 'InvalidWorkflowException',
      errorMessage: 'Something went wrong',
      errorDetails: [
        '<urn:test> a <urn:Class> ;',
        '  <urn:prop> true .'
      ]
    };
    component.errorObject = errorObject;
    expect(component.errorObject).toEqual(errorObject);
    expect(component.report).toEqual('<urn:test> a <urn:Class> ;\n  <urn:prop> true .');
  });
  describe('contains the correct html', () => {
    ['div.field-label', 'ngx-codemirror'].forEach(item => {
      it(`with a .${item}`, function() {
        expect(element.queryAll(By.css(item)).length).toEqual(1);
      });
    });
  });
});
