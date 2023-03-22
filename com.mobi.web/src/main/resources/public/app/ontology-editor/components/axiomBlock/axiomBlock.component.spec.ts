/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { DatatypePropertyAxiomsComponent } from '../datatypePropertyAxioms/datatypePropertyAxioms.component';
import { ClassAxiomsComponent } from '../classAxioms/classAxioms.component';
import { ObjectPropertyAxiomsComponent } from '../objectPropertyAxioms/objectPropertyAxioms.component';
import { RDFS } from '../../../prefixes';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { AxiomOverlayComponent } from '../axiomOverlay/axiomOverlay.component';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { AxiomBlockComponent } from './axiomBlock.component';

describe('Axiom Block component', function() {
    let component: AxiomBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AxiomBlockComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;
    let propertyServiceStub: jasmine.SpyObj<PropertyManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                AxiomBlockComponent,
                MockComponent(ClassAxiomsComponent),
                MockComponent(ObjectPropertyAxiomsComponent),
                MockComponent(DatatypePropertyAxiomsComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(MatDialog),
                MockProvider(PropertyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(AxiomBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerServiceStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        propertyServiceStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.selected = {
            '@id': 'axiom1',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2', '@type': 'type', '@language': 'language'}]
        };
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
        dialogStub = null;
        propertyServiceStub = null;
    });

    describe('controller methods', function() {
        describe('should open the correct modal if the selected entity is a', function() {
            it('class', function() {
                propertyServiceStub.classAxiomList = [{iri: 'axiom1', valuesKey: ''}];
                ontologyManagerServiceStub.isClass.and.returnValue(true);
                component.showAxiomOverlay();
                expect(dialogStub.open).toHaveBeenCalledWith(AxiomOverlayComponent, {data: {axiomList: [{iri: 'axiom1', valuesKey: ''}]}});
            });
            it('data property', function() {
                propertyServiceStub.datatypeAxiomList = [{iri: 'axiom1', valuesKey: ''}];
                ontologyManagerServiceStub.isDataTypeProperty.and.returnValue(true);
                component.showAxiomOverlay();
                expect(dialogStub.open).toHaveBeenCalledWith(AxiomOverlayComponent, {data: {axiomList: [{iri: 'axiom1', valuesKey: ''}]}});
            });
            it('object property', function() {
                propertyServiceStub.objectAxiomList = [{iri: 'axiom1', valuesKey: ''}];
                ontologyManagerServiceStub.isObjectProperty.and.returnValue(true);
                component.showAxiomOverlay();
                expect(dialogStub.open).toHaveBeenCalledWith(AxiomOverlayComponent, {data: { axiomList: [{iri: 'axiom1', valuesKey: ''}]}});
            });
        });
        describe('should update the class hierarchy', function() {
            beforeEach(function() {
                this.values = ['iri'];
                this.axiom = 'axiom';
            });
            it('unless the axiom is not subClassOf or there are no values', function() {
                component.updateClassHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.addEntityToHierarchy).not.toHaveBeenCalled();

                this.axiom = RDFS + 'subClassOf';
                this.values = [];
                component.updateClassHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.addEntityToHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.setVocabularyStuff).not.toHaveBeenCalled();
            });
            describe('if the axiom is subClassOf', function() {
                beforeEach(function() {
                    this.axiom = RDFS + 'subClassOf';
                });
                it('and is present in the individual hierarchy', function () {
                    ontologyStateServiceStub.listItem.individualsParentPath = [ontologyStateServiceStub.listItem.selected['@id']];
                    component.updateClassHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontologyStateServiceStub.setSuperClasses).toHaveBeenCalledWith('axiom1', this.values);
                    expect(ontologyStateServiceStub.updateFlatIndividualsHierarchy).toHaveBeenCalledWith(this.values);
                    expect(ontologyStateServiceStub.setVocabularyStuff).toHaveBeenCalledWith();
                });
                it('and is not present in the individual hierarchy', function () {
                    component.updateClassHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontologyStateServiceStub.setSuperClasses).toHaveBeenCalledWith('axiom1', this.values);
                    expect(ontologyStateServiceStub.updateFlatIndividualsHierarchy).not.toHaveBeenCalled();
                    expect(ontologyStateServiceStub.setVocabularyStuff).toHaveBeenCalledWith();
                });
            });
        });
        describe('should update the data property hierarchy', function() {
            beforeEach(function() {
                this.axiom = 'axiom';
                this.values = ['value'];
            });
            it('unless the axiom is not subPropertyOf or domain or there are no values', function() {
                component.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = RDFS + 'subPropertyOf';
                this.values = [];
                component.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = RDFS + 'domain';
                component.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();
            });
            it('if the axiom is subPropertyOf', function() {
                this.axiom = RDFS + 'subPropertyOf';
                component.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected['@id'], this.values, 'dataProperties');
            });
            it('if the axiom is domain', function() {
                this.axiom = RDFS + 'domain';
                ontologyStateServiceStub.createFlatEverythingTree.and.returnValue([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'test', names: ['test', 'sample'],},
                    joinedPath: 'www.test.com',
                }]);
                component.updateDataPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateServiceStub.listItem);
                expect(ontologyStateServiceStub.listItem.flatEverythingTree).toEqual([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'test', names: ['test', 'sample'],},
                    joinedPath: 'www.test.com',
                }]);
            });
        });
        describe('should update the object property hierarchy', function() {
            beforeEach(function() {
                this.values = ['iri'];
                this.axiom = 'axiom';
            });
            it('unless the axiom is not subPropertyOf or domain or there are no values', function() {
                component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = RDFS + 'subPropertyOf';
                this.values = [];
                component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();

                this.axiom = RDFS + 'domain';
                component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.setSuperProperties).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.createFlatEverythingTree).not.toHaveBeenCalled();
            });
            describe('if the axiom is subPropertyOf', function() {
                it('and is a derived semanticRelation', function() {
                    this.axiom = RDFS + 'subPropertyOf';
                    ontologyStateServiceStub.containsDerivedSemanticRelation.and.returnValue(true);
                    component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontologyStateServiceStub.setSuperProperties).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected['@id'], this.values, 'objectProperties');
                    expect(ontologyStateServiceStub.setVocabularyStuff).toHaveBeenCalledWith();
                });
                it('and is not a derived semanticRelation', function() {
                    this.axiom = RDFS + 'subPropertyOf';
                    component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                    expect(ontologyStateServiceStub.setSuperProperties).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected['@id'], this.values, 'objectProperties');
                    expect(ontologyStateServiceStub.setVocabularyStuff).not.toHaveBeenCalled();
                });
            });
            it('if the axiom is domain', function() {
                this.axiom = RDFS + 'domain';
                ontologyStateServiceStub.createFlatEverythingTree.and.returnValue([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'test', names: ['test', 'sample'],},
                    joinedPath: 'www.test.com',
                }]);
                component.updateObjectPropHierarchy({axiom: this.axiom, values: this.values});
                expect(ontologyStateServiceStub.createFlatEverythingTree).toHaveBeenCalledWith(ontologyStateServiceStub.listItem);
                expect(ontologyStateServiceStub.listItem.flatEverythingTree).toEqual([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'test', names: ['test', 'sample'],},
                    joinedPath: 'www.test.com',
                }]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.axiom-block')).length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
        });
        it('based on whether something is selected and the user can modify the branch', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);

            ontologyStateServiceStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
        });
        it('when the user cannot modify the branch', function() {
            ontologyStateServiceStub.canModify.and.returnValue(false);
            ontologyStateServiceStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
        });
        it('based on whether the selected entity is imported', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);

            ontologyStateServiceStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
        });
        it('based on whether a class is selected', function() {
            ontologyManagerServiceStub.isClass.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('class-axioms')).length).toEqual(1);

            ontologyManagerServiceStub.isClass.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('class-axioms')).length).toEqual(0);
        });
        it('based on whether an object property is selected', function() {
            ontologyManagerServiceStub.isObjectProperty.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('object-property-axioms')).length).toEqual(1);

            ontologyManagerServiceStub.isObjectProperty.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('object-property-axioms')).length).toEqual(0);
        });
        it('based on whether a datatype property is selected', function() {
            ontologyManagerServiceStub.isDataTypeProperty.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-axioms')).length).toEqual(1);

            ontologyManagerServiceStub.isDataTypeProperty.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-axioms')).length).toEqual(0);
        });
    });
    it('should call showAxiomOverlay when the add axiom link is clicked', function() {
        ontologyStateServiceStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showAxiomOverlay');
        const link = element.queryAll(By.css('.section-header a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.showAxiomOverlay).toHaveBeenCalledWith();
    });
});
