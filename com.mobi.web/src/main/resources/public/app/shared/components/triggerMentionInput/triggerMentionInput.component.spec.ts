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
import { Component, DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';
import { TriggerMentionInputComponent, TriggerMentionOption, PatternValidationResult } from './triggerMentionInput.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-trigger-mention-input
        formControlName="template"
        [suggestions]="suggestions"
        [patternValidator]="patternValidator"
        [label]="'IRI Template'"
        [placeholder]="'Enter template'"
        [hint]="'Type \${ to insert a column'">
      </app-trigger-mention-input>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    template: new FormControl('', Validators.required)
  });
  suggestions: TriggerMentionOption[] = [
    { displayText: 'UUID', insertValue: 'UUID', metadata: { preview: '(Auto-generated)' } },
    { displayText: 'Column1', insertValue: '0', metadata: { preview: 'Value1' } },
    { displayText: 'Column2', insertValue: '1', metadata: { preview: 'Value2' } }
  ];
  patternValidator = (innerValue: string): PatternValidationResult => {
    if (innerValue === 'UUID') {
      return { isValid: true, resolvedName: 'UUID', resolvedValue: '(Auto-generated)' };
    }
    const index = parseInt(innerValue, 10);
    if (!isNaN(index) && index >= 0 && index < 2) {
      return { isValid: true, resolvedName: `Column${index + 1}`, resolvedValue: `Value${index + 1}` };
    }
    return { isValid: false };
  };
}

