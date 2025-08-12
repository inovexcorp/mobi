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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ValueOption } from '../../models/value-option.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { ShaclTargetChipInputComponent } from './shacl-target-chip-input.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-target-chip-input
        formControlName="targetValue"
        [label]="label"
        [targetType]="targetType"
      >
      </app-shacl-target-chip-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    targetValue: new FormControl(null, Validators.required)
  });
  label = 'label';
  targetType = 'targetType';
}

describe('ShaclTargetChipInputComponent', () => {
  let component: ShaclTargetChipInputComponent;
  let fixture: ComponentFixture<ShaclTargetChipInputComponent>;
  let element: DebugElement;
  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;
  let stateServiceStub: jasmine.SpyObj<ShapesGraphStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const mockGroupSuggestion: GroupedSuggestion[] = [
    {
      label: 'http://example.org',
      suggestions: [
        { label: 'Property1', value: 'http://example.org/Property1' },
        { label: 'Property2', value: 'http://example.org/Property2' }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      declarations: [
        ShaclTargetChipInputComponent,
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
    stateServiceStub.getEntityName.and.callFake((entityId: string) => `entityName(${entityId})`);
    stateServiceStub.getPropertiesOptions.and.returnValue(of(mockGroupSuggestion));

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclTargetChipInputComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.targetType = 'targetType';
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
      const newChip: ValueOption = {
        value: 'http://example.com/item/1',
        label: 'Item 1'
      };
      it('should add a new chip, update the form, and clear the input', () => {
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: newChip } as MatOption,
          source: {} as MatAutocomplete
        };
        component.chipValues = [];
        component.addChipFromSelection(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.chipValues[0]).toEqual(newChip);
        expect(component.onChange).toHaveBeenCalledWith(['http://example.com/item/1']);
        expect(component.onTouched).toHaveBeenCalledWith();
        expect(component.chipInput.nativeElement.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
      it('should not add a duplicate chip', () => {
        component.chipValues = [newChip];
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: newChip } as MatOption,
          source: {} as MatAutocomplete
        };

        component.addChipFromSelection(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.onChange).not.toHaveBeenCalled();
        expect(component.onTouched).not.toHaveBeenCalled();
      });
      it('should still clear the input even if the chip is a duplicate', () => {
        component.chipValues = [newChip];
        const mockEvent: MatAutocompleteSelectedEvent = {
          option: { value: newChip } as MatOption,
          source: {} as MatAutocomplete
        };
        component.inputControl.setValue('Some text');

        component.addChipFromSelection(mockEvent);

        expect(component.chipInput.nativeElement.value).toEqual('');
        expect(component.inputControl.value).toBeNull();
      });
    });
    describe('addChipFromInput', () => {
      const newIri = 'http://example.com/typed/iri';
      it('should add a chip from valid input, update form, and clear input', () => {
        component.inputControl.setValue(newIri);
        const mockEvent = {
          input: { value: '' } as HTMLInputElement,
          value: newIri
        } as MatChipInputEvent;

        component.addChipFromInput(mockEvent);

        expect(component.chipValues.length).toEqual(1);
        expect(component.chipValues[0]).toEqual({
          value: newIri,
          label: 'entityName(http://example.com/typed/iri)'
        });
        expect(stateServiceStub.getEntityName).toHaveBeenCalledWith(newIri);
        expect(component.onChange).toHaveBeenCalledWith([newIri]);
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
        const existingChip = { value: newIri, label: `Label for ${newIri}` };
        component.chipValues = [existingChip];
        component.inputControl.setValue(newIri);
        const mockEvent = {
          input: { value: '' } as HTMLInputElement,
          value: newIri
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
        expect(component.onChange).toHaveBeenCalledWith(['V2']);
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
      component.writeValue(['http://x']);
      expect(component.chipValues.length).toEqual(1);
      expect(component.chipValues[0].label).toEqual('entityName(http://x)');
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
    it('should fetch suggestions on input', fakeAsync(() => {
      const input =
        element.query(By.css('input[formControlName]')) || element.query(By.css('input'));
      input.nativeElement.value = 'a';
      input.nativeElement.dispatchEvent(new Event('input'));
      component.suggestions$.subscribe(result => {
        expect(result.length).toBeGreaterThan(0);
      });
      tick(300);
      expect(stateServiceStub.getPropertiesOptions).toHaveBeenCalledWith('a', 'targetType', true);
      // expect(component.suggestions.length).toBeGreaterThan(0);
    }));
    it('should handle no record or type', fakeAsync(() => {
      stateServiceStub.getPropertiesOptions.and.returnValue(of([]));
      component.targetType = null;
      fixture.detectChanges();
      component.inputControl.setValue('x');
      fixture.detectChanges();
      component.suggestions$.subscribe(result => {
        expect(result).toEqual([]);
      });
      tick(300);
    }));
    it('should handle errors during suggestion fetching gracefully', fakeAsync(() => {
      stateServiceStub.getPropertiesOptions.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      component.suggestions$.subscribe(result => {
        expect(result).toEqual([]);
      });

      component.inputControl.setValue('fail');
      tick(300); // Wait for debounceTime
      fixture.detectChanges();

      expect(stateServiceStub.getPropertiesOptions).toHaveBeenCalledWith('fail', 'targetType', true);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load suggestions. Please try typing again.');
    }));
  });
  describe('setDisabledState', () => {
    it('should disable and enable inputControl', () => {
      component.setDisabledState(true);
      expect(component.inputControl.disabled).toBeTrue();
      component.setDisabledState(false);
      expect(component.inputControl.enabled).toBeTrue();
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      component.chipValues = [
        { label: 'Label1', value: 'http://iri1' },
        { label: 'Label2', value: 'http://iri2' }
      ];
      stateServiceStub.getPropertiesOptions.and.returnValue(of([
        { label: 'Group1', suggestions: [{ label: 'Sug1', value: 'http://sug1' }] }
      ]));
      // component.suggestions = [
      //   { label: 'Group1', suggestions: [{ label: 'Sug1', value: 'http://sug1' }] }
      // ];
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
