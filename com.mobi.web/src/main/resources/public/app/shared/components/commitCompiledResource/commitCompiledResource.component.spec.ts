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
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockComponent, MockPipe } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { Difference } from '../../models/difference.class';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { CommitCompiledResourceComponent } from './commitCompiledResource.component';

describe('Commit Compiled Resource component', function() {
    let component: CommitCompiledResourceComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitCompiledResourceComponent>;

    const entityId = 'entity';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CommitCompiledResourceComponent,
                MockComponent(InfoMessageComponent),
                MockPipe(PrefixationPipe)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CommitCompiledResourceComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.entityId = entityId;
        component.entityNameFunc = jasmine.createSpy('entityNameFunc');
        component.entityNameFunc.and.returnValue('label');
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
    });

    describe('controller methods', function() {
        it('gets the display of an IRI', function() {
            const iri = 'http://test.com#test';
            expect(component.getDisplay(iri)).toEqual('label');
            component.entityNameFunc = null;
            expect(component.getDisplay(iri)).toEqual('Test');
        });
        describe('sets the data for display', function() {
            it('if only triples are set', function() {
                component.triples = {'@id': entityId, '@type': ['TypeA']};
                component.setResource();
                expect(component.resource).toEqual({});
                expect(component.types).toEqual([{type: 'TypeA'}]);
            });
            it('if only changes are set', function() {
                component.changes = new Difference([
                    {'@id': entityId, '@type': ['NewType'], propA: [{'@value': 'New Value'}], propB: [{'@id': 'otherobject'}]}, {'@id': 'otherobject'}],
                    [{'@id': entityId, '@type': ['OldType'], propA: [{'@value': 'Old Value'}], propC: [{'@id': 'oldobject'}]}, {'@id': 'oldobject'}]
                );
                component.setResource();
                expect(component.resource).toEqual({
                    propA: [{'@value': 'New Value', add: true}, {'@value': 'Old Value', del: true}],
                    propB: [{'@id': 'otherobject', add: true}],
                    propC: [{'@id': 'oldobject', del: true}]
                });
                expect(component.types).toEqual([{type: 'NewType', add: true}, {type: 'OldType', del: true}]);
            });
            it('if both changes and triples are set', function() {
                component.triples = {
                    '@id': entityId,
                    '@type': ['TypeA'],
                    propA: [{'@value': 'Existing Value'}, {'@value': 'New Value'}],
                    propB: [{'@id': 'otherobject'}],
                    propC: [{'@id': 'existingobject'}],
                    propD: [{'@value': 'other value'}]
                };
                component.changes = new Difference([
                    {'@id': entityId, '@type': ['NewType'], propA: [{'@value': 'New Value'}], propB: [{'@id': 'otherobject'}]}, {'@id': 'otherobject'}],
                    [{'@id': entityId, '@type': ['OldType'], propA: [{'@value': 'Old Value'}], propC: [{'@id': 'oldobject'}]}, {'@id': 'oldobject'}]
                );
                component.setResource();
                expect(component.resource).toEqual({
                    propA: [{'@value': 'Existing Value'}, {'@value': 'New Value', add: true}, {'@value': 'Old Value', del: true}],
                    propB: [{'@id': 'otherobject', add: true}],
                    propC: [{'@id': 'existingobject'}, {'@id': 'oldobject', del: true}],
                    propD: [{'@value': 'other value'}]
                });
                expect(component.types).toEqual([{type: 'TypeA'}, {type: 'NewType', add: true}, {type: 'OldType', del: true}]);
            });
            it('unless nothing is set', function() {
                component.setResource();
                expect(component.resource).toBeUndefined();
                expect(component.types).toEqual([]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('depending on whether a resource is found', function() {
            component.resource = {prop: [{'@value': 'Test'}]};
            component.entityId = 'entity';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.wrapper')).length).toBe(1);
            expect(element.queryAll(By.css('.property-values')).length).toBe(1);
            expect(element.queryAll(By.css('.prop-value-container')).length).toBe(1);
            expect(element.queryAll(By.css('.value-display-wrapper')).length).toBe(1);
            expect(element.queryAll(By.css('.prop-header')).length).toBe(1);
            expect(element.queryAll(By.css('.value-signs')).length).toBe(1);
        });
        it('depending on whether there is no resource', function() {
            component.resource = {};
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toBe(0);
            component.resource = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toBe(1);
        });
    });
});
