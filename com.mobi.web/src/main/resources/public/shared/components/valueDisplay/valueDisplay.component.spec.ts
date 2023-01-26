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

import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ValueDisplayComponent } from './valueDisplay.component';
import { DebugElement } from '@angular/core';
import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';
import { MockPipe, MockProvider } from 'ng-mocks';
import { HighlightTextPipe } from '../../pipes/highlightText.pipe';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { By } from '@angular/platform-browser';
import { UtilService } from '../../services/util.service';
import { DiscoverStateService } from '../../services/discoverState.service';

describe('Value Display component', function() {
    let component: ValueDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ValueDisplayComponent>;
    let discoverStateServiceStub: jasmine.SpyObj<DiscoverStateService>;
    let utilServiceStub: jasmine.SpyObj<UtilService>;
    let trustedHtmlPipeStub: jasmine.SpyObj<TrustedHtmlPipe>;
    let highlightTextPipeStub: jasmine.SpyObj<HighlightTextPipe>;
    let prefixationPipeStub: jasmine.SpyObj<PrefixationPipe>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ValueDisplayComponent,
                MockPipe(TrustedHtmlPipe),
                MockPipe(HighlightTextPipe),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                MockProvider(DiscoverStateService),
                MockProvider(UtilService),
                TrustedHtmlPipe,
                HighlightTextPipe,
                PrefixationPipe
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ValueDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        discoverStateServiceStub = TestBed.get(DiscoverStateService);
        utilServiceStub = TestBed.get(UtilService);
        trustedHtmlPipeStub = TestBed.get(TrustedHtmlPipe);
        highlightTextPipeStub = TestBed.get(HighlightTextPipe);
        prefixationPipeStub = TestBed.get(PrefixationPipe);

        discoverStateServiceStub.explore = {
            breadcrumbs: ['Classes', 'instance'],
            classDeprecated: false,
            classDetails: [],
            classId: 'classId',
            creating: false,
            editing: false,
            instance: {
                entity: [{'@id': 'instanceId', '@type': ['instance']}],
                metadata: {instanceIRI: 'instanceIRI', title: 'prop', description: 'prop description'},
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                total: 0,
                links: {
                    next: '',
                    prev: ''
                },
            },
            recordId: 'recordId',
            recordTitle: 'recordTitle',
            hasPermissionError: false
        };
        component.value = {'@id': 'new'};
        component.highlightText = 'text';
        fixture.detectChanges();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        discoverStateServiceStub = null;
        utilServiceStub = null;
        trustedHtmlPipeStub = null;
        highlightTextPipeStub = null;
        prefixationPipeStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.value-display')).length).toEqual(1);
        });
        it('with a .has-id', function() {
            expect(element.queryAll(By.css('.has-id')).length).toEqual(1);
            // component.value = {}; // Typing makes this test not possible
            fixture.detectChanges();
            // expect(element.queryAll(By.css('.has-id')).length).toEqual(0);
        });
        it('with a .has-value', function() {
            expect(element.queryAll(By.css('.has-value')).length).toEqual(0);

            component.value = {'@id': 'id', '@value': 'value'};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.has-value')).length).toEqual(1);
        });
        it('with a .text-muted.lang-display', function() {
            expect(element.queryAll(By.css('.text-muted.lang-display')).length).toEqual(0);

            component.value = {'@id': 'id', '@value': 'value', '@language': 'en'};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.text-muted.lang-display')).length).toEqual(1);
        });
        it('with a .text-muted.type-display', function() {
            expect(element.queryAll(By.css('.text-muted.type-display')).length).toEqual(0);

            component.value = {'@id': 'id', '@value': 'value', '@type': ['type']};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.text-muted.type-display')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('has should return', function() {
            beforeEach(function() {
                this.obj = {prop: 'value'};
            });
            it('true when property is present', function() {
                expect(component.has(this.obj, 'prop')).toEqual(true);
            });
            it('false when property is not present', function() {
                expect(component.has(this.obj, 'missing')).toEqual(false);
            });
        });
    });
});
