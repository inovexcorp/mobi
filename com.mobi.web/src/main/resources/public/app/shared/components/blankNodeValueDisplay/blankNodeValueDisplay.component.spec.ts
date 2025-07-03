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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../services/ontologyState.service';
import { BlankNodeValueDisplayComponent } from './blankNodeValueDisplay.component';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';

describe('Blank Node Value Display component', function() {
    let component: BlankNodeValueDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BlankNodeValueDisplayComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let trustedHtmlStub: jasmine.SpyObj<TrustedHtmlPipe>;

    const bnode = 'hasFin<span class="manchester-rest"> some </span>Fin';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
                FormsModule,
                ReactiveFormsModule
             ],
            declarations: [
                BlankNodeValueDisplayComponent,
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(TrustedHtmlPipe),
                MockProvider(PrefixationPipe)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BlankNodeValueDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        trustedHtmlStub = TestBed.inject(TrustedHtmlPipe) as jasmine.SpyObj<TrustedHtmlPipe>;

        component.node = {'@id': 'someId', name: 'someName'};
        ontologyStateStub.getBlankNodeValue.and.returnValue(bnode);
        trustedHtmlStub.transform.and.returnValue(bnode);
        component.stateService = ontologyStateStub;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        trustedHtmlStub = null;
    });

    it('initializes values correctly', function() {
        fixture.detectChanges();
        expect(component.htmlValue).toEqual(bnode);
        expect(ontologyStateStub.getBlankNodeValue).toHaveBeenCalledWith('someId');
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.blank-node-value-display')).length).toEqual(1);
        });
        it('with a value display', function() {
            expect(element.queryAll(By.css('.value-display')).length).toEqual(1);
        });
        it('with a manchester-rest', function() {
            fixture.detectChanges();
            const manchesterSpan = element.queryAll(By.css('.value-display span'))[0];
            expect(manchesterSpan.nativeElement.innerHTML).toEqual(bnode);
        });
    });
});
