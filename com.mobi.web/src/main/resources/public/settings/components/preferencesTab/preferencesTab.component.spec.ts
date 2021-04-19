/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
    cleanStylesFromDOM,
    mockPreferenceManager,
    mockUtil,
    mockPrefixes
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { PreferencesTabComponent } from './preferencesTab.component';
import { PreferenceGroupComponent } from '../preferenceGroup/preferenceGroup.component';
import { TrustedHtmlPipe } from '../../../shared/pipes/trustedHtml.pipe';
import utilService from '../../../shared/services/util.service';
import { get } from 'lodash';

describe('Preferences Tab component', function() {
    let component: PreferencesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreferencesTabComponent>;
    let utilStub;
    let preferenceManagerStub;
    let testGroups;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule,
                NoopAnimationsModule
            ],
            declarations: [
                PreferencesTabComponent,
                MockComponent(PreferenceGroupComponent),
                TrustedHtmlPipe
            ],
            providers: [
                { provide: 'preferenceManagerService', useClass: mockPreferenceManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PreferencesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        preferenceManagerStub = TestBed.get('preferenceManagerService');
        utilStub = TestBed.get('utilService');
        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@value']", '');
        });

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@id']", '');
        });
        testGroups = [ {
            "@id" : "preference:TestGroupA",
            "@type" : [ "preference:PreferenceGroup" ],
            "rdfs:label" : [ {
              "@language" : "en",
              "@value" : "Test Group A"
            } ]
          }, {
            "@id" : "preference:#TestGroupB",
            "@type" : [ "preference:PreferenceGroup" ],
            "rdfs:label" : [ {
              "@language" : "en",
              "@value" : "Test Group B"
            } ]
          } ];

        preferenceManagerStub.tabs = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        preferenceManagerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        describe('should populate the sidebar', function() {
            it('unless an error occurs', fakeAsync(function() {
                preferenceManagerStub.getPreferenceGroups.and.returnValue(Promise.reject('Error message'));
                component.setPreferenceTabs();
                tick();
                expect(preferenceManagerStub.tabs.length).toEqual(0);
                expect(utilStub.createErrorToast).toHaveBeenCalled();
            }));
            it('with new values', fakeAsync(function() {
                preferenceManagerStub.getPreferenceGroups.and.returnValue(Promise.resolve({data: testGroups}));
                component.setPreferenceTabs();
                tick();
                expect(component.tabs.length).toEqual(2);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(component.tabs[0].active).toEqual(true);
            }));
        });
        describe('should add a preference group to the sidebar', function() {
            it('unless the group has no label', function() {
                const testPreferenceGroup = {
                    "@id" : "preference:TestGroupA",
                    "@type" : [ "preference:PreferenceGroup" ]
                };
                component.addTab(testPreferenceGroup);
                expect(component.tabs.length).toEqual(0);
                expect(utilStub.createErrorToast).toHaveBeenCalled();
            });
            it('with the correct properties', function() {
                const testPreferenceGroup = {
                    "@id" : "preference:TestGroupA",
                    "@type" : [ "preference:PreferenceGroup" ],
                    "rdfs:label" : [ {
                      "@language" : "en",
                      "@value" : "Test Group A"
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
            component.select(component.tabs[1]);
            expect(component.tabs[0].active).toEqual(false);
            expect(component.tabs[1].active).toEqual(true);

            component.select(component.tabs[0]);
            expect(component.tabs[0].active).toEqual(true);
            expect(component.tabs[1].active).toEqual(false);
        });
    });
        
    describe('contains the correct html', function() {
        beforeEach(function() {
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
            expect(element.queryAll(By.css('.preferences-tab')).length).toEqual(1);
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
            expect(element.queryAll(By.css('.preference-group-item a')).length).toEqual(2);
        });
    });
});