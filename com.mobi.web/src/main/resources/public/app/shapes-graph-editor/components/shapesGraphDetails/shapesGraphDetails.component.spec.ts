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
//angular imports
import { By } from '@angular/platform-browser';
import { ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { DebugElement } from '@angular/core';
//third party imports
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { throwError, of } from 'rxjs';
//mobi + local imports
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { OnEditEventI } from '../../../shared/models/onEditEvent.interface';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { ShapesGraphDetailsComponent } from './shapesGraphDetails.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { StaticIriLimitedComponent } from '../staticIriLimited/staticIriLimited.component';
import { ToastService } from '../../../shared/services/toast.service';

describe('Shapes Graph Details component', function() {
    let component: ShapesGraphDetailsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphDetailsComponent>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let iriEditEvent: OnEditEventI;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ShapesGraphDetailsComponent,
                MockComponent(StaticIriLimitedComponent),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                PrefixationPipe,
                MockProvider(ShapesGraphStateService),
                MockProvider(OntologyManagerService),
                MockProvider(ToastService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ShapesGraphDetailsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.metadata = {'@id': ''};
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        iriEditEvent = {
            value: {
                'iriBegin': 'http://matonto.org/ontologies/uhtc',
                'iriThen': '/',
                'iriEnd': 'shapes-graph-test'
            }
        };
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
        toastStub = null;
        iriEditEvent = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-details')).length).toEqual(1);
        });
        it('depending on whether the selected entity has types', function() {
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(0);
            shapesGraphStateStub.listItem.metadata['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                shapesGraphStateStub.listItem.metadata = {'@id': ''};
                expect(component.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                const expected = 'test, test2';
                shapesGraphStateStub.listItem.metadata = {'@id': '', '@type': ['test', 'test2']};
                expect(component.getTypes()).toEqual(expected);
            });
        });
        describe('onIriEdit functions properly', function() {
            it('when shapesGraphState.onIriEdit resolves', fakeAsync(() => {
                shapesGraphStateStub.onIriEdit.and.returnValue(of(null));
                shapesGraphStateStub.saveCurrentChanges.and.returnValue(of(null));
                component.onIriEdit(iriEditEvent);
                tick();
                expect(shapesGraphStateStub.onIriEdit).toHaveBeenCalledWith('http://matonto.org/ontologies/uhtc', '/', 'shapes-graph-test');
                expect(shapesGraphStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            }));
            it('when shapesGraphState.onIriEdit does not resolve', fakeAsync(function() {
                shapesGraphStateStub.onIriEdit.and.returnValue(throwError('Test Error'));
                iriEditEvent.value.iriThen = undefined;
                component.onIriEdit(iriEditEvent);
                tick();
                expect(shapesGraphStateStub.onIriEdit).toHaveBeenCalledWith('http://matonto.org/ontologies/uhtc', undefined, 'shapes-graph-test');
                expect(shapesGraphStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Test Error');
            }));
        });
    });
});
