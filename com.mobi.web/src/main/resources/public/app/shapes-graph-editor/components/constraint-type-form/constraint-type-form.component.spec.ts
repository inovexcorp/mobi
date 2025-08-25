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
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipInput, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';

import { MockComponent } from 'ng-mocks';

import { AutocompleteConstraintControl, ChipsConstraintControl, NumberConstraintControl, SelectConstraintControl, TextConstraintControl } from '../../models/constraint-control.interface';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ShaclSingleSuggestionInputComponent } from '../shacl-single-suggestion-input/shacl-single-suggestion-input.component';
import { ConstraintTypeFormComponent } from './constraint-type-form.component';

describe('ConstraintTypeFormComponent', () => {
  let component: ConstraintTypeFormComponent;
  let fixture: ComponentFixture<ConstraintTypeFormComponent>;
  let element: DebugElement;

  let textControl: TextConstraintControl;
  let numberControl: NumberConstraintControl;
  let selectControl: SelectConstraintControl;
  let chipControl: ChipsConstraintControl;
  let autocompleteControl: AutocompleteConstraintControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule
      ],
      declarations: [
        ConstraintTypeFormComponent,
        MockComponent(ShaclSingleSuggestionInputComponent)
      ],
    }).compileComponents();

    textControl = {
      type: 'text',
      prop: 'urn:prop',
      label: 'Text Field',
      name: 'textField',
      multiple: false,
      control: new FormControl('', [Validators.required])
    };
    numberControl = {
      type: 'number',
      prop: 'urn:prop',
      label: 'Number Field',
      name: 'numberField',
      multiple: false,
      min: 0,
      step: 1,
      control: new FormControl('', [Validators.required])
    };
    selectControl = {
      type: 'select',
      prop: 'urn:prop',
      label: 'Select Field',
      name: 'selectField',
      multiple: true,
      control: new FormControl(''),
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
      ],
      tooltip: 'This is a tooltip'
    };
    chipControl = {
      type: 'chips',
      prop: 'urn:prop',
      label: 'Chips Field',
      name: 'chipsField',
      multiple: true,
      control: new FormControl([])
    };
    autocompleteControl = {
      type: 'autocomplete',
      prop: 'urn:prop',
      label: 'Autocomplete Field',
      name: 'autocompleteField',
      multiple: false,
      control: new FormControl('', [Validators.required]),
      pullClasses: true
    };

    fixture = TestBed.createComponent(ConstraintTypeFormComponent);
    component = fixture.componentInstance;
    component.constraintOption = {
      label: 'Test',
      controls: [textControl]
    };
    component.parentForm = new FormGroup([textControl, numberControl, selectControl, chipControl, autocompleteControl].reduce((acc, val) => {
      acc[val.name] = val.control;
      return acc;
    }, {}));
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    textControl = null;
    numberControl = null;
    selectControl = null;
    chipControl = null;
    autocompleteControl = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('isRequired should determine whether a control is required', () => {
      expect(component.isRequired(selectControl.name)).toBeFalse();
      expect(component.isRequired(textControl.name)).toBeTrue();
    });
    it('requiredMessage should determine whether to show a required error', () => {
      textControl.control.setValue('Test');
      expect(component.requiredMessage(textControl)).toBeFalse();
      expect(component.requiredMessage(selectControl)).toBeFalse();
      expect(component.requiredMessage(autocompleteControl)).toBeTrue();
    });
    describe('addChip should add a new value to a chip control', () => {
      beforeEach(() => {
        spyOn(chipControl.control, 'updateValueAndValidity').and.callThrough();
      });
      describe('if a value was actually set', () => {
        describe('if there are existing values', () => {
          it('and it has not been added before', () => {
            const event = {
              value: 'test',
              chipInput: { clear: jasmine.createSpy() } as unknown as MatChipInput
            } as MatChipInputEvent;
            chipControl.control.setValue(['existing']);
            component.addChip(event, chipControl);
            expect(chipControl.control.value).toEqual(['existing', 'test']);
            expect(chipControl.control.updateValueAndValidity).toHaveBeenCalledWith();
            expect(event.chipInput.clear).toHaveBeenCalledWith();
          });
          it('and it has been added before', () => {
            const event = {
              value: 'test',
              chipInput: { clear: jasmine.createSpy() } as unknown as MatChipInput
            } as MatChipInputEvent;
            chipControl.control.setValue(['test']);
            component.addChip(event, chipControl);
            expect(chipControl.control.value).toEqual(['test']);
            expect(chipControl.control.updateValueAndValidity).toHaveBeenCalledWith();
            expect(event.chipInput.clear).toHaveBeenCalledWith();
          });
        });
        it('if there are no existing values', () => {
          const event = {
            value: 'test',
            chipInput: { clear: jasmine.createSpy() } as unknown as MatChipInput
          } as MatChipInputEvent;
          component.addChip(event, chipControl);
          expect(chipControl.control.value).toEqual(['test']);
          expect(chipControl.control.updateValueAndValidity).toHaveBeenCalledWith();
          expect(event.chipInput.clear).toHaveBeenCalledWith();
        });
      });
      it('if no value was actually set', () => {
        const event = {
          value: '',
          chipInput: { clear: jasmine.createSpy() } as unknown as MatChipInput
        } as MatChipInputEvent;
        component.addChip(event, chipControl);
        expect(chipControl.control.value).toEqual([]);
        expect(chipControl.control.updateValueAndValidity).toHaveBeenCalledWith();
        expect(event.chipInput.clear).toHaveBeenCalledWith();
      });
    });
    it('removeChip should remove a value from the chip control', () => {
      chipControl.control.setValue(['A']);
      component.removeChip('A', chipControl);
      expect(chipControl.control.value).toEqual([]);
      component.removeChip('A', chipControl);
      expect(chipControl.control.value).toEqual([]);
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      component.constraintOption = {
        label: 'Test',
        controls: [textControl, numberControl, selectControl, chipControl, autocompleteControl]
      };
      fixture.detectChanges();
    });
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('div.constraint-type-form')).length).toEqual(1);
    });
    it('with mat-form-fields for each control', () => {
      expect(element.queryAll(By.css('mat-form-field')).length).toEqual(component.constraintOption.controls.length - 1 );
    });
    it('for text inputs', () => {
      expect(element.queryAll(By.css(`input[type="text"][name="${textControl.name}"]`)).length).toEqual(1);
    });
    it('for number inputs', () => {
      expect(element.queryAll(By.css(`input[type="number"][name="${numberControl.name}"]`)).length).toEqual(1);
    });
    it('for select inputs', () => {
      expect(element.queryAll(By.css('mat-select')).length).toEqual(1);
    });
    it('for chip inputs', () => {
      expect(element.queryAll(By.css('input.chip-input')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);
    });
    it('for autocomplete inputs', () => {
      expect(element.queryAll(By.css('app-shacl-single-suggestion-input')).length).toEqual(1);
    });
  });
});
