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
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, SimpleChange } from '@angular/core';
import { MockPipe, MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { TrustedHtmlPipe } from '../../../shared/pipes/trustedHtml.pipe';
import { SplitIRI } from '../../../shared/models/splitIRI.interface';
import { CopyClipboardDirective } from '../../../shared/directives/copyClipboard/copyClipboard.directive';
import { StaticIriLimitedComponent } from './staticIriLimited.component';

describe('Static IRI Limited component', function() {
    let component: StaticIriLimitedComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<StaticIriLimitedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                StaticIriLimitedComponent,
                MockComponent(CopyClipboardDirective),
                MockPipe(SplitIRIPipe, () => {
                    return {
                        begin: '',
                        then: '',
                        end: ''
                    } as SplitIRI;
                }),
                TrustedHtmlPipe
            ],
            providers: [
                SplitIRIPipe,
                TrustedHtmlPipe
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StaticIriLimitedComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.iri = 'full/id';

        fixture.detectChanges();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.static-iri-limited')).length).toEqual(1);
            expect(element.queryAll(By.css('strong')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('setVariables sets the parts of the IRI', function() {
            component.iriBegin = '';
            component.iriThen = '';
            component.iriEnd = '';
            component.setVariables();
            expect(component.iriBegin).toEqual('full');
            expect(component.iriThen).toEqual('/');
            expect(component.iriEnd).toEqual('id');
        });
    });
    it('updates appropriately when the IRI changes', function() {
        component.setVariables = jasmine.createSpy('setVariables');
        component.iri = 'full/idnew';
        component.ngOnChanges({
            iri: new SimpleChange(null, 'full/idnew', false)
          });
        expect(component.setVariables).toHaveBeenCalledWith();
    });
});
