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
 * 
 */

import { DebugElement } from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import { MockProvider, MockPipe } from 'ng-mocks';
import { configureTestSuite } from 'ng-bullet';
import { By } from '@angular/platform-browser';
import { min } from 'lodash';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { UsagesBlockComponent } from './usagesBlock.component';

describe('Usages Block component', function() {
    let component: UsagesBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UsagesBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                UsagesBlockComponent,
                MockPipe(SplitIRIPipe, () => ({begin: 'www.test.com', then: '/', end: 'test'}))
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UsagesBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {'@id': 'test'};
        ontologyStateStub.listItem.versionedRdfRecord = {
            title: 'test ontology',
            recordId: 'www.test.com',
            commitId: 'www.testCommit.com',
        };
        ontologyStateStub.getActiveKey.and.returnValue('test');
        ontologyStateStub.getActivePage.and.returnValue({});
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateStub = null;
    });

    it('should initialize correctly', function() {
        const page: any = {};
        ontologyStateStub.getActivePage.and.returnValue(page);
        component.ngOnInit();
        expect(page.usagesElement).toEqual(component.usagesContainer);
    });
    it('should tear down correctly', function() {
        const page: any = {usagesElement: 'prev'};
        ontologyStateStub.getActivePage.and.returnValue(page);
        component.ngOnDestroy();
        expect(page.usagesElement).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.usages-block')).length).toEqual(1);
        });
        ['.section-header', '.text-center', '.usages-container'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on how many values and results there are', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.property-values')).length).toEqual(0);

            component.usages = [{
                s: {value: 'www.test.com/A'},
                p: {value: 'www.test.com/B'},
                o: {value: 'www.test.com/test'}
            }];

            fixture.detectChanges();
            component.ngOnChanges();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.property-values')).length).toEqual(1);
            expect(element.queryAll(By.css('.property-values .prop-value-container')).length).toEqual(1);
        });
    });
    it('should update the results when the usages change', function() {
        component.usages = [{
            s: {value: 'A'},
            p: {value: 'B'},
            o: {value: 'test'}
        }, {
            s: {value: 'B'},
            p: {value: 'test'},
            o: {value: 'A'}
        }, {
            s: {value: 'B'},
            p: {value: 'A'},
            o: {value: 'test'}
        }, {
            s: {value: 'B'},
            p: {value: 'B'},
            o: {value: 'test'}
        }, {
            s: {value: 'B'},
            p: {value: 'test'},
            o: {value: 'B'}
        }];
        const expected = {
            B: [{
                subject: 'A', predicate: 'B', object: 'test'
            }, {
                subject: 'B', predicate: 'B', object: 'test'
            }],
            test: [{
                subject: 'B', predicate: 'test', object: 'A'
            }, {
                subject: 'B', predicate: 'test', object: 'B'
            }],
            A: [{
                subject: 'B', predicate: 'A', object: 'test'
            }]
        };
        fixture.detectChanges();
        component.ngOnChanges();
        expect(component.results).toEqual(expected);
        expect(component.total).toEqual(component.usages.length);
        expect(component.shown).toEqual(min([component.usages.length, component.size]));
    });
    describe('controller methods', function() {
        it('getMoreResults populates variables correctly', function() {
            component.usages = [{
                s: {value: 'A'},
                p: {value: 'B'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'test'},
                o: {value: 'A'}
            }, {
                s: {value: 'B'},
                p: {value: 'A'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'B'},
                o: {value: 'test'}
            }, {
                s: {value: 'B'},
                p: {value: 'test'},
                o: {value: 'B'}
            }];
            const expected = {
                B: [{
                    subject: 'A', predicate: 'B', object: 'test'
                }],
                test: [{
                    subject: 'B', predicate: 'test', object: 'A'
                }]
            };
            component.index = -1;
            component.size = 2;
            component.getMoreResults();
            expect(component.index).toEqual(0);
            expect(component.results).toEqual(expected);
            expect(component.shown).toEqual(component.size);
        });
    });
});
