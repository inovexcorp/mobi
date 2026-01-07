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
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CharacteristicsBlockComponent } from '../characteristicsBlock/characteristicsBlock.component';
import { CharacteristicsRowComponent } from './characteristicsRow.component';

describe('Characteristics Row component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<CharacteristicsRowComponent>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CharacteristicsRowComponent,
                MockComponent(CharacteristicsBlockComponent),
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
            ]
        });
    });
    
    beforeEach(function() {
        fixture = TestBed.createComponent(CharacteristicsRowComponent);
        element = fixture.debugElement;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {'@id': 'id'};
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.characteristics-row')).length).toEqual(1);
        });
        describe('when selected is not an object or data property', function() {
            it('for a row', function() {
                expect(element.queryAll(By.css('.row')).length).toEqual(0);
            });
            it('for a characteristics-block', function() {
                expect(element.queryAll(By.css('characteristics-block')).length).toEqual(0);
            });
        });
        describe('when selected is an object property', function() {
            beforeEach(function() {
                ontologyManagerStub.isObjectProperty.and.returnValue(true);
                ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
                fixture.detectChanges();
            });
            it('for a row', function() {
                expect(element.queryAll(By.css('.row')).length).toEqual(1);
            });
            it('for a characteristics-block', function() {
                expect(element.queryAll(By.css('characteristics-block')).length).toEqual(1);
            });
        });
        describe('when selected is a data property', function() {
            beforeEach(function() {
                ontologyManagerStub.isObjectProperty.and.returnValue(false);
                ontologyManagerStub.isDataTypeProperty.and.returnValue(true);
                fixture.detectChanges();
            });
            it('for a row', function() {
                expect(element.queryAll(By.css('.row')).length).toEqual(1);
            });
            it('for a characteristics-block', function() {
                expect(element.queryAll(By.css('characteristics-block')).length).toEqual(1);
            });
        });
    });
});
