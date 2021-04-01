import { DebugElement } from '@angular/core';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
    cleanStylesFromDOM,
    mockUtil,
    mockPreferenceManager
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { PreferenceGroupComponent } from '../preferenceGroup/preferenceGroup.component';
import { PreferenceFormComponent } from '../preferenceForm/preferenceForm.component';
import { KeyValuePipe } from '../../../shared/pipes/keyvalue.pipe';
import { PreferenceConstants } from '../../classes/preferenceConstants.class';
import { SimplePreference } from '../../classes/simplePreference.class';
import { By } from '@angular/platform-browser';

describe('Preference Group component', function() {
    let component: PreferenceGroupComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreferenceGroupComponent>;
    let preferenceManagerStub;
    let testUserPreferences;
    let testPreferenceDefinitions;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule,
                NoopAnimationsModule,

            ],
            declarations: [
                MockComponent(PreferenceFormComponent),
                PreferenceGroupComponent,
                KeyValuePipe
            ],
            providers: [
                { provide: 'preferenceManagerService', useClass: mockPreferenceManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PreferenceGroupComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        preferenceManagerStub = TestBed.get('preferenceManagerService');

        testUserPreferences = {
            "http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference": [
                {
                    "@id": "http://mobi.com/preference#bff0d229-5691-455a-8e2b-8c09ccbc4ef6",
                    "@type": [
                        "http://www.w3.org/2002/07/owl#Thing",
                        "http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference",
                        "http://mobi.com/ontologies/preference#Preference",
                        "http://mobi.com/ontologies/preference#Setting"
                    ],
                    "http://mobi.com/ontologies/preference#forUser": [
                        {
                            "@id": "http://mobi.com/users/111111111111111111111111111"
                        }
                    ],
                    "http://mobi.com/ontologies/preference#hasDataValue": [
                        {
                            "@value": "true"
                        }
                    ]
                }
            ],
            "http://mobi.com/ontologies/preference#SomeSimpleTextPreference": [
                {
                    "@id": "http://mobi.com/preference#45e225a4-90f6-4276-b435-1b2888fdc01e",
                    "@type": [
                        "http://www.w3.org/2002/07/owl#Thing",
                        "http://mobi.com/ontologies/preference#Preference",
                        "http://mobi.com/ontologies/preference#SomeSimpleTextPreference",
                        "http://mobi.com/ontologies/preference#Setting"
                    ],
                    "http://mobi.com/ontologies/preference#forUser": [
                        {
                            "@id": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
                        }
                    ],
                    "http://mobi.com/ontologies/preference#hasDataValue": [
                        {
                            "@value": "aaa"
                        }
                    ]
                }
            ]
        };

        testPreferenceDefinitions = [ {
            "@id" : "http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference",
            "@type" : [ "http://www.w3.org/2002/07/owl#Class", "http://www.w3.org/ns/shacl#NodeShape" ],
            "http://mobi.com/ontologies/preference#inGroup" : [ {
              "@id" : "http://mobi.com/ontologies/preference#TestPrefGroupA"
            } ],
            "http://www.w3.org/2000/01/rdf-schema#subClassOf" : [ {
              "@id" : "http://mobi.com/ontologies/preference#Preference"
            } ],
            "http://www.w3.org/ns/shacl#description" : [ {
              "@value" : "What is your value for the simple boolean preference?"
            } ],
            "http://www.w3.org/ns/shacl#property" : [ {
              "@id" : "http://mobi.com/ontologies/preference#SomeSimpleBooleanPreferencePropertyShape"
            } ]
          }, {
            "@id" : "http://mobi.com/ontologies/preference#SomeSimpleBooleanPreferencePropertyShape",
            "@type" : [ "http://www.w3.org/ns/shacl#PropertyShape" ],
            "http://mobi.com/ontologies/preference#usesFormField" : [ {
              "@id" : "http://mobi.com/ontologies/preference#ToggleInput"
            } ],
            "http://www.w3.org/ns/shacl#datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#boolean"
            } ],
            "http://www.w3.org/ns/shacl#maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "http://www.w3.org/ns/shacl#minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "http://www.w3.org/ns/shacl#path" : [ {
              "@id" : "http://mobi.com/ontologies/preference#hasDataValue"
            } ]
          }, {
            "@id" : "http://mobi.com/ontologies/preference#SomeSimpleTextPreference",
            "@type" : [ "http://www.w3.org/2002/07/owl#Class", "http://www.w3.org/ns/shacl#NodeShape" ],
            "http://mobi.com/ontologies/preference#inGroup" : [ {
              "@id" : "http://mobi.com/ontologies/preference#TestPrefGroupA"
            } ],
            "http://www.w3.org/2000/01/rdf-schema#subClassOf" : [ {
              "@id" : "http://mobi.com/ontologies/preference#Preference"
            } ],
            "http://www.w3.org/ns/shacl#description" : [ {
              "@language" : "en",
              "@value" : "Enter a value for this simple text preference"
            } ],
            "http://www.w3.org/ns/shacl#property" : [ {
              "@id" : "http://mobi.com/ontologies/preference#SomeSimpleTextPreferencePropertyShape"
            } ]
          }, {
            "@id" : "http://mobi.com/ontologies/preference#SomeSimpleTextPreferencePropertyShape",
            "@type" : [ "http://www.w3.org/ns/shacl#PropertyShape" ],
            "http://mobi.com/ontologies/preference#usesFormField" : [ {
              "@id" : "http://mobi.com/ontologies/preference#TextInput"
            } ],
            "http://www.w3.org/ns/shacl#datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#string"
            } ],
            "http://www.w3.org/ns/shacl#maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "2"
            } ],
            "http://www.w3.org/ns/shacl#minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "http://www.w3.org/ns/shacl#path" : [ {
              "@id" : "http://mobi.com/ontologies/preference#hasDataValue"
            } ]
          } ];

        preferenceManagerStub.getPreferenceDefinitions.and.returnValue(Promise.resolve({data: testPreferenceDefinitions}));
        preferenceManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: testUserPreferences}));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        preferenceManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should retrieve preferences', function() {
            describe('successfully', function() {
                it('when user preferences exist', fakeAsync(function() {
                    component.retrievePreferences();
                    tick();
    
                    expect(Object.keys(component.preferences).length).toEqual(2);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('true');
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstance.length).toEqual(1);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstanceId).toEqual('http://mobi.com/preference#bff0d229-5691-455a-8e2b-8c09ccbc4ef6');
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference']).toBeInstanceOf(SimplePreference);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].asJsonLD()).toEqual(testUserPreferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference']);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleTextPreference'].asJsonLD()).toEqual(testUserPreferences['http://mobi.com/ontologies/preference#SomeSimpleTextPreference']);
                }));
                it('when no user preferences exist', fakeAsync(function() {
                    preferenceManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: []}));
                    component.retrievePreferences();
                    tick();
    
                    expect(Object.keys(component.preferences).length).toEqual(2);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');

                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleTextPreference'].values[0][PreferenceConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');

                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'].topLevelPreferenceNodeshapeInstanceId).toEqual(undefined);
    
                    expect(component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference']).toBeInstanceOf(SimplePreference);
                }));
            });
        });
        it('should update a preference', fakeAsync(function() {
            component.retrievePreferences();
            tick();
            const pref: SimplePreference = component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'];
            preferenceManagerStub.updateUserPreference.and.returnValue(Promise.resolve());
            component.updateUserPreference(pref);
            expect(preferenceManagerStub.updateUserPreference).toHaveBeenCalled();
            expect(preferenceManagerStub.createUserPreference).not.toHaveBeenCalled();
        }));
        it('should create a preference', fakeAsync(function() {
            preferenceManagerStub.getUserPreferences.and.returnValue(Promise.resolve({data: []}));
            component.retrievePreferences();
            tick();
            const pref: SimplePreference = component.preferences['http://mobi.com/ontologies/preference#SomeSimpleBooleanPreference'];
            preferenceManagerStub.createUserPreference.and.returnValue(Promise.resolve());
            component.updateUserPreference(pref);
            expect(preferenceManagerStub.updateUserPreference).not.toHaveBeenCalled();
            expect(preferenceManagerStub.createUserPreference).toHaveBeenCalled();
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
            preferenceManagerStub.getUserPreferences.and.returnValue(Promise.reject('Error message'));
            component.retrievePreferences();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(0);
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        }));
    });
});