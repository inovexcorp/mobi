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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { IriOption, IriSelectComponent } from './iriSelect.component';

describe('IRI Select component', function () {
  let component: IriSelectComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<IriSelectComponent>;

  const iri = 'http://test.com';
  const iriOption: IriOption = {
    item: iri,
    name: 'name'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatOptionModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatAutocompleteModule
      ],
      declarations: [
        IriSelectComponent,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IriSelectComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.displayText = 'test';
    component.selectList = {};
    component.mutedText = 'test';
    spyOn(component.selectedChange, 'emit');
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });
  describe('should initialize correctly', function () {
    beforeEach(function () {
      this.group = { namespace: 'namespace', options: [iriOption] };
      spyOn(component, 'filter').and.returnValue([this.group]);
      spyOn(component, 'getName').and.returnValue('Name');
      component.selected = ['test'];
    });
    it('when singleSelect is true', fakeAsync(function () {
      component.singleSelect = true;
      component.ngOnInit();
      component.filteredIris.subscribe(result => {
        expect(result).toEqual([this.group]);
      });
      tick();
      expect(component.singleControl.value).toEqual({
        item: 'test',
        name: 'Name'
      });
    }));
    it('when singleSelect is false', fakeAsync(function () {
      component.ngOnInit();
      component.filteredIris.subscribe(result => {
        expect(result).toEqual([this.group]);
      });
      tick();
      expect(component.selectedOptions).toEqual([{
        item: 'test',
        name: 'Name'
      }]);
    }));
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.iri-select')).length).toBe(1);
      expect(element.queryAll(By.css('mat-form-field')).length).toBe(1);
    });
    it('depending on whether it is a multi select', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('input.single-input')).length).toEqual(0);
      expect(element.queryAll(By.css('input.multi-input')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);

      component.singleSelect = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('input.single-input')).length).toEqual(1);
      expect(element.queryAll(By.css('input.multi-input')).length).toEqual(0);
      expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(0);
    });
  });
  describe('controller methods', function () {
    describe('setRequired should handle updating required status', function () {
      it('for single select', function () {
        spyOn(component.singleControl, 'setValidators').and.callThrough();
        spyOn(component.singleControl, 'clearValidators').and.callThrough();
        component.singleSelect = true;
        component.setRequired(true);
        expect(component.singleControl.setValidators).toHaveBeenCalledWith([Validators.required]);

        component.setRequired(false);
        expect(component.singleControl.clearValidators).toHaveBeenCalledWith();
      });
      it('for multi select', function () {
        spyOn(component.multiControl, 'setValidators').and.callThrough();
        spyOn(component.multiControl, 'clearValidators').and.callThrough();
        component.setRequired(true);
        expect(component.multiControl.setValidators).toHaveBeenCalledWith([Validators.required]);

        component.setRequired(false);
        expect(component.multiControl.clearValidators).toHaveBeenCalledWith();
      });
    });
    describe('setDisabled should handle updating disabled status', function () {
      it('for single select', function () {
        component.singleSelect = true;
        component.setDisabled(true);
        expect(component.singleControl.disabled).toBeTrue();

        component.setDisabled(false);
        expect(component.singleControl.disabled).toBeFalse();
      });
      it('for multi select', function () {
        component.setDisabled(true);
        expect(component.multiControl.disabled).toBeTrue();

        component.setDisabled(false);
        expect(component.multiControl.disabled).toBeFalse();
      });
    });
    it('filter should return the list of filtered grouped IRIs', function () {
      component.selectList = {
        'iri1': 'A',
        'iri2': 'B',
        'test1': 'A',
        'test3': 'C'
      };
      spyOn(component, 'getOntologyIri').and.callThrough();
      spyOn(component, 'getName').and.callThrough();
      expect(component.filter('I')).toEqual([
        {
          namespace: 'A', options: [
            { item: 'iri1', name: 'Iri 1' },
          ]
        },
        {
          namespace: 'B', options: [
            { item: 'iri2', name: 'Iri 2' },
          ]
        },
      ]);
      Object.keys(component.selectList).forEach(iri => {
        expect(component.getName).toHaveBeenCalledWith(iri);
      });
      ['iri1', 'iri2'].forEach(iri => {
        expect(component.getOntologyIri).toHaveBeenCalledWith(iri);
      });
    });
    describe('getOntologyIri', function () {
      it('should return the set ontology IRI from the selectList if provided', function () {
        component.selectList = { [iri]: 'new' };
        expect(component.getOntologyIri(iri)).toEqual('new');
      });
      it('should return ontologyId if iri is not set on selectList', function () {
        expect(component.getOntologyIri('http://mobi.com/test')).toEqual('http://mobi.com');
      });
    });
    it('getName should return the name of an iri', function () {
      expect(component.getName(iri)).toEqual('Test.com');
    });
    it('add should handle adding a chip', function () {
      spyOn(component, 'getName').and.returnValue('name');
      component.add({ chipInput: null, input: null, value: iriOption.item });
      expect(component.selected).toEqual([iriOption.item]);
      expect(component.selectedOptions).toEqual([iriOption]);
      expect(component.selectedChange.emit).toHaveBeenCalledWith([iriOption.item]);
      expect(component.multiControl.value).toEqual(null);
    });
    it('remove should handle removing a class', function () {
      component.remove(iriOption);
      expect(component.selected).toEqual([]);
      expect(component.selectedChange.emit).not.toHaveBeenCalled();

      component.selected = [iriOption.item];
      component.remove(iriOption);
      expect(component.selected).toEqual([]);
      expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
    });
    describe('select should handle selecting an option in the autocomplete', function () {
      beforeEach(function () {
        component.selected = ['previous'];
      });
      it('if single select', function () {
        component.singleSelect = true;
        fixture.detectChanges();
        const event: MatAutocompleteSelectedEvent = {
          option: {
            value: iriOption
          }
        } as MatAutocompleteSelectedEvent;
        component.select(event);
        expect(component.selected).toEqual([iriOption.item]);
        expect(component.selectedOptions).toEqual([]);
        expect(component.selectedChange.emit).toHaveBeenCalledWith([iriOption.item]);
      });
      it('if multi select', function () {
        component.singleSelect = false;
        fixture.detectChanges();
        const event: MatAutocompleteSelectedEvent = {
          option: {
            value: iriOption
          }
        } as MatAutocompleteSelectedEvent;
        component.select(event);
        expect(component.selected).toEqual(['previous', iriOption.item]);
        console.log(component.selectedOptions)
        expect(component.selectedOptions).toEqual([{ item: 'previous', name: 'Previous' }, iriOption]);
        expect(component.selectedChange.emit).toHaveBeenCalledWith(['previous', iriOption.item]);
        expect(component.multiInput.nativeElement.value).toEqual('');
        expect(component.multiControl.value).toEqual(null);
      });
    });
  });
});