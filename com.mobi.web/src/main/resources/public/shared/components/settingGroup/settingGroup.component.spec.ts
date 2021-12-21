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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { get, has, set } from 'lodash';

import {
    cleanStylesFromDOM,
    mockUtil,
    mockSettingManager,
    mockPrefixes
} from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { SettingGroupComponent } from './settingGroup.component';
import { SettingFormComponent } from '../settingForm/settingForm.component';
import { SettingConstants } from '../../models/settingConstants.class';
import { SimpleSetting } from '../../models/simpleSetting.class';
import { SettingUtils } from '../../models/settingUtils.class';

describe('Setting Group component', function() {
    let component: SettingGroupComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingGroupComponent>;
    let settingManagerStub;
    let testUserSettings;
    let testSettingsDefinitions;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule
            ],
            declarations: [
                MockComponent(SettingFormComponent),
                SettingGroupComponent,
                ErrorDisplayComponent
            ],
            providers: [
                { provide: 'settingManagerService', useClass: mockSettingManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SettingGroupComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        settingManagerStub = TestBed.get('settingManagerService');
        utilStub = TestBed.get('utilService');
        
        spyOn(SettingUtils, 'isSimpleSetting').and.returnValue(true);
        
        component.settingType = { iri: `http://mobitest.com/Preference`, userText: 'Preferences'};
        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@value']", '');
        });

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@id']", '');
        });

        utilStub.setPropertyValue.and.callFake((entity, propertyIRI, value) => {
            if (has(entity, "['" + propertyIRI + "']")) {
                entity[propertyIRI].push({'@value': value});
            } else {
                set(entity, "['" + propertyIRI + "'][0]", {'@value': value});
            }
        });
        testUserSettings = {
            "setting:SomeSimpleBooleanPreference": [
                {
                    "@id": "http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6",
                    "@type": [
                        "http://www.w3.org/2002/07/owl#Thing",
                        "setting:SomeSimpleBooleanPreference",
                        "setting:Preference",
                        "setting:Setting"
                    ],
                    "setting:forUser": [
                        {
                            "@id": "http://mobi.com/users/111111111111111111111111111"
                        }
                    ],
                    "http://mobi.com/ontologies/setting#hasDataValue": [
                        {
                            "@value": "true"
                        }
                    ]
                }
            ],
            "setting:SomeSimpleTextPreference": [
                {
                    "@id": "http://mobi.com/setting#45e225a4-90f6-4276-b435-1b2888fdc01e",
                    "@type": [
                        "http://www.w3.org/2002/07/owl#Thing",
                        "setting:Preference",
                        "setting:SomeSimpleTextPreference",
                        "setting:Setting"
                    ],
                    "setting:forUser": [
                        {
                            "@id": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
                        }
                    ],
                    "http://mobi.com/ontologies/setting#hasDataValue": [
                        {
                            "@value": "aaa"
                        }
                    ]
                }
            ]
        };

        testSettingsDefinitions = [ {
            "@id" : "setting:SomeSimpleBooleanPreference",
            "@type" : [ "http://www.w3.org/2002/07/owl#Class", "shacl:NodeShape" ],
            "setting:inGroup" : [ {
              "@id" : "setting:TestPrefGroupA"
            } ],
            "http://www.w3.org/2000/01/rdf-schema#subClassOf" : [ {
              "@id" : "setting:Preference"
            } ],
            "shacl:description" : [ {
              "@value" : "What is your value for the simple boolean preference?"
            } ],
            "shacl:property" : [ {
              "@id" : "setting:SomeSimpleBooleanPreferencePropertyShape"
            } ]
          }, {
            "@id" : "setting:SomeSimpleBooleanPreferencePropertyShape",
            "@type" : [ "shacl:PropertyShape" ],
            "setting:usesFormField" : [ {
              "@id" : "setting:ToggleInput"
            } ],
            "shacl:datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#boolean"
            } ],
            "shacl:maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "shacl:minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "shacl:path" : [ {
              "@id" : "http://mobi.com/ontologies/setting#hasDataValue"
            } ]
          }, {
            "@id" : "setting:SomeSimpleTextPreference",
            "@type" : [ "http://www.w3.org/2002/07/owl#Class", "shacl:NodeShape" ],
            "setting:inGroup" : [ {
              "@id" : "setting:TestPrefGroupA"
            } ],
            "http://www.w3.org/2000/01/rdf-schema#subClassOf" : [ {
              "@id" : "setting:Preference"
            } ],
            "shacl:description" : [ {
              "@language" : "en",
              "@value" : "Enter a value for this simple text preference"
            } ],
            "shacl:property" : [ {
              "@id" : "setting:SomeSimpleTextPreferencePropertyShape"
            } ]
          }, {
            "@id" : "setting:SomeSimpleTextPreferencePropertyShape",
            "@type" : [ "shacl:PropertyShape" ],
            "setting:usesFormField" : [ {
              "@id" : "setting:TextInput"
            } ],
            "shacl:datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#string"
            } ],
            "shacl:maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "2"
            } ],
            "shacl:minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "shacl:path" : [ {
              "@id" : "http://mobi.com/ontologies/setting#hasDataValue"
            } ]
          } ];
        settingManagerStub.getDefaultNamespace.and.returnValue(Promise.resolve(settingManagerStub.defaultNamespace));
        settingManagerStub.getSettingDefinitions.and.returnValue(Promise.resolve({data: testSettingsDefinitions}));
        settingManagerStub.getSettings.and.returnValue(Promise.resolve({data: testUserSettings}));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        settingManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should retrieve settings', function() {
            describe('successfully', function() {
                it('when user settings exist', fakeAsync(function() {
                    component.retrieveSettings();
                    tick();
                    expect(Object.keys(component.settings).length).toEqual(2);
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('true');
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstance.length).toEqual(1);
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstanceId).toEqual('http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6');
                    expect(component.settings['setting:SomeSimpleBooleanPreference']).toBeInstanceOf(SimpleSetting);
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].asJsonLD()).toEqual(testUserSettings['setting:SomeSimpleBooleanPreference']);
                    expect(component.settings['setting:SomeSimpleTextPreference'].asJsonLD()).toEqual(testUserSettings['setting:SomeSimpleTextPreference']);
                }));
                it('when no user settings exist', fakeAsync(function() {
                    settingManagerStub.getSettings.and.returnValue(Promise.resolve({data: []}));
                    component.retrieveSettings();
                    tick();
                    expect(Object.keys(component.settings).length).toEqual(2);
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');
                    expect(component.settings['setting:SomeSimpleTextPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');
                    expect(component.settings['setting:SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstanceId).toEqual(undefined);
                    expect(component.settings['setting:SomeSimpleBooleanPreference']).toBeInstanceOf(SimpleSetting);
                }));
            });
        });
        it('should update a setting', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            const simpleSetting: SimpleSetting = component.settings['setting:SomeSimpleBooleanPreference'];
            settingManagerStub.updateSetting.and.returnValue(Promise.resolve());
            component.updateSetting(simpleSetting);
            expect(settingManagerStub.updateSetting).toHaveBeenCalled();
            expect(settingManagerStub.createSetting).not.toHaveBeenCalled();
        }));
        it('should create a setting', fakeAsync(function() {
            settingManagerStub.getSettings.and.returnValue(Promise.resolve({data: []}));
            component.retrieveSettings();
            tick();
            const simpleSetting: SimpleSetting = component.settings['setting:SomeSimpleBooleanPreference'];
            settingManagerStub.createUserPreference.and.returnValue(Promise.resolve());
            component.updateSetting(simpleSetting);
            expect(settingManagerStub.updateSetting).not.toHaveBeenCalled();
            expect(settingManagerStub.createSetting).toHaveBeenCalled();
        }));
    });
    describe('contains the correct html', function() {
        it('when settings are retrieved successfully', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(2);
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
        }));
        it('when settings are can not be retrieved', fakeAsync(function() {
            settingManagerStub.getSettings.and.returnValue(Promise.reject('Error message'));
            component.retrieveSettings();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(0);
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        }));
    });
});