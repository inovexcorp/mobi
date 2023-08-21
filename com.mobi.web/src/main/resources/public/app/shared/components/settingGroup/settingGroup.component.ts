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
import { Input, Component, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { forEach, has } from 'lodash';

import { Setting } from '../../models/setting.interface';
import { SimpleSetting } from '../../models/simpleSetting.class';
import { SETTING } from '../../../prefixes';
import { ToastService } from '../../services/toast.service';
import { SettingManagerService } from '../../services/settingManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { FormValues } from '../../../shacl-forms/components/shacl-form/shacl-form.component';
import { getPropertyId, setPropertyId } from '../../utility';
import { LoginManagerService } from '../../services/loginManager.service';
import { RESTError } from '../../models/RESTError.interface';

/**
 * @class shared.SettingGroupComponent
 *
 * A component that creates a collection of {@link shared.SHACLFormComponent} instances for all Settings within a
 * particular Setting group. Handles the rendering of a label for the form and a save button for creating/updating a
 * particular Setting. NOTE: Only supports "Simple Settings" for now, not ones where the PropertyShapes refer to nested
 * NodeShapes.
 * 
 * @param {{iri: string, userText: string}} settingType An object that represents the type of Setting that the
 * groups are for
 * @param {string} group The IRI of the specific Setting group to display individual Settings for
 */
@Component({
    selector: 'setting-group',
    templateUrl: './settingGroup.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingGroupComponent implements OnChanges {
    @Input() settingType: {iri: string, userText: string};
    @Input() group: string;

    errorMessage = '';
    settings: { [key: string]: Setting } = {};
    settingSaveable: { [key: string]: boolean } = {};
    settingIRIs: string[] = [];

    constructor(private sm: SettingManagerService, private toast: ToastService, private lm: LoginManagerService, 
        private ref: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.retrieveSettings();
    }

    retrieveSettings(): void {
        this.sm.getSettings(this.settingType.iri)
            .subscribe(response => {
                this.errorMessage = '';
                const settingResponse = response;
                this.sm.getSettingDefinitions(this.group, this.settingType.iri)
                    .subscribe(response => {
                        this.settings = {};
                        const shapeDefinitions: {[key: string]: JSONLDObject} = {};
                        const settingObject: {[key: string]: JSONLDObject} = {};
                        response.forEach(shape => {
                            shapeDefinitions[shape['@id']] = shape;
                            if (this.isTopLevelNodeShape(shape)) {
                                settingObject[shape['@id']] = shape;
                            }
                        });
                        forEach(settingObject, (settingJson: JSONLDObject, settingType: string) => {
                            let setting: Setting;
                            if (SimpleSetting.isSimpleSetting(settingJson, shapeDefinitions)) {
                                setting = new SimpleSetting(settingJson, shapeDefinitions);
                                setting.populate(settingResponse[settingType] || []);
                                this.settings[settingType] = setting;
                                this.settingSaveable[settingType] = false;
                            } else {
                                this.toast.createErrorToast('Complex Settings are not yet supported.');
                            }
                        });
                        this.settingIRIs = Object.keys(this.settings);
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateSetting(setting: Setting): void {
        if (setting.exists()) {
            this.sm.updateSetting(this.settingType.iri, setting.topLevelSettingNodeshapeInstanceId, setting.type, setting.values)
                .subscribe(() => {
                    this.errorMessage = '';
                    this.settingSaveable[setting.type] = false;
                    this.ref.markForCheck();
                    this.toast.createSuccessToast('Successfully updated the setting');
                }, error => {
                    this.errorMessage = error.errorMessage;
                    this.ref.markForCheck();
                });
        } else {
            this.sm.createSetting(this.settingType.iri, setting.type, setting.values)
                .subscribe(() => {
                    this.errorMessage = '';
                    this.settingSaveable[setting.type] = false;
                    setting.values.forEach(val => {
                        if (!getPropertyId(val, `${SETTING}forUser`)) {
                            setPropertyId(val, `${SETTING}forUser`, this.lm.currentUserIRI);
                        }
                    });
                    setting.populate(setting.values); // Will update the existing value
                    this.ref.markForCheck();
                    this.toast.createSuccessToast('Successfully created the setting');
                }, (error: RESTError) => {
                    this.errorMessage = error.errorMessage;
                    this.ref.markForCheck();
                });
        }
    }

    isTopLevelNodeShape(shape: JSONLDObject): boolean {
        return has(shape, `${SETTING}inGroup`);
    }

    updateSettingWithValues(values: FormValues, setting: Setting): void {
        setting.updateWithFormValues(values);
        this.settingSaveable[setting.type] = true;
    }

    updateSaveableStatus(status: string, setting: Setting): void {
        this.settingSaveable[setting.type] = status === 'VALID';
    }
}
