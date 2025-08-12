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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ShaclTargetSelectorComponent } from './shacl-target-selector.component';

@Component({
  template: `
    <form [formGroup]="form">
      <app-shacl-target-selector formControlName="target"></app-shacl-target-selector>
    </form>
  `
})
class TestParentComponent {
  form = new FormGroup({
    target: new FormControl('', Validators.required)
  });
}

describe('ShaclTargetSelectorComponent', () => {
  let component: ShaclTargetSelectorComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ShaclTargetSelectorComponent>;

  let parentFixture: ComponentFixture<TestParentComponent>;
  let parentComponent: TestParentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatRadioModule
      ],
      declarations: [ShaclTargetSelectorComponent, TestParentComponent]
    }).compileComponents();
    parentFixture = TestBed.createComponent(TestParentComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    fixture = TestBed.createComponent(ShaclTargetSelectorComponent);
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
      const fn = () => { };
      component.registerOnChange(fn as any);
      expect(component.onChange).toBe(fn);
    });
    it('should register the onTouched function', () => {
      const fn = () => { };
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });
  });
  describe('controlValueAccessor integration', () => {
    it('should not emit selectionChange for null or unknown IRI', () => {
      spyOn(component.selectionChange, 'emit');
      component.writeValue(null);
      component.writeValue('urn:nonexistent');
      expect(component.selectionChange.emit).not.toHaveBeenCalled();
    });
    it('should emit selectionChange with isUserSelection=false on valid writeValue', () => {
      spyOn(component.selectionChange, 'emit');
      const testOption = component.targetOptions[1];
      component.writeValue(testOption.iri);
      expect(component.selectionChange.emit).toHaveBeenCalledWith({
        ...testOption,
        isUserSelection: false
      });
    });
    it('should update the checked radio input when writeValue is called', () => {
      const testIri = component.targetOptions[3].iri;
      component.writeValue(testIri);
      fixture.detectChanges();
      const selectedInput = element.query(By.css('input:checked'));
      expect(selectedInput.nativeElement.value).toBe(testIri);
    });
    describe('disabled state', () => {
      it('should disable all radio inputs when setDisabledState(true) is called', () => {
        component.setDisabledState(true);
        fixture.detectChanges();
        const inputs = element.queryAll(By.css('input[type="radio"]'));
        expect(inputs.length).withContext('Should have rendered radio buttons').toBeGreaterThan(0);
        inputs.forEach((inputDe) => expect(inputDe.nativeElement.disabled).toBe(true));
      });
      it('should re-enable all radio inputs when setDisabledState(false) is called', () => {
        component.setDisabledState(true);
        fixture.detectChanges();
        component.setDisabledState(false);
        fixture.detectChanges();
        const inputs = element.queryAll(By.css('input[type="radio"]'));
        expect(inputs.length).withContext('Should have rendered radio buttons').toBeGreaterThan(0);
        inputs.forEach((inputDe) => expect(inputDe.nativeElement.disabled).toBe(false));
      });
    });
  });
  describe('user interactions', () => {
    it('should emit full TargetOption including valueLabel on implicit option click', () => {
      spyOn(component.selectionChange, 'emit');
      const idx = component.targetOptions.findIndex((o) => o.iri === 'urn:implicitTarget');
      const implicitIri = component.targetOptions[idx].iri;
      element
        .query(By.css('mat-radio-group'))
        .triggerEventHandler('change', { value: implicitIri });
      fixture.detectChanges();
      expect(component.selectionChange.emit).toHaveBeenCalledWith({
        ...component.targetOptions[idx],
        isUserSelection: true
      });
    });
    it('should propagate value and emit selectionChange on standard option click', () => {
      spyOn(component.selectionChange, 'emit');
      const radioGroup = element.query(By.css('mat-radio-group'));
      const option = component.targetOptions[2];
      radioGroup.triggerEventHandler('change', { value: option.iri });
      fixture.detectChanges();
      expect(component['value']).toBe(option.iri);
      expect(component.selectionChange.emit).toHaveBeenCalledWith({
        ...option,
        isUserSelection: true
      });
    });
    it('should allow changing selection multiple times and emit each', () => {
      spyOn(component.selectionChange, 'emit');
      const [first, second] = component.targetOptions;
      const group = element.query(By.css('mat-radio-group'));
      group.triggerEventHandler('change', { value: first.iri });
      expect(component.onChange).toHaveBeenCalledWith(first.iri);
      expect(component.onTouched).toHaveBeenCalledTimes(1);
      expect(component.selectionChange.emit).toHaveBeenCalledWith({ ...first, isUserSelection: true });
      group.triggerEventHandler('change', { value: second.iri });
      fixture.detectChanges();

      expect(component.value).toBe(second.iri);
      expect(component.onChange).toHaveBeenCalledWith(second.iri);
      expect(component.onTouched).toHaveBeenCalledTimes(2);
      expect(component.selectionChange.emit).toHaveBeenCalledTimes(2);
      expect(component.selectionChange.emit).toHaveBeenCalledWith({ ...second, isUserSelection: true });
    });
  });
  describe('contains the correct html', () => {
    it('should render a radio button for each option with correct label, title, and value', () => {
      const radios = element.queryAll(By.css('mat-radio-button'));
      expect(radios.length).toBe(component.targetOptions.length);
      radios.forEach((radioDe, index) => {
        const span = radioDe.query(By.css('span[title]'));
        expect(span.nativeElement.textContent.trim()).toBe(component.targetOptions[index].label);
        expect(span.nativeElement.getAttribute('title')).toBe(
          component.targetOptions[index].description
        );
        const input = radioDe.query(By.css('input[type="radio"]'));
        expect(input.nativeElement.value).toBe(component.targetOptions[index].iri);
      });
    });
  });
  describe('reactive forms integration', () => {
    it('should be invalid initially and valid after selection', () => {
      const form = parentComponent.form;
      expect(form.valid).toBeFalse();
      parentFixture.debugElement
        .query(By.css('mat-radio-group'))
        .triggerEventHandler('change', { value: component.targetOptions[0].iri });
      parentFixture.detectChanges();
      expect(form.valid).toBeTrue();
      expect(form.value.target).toBe(component.targetOptions[0].iri);
    });
    it('should disable component when form control is disabled', () => {
      const form = parentComponent.form;
      form.controls['target'].disable();
      parentFixture.detectChanges();
      const inputs = parentFixture.debugElement.queryAll(By.css('input[type="radio"]'));
      inputs.forEach((inputDe) => expect(inputDe.nativeElement.disabled).toBe(true));
    });
    it('should update component when form control value changes programmatically', () => {
      const form = parentComponent.form;
      const testIri = component.targetOptions[1].iri;
      form.controls['target'].setValue(testIri);
      parentFixture.detectChanges();
      const selected = parentFixture.debugElement.query(By.css('input:checked'));
      expect(selected.nativeElement.value).toBe(testIri);
    });
    it('should mark control as touched on value change', () => {
      const form = parentComponent.form;
      expect(form.controls['target'].touched).toBeFalse();
      parentFixture.debugElement
        .query(By.css('mat-radio-group'))
        .triggerEventHandler('change', { value: component.targetOptions[2].iri });
      parentFixture.detectChanges();
      expect(form.controls['target'].touched).toBeTrue();
    });
    it('should mark control as dirty after user interaction', () => {
      const form = parentComponent.form;
      expect(form.controls['target'].dirty).toBeFalse();
      parentFixture.debugElement
        .query(By.css('mat-radio-group'))
        .triggerEventHandler('change', { value: component.targetOptions[3].iri });
      parentFixture.detectChanges();
      expect(form.controls['target'].dirty).toBeTrue();
    });
  });
});
