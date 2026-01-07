/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { SettingGroupComponent } from '../settingGroup/settingGroup.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';
import { RDFS } from '../../../prefixes';
import { ToastService } from '../../services/toast.service';
import { SettingManagerService } from '../../services/settingManager.service';
import { SettingEditPageComponent } from './settingEditPage.component';

describe('Setting Edit Page Component', function() {
    let component: SettingEditPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingEditPageComponent>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
    let testGroups;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule
            ],
            declarations: [
                SettingEditPageComponent,
                MockComponent(SettingGroupComponent),
                ErrorDisplayComponent,
                InfoMessageComponent,
                TrustedHtmlPipe
            ],
            providers: [
                MockProvider(SettingManagerService),
                MockProvider(ToastService),
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SettingEditPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
        settingManagerStub.getSettingGroups.and.returnValue(of([]));
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        testGroups = [ {
            '@id': 'preference:TestGroupA',
            '@type': [ 'preference:PreferenceGroup' ],
            [`${RDFS}label`]: [ {
              '@language': 'en',
              '@value': 'Test Group A'
            } ]
          }, {
            '@id': 'preference:#TestGroupB',
            '@type': [ 'preference:PreferenceGroup' ],
            [`${RDFS}label`]: [ {
              '@language': 'en',
              '@value': 'Test Group B'
            } ]
          } ];

        component.tabs = [];

        component.settingType = { iri: 'http://mobitest.com/Preference', userText: 'Preferences'};
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        settingManagerStub = null;
        toastStub = null;
    });

    describe('controller methods', function() {
        describe('should populate the sidebar', function() {
            it('unless an error occurs', fakeAsync(function() {
                settingManagerStub.getSettingGroups.and.returnValue(throwError('Error message'));
                component.setSettingTabs();
                tick();
                expect(component.tabs.length).toEqual(0);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
            it('with new values', fakeAsync(function() {
                settingManagerStub.getSettingGroups.and.returnValue(of(testGroups));
                component.setSettingTabs();
                tick();
                expect(component.tabs.length).toEqual(2);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.tabs[0].active).toEqual(true);
            }));
        });
        describe('should add a preference group to the sidebar', function() {
            it('unless the group has no label', function() {
                const testPreferenceGroup = {
                    '@id': 'preference:TestGroupA',
                    '@type': [ 'preference:PreferenceGroup' ]
                };
                component.addTab(testPreferenceGroup);
                expect(component.tabs.length).toEqual(0);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            });
            it('with the correct properties', function() {
                const testPreferenceGroup = {
                    '@id': 'preference:TestGroupA',
                    '@type': [ 'preference:PreferenceGroup' ],
                    [`${RDFS}label`]: [ {
                      '@language': 'en',
                      '@value': 'Test Group A'
                    } ]
                };
                component.addTab(testPreferenceGroup);
                expect(component.tabs.length).toEqual(1);
                expect(component.tabs[0]).toEqual({
                    type: 'preference:TestGroupA',
                    heading: 'Test Group A',
                    active: false
                });
            });
        });
        it('should change which tab is active', function() {
            component.tabs = [
                {
                    type: 'preference:TestGroupA',
                    heading: 'Test Group A',
                    active: true
                },
                {
                    type: 'preference:TestGroupB',
                    heading: 'Test Group B',
                    active: false
                }
            ];
            component.selectTab(component.tabs[1]);
            expect(component.tabs[0].active).toEqual(false);
            expect(component.tabs[1].active).toEqual(true);

            component.selectTab(component.tabs[0]);
            expect(component.tabs[0].active).toEqual(true);
            expect(component.tabs[1].active).toEqual(false);
        });
    });
        
    describe('contains the correct html', function() {
        beforeEach(function() {
            fixture.detectChanges();
            component.tabs = [
                {
                    type: 'preference:TestGroupA',
                    heading: 'Test Group A',
                    active: true
                },
                {
                    type: 'preference:TestGroupB',
                    heading: 'Test Group B',
                    active: false
                }
            ];
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.setting-edit-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(2);
            expect(element.queryAll(By.css('.col-3')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-9')).length).toEqual(1);
        });
        it('when no tabs exist', function() {
            expect(element.query(By.css('info-message'))).toBeFalsy();
            component.tabs = [];
            fixture.detectChanges();
            expect(element.query(By.css('info-message'))).toBeTruthy();
        });
        it('with sidebar elements', function() {
            expect(element.queryAll(By.css('.setting-group-item a')).length).toEqual(2);
        });
    });
});
