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
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { ShaclTargetNodeInputComponent } from './shacl-target-node-input.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-target-node-input formControlName="targetValue"></app-shacl-target-node-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    targetValue: new FormControl(null, Validators.required)
  });
}

describe('ShaclTargetNodeInputComponent', () => {
  let component: ShaclTargetNodeInputComponent;
  let fixture: ComponentFixture<ShaclTargetNodeInputComponent>;
  let element: DebugElement;

  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      declarations: [
        ShaclTargetNodeInputComponent,
        TestParentComponent
      ]
    }).compileComponents();

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclTargetNodeInputComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    spyOn(component, 'onChange').and.callThrough();
    spyOn(component, 'onTouched').and.callThrough();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
  });
  describe('controlValueAccessor registration', () => {
    it('should register the onChange function', () => {
      const fn = () => {};
      component.registerOnChange(fn as any);
      expect(component.onChange).toEqual(fn);
    });
    it('should register the onTouched function', () => {
      const fn = () => {};
      component.registerOnTouched(fn);
      expect(component.onTouched).toEqual(fn);
    });
  });
  describe('controlValueAccessor integration', () => {
    it('should propagate changes on input', () => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      input.value = 'https://example.org';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.onChange).toHaveBeenCalledWith({
        value: 'https://example.org',
        label: 'Example.org'
      });
      // expect(component.onChange).toHaveBeenCalledWith('https://example.org');
    });
    it('should call onTouched on blur', () => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      input.dispatchEvent(new Event('blur'));
      expect(component.onTouched).toHaveBeenCalledWith();
    });
    describe('should writeValue to the form control without emitting', () => {
      it('if passed a string', () => {
        component.writeValue('https://test');
        fixture.detectChanges();
        expect(component.nodeInputControl.value).toEqual('https://test');
      });
      it('if passed a ValueOption', () => {
        component.writeValue({
          value: 'https://test',
          label: ''
        });
        fixture.detectChanges();
        expect(component.nodeInputControl.value).toEqual('https://test');
      });
    });
    it('should enable and disable via setDisabledState', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(component.nodeInputControl.disabled).toBeTrue();
      component.setDisabledState(false);
      expect(component.nodeInputControl.enabled).toBeTrue();
    });
  });
  describe('validation logic', () => {
    it('should invalidate empty input as required and display required error', () => {
      component.nodeInputControl.setValue('');
      component.nodeInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.nodeInputControl.hasError('required')).toBeTrue();
      const error = element.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('This field is required');
    });
    it('should invalidate invalid IRI pattern and display pattern error', () => {
      const badValue = 'not-an-iri';
      component.nodeInputControl.setValue(badValue);
      component.nodeInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.nodeInputControl.hasError('pattern')).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.some(e => e.nativeElement.textContent.includes('valid IRI'))).toBeTrue();
    });
    it('should accept valid IRI and hide all errors', () => {
      const valid = 'https://example.org/resource';
      component.nodeInputControl.setValue(valid);
      component.nodeInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.nodeInputControl.valid).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.length).toEqual(0);
    });
  });
  describe('contains the correct html', () => {
    it('should render a text input with label', () => {
      component.label = 'Node IRI';
      fixture.detectChanges();
      const input = element.query(By.css('input[matInput]'));
      expect(input).toBeTruthy();
      const labelEl = fixture.nativeElement.querySelector('label.mat-form-field-label');
      expect(labelEl).toBeTruthy();
      expect(labelEl.textContent).toContain('Node IRI');
    });
    it('should render a text input with required', () => {
      const input = element.query(By.css('input[matInput]'));
      expect(input).toBeTruthy();
      const labelEl = fixture.nativeElement.querySelector('label.mat-form-field-label');
      expect(labelEl).toBeTruthy();
      expect(labelEl.textContent).toContain('*');
    });
  });
  describe('validator integration', () => {
    it('validate() should return null when control is valid', () => {
      component.nodeInputControl.setValue('https://example.org');
      const fakeControl = new FormControl('');
      expect(component.validate(fakeControl)).toBeNull();
    });
    it('validate() should return errors when control is invalid', () => {
      component.nodeInputControl.setValue('');
      component.nodeInputControl.markAsTouched();
      const fakeControl = new FormControl('');
      const errors = component.validate(fakeControl);
      expect(errors).toEqual(component.nodeInputControl.errors);
    });
  });
  describe('reactive forms integration', () => {
    let parentForm, targetValueControl;
    beforeEach(() => {
      parentForm = parentComponent.form;
      targetValueControl = parentForm.controls['targetValue'];
    });
    it('should be invalid initially and valid after input via host form', () => {
      expect(parentForm.valid).toBeFalse();
      const hostInput = parentFixture.debugElement.query(By.css('input[matInput]')).nativeElement;
      hostInput.value = 'https://example.org/item';
      hostInput.dispatchEvent(new Event('input'));
      parentFixture.detectChanges();
      expect(targetValueControl.value).toEqual({
        value: 'https://example.org/item',
        label: 'Item'
      });
      expect(parentForm.valid).toBeTrue();
    });
    it('should disable component when form control is disabled', () => {
      targetValueControl.disable();
      parentFixture.detectChanges();
      const inputEls = parentFixture.debugElement.queryAll(By.css('input[matInput]'));
      inputEls.forEach(el => expect(el.nativeElement.disabled).toBeTrue());
    });
    it('should update component when form control value changes programmatically', () => {
      targetValueControl.setValue('https://example.org/123');
      parentFixture.detectChanges();
      const shaclInputDebugElement = parentFixture.debugElement.query(
        By.directive(ShaclTargetNodeInputComponent)
      );
      const inputElement = shaclInputDebugElement.query(By.css('input[matInput]')).nativeElement;
      expect(inputElement.value).toEqual('https://example.org/123');
    });
    it('should propagate touched and dirty states', () => {
      expect(targetValueControl.touched).toBeFalse();
      expect(targetValueControl.dirty).toBeFalse();
      const hostInput = parentFixture.debugElement.query(By.css('input[matInput]')).nativeElement;
      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      expect(targetValueControl.touched).toBeTrue();
      hostInput.value = 'https://example.org/456';
      hostInput.dispatchEvent(new Event('input'));
      parentFixture.detectChanges();
      expect(targetValueControl.dirty).toBeTrue();
    });
  });
});
