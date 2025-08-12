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
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ShaclTargetClassInputComponent } from './shacl-target-class-input.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-target-class-input formControlName="targetClass" [label]="'label'">
      </app-shacl-target-class-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    targetClass: new FormControl(null, Validators.required)
  });
}

describe('ShaclTargetClassInputComponent', () => {
  let component: ShaclTargetClassInputComponent;
  let fixture: ComponentFixture<ShaclTargetClassInputComponent>;
  let element: DebugElement;
  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;
  let stateServiceStub: jasmine.SpyObj<ShapesGraphStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const validIri = 'https://example.org/ValidClass';
  const invalidIri = 'not-an-iri';
  const mockGroupSuggestion: GroupedSuggestion[] = [
    {
      label: 'http://example.org',
      suggestions: [
        { label: 'ClassA', value: 'http://example.org/ClassA' },
        { label: 'ClassB', value: 'http://example.org/ClassB' }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatOptionModule
      ],
       declarations: [
        ShaclTargetClassInputComponent,
        TestParentComponent
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ToastService),
        MockProvider(ProgressSpinnerService)
      ]
    }).compileComponents();

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    stateServiceStub = TestBed.inject(
      ShapesGraphStateService
    ) as jasmine.SpyObj<ShapesGraphStateService>;
    stateServiceStub.getClassOptions.and.returnValue(of(mockGroupSuggestion));
    stateServiceStub.getEntityName.and.callFake((entityId: string) => `entityName(${entityId})`);

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclTargetClassInputComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.label = 'label';
    spyOn(component, 'onChange').and.callThrough();
    spyOn(component, 'onTouched').and.callThrough();
    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    fixture = null;
    element = null;
    parentFixture = null;
    parentComponent = null;
    stateServiceStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should complete the _destroySub$ subject on ngOnDestroy', () => {
    spyOn(component['_destroySub$'], 'next').and.callThrough();
    spyOn(component['_destroySub$'], 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(component['_destroySub$'].next).toHaveBeenCalledWith();
    expect(component['_destroySub$'].complete).toHaveBeenCalledWith();
  });
  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
  });
  describe('controlValueAccessor registration', () => {
    it('should register the onChange function', () => {
      const fn = () => {};
      component.registerOnChange(fn as any);
      expect(component.onChange).toBe(fn);
    });
    it('should register the onTouched function', () => {
      const fn = () => {};
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });
  });
  describe('controlValueAccessor integration', () => {
    it('should propagate changes on input', fakeAsync(() => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      input.value = validIri;
      input.dispatchEvent(new Event('input'));
      tick(300); // Debounce
      fixture.detectChanges();
      expect(component.onChange).toHaveBeenCalledWith(validIri);
    }));
    it('should call onTouched on blur', () => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(component.onTouched).toHaveBeenCalledWith();
    });
    it('should writeValue to the form control without emitting', fakeAsync(() => {
      spyOn(component.classInputControl, 'setValue').and.callThrough();
      component.writeValue(validIri);
      expect(component.classInputControl.setValue).toHaveBeenCalledWith(validIri, {
        emitEvent: false
      });
      expect(component.classInputControl.value).toEqual(validIri);

      component.writeValue('http://test.org/another');
      tick(300); // Debounce
      expect(component.onChange).not.toHaveBeenCalled();
    }));
    it('should enable and disable via setDisabledState', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(component.classInputControl.disabled).toBeTrue();
      const input = element.query(By.css('input[matInput]')).nativeElement;
      expect(input.disabled).toBeTrue();

      component.setDisabledState(false);
      fixture.detectChanges();
      expect(component.classInputControl.enabled).toBeTrue();
      expect(input.disabled).toBeFalse();
    });
  });
  describe('validation logic', () => {
    it('should invalidate empty input as required and display required error', () => {
      component.classInputControl.updateValueAndValidity();
      component.classInputControl.setValue('');
      component.classInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.classInputControl.hasError('required')).toBeTrue();
      const error = element.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('This field is required.');
    });
    it('should invalidate invalid IRI pattern and display pattern error', () => {
      component.classInputControl.setValue(invalidIri);
      component.classInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.classInputControl.hasError('pattern')).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.some((e) => e.nativeElement.textContent.includes('valid IRI'))).toBeTrue();
    });
    it('should accept valid IRI and hide all errors', () => {
      component.classInputControl.setValue(validIri);
      component.classInputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.classInputControl.valid).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.length).toEqual(0);
    });
  });
  describe('autocomplete functionality', () => {
    it('should display suggestions when search text is empty (after debounce)', fakeAsync(() => {
      component.classInputControl.setValue('');
      fixture.detectChanges(); // Make sure input value is reflected before tick
      component.suggestions$.subscribe(result => {
        expect(result).toEqual([
          {
            label: 'http://example.org',
            suggestions: [
              { label: 'ClassA', value: 'http://example.org/ClassA' },
              { label: 'ClassB', value: 'http://example.org/ClassB' }
            ]
          }
        ]);
      });
      tick(300); // Debounce
      fixture.detectChanges();

      expect(stateServiceStub.getClassOptions).toHaveBeenCalledWith('', true);
    }));
    it('should debounce input before fetching suggestions', fakeAsync(() => {
      const input = element.query(By.css('input[matInput]')).nativeElement;

      input.value = 'input1';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(stateServiceStub.getClassOptions).not.toHaveBeenCalled();

      tick(100);
      input.value = 'input2';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(stateServiceStub.getClassOptions).not.toHaveBeenCalled();

      tick(299); // if debounce is 300ms, tick 299 more ms after latest input
      fixture.detectChanges();
      expect(stateServiceStub.getClassOptions).not.toHaveBeenCalled();

      tick(1); // Pass the remaining time to hit/exceed debounce
      fixture.detectChanges(); // Update view after observable emits

      expect(stateServiceStub.getClassOptions).toHaveBeenCalledWith('input2', true);
    }));
    it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
      stateServiceStub.getClassOptions.and.returnValue(throwError(() => new Error('API Error')));
      component.classInputControl.setValue('input');
      component.suggestions$.subscribe(result => {
        expect(result).toEqual([]);
      });
      tick(300); // Debounce
      fixture.detectChanges();
      expect(stateServiceStub.getClassOptions).toHaveBeenCalledWith('input', true);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load suggestions. Please try typing again.');
    }));
  });
  describe('contains the correct html', () => {
    it('should render a text input with label', () => {
      component.label = 'Target Class URI';
      fixture.detectChanges();
      const input = element.query(By.css('input[matInput]')).nativeElement;
      expect(input).toBeTruthy();
      const labelEl = fixture.nativeElement.querySelector('mat-label');
      expect(labelEl).toBeTruthy();
      expect(labelEl.textContent).toContain('Target Class URI');
    });
    it('should have matAutocomplete attached to the input', () => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      expect(input.getAttribute('aria-autocomplete')).toEqual('list');
      expect(element.query(By.directive(MatAutocomplete))).toBeTruthy();
    });
  });
  describe('reactive forms integration', () => {
    let parentForm: FormGroup;
    let targetClassControl: FormControl;
    let hostInput: HTMLInputElement;

    beforeEach(() => {
      parentForm = parentComponent.form;
      targetClassControl = parentForm.controls['targetClass'] as FormControl;
      hostInput = parentFixture.debugElement.query(
        By.css('app-shacl-target-class-input input[matInput]')
      ).nativeElement;
    });
    it('should be invalid initially and valid after input via host form', fakeAsync(() => {
      expect(parentForm.valid).toBeFalse();
      expect(targetClassControl.hasError('required')).toBeTrue();

      hostInput.value = validIri;
      hostInput.dispatchEvent(new Event('input'));
      tick(300); // Debounce
      parentFixture.detectChanges(); // Update parent and child views

      expect(targetClassControl.value).toEqual(validIri);
      expect(targetClassControl.valid).toBeTrue();
      expect(parentForm.valid).toBeTrue();
    }));
    it('should disable component when form control is disabled', () => {
      targetClassControl.disable();
      parentFixture.detectChanges();
      expect(hostInput.disabled).toBeTrue();
    });
    it('should update component when form control value changes programmatically', fakeAsync(() => {
      const childComponentDebugElement = parentFixture.debugElement.query(
        By.directive(ShaclTargetClassInputComponent)
      );
      const childComponentInstance =
        childComponentDebugElement.componentInstance as ShaclTargetClassInputComponent;

      spyOn(childComponentInstance.classInputControl, 'setValue').and.callThrough(); // Spy on child's internal control
      targetClassControl.setValue(validIri);
      parentFixture.detectChanges(); // Update parent and child views after setValue
      parentFixture.detectChanges(); // Second detectChanges to ensure DOM updates for Material components

      expect(childComponentInstance.classInputControl.setValue).toHaveBeenCalledWith(validIri, {
        emitEvent: false
      });
      expect(parentComponent.form.get('targetClass')?.value).toEqual(validIri);
      tick(300); // Debounce
    }));
    it('should propagate touched and dirty states', fakeAsync(() => {
      expect(targetClassControl.touched).toBeFalse();
      expect(targetClassControl.dirty).toBeFalse();

      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      expect(targetClassControl.touched).toBeTrue();

      hostInput.value = validIri;
      hostInput.dispatchEvent(new Event('input'));
      tick(300); // Debounce
      parentFixture.detectChanges();
      expect(targetClassControl.dirty).toBeTrue();
    }));
    it('should show validity errors from parent form control on blur', fakeAsync(() => {
      expect(parentForm.valid).toBeFalse();
      expect(parentForm.controls['targetClass'].hasError('required')).toBeTrue();

      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      // Ensure the error message for required is displayed after blur
      expect(
        parentFixture.debugElement.query(By.css('mat-error')).nativeElement.textContent
      ).toContain('This field is required.');

      hostInput.value = invalidIri;
      hostInput.dispatchEvent(new Event('input'));
      tick(300); // Debounce
      hostInput.dispatchEvent(new Event('blur')); // Blur to trigger error display
      parentFixture.detectChanges();
      expect(parentForm.controls['targetClass'].hasError('pattern')).toBeTrue();
      // Ensure the error message for pattern is displayed after blur
      expect(
        parentFixture.debugElement.query(By.css('mat-error')).nativeElement.textContent
      ).toContain('valid IRI');
    }));
  });
});
