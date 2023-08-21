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
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MockPipe, MockProvider } from 'ng-mocks';

import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';
import { HighlightTextPipe } from '../../pipes/highlightText.pipe';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../services/discoverState.service';
import { ValueDisplayComponent } from './valueDisplay.component';

describe('Value Display component', function() {
    let component: ValueDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ValueDisplayComponent>;
    let discoverStateServiceStub: jasmine.SpyObj<DiscoverStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ValueDisplayComponent,
                MockPipe(TrustedHtmlPipe),
                MockPipe(HighlightTextPipe),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                MockProvider(DiscoverStateService),
                TrustedHtmlPipe,
                HighlightTextPipe,
                PrefixationPipe
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ValueDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        discoverStateServiceStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
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
                objectMap: { 'iri': 'Test' },
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
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.value-display')).length).toEqual(1);
        });
        it('with a .has-id', function() {
            expect(element.queryAll(By.css('.has-id')).length).toEqual(1);
            
            component.value = {'@value': 'value'};
            fixture.detectChanges();
            expect(element.queryAll(By.css('.has-id')).length).toEqual(0);
        });
        it('with a .has-value', function() {
            expect(element.queryAll(By.css('.has-value')).length).toEqual(0);

            component.value = {'@value': 'value'};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.has-value')).length).toEqual(1);
        });
        it('with a .text-muted.lang-display', function() {
            expect(element.queryAll(By.css('.text-muted.lang-display')).length).toEqual(0);

            component.value = {'@value': 'value', '@language': 'en'};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.text-muted.lang-display')).length).toEqual(1);
        });
        it('with a .text-muted.type-display', function() {
            expect(element.queryAll(By.css('.text-muted.type-display')).length).toEqual(0);

            component.value = {'@value': 'value', '@type': 'type'};
            fixture.detectChanges();

            expect(element.queryAll(By.css('.text-muted.type-display')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('getDisplay should return display text for an IRI', function() {
            it('when property is in the explore state', function() {
                expect(component.getDisplay('iri')).toEqual('Test');
            });
            it('when property is not in the explore state', function() {
                expect(component.getDisplay('http://test.com#iri')).toEqual('Iri');
            });
        });
    });
});
