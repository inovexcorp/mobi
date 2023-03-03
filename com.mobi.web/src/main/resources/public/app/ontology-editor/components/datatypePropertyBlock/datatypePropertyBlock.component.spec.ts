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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { RDF, XSD } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { DatatypePropertyOverlayComponent } from '../datatypePropertyOverlay/datatypePropertyOverlay.component';
import { PropertyValuesComponent } from '../propertyValues/propertyValues.component';
import { DatatypePropertyBlockComponent } from './datatypePropertyBlock.component';

describe('Datatype Property Block component', function() {
    let component: DatatypePropertyBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DatatypePropertyBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let propertyIRI;
    let value;
    let modalData = {
        editingProperty: false,
        propertySelect: undefined,
        propertyValue: '',
        propertyType: XSD + 'string',
        propertyIndex: 0,
        propertyLanguage: 'en'
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                DatatypePropertyBlockComponent,
                MockComponent(PropertyValuesComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DatatypePropertyBlockComponent);
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
        ontologyStateStub.listItem.dataProperties.iris = { 'annotation1': '', 'default2': '', 'owl2': '' };
        component.updatePropertiesFiltered();
        fixture.detectChanges();
        expect(component.dataProperties).toEqual(['annotation1', 'default2', 'owl2']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.datatype-property-block')).length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
        });
        it('with a link to add a datatype property if the user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);
        });
        it('with no link to add a datatype property if the user cannot modify', function() {
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
            ontologyStateStub.listItem.dataProperties.iris = { 'prop1': 'pr', 'prop2': 'test', 'owl2': '' };
            component.updatePropertiesFiltered();
            fixture.detectChanges();
            expect(component.dataPropertiesFiltered).toEqual(['prop1', 'prop2']);
            expect(element.queryAll(By.css('property-values')).length).toEqual(2);
            ontologyStateStub.listItem.selected = undefined;
            component.updatePropertiesFiltered();
            fixture.detectChanges();
            expect(component.dataPropertiesFiltered).toEqual([]);
            expect(element.queryAll(By.css('property-values')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateStub.removeProperty.and.returnValue(of(null));
            ontologyStateStub.getRemovePropOverlayMessage.and.returnValue('REMOVE');
        });
        it('should set the correct manager values when opening the Add Data Property Overlay', function() {
            const data = {
                editingProperty: false,
                propertySelect: undefined,
                propertyValue: '',
                propertyType: XSD + 'string',
                propertyIndex: 0,
                propertyLanguage: 'en'
            };
            component.openAddDataPropOverlay();
            expect(matDialog.open).toHaveBeenCalledWith(DatatypePropertyOverlayComponent, { data: data });
        });
        it('should set the correct manager values when opening the Remove Data Property Overlay', function() {
            component.showRemovePropertyOverlay({key: 'key', index: 1});
            expect(ontologyStateStub.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent,  { data: { content: 'Are you sure you want to clear <strong>' +  ontologyStateStub.getRemovePropOverlayMessage('key', 1)+ '</strong>?'}});
        });
        describe('should set the correct manager values when editing a data property', function() {
            beforeEach(function() {
                propertyIRI = 'prop1';
                value = {'@value': 'value', '@language': 'lang', '@type': RDF + 'langString'};
                ontologyStateStub.listItem.selected = {
                    [propertyIRI]: [value],
                    '@id': propertyIRI
                };
            });
            it('when @language is present', function() {
                modalData = {
                    editingProperty: true,
                    propertySelect: propertyIRI,
                    propertyValue: 'value',
                    propertyType: RDF + 'langString',
                    propertyIndex: 0,
                    propertyLanguage: 'lang'
                };
                component.editDataProp({property: propertyIRI, index: 0});
                expect(matDialog.open).toHaveBeenCalledWith(DatatypePropertyOverlayComponent, { data: modalData });
            });
            it('when @language is missing', function() {
                value['@language'] = null;
                modalData = {
                    editingProperty: true,
                    propertySelect: propertyIRI,
                    propertyValue: 'value',
                    propertyType: RDF + 'langString',
                    propertyIndex: 0,
                    propertyLanguage: null
                };
                component.editDataProp({property: propertyIRI, index: 0});
                expect(matDialog.open).toHaveBeenCalledWith(DatatypePropertyOverlayComponent, { data: modalData });
            });
        });
    });
    it('should call openAddDataPropOverlay when the link is clicked', function() {
        ontologyStateStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'openAddDataPropOverlay');
        const link = element.queryAll(By.css('.section-header a'))[0];
        link.triggerEventHandler('click', null);
        expect(component.openAddDataPropOverlay).toHaveBeenCalledWith();
    });
});
