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
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';

import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { OWL } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ValueOption } from '../../models/value-option.interface';
import { ShaclSingleSuggestionInputComponent } from './shacl-single-suggestion-input.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-single-suggestion-input formControlName="option" [label]="'label'">
      </app-shacl-single-suggestion-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    option: new FormControl(null, Validators.required)
  });
}

describe('ShaclSingleSuggestionInputComponent', () => {
  let component: ShaclSingleSuggestionInputComponent;
  let fixture: ComponentFixture<ShaclSingleSuggestionInputComponent>;
  let element: DebugElement;
  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

  const validIri = 'https://example.org/ValidClass';
  const validOption: ValueOption = { value: validIri, label: 'Valid Class', type: `${OWL}Class` };
  const invalidIri = 'not-an-iri';
  const mockClassGroupSuggestion: GroupedSuggestion[] = [
    {
      label: 'http://example.org',
      suggestions: [
        { label: 'ClassA', value: 'http://example.org/ClassA' },
        validOption
      ]
    }
  ];
  const mockPropertyGroupSuggestion: GroupedSuggestion[] = [
    {
      label: 'http://example.org',
      suggestions: [
        { label: 'PropA', value: 'http://example.org/PropA', type: `${OWL}DatatypeProperty` },
        validOption
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
        ShaclSingleSuggestionInputComponent,
        TestParentComponent
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ToastService),
        MockProvider(ProgressSpinnerService)
      ]
    }).compileComponents();

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

    shapesGraphStateStub = TestBed.inject(
      ShapesGraphStateService
    ) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.getClassOptions.and.returnValue(of(mockClassGroupSuggestion));
    shapesGraphStateStub.getPropertyOptions.and.returnValue(of(mockPropertyGroupSuggestion));
    shapesGraphStateStub.getEntityName.and.callFake((entityId: string) => `entityName(${entityId})`);

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclSingleSuggestionInputComponent);
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
    shapesGraphStateStub = null;
    toastStub = null;
    progressSpinnerStub = null;
  });

  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
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
    it('should call onTouched on blur', () => {
      const input = element.query(By.css('input[matInput]')).nativeElement;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(component.onTouched).toHaveBeenCalledWith();
    });
    it('should writeValue to the form control without emitting', fakeAsync(() => {
      spyOn(component.inputControl, 'setValue').and.callThrough();
      component.writeValue(validIri);
      expect(component.inputControl.setValue).toHaveBeenCalledWith(validIri, {
        emitEvent: false
      });
      expect(component.inputControl.value).toEqual(validIri);

      component.writeValue('http://test.org/another');
      tick(300); // Debounce
      expect(component.onChange).not.toHaveBeenCalled();
    }));
    it('should enable and disable via setDisabledState', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(component.inputControl.disabled).toBeTrue();
      const input = element.query(By.css('input[matInput]')).nativeElement;
      expect(input.disabled).toBeTrue();

      component.setDisabledState(false);
      fixture.detectChanges();
      expect(component.inputControl.enabled).toBeTrue();
      expect(input.disabled).toBeFalse();
    });
  });
  describe('validation logic', () => {
    it('should invalidate empty input as required and display required error', () => {
      component.inputControl.updateValueAndValidity();
      component.inputControl.setValue('');
      component.inputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.inputControl.hasError('required')).toBeTrue();
      const error = element.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('This field is required.');
    });
    it('should invalidate invalid IRI pattern and display pattern error', () => {
      component.inputControl.setValue(invalidIri);
      component.inputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.inputControl.hasError('pattern')).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.some((e) => e.nativeElement.textContent.includes('valid IRI'))).toBeTrue();
    });
    it('should accept valid IRI and hide all errors', () => {
      component.inputControl.setValue(validIri);
      component.inputControl.markAsTouched();
      fixture.detectChanges();
      expect(component.inputControl.valid).toBeTrue();
      const errors = element.queryAll(By.css('mat-error'));
      expect(errors.length).toEqual(0);
    });
  });
  describe('autocomplete functionality', () => {
    describe('if pulling classes', () => {
      it('should display suggestions when search text is empty (after debounce)', fakeAsync(() => {
        component.inputControl.setValue('');
        fixture.detectChanges(); // Make sure input value is reflected before tick
        component.suggestions$.subscribe(result => {
          expect(result).toEqual(mockClassGroupSuggestion);
        });
        tick(300); // Debounce
        fixture.detectChanges();

        expect(component.noMatches).toBeTrue();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).toHaveBeenCalledWith('', true);
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should debounce input before fetching suggestions', fakeAsync(() => {
        const input = element.query(By.css('input[matInput]')).nativeElement;

        input.value = 'input1';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();

        tick(100);
        input.value = validIri;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();

        tick(299); // if debounce is 300ms, tick 299 more ms after latest input
        fixture.detectChanges();
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();

        tick(1); // Pass the remaining time to hit/exceed debounce
        fixture.detectChanges(); // Update view after observable emits

        expect(component.noMatches).toBeFalse();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).toHaveBeenCalledWith(validIri, true);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
        shapesGraphStateStub.getClassOptions.and.returnValue(throwError(() => new Error('API Error')));
        component.inputControl.setValue('input');
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
        tick(300); // Debounce
        fixture.detectChanges();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).toHaveBeenCalledWith('input', true);
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load suggestions. Please try typing again.');
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
    });
    describe('if pulling properties', () => {
      beforeEach(() => {
        component.pullClasses = false;
        component.propertyTypes = ['ObjectProperty'];
      });
      it('should display suggestions when search text is empty (after debounce)', fakeAsync(() => {
        component.inputControl.setValue('');
        fixture.detectChanges(); // Make sure input value is reflected before tick
        component.suggestions$.subscribe(result => {
          expect(result).toEqual(mockPropertyGroupSuggestion);
        });
        tick(300); // Debounce
        fixture.detectChanges();

        expect(component.noMatches).toBeTrue();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();
        expect(shapesGraphStateStub.getPropertyOptions).toHaveBeenCalledWith('', component.propertyTypes, true);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should debounce input before fetching suggestions', fakeAsync(() => {
        const input = element.query(By.css('input[matInput]')).nativeElement;

        input.value = 'input1';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalled();

        tick(100);
        input.value = validIri;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalled();

        tick(299); // if debounce is 300ms, tick 299 more ms after latest input
        fixture.detectChanges();
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalled();

        tick(1); // Pass the remaining time to hit/exceed debounce
        fixture.detectChanges(); // Update view after observable emits

        expect(component.noMatches).toBeFalse();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getPropertyOptions).toHaveBeenCalledWith(validIri, component.propertyTypes, true);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
        shapesGraphStateStub.getPropertyOptions.and.returnValue(throwError(() => new Error('API Error')));
        component.inputControl.setValue('input');
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
        tick(300); // Debounce
        fixture.detectChanges();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalledWith('input', true);
        expect(shapesGraphStateStub.getPropertyOptions).toHaveBeenCalledWith('input', component.propertyTypes, true);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load suggestions. Please try typing again.');
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
    });
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
    let testControl: FormControl;
    let hostInput: HTMLInputElement;

    beforeEach(() => {
      parentForm = parentComponent.form;
      testControl = parentForm.controls['option'] as FormControl;
      hostInput = parentFixture.debugElement.query(
        By.css('app-shacl-single-suggestion-input input[matInput]')
      ).nativeElement;
    });
    it('should be invalid initially and valid after input via host form', fakeAsync(() => {
      expect(hostInput.value).toEqual('');
      expect(parentForm.valid).toBeFalse();
      expect(testControl.hasError('required')).toBeTrue();

      testControl.setValue(validOption);
      tick(300); // Debounce
      parentFixture.detectChanges(); // Update parent and child views

      expect(hostInput.value).toEqual(validOption.value);
      expect(testControl.value).toEqual(validOption);
      expect(testControl.valid).toBeTrue();
      expect(parentForm.valid).toBeTrue();
    }));
    it('should disable component when form control is disabled', () => {
      testControl.disable();
      parentFixture.detectChanges();
      expect(hostInput.disabled).toBeTrue();
    });
    it('should trigger valueChanges on focus', () => {
      const childComponentDebugElement = parentFixture.debugElement.query(
        By.directive(ShaclSingleSuggestionInputComponent)
      );
      const childComponentInstance =
        childComponentDebugElement.componentInstance as ShaclSingleSuggestionInputComponent;

      spyOn(childComponentInstance.inputControl, 'setValue').and.callThrough(); // Spy on child's internal control
      hostInput.dispatchEvent(new Event('focus'));
      parentFixture.detectChanges(); // Update parent and child views after setValue
      expect(childComponentInstance.inputControl.setValue).toHaveBeenCalledWith(undefined);
    });
    it('should reset the input on blur', () => {
      const childComponentDebugElement = parentFixture.debugElement.query(
        By.directive(ShaclSingleSuggestionInputComponent)
      );
      const childComponentInstance =
        childComponentDebugElement.componentInstance as ShaclSingleSuggestionInputComponent;

      spyOn(childComponentInstance.inputControl, 'setValue').and.callThrough(); // Spy on child's internal control
      childComponentInstance.selectedOption = validOption;
      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      expect(childComponentInstance.inputControl.setValue).toHaveBeenCalledWith(validIri);
    });
    it('should handle an option being selected', () => {
      component.onOptionSelected(validOption);
      parentFixture.detectChanges();
      expect(component.inputControl.value).toEqual(validIri);
      expect(component.selectedOption).toEqual(validOption);
      expect(component.onChange).toHaveBeenCalledWith(validOption);
    });
    it('should propagate touched states', () => {
      expect(testControl.touched).toBeFalse();
      expect(testControl.dirty).toBeFalse();

      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      expect(testControl.touched).toBeTrue();
    });
    it('should show validity errors', fakeAsync(() => {
      expect(parentForm.valid).toBeFalse();
      expect(parentForm.controls['option'].hasError('required')).toBeTrue();

      hostInput.dispatchEvent(new Event('blur'));
      parentFixture.detectChanges();
      // Ensure the error message for required is displayed after blur
      expect(
        parentFixture.debugElement.query(By.css('mat-error')).nativeElement.textContent
      ).toContain('This field is required.');

      hostInput.value = invalidIri;
      hostInput.dispatchEvent(new Event('input'));
      tick(300); // Debounce
      parentFixture.detectChanges();
      // Ensure the error message for pattern is displayed
      expect(
        parentFixture.debugElement.query(By.css('mat-error')).nativeElement.textContent
      ).toContain('valid IRI');
    }));
    it('should update the custom suggestion on change', fakeAsync(() => {
      component.inputControl.setValue('input');
      tick(300);
      expect(component.customSuggestion.value).toEqual('input');
      expect(component.customSuggestion.label).toEqual('entityName(input)');
      expect(shapesGraphStateStub.getEntityName).toHaveBeenCalledWith('input');
    }));
  });
});