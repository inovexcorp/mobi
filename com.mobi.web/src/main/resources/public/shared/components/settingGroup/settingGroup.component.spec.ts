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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { get, has, set } from 'lodash';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { SettingFormComponent } from '../settingForm/settingForm.component';
import { SettingConstants } from '../../models/settingConstants.class';
import { SimpleSetting } from '../../models/simpleSetting.class';
import { SettingUtils } from '../../models/settingUtils.class';
import { OWL, RDFS, SETTING, SHACL, XSD } from '../../../prefixes';
import { UtilService } from '../../services/util.service';
import { SettingManagerService } from '../../services/settingManager.service';
import { SettingGroupComponent } from './settingGroup.component';

describe('Setting Group component', function() {
    let component: SettingGroupComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingGroupComponent>;
    let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
    let testUserSettings;
    let testSettingsDefinitions;
    let utilStub: jasmine.SpyObj<UtilService>;

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
                MockProvider(SettingManagerService),
                MockProvider(UtilService),
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SettingGroupComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        settingManagerStub = TestBed.get(SettingManagerService);
        utilStub = TestBed.get(UtilService);
        
        spyOn(SettingUtils, 'isSimpleSetting').and.returnValue(true);
        
        component.settingType = { iri: 'http://mobitest.com/Preference', userText: 'Preferences'};
        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@value\']', '');
        });

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@id\']', '');
        });

        utilStub.setPropertyValue.and.callFake((entity, propertyIRI, value) => {
            if (has(entity, '[\'' + propertyIRI + '\']')) {
                entity[propertyIRI].push({'@value': value});
            } else {
                set(entity, '[\'' + propertyIRI + '\'][0]', {'@value': value});
            }
        });
        testUserSettings = {
            [SETTING + 'SomeSimpleBooleanPreference']: [
                {
                    '@id': 'http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6',
                    '@type': [
                        OWL + 'Thing',
                        SETTING + 'SomeSimpleBooleanPreference',
                        SETTING + 'Preference',
                        SETTING + 'Setting'
                    ],
                    [SETTING + 'forUser']: [
                        {
                            '@id': 'http://mobi.com/users/111111111111111111111111111'
                        }
                    ],
                    [SETTING + 'hasDataValue']: [
                        {
                            '@value': 'true'
                        }
                    ]
                }
            ],
            [SETTING + 'SomeSimpleTextPreference']: [
                {
                    '@id': 'http://mobi.com/setting#45e225a4-90f6-4276-b435-1b2888fdc01e',
                    '@type': [
                        OWL + 'Thing',
                        SETTING + 'SomeSimpleTextPreference',
                        SETTING + 'Preference',
                        SETTING + 'Setting'
                    ],
                    [SETTING + 'forUser']: [
                        {
                            '@id': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997'
                        }
                    ],
                    [SETTING + 'hasDataValue']: [
                        {
                            '@value': 'aaa'
                        }
                    ]
                }
            ]
        };

        testSettingsDefinitions = [ {
            '@id': SETTING + 'SomeSimpleBooleanPreference',
            '@type': [ OWL + 'Class', SHACL + 'NodeShape' ],
            [SETTING + 'inGroup']: [ {
              '@id': SETTING + 'TestPrefGroupA'
            } ],
            [RDFS + 'subClassOf']: [ {
              '@id': SETTING + 'Preference'
            } ],
            [SHACL + 'description']: [ {
              '@value': 'What is your value for the simple boolean preference?'
            } ],
            [SHACL + 'property']: [ {
              '@id': SETTING + 'SomeSimpleBooleanPreferencePropertyShape'
            } ]
          }, {
            '@id': SETTING + 'SomeSimpleBooleanPreferencePropertyShape',
            '@type': [ SHACL + 'PropertyShape' ],
            [SETTING + 'usesFormField']: [ {
              '@id': SETTING + 'ToggleInput'
            } ],
            [SHACL + 'datatype']: [ {
              '@id': XSD + 'boolean'
            } ],
            [SHACL + 'maxCount']: [ {
              '@type': XSD + 'integer',
              '@value': '1'
            } ],
            [SHACL + 'minCount']: [ {
              '@type': XSD + 'integer',
              '@value': '1'
            } ],
            [SHACL + 'path']: [ {
              '@id': SETTING + 'hasDataValue'
            } ]
          }, {
            '@id': SETTING + 'SomeSimpleTextPreference',
            '@type': [ OWL + 'Class', SHACL + 'NodeShape' ],
            [SETTING + 'inGroup']: [ {
              '@id': SETTING + 'TestPrefGroupA'
            } ],
            [RDFS + 'subClassOf']: [ {
              '@id': SETTING + 'Preference'
            } ],
            [SHACL + 'description']: [ {
              '@language': 'en',
              '@value': 'Enter a value for this simple text preference'
            } ],
            [SHACL + 'property']: [ {
              '@id': SETTING + 'SomeSimpleTextPreferencePropertyShape'
            } ]
          }, {
            '@id': SETTING + 'SomeSimpleTextPreferencePropertyShape',
            '@type': [ SHACL + 'PropertyShape' ],
            [SETTING + 'usesFormField']: [ {
              '@id': SETTING + 'TextInput'
            } ],
            [SHACL + 'datatype']: [ {
              '@id': XSD + 'string'
            } ],
            [SHACL + 'maxCount']: [ {
              '@type': XSD + 'integer',
              '@value': '2'
            } ],
            [SHACL + 'minCount']: [ {
              '@type': XSD + 'integer',
              '@value': '1'
            } ],
            [SHACL + 'path']: [ {
              '@id': SETTING + 'hasDataValue'
            } ]
          } ];
        settingManagerStub.getDefaultNamespace.and.returnValue(of('http://test.com'));
        settingManagerStub.getSettingDefinitions.and.returnValue(of(testSettingsDefinitions));
        settingManagerStub.getSettings.and.returnValue(of(testUserSettings));
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
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('true');
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstance.length).toEqual(1);
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstanceId).toEqual('http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6');
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference']).toBeInstanceOf(SimpleSetting);
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].asJsonLD()).toEqual(testUserSettings[SETTING + 'SomeSimpleBooleanPreference']);
                    expect(component.settings[SETTING + 'SomeSimpleTextPreference'].asJsonLD()).toEqual(testUserSettings[SETTING + 'SomeSimpleTextPreference']);
                }));
                it('when no user settings exist', fakeAsync(function() {
                    settingManagerStub.getSettings.and.returnValue(of({}));
                    component.retrieveSettings();
                    tick();
                    expect(Object.keys(component.settings).length).toEqual(2);
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');
                    expect(component.settings[SETTING + 'SomeSimpleTextPreference'].values[0][SettingConstants.HAS_DATA_VALUE][0]['@value']).toEqual('');
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference'].topLevelSettingNodeshapeInstanceId).toEqual(undefined);
                    expect(component.settings[SETTING + 'SomeSimpleBooleanPreference']).toBeInstanceOf(SimpleSetting);
                }));
            });
        });
        it('should update a setting', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            const simpleSetting: SimpleSetting = component.settings[SETTING + 'SomeSimpleBooleanPreference'];
            settingManagerStub.updateSetting.and.returnValue(of(null));
            component.updateSetting(simpleSetting);
            expect(settingManagerStub.updateSetting).toHaveBeenCalled();
            expect(settingManagerStub.createSetting).not.toHaveBeenCalled();
        }));
        it('should create a setting', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            const simpleSetting: SimpleSetting = component.settings[SETTING + 'SomeSimpleBooleanPreference'];
            simpleSetting.topLevelSettingNodeshapeInstanceId = '';
            settingManagerStub.createSetting.and.returnValue(of(null));
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
            settingManagerStub.getSettings.and.returnValue(throwError('Error message'));
            component.retrieveSettings();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('div')).length).toEqual(0);
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        }));
    });
});