describe('TriggerMentionInputComponent', () => {
  let component: TriggerMentionInputComponent;
  let fixture: ComponentFixture<TriggerMentionInputComponent>;
  let element: DebugElement;
  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;

  const mockSuggestions: TriggerMentionOption[] = [
    { displayText: 'UUID', insertValue: 'UUID', metadata: { preview: '(Auto-generated)' } },
    { displayText: 'Column1', insertValue: '0', metadata: { preview: 'Value1' } },
    { displayText: 'Column2', insertValue: '1', metadata: { preview: 'Value2' } }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule
      ],
      declarations: [
        TriggerMentionInputComponent,
        TestParentComponent,
        TrustedHtmlPipe
      ]
    }).compileComponents();

    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(TriggerMentionInputComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.suggestions = mockSuggestions;
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
  });

  it('should create parent component', () => {
    expect(parentComponent).toBeTruthy();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('ControlValueAccessor implementation', () => {
    it('should write value to form control', () => {
      component.writeValue('http://test/${0}');
      expect(component.inputControl.value).toEqual('http://test/${0}');
    });
    it('should handle null value', () => {
      component.writeValue(null);
      expect(component.inputControl.value).toEqual('');
    });
    it('should register onChange callback', () => {
      const fn = jasmine.createSpy('onChange');
      component.registerOnChange(fn);
      component.inputControl.setValue('test');
      expect(fn).toHaveBeenCalledWith('test');
    });
    it('should register onTouched callback', fakeAsync(() => {
      const fn = jasmine.createSpy('onTouched');
      component.registerOnTouched(fn);
      component.onBlur();
      // Wait for setTimeout in onBlur
      tick(201);
      expect(fn).toHaveBeenCalledWith();
    }));
    it('should disable control when setDisabledState is called with true', () => {
      component.setDisabledState(true);
      expect(component.inputControl.disabled).toBeTrue();
    });
    it('should enable control when setDisabledState is called with false', () => {
      component.inputControl.disable();
      component.setDisabledState(false);
      expect(component.inputControl.enabled).toBeTrue();
    });
  });
  describe('trigger detection', () => {
    beforeEach(() => {
      component.inputElement = { nativeElement: document.createElement('input') } as ElementRef<HTMLInputElement>;
    });
    it('should filter suggestions when trigger is typed', () => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/${';
      input.selectionStart = 15;
      component.inputControl.setValue(input.value);

      const event = { target: input } as unknown as Event;
      component.onInput(event);

      // Should have filtered suggestions ready
      expect(component.filteredSuggestions.length).toBeGreaterThan(0);
    });
    it('should have empty trigger position when no trigger is present', () => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/';
      input.selectionStart = 12;
      component.inputControl.setValue(input.value);

      const event = { target: input } as unknown as Event;
      component.onInput(event);

      // triggerStartPosition should be -1 when no trigger
      expect((component as any)._triggerStartPosition).toBe(-1);
    });
    it('should reset trigger position when cursor moves past completed pattern', () => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/${0}/more';
      input.selectionStart = 21;
      component.inputControl.setValue(input.value);

      const event = { target: input } as unknown as Event;
      component.onInput(event);

      // triggerStartPosition should be reset
      expect((component as any)._triggerStartPosition).toBe(-1);
    });
    it('should filter suggestions based on typed text after trigger', () => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/${Col';
      input.selectionStart = 17;
      component.inputControl.setValue(input.value);

      const event = { target: input } as unknown as Event;
      component.onInput(event);

      expect(component.filteredSuggestions.length).toBe(2); // Column1 and Column2
      expect(component.filteredSuggestions.every(s => s.displayText.toLowerCase().includes('col'))).toBeTrue();
    });
  });
  describe('dropdown navigation', () => {
    beforeEach(() => {
      (component as any)._isPanelOpen = true;
      component.filteredSuggestions = [...mockSuggestions];
      component.highlightedIndex = 0;
    });
    it('should navigate down with ArrowDown key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      expect(event.preventDefault).toHaveBeenCalledWith();
      expect(component.highlightedIndex).toBe(1);
    });
    it('should wrap around when navigating down past last item', () => {
      component.highlightedIndex = 2;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.onKeydown(event);

      expect(component.highlightedIndex).toBe(0);
    });
    it('should navigate up with ArrowUp key', () => {
      component.highlightedIndex = 2;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      expect(event.preventDefault).toHaveBeenCalledWith();
      expect(component.highlightedIndex).toBe(1);
    });
    it('should wrap around when navigating up past first item', () => {
      component.highlightedIndex = 0;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.onKeydown(event);

      expect(component.highlightedIndex).toBe(2);
    });
    it('should handle Escape key when panel is open', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      expect(event.preventDefault).toHaveBeenCalledWith();
    });
    it('should handle Tab key when panel is open', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });

      component.onKeydown(event);

      // Tab should close autocomplete (triggerStartPosition reset)
      expect((component as any)._triggerStartPosition).toBe(-1);
    });
  });
  describe('option selection', () => {
    beforeEach(() => {
      component.inputElement = { nativeElement: document.createElement('input') } as any;
      component.inputElement.nativeElement.value = 'http://test/${';
      component.inputElement.nativeElement.selectionStart = 15;
      component.inputControl.setValue('http://test/${');
      (component as any)._isPanelOpen = true;
      component.filteredSuggestions = [...mockSuggestions];
    });
    it('should insert selected option with closing brace', fakeAsync(() => {
      // Simulate trigger detection first
      const inputEvent = { target: component.inputElement.nativeElement } as any;
      component.onInput(inputEvent);

      component.selectOption(mockSuggestions[0]);
      tick();

      expect(component.inputControl.value).toContain('${UUID}');
      // triggerStartPosition should be reset after selection
      expect((component as any)._triggerStartPosition).toBe(-1);
    }));
    it('should select option on Enter key', fakeAsync(() => {
      const inputEvent = { target: component.inputElement.nativeElement } as any;
      component.onInput(inputEvent);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'selectOption').and.callThrough();

      component.onKeydown(event);
      tick();

      expect(event.preventDefault).toHaveBeenCalledWith();
      expect(component.selectOption).toHaveBeenCalledWith(mockSuggestions[0]);
    }));
    it('should not select if no option provided', () => {
      const initialValue = component.inputControl.value;
      component.selectOption(null);
      expect(component.inputControl.value).toBe(initialValue);
    });
  });
  describe('pattern parsing', () => {
    it('should parse patterns from value', () => {
      component.patternValidator = (innerValue: string) => ({ isValid: true, resolvedName: innerValue });

      const patterns = component.parsePatterns('http://test/${0}/${UUID}');

      expect(patterns.length).toBe(2);
      expect(patterns[0].innerValue).toBe('0');
      expect(patterns[1].innerValue).toBe('UUID');
    });
    it('should identify invalid patterns', () => {
      component.patternValidator = (innerValue: string) => {
        return innerValue === '999' ? { isValid: false } : { isValid: true };
      };

      const patterns = component.parsePatterns('http://test/${999}');

      expect(patterns.length).toBe(1);
      expect(patterns[0].isValid).toBeFalse();
    });
    it('should handle empty value', () => {
      const patterns = component.parsePatterns('');
      expect(patterns.length).toBe(0);
    });
    it('should handle value with no patterns', () => {
      const patterns = component.parsePatterns('http://test/no-patterns');
      expect(patterns.length).toBe(0);
    });
  });
  describe('validation', () => {
    it('should return null for valid value', () => {
      component.patternValidator = () => ({ isValid: true });
      component.inputControl.setValue('http://test/${0}');

      const errors = component.validate();

      expect(errors).toBeNull();
    });
    it('should return error for invalid pattern', () => {
      component.patternValidator = (innerValue: string) => {
        return innerValue === 'invalid' ? { isValid: false } : { isValid: true };
      };
      component.inputControl.setValue('http://test/${invalid}');

      const errors = component.validate();

      expect(errors).toEqual({ invalidPattern: { patterns: ['invalid'] } });
    });
    it('should return error for unclosed pattern', () => {
      component.inputControl.setValue('http://test/${unclosed');

      const errors = component.validate();

      expect(errors).toEqual({ unclosedPattern: true });
    });
    it('should use custom resolveValidator', () => {
      component.resolveValidator = () => ({ customError: true });
      component.inputControl.setValue('http://test/');

      const errors = component.validate();

      expect(errors).toEqual({ customError: true });
    });
  });
  describe('backspace handling', () => {
    beforeEach(() => {
      component.inputElement = { nativeElement: document.createElement('input') } as ElementRef<HTMLInputElement>;
    });
    it('should delete entire pattern when backspace at pattern end', fakeAsync(() => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/${0}';
      input.selectionStart = 16; // Right after }
      component.inputControl.setValue(input.value);

      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);
      tick();

      expect(event.preventDefault).toHaveBeenCalledWith();
      expect(component.inputControl.value).toBe('http://test/');
    }));
    it('should not delete entire pattern when backspace in middle of text', () => {
      const input = component.inputElement.nativeElement;
      input.value = 'http://test/${0}/more';
      input.selectionStart = 21; // At end, past the pattern
      component.inputControl.setValue(input.value);

      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');

      component.onKeydown(event);

      // Should not prevent default since cursor is not right after a pattern
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
  describe('styled value generation', () => {
    it('should generate styled HTML for patterns', () => {
      component.patternValidator = (innerValue: string) => ({
        isValid: true,
        resolvedName: innerValue === '0' ? 'Column1' : innerValue
      });
      component.writeValue('http://test/${0}');

      expect(component.styledValue).toContain('pattern-valid');
      expect(component.styledValue).toContain('${Column1}');
    });
    it('should mark invalid patterns differently', () => {
      component.patternValidator = () => ({ isValid: false });
      component.writeValue('http://test/${invalid}');

      expect(component.styledValue).toContain('pattern-invalid');
    });
    it('should escape HTML in regular text', () => {
      component.writeValue('http://test/<script>/path');

      expect(component.styledValue).toContain('&lt;script&gt;');
      expect(component.styledValue).not.toContain('<script>');
    });
  });
  describe('blur handling', () => {
    it('should reset trigger position on blur after delay', fakeAsync(() => {
      (component as any)._triggerStartPosition = 5;
      component.onBlur();
      // triggerStartPosition still set immediately
      expect((component as any)._triggerStartPosition).toBe(5);

      tick(201);
      // After delay, it should be reset
      expect((component as any)._triggerStartPosition).toBe(-1);
    }));
  });
  describe('parent form integration', () => {
    it('should propagate value to parent form', () => {
      const childComponent = parentFixture.debugElement.query(By.directive(TriggerMentionInputComponent));
      const input = childComponent.query(By.css('input')).nativeElement;

      input.value = 'http://example.com/${0}';
      input.dispatchEvent(new Event('input'));
      parentFixture.detectChanges();

      expect(parentComponent.form.get('template').value).toBe('http://example.com/${0}');
    });
    it('should apply pattern validation from parent', fakeAsync(() => {
      const childComponent = parentFixture.debugElement.query(By.directive(TriggerMentionInputComponent));
      const componentInstance = childComponent.componentInstance as TriggerMentionInputComponent;

      componentInstance.writeValue('http://test/${999}');
      tick();
      parentFixture.detectChanges();

      const errors = componentInstance.validate();
      expect(errors?.invalidPattern).toBeDefined();
    }));
  });
});
