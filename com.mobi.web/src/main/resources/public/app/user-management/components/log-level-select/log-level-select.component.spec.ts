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
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { LogLevelOption } from '../log-level-manager/log-level-manager.component';
import { LogLevelSelectComponent } from './log-level-select.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-log-level-select class="w-100" formControlName="level" [required]="true" [availableLevels]="availableLevels"></app-log-level-select>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    level: new FormControl(undefined, Validators.required)
  });
  availableLevels: LogLevelOption[] = [
    { level: 'DEBUG', icon: 'bug_report' },
    { level: 'INFO', icon: 'info' },
    { level: 'WARN', icon: 'warning' },
    { level: 'ERROR', icon: 'error' }
  ];
}

describe('LogLevelSelectComponent', () => {
  let component: LogLevelSelectComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<LogLevelSelectComponent>;

  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule
      ],
      declarations: [LogLevelSelectComponent, TestParentComponent]
    }).compileComponents();
    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    element = parentFixture.debugElement;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(LogLevelSelectComponent);
    component = fixture.componentInstance;
    spyOn(component, 'onChange').and.callThrough();
    spyOn(component, 'onTouched').and.callThrough();
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    parentComponent = null;
    parentFixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
  });
  describe('controlValueAccessor registration', () => {
    it('should register the onChange function', () => {
      const fn = () => { };
      component.registerOnChange(fn as (value: LogLevelOption) => void);
      expect(component.onChange).toBe(fn);
    });
    it('should register the onTouched function', () => {
      const fn = () => { };
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });
  });
  describe('contains the correct html', () => {
    it('with a mat-select with options for the available levels', async () => {
      expect(element.queryAll(By.css('mat-form-field')).length).toBe(1);
      expect(element.queryAll(By.css('mat-select')).length).toBe(1);
      const action = element.query(By.css('.mat-select-trigger')).nativeElement;
      action.click();
      parentFixture.detectChanges();
      await parentFixture.whenStable();
      const options = element.queryAll(By.css('.mat-option'));
      expect(options.length).toEqual(parentComponent.availableLevels.length);
    });
  });
  describe('controlValueAccessor integration', () => {
    it('should write a value from the parent form into the internal control', () => {
      const value: LogLevelOption = parentComponent.availableLevels[2];
      parentComponent.form.get('level')?.setValue(value);
      
      parentFixture.detectChanges();
      const childComponent = element.query(By.directive(LogLevelSelectComponent)).componentInstance;
      expect(childComponent.control.value).toEqual(value);
    });
    it('should mark the parent control as touched and dirty on value change', () => {
      const value: LogLevelOption = parentComponent.availableLevels[2];
      const childComponent = element.query(By.directive(LogLevelSelectComponent)).componentInstance;
      childComponent.control.setValue(value);
      parentFixture.detectChanges();
      expect(parentComponent.form.get('level')?.touched).toBeTrue();
      expect(parentComponent.form.get('level')?.dirty).toBeTrue();
    });
    it('should disable the inner control when parent form control is disabled', () => {
      parentComponent.form.get('level').disable();
      parentFixture.detectChanges();
      const childComponent = element.query(By.directive(LogLevelSelectComponent)).componentInstance;
      expect(childComponent.control.disabled).toBeTrue();
    });
  });
});
