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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { RDF } from '../../../prefixes';
import { PropertyValuesComponent } from '../propertyValues/propertyValues.component';
import { ObjectPropertyOverlayComponent } from '../objectPropertyOverlay/objectPropertyOverlay.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { ObjectPropertyBlockComponent } from './objectPropertyBlock.component';

describe('Object Property Block component', function() {
    let component: ObjectPropertyBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ObjectPropertyBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let property;
    let value;
    const valObj: JSONLDId = {'@id': 'prop1'};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                ObjectPropertyBlockComponent,
                MockComponent(PropertyValuesComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectPropertyBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'iri',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}],
            propertyLanguage: 'lang',
            propertyType: RDF + 'langString'
        };
        ontologyStateStub.removeProperty.and.returnValue(of({'@id': 'prop1'}));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        matDialog = null;
    });

    it('initializes with the correct data', function() {
        ontologyStateStub.listItem.objectProperties.iris = {
            '#hasTopping': 'pizza.owl',
            '#hasBase': 'pizza.owl',
            '#isIngredientOf': 'pizza.owl'
        };
        component.updatePropertiesFiltered();
        fixture.detectChanges();
        expect(component.objectProperties).toEqual(['#hasTopping', '#hasBase', '#isIngredientOf']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.object-property-block')).length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
        });
        it('with a link to add an object property if the user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);
        });
        it('with no link to add an object property if the user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
        });
        it('depending on whether the selected individual is imported', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);

            ontologyStateStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
        });
        it('depending on how many datatype properties there are', function() {
            component.objectPropertiesFiltered = ['prop1', 'prop2'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('property-values')).length).toEqual(2);
            ontologyStateStub.listItem.selected = undefined;
            component.updatePropertiesFiltered();
            fixture.detectChanges();
            expect(element.queryAll(By.css('property-values')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(() => {
            property = 'prop1';
            value = {'@value': 'value', '@language': 'lang', '@type': RDF + 'langString'};
            ontologyStateStub.listItem.selected = {
                [property]: [value],
                '@id': property
            };
        });
        it('should set the correct manager values when opening the Add Object Property Overlay', function() {
            component.openAddObjectPropOverlay();
            expect(matDialog.open).toHaveBeenCalledWith(ObjectPropertyOverlayComponent);
        });
        it('should set the correct manager values when opening the Remove Object Property Overlay', fakeAsync(function() {
            spyOn(component, 'updatePropertiesFiltered');
            spyOn(component, 'removeObjectProperty');
            ontologyStateStub.getRemovePropOverlayMessage.and.returnValue('Test');
            component.showRemovePropertyOverlay({iri: 'key', index: 1});
            tick();
            expect(ontologyStateStub.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            //need to figure ths later
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: { content: 'Test</strong>?' }});
            expect(component.removeObjectProperty).toHaveBeenCalledWith('key', valObj);
            expect(component.updatePropertiesFiltered).toHaveBeenCalledWith();
        }));
        describe('should update vocabulary hierarchies on property removal', function() {
            beforeEach(function() {
                property = 'prop1';
                value = {'@value': 'value', '@language': 'lang', '@type': RDF + 'langString'};
                ontologyStateStub.listItem.selected = {
                    [property]: [value],
                    '@id': property,
                    '@type': [RDF + 'langString']
                };
            });
            it('if selected is a derived Concept or ConceptScheme', function() {
                ontologyStateStub.containsDerivedConcept.and.returnValue(true);
                component.removeObjectProperty('1', {'@id': 'prop1'});
                fixture.detectChanges();
                expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith([RDF + 'langString']);
                expect(ontologyStateStub.removeFromVocabularyHierarchies).toHaveBeenCalledWith('1', {'@id': 'prop1'});

                ontologyStateStub.containsDerivedConcept.and.returnValue(false);
                ontologyStateStub.containsDerivedConceptScheme.and.returnValue(true);
                component.removeObjectProperty('1', {'@id': 'prop1'});
                expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith([RDF + 'langString']);
                expect(ontologyStateStub.removeFromVocabularyHierarchies).toHaveBeenCalledWith('1', {'@id': 'prop1'});
            });
            it('unless selected is not a derived Concept or ConceptScheme', function() {
                component.removeObjectProperty('prop1', {'@id': ''});
                fixture.detectChanges();
                expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith([RDF + 'langString']);
                expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith([RDF + 'langString']);
                expect(ontologyStateStub.removeFromVocabularyHierarchies).not.toHaveBeenCalled();
            });
        });
    });
    it('should call openAddObjectPropOverlay when the link is clicked', function() {
        ontologyStateStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'openAddObjectPropOverlay');
        const link = element.queryAll(By.css('.section-header a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.openAddObjectPropOverlay).toHaveBeenCalledWith();
    });
});
