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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS, OWL, XSD } from '../../../prefixes';
import { IriSelectComponent } from '../iriSelect/iriSelect.component';
import { LanguageSelectComponent } from '../languageSelect/languageSelect.component';
import { OntologyListItem } from '../../models/ontologyListItem.class';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { OntologyStateService } from '../../services/ontologyState.service';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { PropertyOverlayDataOptions } from '../../models/propertyOverlayDataOptions.interface';
import { ToastService } from '../../services/toast.service';
import { PropertyOverlayComponent } from './propertyOverlay.component';
import { JSONLDObject } from '../../models/JSONLDObject.interface';

describe('Property Overlay component', () => {
  let component: PropertyOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<PropertyOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<PropertyOverlayComponent>>;
  let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const property = 'property1';
  const entityIRI = 'entity';
  const entity: JSONLDObject = {
    '@id': entityIRI
  };

  beforeEach(async () => {
    const dialogData: PropertyOverlayDataOptions = {
        entity: entity,
        editing: false,
    };
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        MatRadioModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        PropertyOverlayComponent,
        MockComponent(LanguageSelectComponent),
        MockComponent(IriSelectComponent)
      ],
      providers: [
        MockProvider(OntologyManagerService),
        MockProvider(OntologyStateService),
        MockProvider(PropertyManagerService),
        MockProvider(ToastService),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    }).compileComponents();
    ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<PropertyOverlayComponent>>;
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    ontologyStateStub.listItem = new OntologyListItem();
    ontologyStateStub.listItem.selected = {'@id': entityIRI};
    dialogData.stateService = ontologyStateStub;
    dialogData.annotationIRIs = [property];
    fixture = TestBed.createComponent(PropertyOverlayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    ontologyManagerStub = null;
    ontologyStateStub = null;
    propertyManagerStub = null;
    toastStub = null;
  });

  describe('initializes with the correct data', () => {
    beforeEach(() => {
      ontologyStateStub.listItem.annotations.iris = {[property]: '', 'default2': '', 'owl2': ''};
      propertyManagerStub.ontologyProperties = ['ont1', 'ont2'];
      propertyManagerStub.defaultAnnotations = ['default1', 'default2'];
      propertyManagerStub.owlAnnotations = ['owl1', 'owl2'];
    });
    it('if an property is being edited', () => {
      component.data.editing = true;
      component.data.property = property;
      component.data.value = 'value';
      component.data.type = 'type';
      component.data.language = 'en';
      component.ngOnInit();
      expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.propertyForm.controls.property.value).toEqual(property);
      expect(component.propertyForm.controls.property.disabled).toBeTrue();
      expect(component.propertyForm.controls.value.value).toEqual('value');
      expect(component.propertyForm.controls.type.value).toEqual('type');
      expect(component.propertyForm.controls.language.value).toEqual('en');
    });
    it('if an property is being edited and input data type value is empty', () => {
      component.data.editing = true;
      component.data.property = property;
      component.data.value = 'value';
      component.data.type = '';
      component.ngOnInit();
      expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.propertyForm.controls.property.value).toEqual(property);
      expect(component.propertyForm.controls.property.disabled).toBeTrue();
      expect(component.propertyForm.controls.value.value).toEqual('value');
      expect(component.propertyForm.controls.type.value).toEqual(`${XSD}string`);
      expect(component.propertyForm.controls.language.value).toEqual(undefined);
    });
    it('if a new property is being added', () => {
      component.data.editing = false;
      component.ngOnInit();
      expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
      expect(component.propertyForm.controls.property.value).toEqual('');
      expect(component.propertyForm.controls.property.disabled).toBeFalse();
      expect(component.propertyForm.controls.value.value).toEqual('');
      expect(component.propertyForm.controls.type.value).toEqual(`${XSD}string`);
      expect(component.propertyForm.controls.language.value).toEqual('');
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['input[aria-label="Property"]', 'mat-autocomplete'].forEach(test => {
      it(`with a ${test}`, () => {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('depending on whether a property is being edited', () => {
      [
        {
          value: true,
          heading: 'Edit Property',
        },
        {
          value: false,
          heading: 'Add Property',
        }
      ].forEach(function(test) {
        component.data.editing = test.value;
        component.ngOnInit();
        fixture.detectChanges();

        const header = element.queryAll(By.css('h1'))[0];
        expect(header).toBeTruthy();
        expect(header.nativeElement.textContent.trim()).toEqual(test.heading);
        const input = element.queryAll(By.css('input[aria-label="Property"]'))[0];
        expect(input).toBeTruthy();
        if (test.value) {
          expect(input.properties['disabled']).toBeTruthy();
        } else {
          expect(input.properties['disabled']).toBeFalsy();
        }
      });
    });
    it('depending on whether owl:deprecated is selected', () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('textarea')).length).toEqual(1);
      expect(element.queryAll(By.css('language-select')).length).toEqual(0);
      expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(0);
      
      component.propertyForm.controls.property.setValue(`${OWL}deprecated`);
      fixture.detectChanges();
      expect(element.queryAll(By.css('textarea')).length).toEqual(0);
      expect(element.queryAll(By.css('language-select')).length).toEqual(0);
      expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(1);
    });
    it('depending on whether it is an ontology property', () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('input[aria-label="Value"]')).length).toEqual(0);

      component.isOntologyProperty = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('input[aria-label="Value"]')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
    it('depending on the validity of the form', () => {
      component.data.editing = false;
      fixture.detectChanges();
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeTruthy();
      
      component.propertyForm.controls.property.setValue('test');
      component.propertyForm.controls.value.setValue('test');
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
  });
  describe('controller methods', () => {
    it('should correctly group and filter the list of annotations', () => {
      ontologyStateStub.getEntityName.and.callFake(a => a);
      component.properties = ['http://A#prop1', 'http://B#prop3', 'http://A#prop2', 'http://C#other'];
      expect(component.filter('PROP')).toEqual([
        { namespace: 'http://A#', options: [
          { property: 'http://A#prop1', name: 'http://A#prop1' },
          { property: 'http://A#prop2', name: 'http://A#prop2' },
        ]},
        { namespace: 'http://B#', options: [
          { property: 'http://B#prop3', name: 'http://B#prop3' },
        ]}
      ]);
    });
    describe('should submit the modal if the annotation is being', () => {
      beforeEach(() => {
        spyOn(component, 'addProperty');
        spyOn(component, 'editProperty');
      });
      it('added', () => {
        component.data.editing = false;
        component.submit();
        expect(component.addProperty).toHaveBeenCalledWith();
        expect(component.editProperty).not.toHaveBeenCalled();
      });
      it('edited', () => {
        component.data.editing = true;
        component.submit();
        expect(component.addProperty).not.toHaveBeenCalled();
        expect(component.editProperty).toHaveBeenCalledWith();
      });
    });
    describe('selectProp should set the correct state if it is', () => {
      it('owl:deprecated', () => {
        const event: MatAutocompleteSelectedEvent = {
          option: {
            value: `${OWL}deprecated`
          }
        } as MatAutocompleteSelectedEvent;
        component.selectProp(event);
        expect(component.isOntologyProperty).toBeFalse();
        expect(component.propertyForm.controls.type.value).toEqual(`${XSD}boolean`);
        expect(component.propertyForm.controls.language.value).toEqual('');
      });
      it('not owl:deprecated and is an ontology property', () => {
        const event: MatAutocompleteSelectedEvent = {
          option: {
            value: 'test'
          }
        } as MatAutocompleteSelectedEvent;
        propertyManagerStub.ontologyProperties = ['test'];
        component.selectProp(event);
        expect(component.isOntologyProperty).toBeTrue();
        expect(component.propertyForm.controls.type.value).toEqual(`${XSD}anyURI`);
        expect(component.propertyForm.controls.language.value).toEqual('');
      });
    });
    describe('addProperty calls the correct manager functions', () => {
      beforeEach(() => {
        ontologyManagerStub.entityNameProps = [`${DCTERMS}title`];
        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
        component.propertyForm.controls.property.setValue(property);
        component.propertyForm.controls.value.setValue('value');
        component.propertyForm.controls.type.setValue(`${XSD}string`);
        propertyManagerStub.addValue.and.returnValue(true);
      });
      describe('when isOntologyProperty is true', () => {
        beforeEach(() => {
          component.isOntologyProperty = true;
        });
        it('unless it is a duplicate value', () => {
          propertyManagerStub.addId.and.returnValue(false);
          component.addProperty();
          expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value');
          expect(propertyManagerStub.addValue).not.toHaveBeenCalled();
          expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
          expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(matDialogRef.close).toHaveBeenCalledWith(false);
        });
        describe('successfully', () => {
          beforeEach(() => {
            propertyManagerStub.addId.and.returnValue(true);
          });
          it('and it is a name prop', () => {
            component.propertyForm.controls.property.setValue(`${DCTERMS}title`);
            component.addProperty();
            expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${DCTERMS}title`, 'value');
            expect(propertyManagerStub.addValue).not.toHaveBeenCalled();
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [`${DCTERMS}title`]: [{ '@id': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
          it('and it is not a name prop', () => {
            component.addProperty();
            expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value');
            expect(propertyManagerStub.addValue).not.toHaveBeenCalled();
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@id': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
        });
      });
      describe('when isOntologyProperty is false', () => {
        beforeEach(() => {
          component.isOntologyProperty = false;
          propertyManagerStub.createValueObj.and.returnValue({'@value': 'value'});
        });
        it('unless it is a duplicate value', () => {
          propertyManagerStub.addValue.and.returnValue(false);
          component.addProperty();
          expect(propertyManagerStub.addId).not.toHaveBeenCalled();
          expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value', `${XSD}string`, '');
          expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
          expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(matDialogRef.close).toHaveBeenCalledWith(false);
        });
        describe('successfully', () => {
          beforeEach(() => {
            propertyManagerStub.addValue.and.returnValue(true);
          });
          it('and it is a name prop', () => {
            component.propertyForm.controls.property.setValue(`${DCTERMS}title`);
            component.addProperty();
            expect(propertyManagerStub.addId).not.toHaveBeenCalled();
            expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${DCTERMS}title`, 'value', `${XSD}string`, '');
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
            '@id': ontologyStateStub.listItem.selected['@id'],
            [`${DCTERMS}title`]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
          it('and it is not a name prop', () => {
            component.addProperty();
            expect(propertyManagerStub.addId).not.toHaveBeenCalled();
            expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value', `${XSD}string`, '');
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);  
          });
        });
      });
    });
    describe('editProperty calls the correct manager functions', () => {
      beforeEach(() => {
        ontologyManagerStub.entityNameProps = [`${DCTERMS}title`];
        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
        component.propertyForm.controls.property.setValue(property);
        component.propertyForm.controls.value.setValue('value');
        component.propertyForm.controls.type.setValue(`${XSD}string`);
      });
      describe('when isOntologyProperty is true', () => {
        beforeEach(() => {
          component.isOntologyProperty = true;
        });
        it('unless it is a duplicate value', () => {
          propertyManagerStub.editId.and.returnValue(false);
          component.editProperty();
          expect(propertyManagerStub.editId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value');
          expect(propertyManagerStub.editValue).not.toHaveBeenCalled();
          expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
          expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
          expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(matDialogRef.close).toHaveBeenCalledWith(false);
        });
        describe('successfully', () => {
          beforeEach(() => {
            propertyManagerStub.editId.and.returnValue(true);
          });
          it('and it is a name prop', () => {
            component.propertyForm.controls.property.setValue(`${DCTERMS}title`);
            component.editProperty();
            expect(propertyManagerStub.editId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${DCTERMS}title`, component.data.index, 'value');
            expect(propertyManagerStub.editValue).not.toHaveBeenCalled();
            expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [`${DCTERMS}title`]: [{ '@id': undefined }]
            });
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [`${DCTERMS}title`]: [{ '@id': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
          it('and it is not a name prop', () => {
            component.editProperty();
            expect(propertyManagerStub.editId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value');
            expect(propertyManagerStub.editValue).not.toHaveBeenCalled();
            expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@id': undefined }]
            });
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@id': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
        });
      });
      describe('when isOntologyProperty is false', () => {
        beforeEach(() => {
          component.isOntologyProperty = false;
          propertyManagerStub.createValueObj.and.returnValue({'@value': 'value'});
        });
        it('unless it is a duplicate value', () => {
          propertyManagerStub.editValue.and.returnValue(false);
          component.editProperty();
          expect(propertyManagerStub.editId).not.toHaveBeenCalled();
          expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value', `${XSD}string`, '');
          expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
          expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
          expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
          expect(matDialogRef.close).toHaveBeenCalledWith(false);
        });
        describe('successfully', () => {
          it('and it is a name prop', () => {
            component.propertyForm.controls.property.setValue(`${DCTERMS}title`);
            propertyManagerStub.editValue.and.returnValue(true);
            component.editProperty();
            expect(propertyManagerStub.editId).not.toHaveBeenCalled();
            expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${DCTERMS}title`, component.data.index, 'value', `${XSD}string`, '');
            expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [`${DCTERMS}title`]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [`${DCTERMS}title`]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
          it('and it is not a name prop', () => {
            propertyManagerStub.editValue.and.returnValue(true);
            component.editProperty();
            expect(propertyManagerStub.editId).not.toHaveBeenCalled();
            expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value', `${XSD}string`, '');
            expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
             '@id': ontologyStateStub.listItem.selected['@id'],
             [property]: [{ '@value': 'value' }]
            });
            expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
          });
        });
      });
    });
  });
  it('should call cancel when the button is clicked', () => {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call download when the button is clicked', () => {
    spyOn(component, 'submit');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.submit).toHaveBeenCalledWith();
  });
});