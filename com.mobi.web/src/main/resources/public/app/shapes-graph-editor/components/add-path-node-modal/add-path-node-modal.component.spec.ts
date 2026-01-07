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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MockComponent } from 'ng-mocks';

import { AlternativePathNode, PathNode, SequencePathNode } from '../../models/property-shape.interface';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { OWL } from '../../../prefixes';
import { ValueOption } from '../../models/value-option.interface';
import { ShaclSingleSuggestionInputComponent } from '../shacl-single-suggestion-input/shacl-single-suggestion-input.component';
import { AddPathNodeModalComponent } from './add-path-node-modal.component';

describe('AddPathNodeModalComponent', () => {
  let component: AddPathNodeModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<AddPathNodeModalComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<AddPathNodeModalComponent>>;

  const dataPropertyOption: ValueOption = {
    label: 'Data Property',
    value: 'urn:dataProperty',
    type: `${OWL}DatatypeProperty`
  };
  const objectPropertyOption: ValueOption = {
    label: 'Object Property',
    value: 'urn:objectProperty',
    type: `${OWL}ObjectProperty`
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule
      ],
      declarations: [
        AddPathNodeModalComponent,
        MockComponent(ShaclSingleSuggestionInputComponent)
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { parentNode: undefined } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    }).compileComponents();

    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AddPathNodeModalComponent>>;

    fixture = TestBed.createComponent(AddPathNodeModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('controller method', () => {
    describe('selectProperty should handle when a property is selected in the dropdown', () => {
      beforeEach(() => {
        component.addPropertyForm.controls['inverse'].setValue(true);
        component.addPropertyForm.controls['cardinality'].setValue('ZeroOrOne');
      });
      it('if it is an Object Property', () => {
        component.selectProperty(objectPropertyOption);
        expect(component.selectedProperty).toEqual(objectPropertyOption);
        expect(component.addPropertyForm.controls['inverse'].value).toBeTrue();
        expect(component.filteredCardinalityOptions.length).toEqual(4);
        expect(component.addPropertyForm.controls['cardinality'].value).toEqual('ZeroOrOne');
      });
      describe('if it is not an Object Property', () => {
        it('and the selected cardinality is not compatible', () => {
          component.addPropertyForm.controls['cardinality'].setValue('ZeroOrMore');
          component.selectProperty(dataPropertyOption);
          expect(component.selectedProperty).toEqual(dataPropertyOption);
          expect(component.addPropertyForm.controls['inverse'].value).toBeFalse();
          expect(component.filteredCardinalityOptions.length).toEqual(2);
          expect(component.addPropertyForm.controls['cardinality'].value).toEqual('None');
        });
        it('and the selected cardinality is compatible', () => {
          component.selectProperty(dataPropertyOption);
          expect(component.selectedProperty).toEqual(dataPropertyOption);
          expect(component.addPropertyForm.controls['inverse'].value).toBeFalse();
          expect(component.filteredCardinalityOptions.length).toEqual(2);
          expect(component.addPropertyForm.controls['cardinality'].value).toEqual('ZeroOrOne');
        });
      });
    });
    describe('addPathNode should create a PathNode', () => {
      const iriNode: PathNode = {
        type: 'IRI',
        iri: objectPropertyOption.value,
        label: objectPropertyOption.label
      };
      beforeEach(() => {
        component.selectedProperty = objectPropertyOption;
      });
      const tests: {expectedNode: PathNode, name: string, inverse: boolean, cardinality: string}[] = [
        { expectedNode: {
            type: 'OneOrMore',
            path: {
              type: 'Inverse',
              path: iriNode
            }
          }, name: 'inverse and cardinality', inverse: true, cardinality: 'OneOrMore' },
        { expectedNode: { type: 'Inverse', path: iriNode }, name: 'inverse', inverse: true, cardinality: undefined },
        { expectedNode: { type: 'ZeroOrOne', path: iriNode }, name: 'cardinality and no inverse', inverse: false, cardinality: 'ZeroOrOne' },
        { expectedNode: iriNode , name: 'cardinality and no inverse', inverse: false, cardinality: undefined },
      ];
      tests.forEach(test => {
        describe(`with ${test.name} selected`, () => {
          beforeEach(() => {
            if (test.inverse) {
              component.addPropertyForm.controls['inverse'].setValue(true);
            }
            if (test.cardinality) {
              component.addPropertyForm.controls['cardinality'].setValue(test.cardinality);
            }
          });
          it('if no parentNode was provided', () => {
            component.addPathNode();
            expect(matDialogRef.close).toHaveBeenCalledWith(test.expectedNode);
          });
          const parentNodes: (AlternativePathNode|SequencePathNode)[] = [
            { type: 'Sequence', items: [] },
            { type: 'Alternative', items: [] }
          ];
          parentNodes.forEach(parentNode => {
            it(`if a ${parentNode.type} was provided`, () => {
              component.data.parentNode = parentNode;
              fixture.detectChanges();
              component.addPathNode();
              expect(matDialogRef.close).toHaveBeenCalledWith(parentNode);
              expect(parentNode.items).toContain(test.expectedNode);
            });
          });
        });
      });
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with an app-shacl-single-suggestion-input', () => {
      expect(element.queryAll(By.css('app-shacl-single-suggestion-input')).length).toEqual(1);
    });
    describe('if a property was selected', () => {
      it('and it is an object property', () => {
        component.selectedProperty = objectPropertyOption;
        fixture.detectChanges();
        expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);
        expect(element.queryAll(By.css('mat-button-toggle-group')).length).toEqual(1);
      });
      it('and it is not an object property', () => {
        component.selectedProperty = dataPropertyOption;
        fixture.detectChanges();
        expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        expect(element.queryAll(By.css('mat-button-toggle-group')).length).toEqual(1);
      });
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call addPathNode when the button is clicked', () => {
    spyOn(component, 'addPathNode');
    const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
    button.triggerEventHandler('click', null);
    expect(component.addPathNode).toHaveBeenCalledWith();
  });
  it('should call cancel when the button is clicked', () => {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
