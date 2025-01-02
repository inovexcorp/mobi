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
import { DebugElement } from '@angular/core';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { SimpleSetting } from '../../models/simpleSetting.class';
import { OWL, RDFS, SETTING, SHACL, SHACL_FORM, XSD } from '../../../prefixes';
import { ToastService } from '../../services/toast.service';
import { SettingManagerService } from '../../services/settingManager.service';
import { SHACLFormComponent } from '../../../shacl-forms/components/shacl-form/shacl-form.component';
import { Setting } from '../../models/setting.interface';
import { LoginManagerService } from '../../services/loginManager.service';
import { SettingGroupComponent } from './settingGroup.component';
import { RESTError } from '../../models/RESTError.interface';

describe('Setting Group component', function() {
    let component: SettingGroupComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingGroupComponent>;
    let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let testUserSettings;
    let testSettingsDefinitions;

    const error = 'Error Message';
    const errorObj: RESTError = {
        error: '',
        errorMessage: error,
        errorDetails: []
    };
    const userId = 'http://mobi.com/users/111111111111111111111111111';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule
            ],
            declarations: [
              SettingGroupComponent,
              MockComponent(SHACLFormComponent),
              MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(SettingManagerService),
                MockProvider(ToastService),
                MockProvider(LoginManagerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SettingGroupComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        loginManagerStub.currentUserIRI = userId;

        component.settingType = { iri: 'http://mobitest.com/Preference', userText: 'Preferences'};

        testUserSettings = {
            [`${SETTING}SomeSimpleBooleanPreference`]: [
                {
                    '@id': 'http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6',
                    '@type': [
                        `${OWL}Thing`,
                        `${SETTING}SomeSimpleBooleanPreference`,
                        `${SETTING}Preference`,
                        `${SETTING}Setting`
                    ],
                    [`${SETTING}forUser`]: [{ '@id': userId }],
                    [`${SETTING}hasDataValue`]: [{
                        '@value': 'true',
                        '@type': `${XSD}boolean`
                    }]
                }
            ],
            [`${SETTING}SomeSimpleTextPreference`]: [
                {
                    '@id': 'http://mobi.com/setting#45e225a4-90f6-4276-b435-1b2888fdc01e',
                    '@type': [
                        `${OWL}Thing`,
                        `${SETTING}SomeSimpleTextPreference`,
                        `${SETTING}Preference`,
                        `${SETTING}Setting`
                    ],
                    [`${SETTING}forUser`]: [{ '@id': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997' }],
                    [`${SETTING}hasDataValue`]: [{
                        '@value': 'aaa'
                    }]
                }
            ]
        };

        testSettingsDefinitions = [ {
            '@id': `${SETTING}SomeSimpleBooleanPreference`,
            '@type': [ `${OWL}Class`, `${SHACL}NodeShape` ],
            [`${SETTING}inGroup`]: [ {
              '@id': `${SETTING}TestPrefGroupA`
            } ],
            [`${RDFS}subClassOf`]: [ {
              '@id': `${SETTING}Preference`
            } ],
            [`${SHACL}description`]: [ {
              '@value': 'What is your value for the simple boolean preference?'
            } ],
            [`${SHACL}property`]: [ {
              '@id': `${SETTING}SomeSimpleBooleanPreferencePropertyShape`
            } ]
          }, {
            '@id': `${SETTING}SomeSimpleBooleanPreferencePropertyShape`,
            '@type': [ `${SHACL}PropertyShape` ],
            [`${SHACL_FORM}usesFormField`]: [ {
              '@id': `${SHACL_FORM}ToggleInput`
            } ],
            [`${SHACL}datatype`]: [ {
              '@id': `${XSD}boolean`
            } ],
            [`${SHACL}maxCount`]: [ {
              '@type': `${XSD}integer`,
              '@value': '1'
            } ],
            [`${SHACL}minCount`]: [ {
              '@type': `${XSD}integer`,
              '@value': '1'
            } ],
            [`${SHACL}path`]: [ {
              '@id': `${SETTING}hasDataValue`
            } ]
          }, {
            '@id': `${SETTING}SomeSimpleTextPreference`,
            '@type': [ `${OWL}Class`, `${SHACL}NodeShape` ],
            [`${SETTING}inGroup`]: [ {
              '@id': `${SETTING}TestPrefGroupA`
            } ],
            [`${RDFS}subClassOf`]: [ {
              '@id': `${SETTING}Preference`
            } ],
            [`${SHACL}description`]: [ {
              '@language': 'en',
              '@value': 'Enter a value for this simple text preference'
            } ],
            [`${SHACL}property`]: [ {
              '@id': `${SETTING}SomeSimpleTextPreferencePropertyShape`
            } ]
          }, {
            '@id': `${SETTING}SomeSimpleTextPreferencePropertyShape`,
            '@type': [ `${SHACL}PropertyShape` ],
            [`${SHACL_FORM}usesFormField`]: [ {
              '@id': `${SHACL_FORM}TextInput`
            } ],
            [`${SHACL}datatype`]: [ {
              '@id': `${XSD}string`
            } ],
            [`${SHACL}maxCount`]: [ {
              '@type': `${XSD}integer`,
              '@value': '2'
            } ],
            [`${SHACL}minCount`]: [ {
              '@type': `${XSD}integer`,
              '@value': '1'
            } ],
            [`${SHACL}path`]: [ {
              '@id': `${SETTING}hasDataValue`
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
        loginManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should retrieve settings', function() {
            describe('successfully', function() {
                it('when user settings exist', fakeAsync(function() {
                    component.retrieveSettings();
                    tick();
                    expect(Object.keys(component.settings).length).toEqual(2);
                    expect(Object.keys(component.settingSaveable).length).toEqual(2);
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`]).toBeInstanceOf(SimpleSetting);
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`].topLevelSettingNodeshapeInstanceId).toEqual('http://mobi.com/setting#bff0d229-5691-455a-8e2b-8c09ccbc4ef6');
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`].values).toEqual(testUserSettings[`${SETTING}SomeSimpleBooleanPreference`]);
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`]).toBeInstanceOf(SimpleSetting);
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`].topLevelSettingNodeshapeInstanceId).toEqual('http://mobi.com/setting#45e225a4-90f6-4276-b435-1b2888fdc01e');
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`].values).toEqual(testUserSettings[`${SETTING}SomeSimpleTextPreference`]);
                }));
                it('when no user settings exist', fakeAsync(function() {
                    settingManagerStub.getSettings.and.returnValue(of({}));
                    component.retrieveSettings();
                    tick();
                    expect(Object.keys(component.settings).length).toEqual(2);
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`]).toBeInstanceOf(SimpleSetting);
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`].topLevelSettingNodeshapeInstanceId).toEqual(undefined);
                    expect(component.settings[`${SETTING}SomeSimpleBooleanPreference`].values.length).toEqual(0);
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`]).toBeInstanceOf(SimpleSetting);
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`].topLevelSettingNodeshapeInstanceId).toEqual(undefined);
                    expect(component.settings[`${SETTING}SomeSimpleTextPreference`].values.length).toEqual(0);
                }));
            });
        });
        describe('should update a setting', function() {
            beforeEach(fakeAsync(function() {
                component.retrieveSettings();
                tick();
                this.setting = component.settings[`${SETTING}SomeSimpleBooleanPreference`];
                component.settingSaveable[this.setting.type] = true;
            }));
            it('unless an error occurs', fakeAsync(function() {
                settingManagerStub.updateSetting.and.returnValue(throwError(errorObj));
                component.updateSetting(this.setting);
                tick();
                expect(settingManagerStub.updateSetting).toHaveBeenCalledWith(component.settingType.iri, this.setting.topLevelSettingNodeshapeInstanceId, this.setting.type, this.setting.values);
                expect(settingManagerStub.createSetting).not.toHaveBeenCalled();
                expect(component.settingSaveable[this.setting.type]).toBeTrue();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(component.errorMessage).toEqual(error);
            }));
            it('successfully', fakeAsync(function() {
                settingManagerStub.updateSetting.and.returnValue(of(null));
                component.updateSetting(this.setting);
                tick();
                expect(settingManagerStub.updateSetting).toHaveBeenCalledWith(component.settingType.iri, this.setting.topLevelSettingNodeshapeInstanceId, this.setting.type, this.setting.values);
                expect(settingManagerStub.createSetting).not.toHaveBeenCalled();
                expect(component.settingSaveable[this.setting.type]).toBeFalse();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Successfully updated the setting');
                expect(component.errorMessage).toEqual('');
            }));
        });
        describe('should create a setting', function() {
            beforeEach(fakeAsync(function() {
                settingManagerStub.getSettings.and.returnValue(of({}));
                component.retrieveSettings();
                tick();
                this.setting = component.settings[`${SETTING}SomeSimpleBooleanPreference`];
                component.settingSaveable[this.setting.type] = true;
                this.setting.updateWithFormValues({[`${SETTING}hasDataValue`]: 'true'});
            }));
            it('unless an error occurs', fakeAsync(function() {
                expect(this.setting.exists()).toBeFalse();
                settingManagerStub.createSetting.and.returnValue(throwError(errorObj));
                component.updateSetting(this.setting);
                tick();
                expect(settingManagerStub.updateSetting).not.toHaveBeenCalled();
                expect(settingManagerStub.createSetting).toHaveBeenCalledWith(component.settingType.iri, this.setting.type, this.setting.values);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(component.settingSaveable[this.setting.type]).toBeTrue();
                this.setting.values.forEach(val => {
                  expect(val[`${SETTING}forUser`]).toBeUndefined();
                });
                expect(this.setting.exists()).toBeFalse();
                expect(component.errorMessage).toEqual(error);
            }));
            it('successfully', fakeAsync(function() {
                expect(this.setting.exists()).toBeFalse();
                settingManagerStub.createSetting.and.returnValue(of(null));
                component.updateSetting(this.setting);
                tick();
                expect(settingManagerStub.updateSetting).not.toHaveBeenCalled();
                expect(settingManagerStub.createSetting).toHaveBeenCalledWith(component.settingType.iri, this.setting.type, this.setting.values);
                expect(component.settingSaveable[this.setting.type]).toBeFalse();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Successfully created the setting');
                this.setting.values.forEach(val => {
                  expect(val[`${SETTING}forUser`]).toEqual([{ '@id': userId }]);
                });
                expect(this.setting.exists()).toBeTrue();
                expect(component.errorMessage).toEqual('');
            }));
        });
        it('should determine whether a NodeShape is a top level node shape', function() {
            expect(component.isTopLevelNodeShape({'@id': 'test', [`${SETTING}inGroup`]: [{'@id': 'group'}]})).toBeTrue();
            expect(component.isTopLevelNodeShape({'@id': 'test'})).toBeFalse();
        });
        it('should update a setting with the latest values from the SHACL form', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            const setting: Setting = component.settings[`${SETTING}SomeSimpleBooleanPreference`];
            spyOn(setting, 'updateWithFormValues');
            component.updateSettingWithValues({[`${SETTING}hasDataValue`]: 'true'}, setting);
            expect(setting.updateWithFormValues).toHaveBeenCalledWith({[`${SETTING}hasDataValue`]: 'true'});
            expect(component.settingSaveable[`${SETTING}SomeSimpleBooleanPreference`]).toBeTrue();
        }));
        it('should update the saveable status of a setting', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            const setting: Setting = component.settings[`${SETTING}SomeSimpleBooleanPreference`];
            component.updateSaveableStatus('VALID', setting);
            expect(component.settingSaveable[`${SETTING}SomeSimpleBooleanPreference`]).toBeTrue();
            component.updateSaveableStatus('INVALID', setting);
            expect(component.settingSaveable[`${SETTING}SomeSimpleBooleanPreference`]).toBeFalse();
        }));
    });
    describe('contains the correct html', function() {
        it('when settings are retrieved successfully', fakeAsync(function() {
            component.retrieveSettings();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            expect(element.queryAll(By.css('div')).length).toEqual(2);
            expect(element.queryAll(By.css('app-shacl-form')).length).toEqual(2);
            expect(element.queryAll(By.css('h4')).length).toEqual(2);
            expect(element.queryAll(By.css('button')).length).toEqual(2);
        }));
        it('when settings are can not be retrieved', fakeAsync(function() {
            settingManagerStub.getSettings.and.returnValue(throwError('Error message'));
            component.retrieveSettings();
            tick();
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
            expect(element.queryAll(By.css('div')).length).toEqual(0);
        }));
    });
});
