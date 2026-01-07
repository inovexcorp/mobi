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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { OWL } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ValueOption } from '../../models/value-option.interface';
import { ShaclChipSuggestionsInputComponent } from './shacl-chip-suggestions-input.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-chip-suggestions-input
        formControlName="options"
        [label]="label"
      >
      </app-shacl-chip-suggestions-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    options: new FormControl(null, Validators.required)
  });
  label = 'label';
}

describe('ShaclChipSuggestionsInputComponent', () => {
  let component: ShaclChipSuggestionsInputComponent;
  let fixture: ComponentFixture<ShaclChipSuggestionsInputComponent>;
  let element: DebugElement;
  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

  const validIri = 'https://example.org/ValidClass';
  const validOption: ValueOption = { value: validIri, label: `entityName(${validIri})`};
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      declarations: [
        ShaclChipSuggestionsInputComponent,
        TestParentComponent
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ToastService),
        MockProvider(ProgressSpinnerService)
      ]
    });

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    shapesGraphStateStub = TestBed.inject(
      ShapesGraphStateService
    ) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.getEntityName.and.callFake((entityId: string) => `entityName(${entityId})`);
    shapesGraphStateStub.getClassOptions.and.returnValue(of(mockClassGroupSuggestion));
    shapesGraphStateStub.getPropertyOptions.and.returnValue(of(mockPropertyGroupSuggestion));

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclChipSuggestionsInputComponent);
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
  });
  it('should complete the _destroySub$ subject on ngOnDestroy', () => {
    spyOn(component['_destroySub$'], 'next').and.callThrough();
    spyOn(component['_destroySub$'], 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(component['_destroySub$'].next).toHaveBeenCalledWith();
    expect(component['_destroySub$'].complete).toHaveBeenCalledWith();
  });
  describe('controller method', () => {
    describe('addChipFromSelection', () => {
      it('should add a new chip, update the form, and clear the input', () => {
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: validOption } as MatOption,
          source: {} as MatAutocomplete
        };
        component.chipValues = [];
        component.addChipFromSelection(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.chipValues[0]).toEqual(validOption);
        expect(component.onChange).toHaveBeenCalledWith([validOption]);
        expect(component.onTouched).toHaveBeenCalledWith();
        expect(component.chipInput.nativeElement.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
      it('should not add a duplicate chip', () => {
        component.chipValues = [validOption];
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: validOption } as MatOption,
          source: {} as MatAutocomplete
        };

        component.addChipFromSelection(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.onChange).not.toHaveBeenCalled();
        expect(component.onTouched).not.toHaveBeenCalled();
      });
      it('should still clear the input even if the chip is a duplicate', () => {
        component.chipValues = [validOption];
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: validOption } as MatOption,
          source: {} as MatAutocomplete
        };
        component.inputControl.setValue('Some text');

        component.addChipFromSelection(mockEvent);

        expect(component.chipInput.nativeElement.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
    });
    describe('addChipFromInput', () => {
      it('should add a chip from valid input, update form, and clear input', () => {
        component.inputControl.setValue(validIri);
        const mockEvent = {
          input: { value: '' } as HTMLInputElement,
          value: validIri
        } as MatChipInputEvent;

        component.addChipFromInput(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.chipValues[0]).toEqual({
          value: validIri,
          label: `entityName(${validIri})`
        });
        expect(shapesGraphStateStub.getEntityName).toHaveBeenCalledWith(validIri);
        expect(component.onChange).toHaveBeenCalledWith([validOption]);
        expect(component.onTouched).toHaveBeenCalledWith();
        expect(mockEvent.input.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
      it('should not add a chip if the input is invalid', () => {
        component.inputControl.setValue('this is not an iri');
        const mockEvent = {
          input: { value: '' } as HTMLInputElement,
          value: 'this is not an iri'
        } as MatChipInputEvent;

        component.addChipFromInput(mockEvent);

        expect(component.chipValues.length).toEqual(0);
        expect(component.onChange).not.toHaveBeenCalled();
        expect(component.onTouched).not.toHaveBeenCalledWith();
        expect(mockEvent.input.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
      it('should not add a duplicate chip from input', () => {
        const existingChip = { value: validIri, label: `Label for ${validIri}` };
        component.chipValues = [existingChip];
        component.inputControl.setValue(validIri);
        const mockEvent = {
          input: { value: '' } as HTMLInputElement,
          value: validIri
        } as MatChipInputEvent;

        component.addChipFromInput(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.onChange).not.toHaveBeenCalled();
        expect(component.onTouched).not.toHaveBeenCalledWith();
      });
    });
    describe('removeChip', () => {
      it('should remove a chip and emit change', () => {
        component.chipValues = [
          { label: 'L1', value: 'V1' },
          { label: 'L2', value: 'V2' }
        ];
        component.removeChip(0);
        expect(component.chipValues.length).toEqual(1);
        expect(component.chipValues[0].value).toEqual('V2');
        expect(component.onChange).toHaveBeenCalledWith([{ label: 'L2', value: 'V2' }]);
      });
    });
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
    it('should writeValue mapped to chipValues', () => {
      component.writeValue([validOption]);
      expect(component.chipValues.length).toEqual(1);
      expect(component.chipValues).toEqual([validOption]);
    });
    it('should register onChange and onTouched callbacks', () => {
      const fn: () => void = () => {};
      component.registerOnChange(fn);
      component.registerOnTouched(fn);
      expect(component.onChange).toEqual(fn);
      expect(component.onTouched).toEqual(fn);
    });
  });
  describe('autocomplete functionality', () => {
    describe('if pulling classes', () => {
      it('should fetch suggestions on input', fakeAsync(() => {
        const input =
          element.query(By.css('input[formControlName]')) || element.query(By.css('input'));
        input.nativeElement.value = 'a';
        input.nativeElement.dispatchEvent(new Event('input'));
        component.suggestions$.subscribe(result => {
          expect(result.length).toBeGreaterThan(0);
        });
        tick(300);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).toHaveBeenCalledWith('a', true);
        expect(shapesGraphStateStub.getPropertyOptions).not.toHaveBeenCalledWith();
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should handle no record or type', fakeAsync(() => {
        shapesGraphStateStub.getClassOptions.and.returnValue(of([]));
        fixture.detectChanges();
        component.inputControl.setValue('x');
        fixture.detectChanges();
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
        tick(300);
      }));
      it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
        shapesGraphStateStub.getClassOptions.and.returnValue(throwError(() => new Error('API Error')));
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
  
        component.inputControl.setValue('fail');
        tick(300); // Wait for debounceTime
        fixture.detectChanges();
  
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).toHaveBeenCalledWith('fail', true);
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
      it('should fetch suggestions on input', fakeAsync(() => {
        const input =
          element.query(By.css('input[formControlName]')) || element.query(By.css('input'));
        input.nativeElement.value = 'a';
        input.nativeElement.dispatchEvent(new Event('input'));
        component.suggestions$.subscribe(result => {
          expect(result.length).toBeGreaterThan(0);
        });
        tick(300);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();
        expect(shapesGraphStateStub.getPropertyOptions).toHaveBeenCalledWith('a', component.propertyTypes, true);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
      it('should handle no record or type', fakeAsync(() => {
        shapesGraphStateStub.getPropertyOptions.and.returnValue(of([]));
        fixture.detectChanges();
        component.inputControl.setValue('x');
        fixture.detectChanges();
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
        tick(300);
      }));
      it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
        shapesGraphStateStub.getPropertyOptions.and.returnValue(throwError(() => new Error('API Error')));
        component.suggestions$.subscribe(result => {
          expect(result).toEqual([]);
        });
  
        component.inputControl.setValue('fail');
        tick(300); // Wait for debounceTime
        fixture.detectChanges();
  
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner, 15);
        expect(shapesGraphStateStub.getClassOptions).not.toHaveBeenCalled();
        expect(shapesGraphStateStub.getPropertyOptions).toHaveBeenCalledWith('fail', component.propertyTypes, true);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load suggestions. Please try typing again.');
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.autocompleteSpinner);
      }));
    });
  });
  describe('reactive forms integration', () => {
    let hostInput: HTMLInputElement;

    beforeEach(() => {
      hostInput = parentFixture.debugElement.query(
        By.css('app-shacl-chip-suggestions-input input[matInput]')
      ).nativeElement;
    });
    describe('setDisabledState', () => {
      it('should disable and enable inputControl', () => {
        component.setDisabledState(true);
        expect(component.inputControl.disabled).toBeTrue();
        component.setDisabledState(false);
        expect(component.inputControl.enabled).toBeTrue();
      });
      it('should trigger valueChanges on focus', () => {
        const childComponentDebugElement = parentFixture.debugElement.query(
          By.directive(ShaclChipSuggestionsInputComponent)
        );
        const childComponentInstance =
          childComponentDebugElement.componentInstance as ShaclChipSuggestionsInputComponent;

        spyOn(childComponentInstance.inputControl, 'setValue').and.callThrough(); // Spy on child's internal control
        hostInput.dispatchEvent(new Event('focus'));
        parentFixture.detectChanges(); // Update parent and child views after setValue
        expect(childComponentInstance.inputControl.setValue).toHaveBeenCalledWith(null);
      });
      it('should reset the input on blur', () => {
        const childComponentDebugElement = parentFixture.debugElement.query(
          By.directive(ShaclChipSuggestionsInputComponent)
        );
        const childComponentInstance =
          childComponentDebugElement.componentInstance as ShaclChipSuggestionsInputComponent;

        spyOn(childComponentInstance.inputControl, 'setValue').and.callThrough(); // Spy on child's internal control
        hostInput.dispatchEvent(new Event('blur'));
        parentFixture.detectChanges();
        expect(childComponentInstance.inputControl.setValue).toHaveBeenCalledWith('');
      });
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      component.chipValues = [
        { label: 'Label1', value: 'http://iri1' },
        { label: 'Label2', value: 'http://iri2' }
      ];
      shapesGraphStateStub.getClassOptions.and.returnValue(of([
        { label: 'Group1', suggestions: [{ label: 'Sug1', value: 'http://sug1' }] }
      ]));
      fixture.detectChanges();
    });
    it('should render mat-chip-list with chips and removable icons', () => {
      const chips = element.queryAll(By.css('mat-chip'));
      expect(chips.length).toEqual(2);
      expect(chips[0].nativeElement.textContent).toContain('Label1');
      const removeIcons = element.queryAll(By.css('mat-chip mat-icon'));
      expect(removeIcons.length).toEqual(2);
    });
    it('should render input inside mat-chip-list', () => {
      const inputEl = element.query(By.css('mat-chip-list input'));
      expect(inputEl).toBeTruthy();
    });
  });
});
