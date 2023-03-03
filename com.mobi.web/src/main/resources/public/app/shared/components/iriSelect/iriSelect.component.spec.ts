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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockPipe, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SplitIRIPipe } from '../../pipes/splitIRI.pipe';
import { UtilService } from '../../services/util.service';
import { IriSelectComponent } from './iriSelect.component';

describe('IRI Select component', function() {
    let component: IriSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IriSelectComponent>;
    let utilServiceStub: jasmine.SpyObj<UtilService>;
    let splitIRIPipeStub: jasmine.SpyObj<SplitIRIPipe>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatFormFieldModule,
                MatOptionModule,
                MatInputModule,
                MatSelectModule,
                MatChipsModule,
                MatAutocompleteModule
             ],
            declarations: [
                IriSelectComponent,
            ],
            providers: [
                MockProvider(UtilService),
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(IriSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.displayText = 'test';
        component.selectList = {};
        component.mutedText = 'test';

        utilServiceStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        splitIRIPipeStub = TestBed.inject(SplitIRIPipe) as jasmine.SpyObj<SplitIRIPipe>;
        splitIRIPipeStub.transform.and.returnValue({begin: 'http://start', then: '/', end: 'end'});
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilServiceStub = null;
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.iri-select')).length).toBe(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            fixture.detectChanges();
            let selects = element.queryAll(By.css('mat-chip-list'));
            expect(selects.length).toBe(1);

            component.singleSelect = true;
            fixture.detectChanges();

            selects = element.queryAll(By.css('mat-chip-list'));
            expect(selects.length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            component.selectList = {iri: 'new'};
        });
        it('getOntologyIri should return the set ontology IRI from the selectList if provided', function() {
            expect(component.getOntologyIri('iri')).toEqual('new');
        });
        it('filter should return the correct value', function() {
            component.selectList = {iri: 'new'};
            utilServiceStub.getBeautifulIRI.and.returnValue('new');
            let iriGrouping = component.filter('new');
            expect(iriGrouping).toEqual([{namespace: 'new', options: [{item: 'iri', name: 'new'}]}]);
        });
    });
});
