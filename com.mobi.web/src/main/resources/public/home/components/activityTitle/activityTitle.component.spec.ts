/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { By } from "@angular/platform-browser";

import {
    mockProvManager,
    mockUtil,
    mockUserManager,
    mockPrefixes,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { ActivityTitleComponent } from "./activityTitle.component";

describe('Activity Title component', function() {
    let component: ActivityTitleComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityTitleComponent>;
    let provManagerStub;
    let utilStub;
    let prefixesStub;
    let userManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ActivityTitleComponent
            ],
            providers: [
                { provide: 'provManagerService', useClass: mockProvManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'userManagerService', useClass: mockUserManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ActivityTitleComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        provManagerStub = TestBed.get('provManagerService');
        utilStub = TestBed.get('utilService');
        prefixesStub = TestBed.get('prefixes');
        userManagerStub = TestBed.get('userManagerService');

        provManagerStub.activityTypes = [{type: 'type1', word: 'word1', pred: 'pred'}, {type: 'type', word: 'word', pred: 'pred'}];
        component.activity = { '@type': [], pred: [{'@id': 'entity'}, {'@id': 'entity1'}] };
        component.entities = [{'@id': 'entity'}, {'@id': 'entity1'}];
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        provManagerStub = null;
        utilStub = null;
        prefixesStub = null;
        userManagerStub = null;
    });

    describe('should initialize with the correct value for', function() {
        describe('username', function() {
            it('if the activity does not have the wasAssociatedWith property', function() {
                expect(component.username).toEqual('(None)');
            });
            describe('if the activity has the wasAssociatedWith property', function() {
                let iri: string;
                beforeEach(function() {
                    iri = 'iri';
                });
                it('and the user was not found', function() {
                    expect(component.username).toEqual('(None)');
                });
                it('and the user was found', function() {
                    userManagerStub.users = [{iri: 'iri', username: 'username'}];
                    component.setUsername(iri);
                    expect(component.username).toEqual('username');
                });
            });
        });
        describe('word if the activity is', function() {
            it('a supported type', function() {
                component.activity['@type'] = ['type'];
                fixture.detectChanges();
                expect(component.word).toEqual('word');
            });
            it('more than one supported type', function() {
                component.activity['@type'] = ['type1'];
                fixture.detectChanges();
                expect(component.word).toEqual('word1');
            });
            it('unsupported type', function() {
                expect(component.word).toEqual('affected');
            });
        });
        describe('entities if the activity is', function() {
            beforeEach(function() {
                utilStub.getDctermsValue.and.callFake(obj => obj['@id']);
            });
            it('a supported type', function() {
                component.activity['@type'] = ['type'];
                fixture.detectChanges();
                expect(component.entitiesStr).toEqual('entity and entity1');
            });
            it('more than one supported type', function() {
                component.activity['@type'] = ['type', 'type1'];
                fixture.detectChanges();
                expect(component.entitiesStr).toEqual('entity and entity1');
            });
            it('unsupported type', function() {
                expect(component.entitiesStr).toEqual('(None)');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.activity-title')).length).toEqual(1);
        });
        it('with the active word for the activity', function() {
            component.word = 'word';
            fixture.detectChanges();
            const content = element.queryAll(By.css('.word'))[0];
            expect(content.nativeElement.innerHTML).toContain(component.word);
        });
        it('with the user for the activity', function() {
            component.username = 'user';
            fixture.detectChanges();
            const content = element.queryAll(By.css('.username'))[0];
            expect(content.nativeElement.innerHTML).toContain(component.username);
        });
        it('with the entities for the activity', function() {
            component.entitiesStr = '';
            fixture.detectChanges();
            const content = element.queryAll(By.css('.entities'))[0];
            expect(content.nativeElement.innerHTML).toContain(component.entitiesStr);
        });
    });
});
