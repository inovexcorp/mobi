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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ValueDisplayComponent } from '../../../../shared/components/valueDisplay/valueDisplay.component';
import { InstanceViewComponent } from './instanceView.component';

describe('Instance View component', function() {
    let component: InstanceViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceViewComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatDividerModule,
            ],
            declarations: [
                InstanceViewComponent,
                MockComponent(BreadcrumbsComponent),
                MockComponent(ValueDisplayComponent)
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                MockProvider(MatDialog),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InstanceViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        discoverStateStub.getInstance.and.returnValue({
            '@id': 'ignored',
            '@type': ['ignored'],
            prop1: [{
                '@id': 'http://mobi.com/id',
            }],
            prop2: [{
                '@value': 'value1',
            }, {
                '@value': 'value2'
            }],
            prop3: [{
                '@value': 'value3'
            }]
        });
        discoverStateStub.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                entity: [],
                metadata: {
                    instanceIRI: 'string',
                    title: 'string',
                    description: 'string'
                },
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
            recordId: '',
            recordTitle: '',
            hasPermissionError: false
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('div.instance-view')).length).toEqual(1);
        });
        it('for a block-header', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.instances-display-header')).length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(element.queryAll(By.css('breadcrumbs')).length).toBe(1);
        });
        it('with a .float-right.edit-button', function() {
            expect(element.queryAll(By.css('.float-right.edit-button')).length).toBe(1);
        });
        it('with a .instance-container', function() {
            fixture.detectChanges();
            expect(element.nativeElement.querySelectorAll('.instance-Container').length).toBe(1);
        });
        it('with a .col-8.offset-2', function() {
            expect(element.queryAll(By.css('.col-8.offset-2')).length).toBe(1);
        });
        it('with a h2', function() {
            expect(element.queryAll(By.css('h2')).length).toBe(1);
        });
        it('with a small', function() {
            expect(element.queryAll(By.css('small')).length).toBe(1);
        });
        it('with three h3.property and three ul.values', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('h3.property')).length).toBe(3);
            expect(element.queryAll(By.css('ul.values')).length).toBe(3);
        });
        it('with three ul.values', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('ul.values')).length).toBe(3);
        });
        it('with a .values.show-link', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.values.show-link')).length).toBe(1);

            discoverStateStub.getInstance.and.returnValue({
                '@id': 'ignored',
                '@type': ['ignored'],
                'prop1': [{
                    '@id': 'http://mobi.com/id',
                    'more': true
                }]
            });
            component.ngOnChanges();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.values.show-link')).length).toBe(0);
        });
        it('with a .values.show-more', async () => {
            expect(element.queryAll(By.css('.values.show-more')).length).toBe(0);
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            const link = element.queryAll(By.css('.link'))[0];
            link.nativeNode.click();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.values.show-more')).length).toBe(1);
        });
        it('with three li.link-containers', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('li.link-container')).length).toBe(3);
        });
        it('with three a.links', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('a.link')).length).toBe(3);
        });
        it('with a a.more', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('a.more')).length).toBe(0);
            const link = element.queryAll(By.css('.link'))[0];

            fixture.detectChanges();
            link.nativeNode.click();
            fixture.detectChanges();
            expect(element.queryAll(By.css('a.more')).length).toBe(1);
        });
    });
    describe('controller methods', function() {
        // describe('getLimit returns the proper value when limit and array.length are', function() {
        //     it('equal', async function() {
        //         component.ngOnInit();
        //         fixture.detectChanges();
        //         await fixture.whenStable();
        //         expect(component.getLimit(['', ''], 2)).toBe(1);
        //     });
        //     it('not equal', async function() {
        //         component.ngOnInit();
        //         fixture.detectChanges();
        //         await fixture.whenStable();
        //         expect(component.getLimit(['', ''], 1)).toBe(2);
        //     });
        // });
        it('edit sets the correct state and has modify permission', fakeAsync(function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
            discoverStateStub.explore.editing = false;
            discoverStateStub.explore.instance.original = [];
            component.edit();
            fixture.detectChanges();
            tick();
            expect(discoverStateStub.explore.editing).toBe(true);
            expect(discoverStateStub.explore.instance.original).toEqual(discoverStateStub.explore.instance.entity);
        }));
        it('edit and does not have modify permission', fakeAsync( function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
            discoverStateStub.explore.editing = false;
            discoverStateStub.explore.instance.original = [];
            component.edit();
            fixture.detectChanges();
            tick();
            expect(discoverStateStub.explore.editing).toBe(false);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
        }));
    });
    it('should call edit when the edit button is clicked', function() {
        spyOn(component, 'edit');
        const btn = element.queryAll(By.css('.float-right.edit-button'))[0];
        btn.nativeNode.click();
        expect(component.edit).toHaveBeenCalledWith();
    });
});
