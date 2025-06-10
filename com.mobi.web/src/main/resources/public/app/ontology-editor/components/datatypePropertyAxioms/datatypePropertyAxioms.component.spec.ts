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

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { RDFS } from '../../../prefixes';
import { PropertyValuesComponent } from '../../../shared/components/propertyValues/propertyValues.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { DatatypePropertyAxiomsComponent } from './datatypePropertyAxioms.component';

describe('Datatype Property Axioms component', function() {
    let component: DatatypePropertyAxiomsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DatatypePropertyAxiomsComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;
    let propertyServiceStub;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                DatatypePropertyAxiomsComponent,
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
        fixture = TestBed.createComponent(DatatypePropertyAxiomsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        propertyServiceStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
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
        ontologyStateStub = null;
        dialogStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.datatype-property-axioms')).length).toEqual(1);
        });
        it('depending on how many axioms there are', function() {
            expect(element.queryAll(By.css('property-values')).length).toEqual(0);
            component.axioms = ['prop1', 'prop2'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('property-values')).length).toEqual(2);
        });
    });
    describe('controller methods', function() {
        const axiomValue = { '@id': 'axiom1' };
        beforeEach(function() {
            ontologyStateStub.listItem.selected.mobi = { originalIRI: '' };
            propertyServiceStub.datatypeAxiomList = [{ iri: 'prop2' }];
            ontologyStateStub.removeProperty.and.returnValue(of(axiomValue));
        });
        it('should get the list of object property axioms', function() {
            component.ngOnChanges();
            expect(component.axioms).toEqual(['prop2']);
        });
        it('should open the remove overlay', fakeAsync(function() {
            spyOn(component, 'removeFromHierarchy');
            ontologyStateStub.getRemovePropOverlayMessage.and.returnValue('working html');
            component.openRemoveOverlay({iri: 'key', index: 0});
            tick();
            expect(ontologyStateStub.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 0);
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: 'working html'}});
            expect(component.removeFromHierarchy).toHaveBeenCalledWith('key', axiomValue);
        }));
        describe('should remove a property from the hierarchy', function() {
            beforeEach(function() {
                this.axiomObject = {'@id': 'axiom'};
            });
            it('unless the selected key is not subPropertyOf or the value is a blank node', function() {
                component.removeFromHierarchy('', this.axiomObject);
                expect(ontologyStateStub.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateStub.flattenHierarchy).not.toHaveBeenCalled();

                this.axiomObject['@id'] = '_:genid0';
                component.removeFromHierarchy(`${RDFS}subPropertyOf`, this.axiomObject);
                expect(ontologyStateStub.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(ontologyStateStub.flattenHierarchy).not.toHaveBeenCalled();
            });
            it('if the selected key is subPropertyOf', function() {
                ontologyStateStub.flattenHierarchy.and.returnValue([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'new', names: ['new', 'test'] },
                    joinedPath: 'www.test.com',
                }]);
                component.removeFromHierarchy(`${RDFS}subPropertyOf`, this.axiomObject);

                expect(ontologyStateStub.deleteEntityFromParentInHierarchy)
                    .toHaveBeenCalledWith(ontologyStateStub.listItem.dataProperties,
                        ontologyStateStub.listItem.selected['@id'], this.axiomObject['@id']);

                expect(ontologyStateStub.flattenHierarchy)
                    .toHaveBeenCalledWith(ontologyStateStub.listItem.dataProperties);

                expect(ontologyStateStub.listItem.dataProperties.flat).toEqual([{
                    entityIRI: 'www.test.com',
                    hasChildren: false,
                    indent: 0,
                    path: ['www.test.com'],
                    entityInfo: { label: 'new', names: ['new', 'test'] },
                    joinedPath: 'www.test.com',
                }]);
            });
        });
    });
});
