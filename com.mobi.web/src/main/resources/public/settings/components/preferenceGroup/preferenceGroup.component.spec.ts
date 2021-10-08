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

import {
    cleanStylesFromDOM,
    mockUtil,
    mockSettingManager,
    mockPrefixes
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { PreferenceGroupComponent } from '../preferenceGroup/preferenceGroup.component';
import { PreferenceFormComponent } from '../preferenceForm/preferenceForm.component';
import { PreferenceConstants } from '../../classes/preferenceConstants.class';
import { SimplePreference } from '../../classes/simplePreference.class';
import { By } from '@angular/platform-browser';
import { PreferenceUtils } from '../../classes/preferenceUtils.class';
import { get, has, set } from 'lodash';

describe('Preference Group component', function() {
    let component: PreferenceGroupComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreferenceGroupComponent>;
    let settingManagerStub;
    let testUserPreferences;
    let testPreferenceDefinitions;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule,
                NoopAnimationsModule,

            ],
            declarations: [
                MockComponent(PreferenceFormComponent),
                PreferenceGroupComponent
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
        fixture = TestBed.createComponent(PreferenceGroupComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        settingManagerStub = TestBed.get('settingManagerService');
        utilStub = TestBed.get('utilService');
        
        spyOn(PreferenceUtils, 'isSimplePreference').and.returnValue(true);
        
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
        testUserPreferences = {
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

        testPreferenceDefinitions = [ {
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

        settingManagerStub.getPreferenceDefinitions.and.returnValue(Promise.resolve({data: testPreferenceDefinitions}));
        settingManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: testUserPreferences}));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        settingManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should retrieve preferences', function() {
            describe('successfully', function() {
                it('when user preferences exist', fakeAsync(function() {
                    component.retrievePreferences();
                    tick();
    
                    expect(Object.keys(component.preferences).length).toEqual(2);
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('true');
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstance.length).toEqual(1);
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstanceId).toEqual('http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6');
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference']).toBeInstanceOf(SimplePreference);
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].asJsonLD()).toEqual(testUserPreferences['setting:SomeSimpleBooleanPreference']);
    
                    expect(component.preferences['setting:SomeSimpleTextPreference'].asJsonLD()).toEqual(testUserPreferences['setting:SomeSimpleTextPreference']);
                }));
                it('when no user preferences exist', fakeAsync(function() {
                    settingManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: []}));
                    component.retrievePreferences();
                    tick();
    
                    expect(Object.keys(component.preferences).length).toEqual(2);
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');

                    expect(component.preferences['setting:SomeSimpleTextPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');

                    expect(component.preferences['setting:SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstanceId).toEqual(undefined);
    
                    expect(component.preferences['setting:SomeSimpleBooleanPreference']).toBeInstanceOf(SimplePreference);
                }));
            });
        });
        it('should update a preference', fakeAsync(function() {
            component.retrievePreferences();
            tick();
            const pref: SimplePreference = component.preferences['setting:SomeSimpleBooleanPreference'];
            settingManagerStub.updateUserPreference.and.returnValue(Promise.resolve());
            component.updateUserPreference(pref);
            expect(settingManagerStub.updateUserPreference).toHaveBeenCalled();
            expect(settingManagerStub.createUserPreference).not.toHaveBeenCalled();
        }));
        it('should create a preference', fakeAsync(function() {
            settingManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: []}));
            component.retrievePreferences();
            tick();
            const pref: SimplePreference = component.preferences['setting:SomeSimpleBooleanPreference'];
            settingManagerStub.createUserPreference.and.returnValue(Promise.resolve());
            component.updateUserPreference(pref);
            expect(settingManagerStub.updateUserPreference).not.toHaveBeenCalled();
            expect(settingManagerStub.createUserPreference).toHaveBeenCalled();
        }));
    });
    describe('contains the correct html', function() {
        it('when preferences are retrieved successfully', fakeAsync(function() {
            component.retrievePreferences();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(2);
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
        }));
        it('when preferences are can not be retrieved', fakeAsync(function() {
            settingManagerStub.getUserPreferences.and.returnValue(Promise.reject('Error message'));
            component.retrievePreferences();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(0);
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        }));
    });
});