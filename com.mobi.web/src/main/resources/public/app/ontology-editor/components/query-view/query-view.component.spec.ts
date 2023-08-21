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
import { MatDialogModule } from '@angular/material/dialog';
import { MockComponent, MockProvider } from 'ng-mocks';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { YasguiService } from '../../../shared/services/yasgui.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ToastService } from '../../../shared/services/toast.service';
import { YasguiQuery } from '../../../shared/models/yasguiQuery.class';
import { QueryViewComponent } from './query-view.component';

describe('QueryViewComponent', () => {
    let component: QueryViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QueryViewComponent>;
    let yasguiStub: jasmine.SpyObj<YasguiService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    let yasguiInstance;
    let tab;
    let yasqe;
    let yasr;

    const error = 'error message';
    const configQuery =  {
        args: [{ name: 'includeImports', value: false }]
    } ;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule
            ],
            declarations: [
                QueryViewComponent,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastService)
            ]
        }).overrideComponent(QueryViewComponent, {
            set: {
                providers: [
                    { provide: YasguiService, useFactory: () => MockProvider(YasguiService).useFactory() }
                ]
            }
        }).compileComponents();

        fixture = TestBed.createComponent(QueryViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        yasguiStub = element.injector.get(YasguiService) as jasmine.SpyObj<YasguiService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        yasqe = {
            on: jasmine.createSpy('on'),
            getValue: jasmine.createSpy('getValue'),
            setValue: jasmine.createSpy('setValue'),
            config: {
                value: ''
            }
        };
        yasr = {
            on: jasmine.createSpy('on'),
            setResponse: jasmine.createSpy('setResponse')
        };
        tab = {
            yasqe,
            yasr,
            rootEl: undefined
        };
        yasguiInstance = jasmine.createSpyObj('yasgui', [
            'getTab',
            'handleYasrContainer'
        ]);
        yasguiInstance.getTab.and.returnValue(tab);
        yasguiStub.getYasgui.and.returnValue(yasguiInstance);

        component.yasguiQuery = new YasguiQuery();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        yasguiStub = null;
    });

    describe('should initialize correctly', function() {
        beforeEach(function() {
            spyOn(component, 'setValues');
        });
        it('if yasgui was created', function() {
            component.ngOnInit();
            expect(yasguiStub.initYasgui).toHaveBeenCalledWith(component.ontologyQuery.nativeElement, {name: 'ontologyQuery'}, new YasguiQuery(), true);
            expect(yasguiStub.getYasgui).toHaveBeenCalledWith();
            expect(yasguiInstance.getTab).toHaveBeenCalledWith();
            expect(component.tab).toEqual(tab);
            expect(component.setValues).toHaveBeenCalledWith();
            expect(component.error).toEqual('');
        });
        it('unless yasgui was not created', function() {
            yasguiStub.getYasgui.and.returnValue(undefined);
            component.ngOnInit();
            expect(yasguiStub.initYasgui).toHaveBeenCalledWith(component.ontologyQuery.nativeElement, {name: 'ontologyQuery'}, new YasguiQuery(), true);
            expect(yasguiStub.getYasgui).toHaveBeenCalledWith();
            expect(yasguiInstance.getTab).not.toHaveBeenCalled();
            expect(component.tab).toEqual({});
            expect(component.setValues).not.toHaveBeenCalled();
            expect(component.error).toEqual(jasmine.stringContaining('Something went wrong'));
        });
    });
    describe('controller method', function() {
        it('submitQuery should handle submitting a query', function() {
            component.submitQuery();
            expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologyQuery);
            expect(yasguiStub.submitQuery).toHaveBeenCalledWith(configQuery);
            expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologyQuery);
        });
        describe('setValues should initialize', function() {
            beforeEach(function() {
                component.yasgui = yasguiInstance;
                component.tab = tab;
            });
            it('the query if set', function() {
                component.yasguiQuery.queryString = 'query';
                component.setValues();
                expect(yasqe.setValue).toHaveBeenCalledWith('query');
                expect(yasr.setResponse).not.toHaveBeenCalled();
                expect(yasguiInstance.handleYasrContainer).not.toHaveBeenCalled();
            });
            it('the results if set', function() {
                delete yasqe.setValue;
                component.yasguiQuery.response = { test: 'test' };
                component.setValues();
                expect(yasr.setResponse).toHaveBeenCalledWith({ test: 'test' }, 0);
                expect(yasguiInstance.handleYasrContainer).toHaveBeenCalledWith();
            });
        });
    });
    describe('contains the correct html', function() {
        beforeEach(() => fixture.detectChanges());
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.query-view')).length).toBe(1);
        });
        ['.query-view', '.top-section', '.btn-container', '.ontology-query'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
    });
    it('should call submitQuery when the button is clicked', function() {
        spyOn(component, 'submitQuery');
        const button = element.queryAll(By.css('button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.submitQuery).toHaveBeenCalledWith();
    });
});
