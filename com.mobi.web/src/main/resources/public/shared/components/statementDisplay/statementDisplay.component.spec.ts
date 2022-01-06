/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { MockPipe } from 'ng-mocks';
import { cleanStylesFromDOM, mockPrefixes } from '../../../../../../test/ts/Shared';
import { CommitChange } from '../../models/commitChange.interface';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { SplitIRIPipe } from '../../pipes/splitIRI.pipe';
import { StatementDisplayComponent } from './statementDisplay.component';

describe('Statement Display component', function() {
    let component: StatementDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<StatementDisplayComponent>;
    let entityNameSpy;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                StatementDisplayComponent,
                MockPipe(SplitIRIPipe),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                SplitIRIPipe,
                PrefixationPipe,
                { provide: 'prefixes', useClass: mockPrefixes },
            ],
        });
    });
    beforeEach(function() {
        fixture = TestBed.createComponent(StatementDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        component.predicate = 'predicate';
        component.object = {
            '@id': 'object'
        } as CommitChange;
        entityNameSpy = jasmine.createSpy('entityNameFunc');
        component.entityNameFunc = entityNameSpy;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
    });

    describe('should initialize with the correct data for', function() {
        it('predicate', function() {
            expect(component.predicate).toEqual('predicate');
        });
        it('object', function() {
            expect(component.object).toEqual({
                '@id': 'object'
            } as CommitChange);
        });
        it('entityNameFunc', function() {
            expect(component.entityNameFunc).toBeDefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.statement-display')).length).toEqual(1);
        });
        it('with .statement-cells', function() {
            expect(element.queryAll(By.css('.statement-cell')).length).toEqual(2);
        });
    });
    describe('check controller.o value', function() {
        describe('when @id is present', function() {
            it('and entityNameFunc is present', function() {
                entityNameSpy.and.returnValue('label');
                component.object = {'@id': 'full/id'};
                component.ngOnInit();
                expect(component.fullObject).toEqual('full/id');
                expect(component.o).toEqual('label <' + component.fullObject + '>');
                expect(component.entityNameFunc).toHaveBeenCalledWith('full/id');
            });
            describe('and entityNameFunc is not present', function() {
                it('and split.end is present', function() {
                    component.entityNameFunc = undefined;
                    component.object = {'@id': 'full/id'};
                    component.ngOnInit();
                    expect(component.fullObject).toEqual('full/id');
                    expect(component.o).toEqual('id <' + component.fullObject + '>');
                });
                it('and split.end is empty', function() {
                    component.entityNameFunc = undefined;
                    component.object = {'@id': 'full/'};
                    component.ngOnInit();
                    expect(component.o).toEqual('full/');
                    expect(component.fullObject).toEqual('full/');
                });
            });
        });
        it('when @value is present', function() {
            component.object = {
                '@value': 'value'
            } as CommitChange;
            component.ngOnInit();
            expect(component.o).toEqual('value');
            expect(component.fullObject).toEqual('value');
        });
        it('when @language is present', function() {
            component.object = {
                '@value': 'value',
                '@language': 'en'
            } as CommitChange;
            component.ngOnInit();
            expect(component.o).toEqual('value [language: en]');
            expect(component.fullObject).toEqual('value [language: en]');
        });
        it('when @type is present', function() {
            component.object = {'@value': 'value', '@type': 'type'};
            component.ngOnInit();
            expect(component.o).toEqual('value [type: type]');
            expect(component.fullObject).toEqual('value [type: type]');
        });
    });
});
