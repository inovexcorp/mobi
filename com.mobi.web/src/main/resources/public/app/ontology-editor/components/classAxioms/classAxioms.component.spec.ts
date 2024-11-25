/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { PropertyValuesComponent } from '../propertyValues/propertyValues.component';
import { RDFS } from '../../../prefixes';
import { SharedModule } from '../../../shared/shared.module';
import { ClassAxiomsComponent } from './classAxioms.component';

describe('Class Axioms component', function() {
    let component: ClassAxiomsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassAxiomsComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;
    let propertyServiceStub: jasmine.SpyObj<PropertyManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ClassAxiomsComponent,
                MockComponent(PropertyValuesComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(MatDialog),
                MockProvider(PropertyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassAxiomsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
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
        dialogStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-axioms')).length).toEqual(1);
        });
        it('depending on how many axioms there are', function() {
            expect(element.queryAll(By.css('property-values')).length).toEqual(0);
            component.axioms = ['prop1', 'prop2'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('property-values')).length).toEqual(2);
        });
    });
    describe('controller methods', function() {
        const axiomValue: JSONLDId = { '@id': 'axiom1' };
        beforeEach(function() {
            ontologyStateServiceStub.removeProperty.and.returnValue(of(axiomValue));

            propertyServiceStub.classAxiomList = [{iri: 'prop2', valuesKey: ''}];
        });
        it('should get the list of object property axioms', function() {
            component.ngOnChanges();
            expect(component.axioms).toEqual(['prop2']);
        });
        it('should open the remove overlay', fakeAsync(function() {
            spyOn(component, 'updateAxioms');
            spyOn(component, 'removeFromHierarchy');
            ontologyStateServiceStub.getRemovePropOverlayMessage.and.returnValue('working html');
            component.openRemoveOverlay({iri: 'key', index: 0});
            tick();
            expect(ontologyStateServiceStub.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 0);
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: 'working html'}});
            expect(component.updateAxioms).toHaveBeenCalledWith();
            expect(component.removeFromHierarchy).toHaveBeenCalledWith('key', axiomValue);
        }));
        describe('should remove a class from the hierarchy', function() {
            beforeEach(function() {
                this.axiomObject = {'@id': 'axiom'};
            });
            it('unless the selected key is not subClassOf or the value is a blank node', function() {
                component.removeFromHierarchy('', this.axiomObject);
                expect(ontologyStateServiceStub.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.setVocabularyStuff).not.toHaveBeenCalled();

                this.axiomObject['@id'] = '_:genid0';
                component.removeFromHierarchy(`${RDFS}subClassOf`, this.axiomObject);
                expect(ontologyStateServiceStub.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.flattenHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateServiceStub.setVocabularyStuff).not.toHaveBeenCalled();
            });
            it('if the selected key is subClassOf and the value is not a blank node', function() {
                ontologyStateServiceStub.flattenHierarchy.and.returnValue([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'new', names: ['new', 'test'] },
                    joinedPath: 'www.test.com',
                }]);
                component.removeFromHierarchy(`${RDFS}subClassOf`, this.axiomObject);
                expect(ontologyStateServiceStub.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.classes, ontologyStateServiceStub.listItem.selected['@id'], this.axiomObject['@id']);
                expect(ontologyStateServiceStub.flattenHierarchy).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.classes);
                expect(ontologyStateServiceStub.listItem.classes.flat).toEqual([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'new', names: ['new', 'test'] },
                    joinedPath: 'www.test.com',
                }]);
                expect(ontologyStateServiceStub.setVocabularyStuff).toHaveBeenCalledWith();
            });
        });
    });
});
