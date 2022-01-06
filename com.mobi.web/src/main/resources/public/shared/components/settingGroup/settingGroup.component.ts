/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Input, Component, OnChanges, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { forEach, has } from 'lodash';

import { SettingUtils } from '../../models/settingUtils.class';
import { Setting } from '../../models/setting.interface';
import { SimpleSetting } from '../../models/simpleSetting.class';

/**
 * @ngdoc component
 * @name shared.component:settingGroup
 * @requires shared.service:settingManagerService
 * @requires shared.service.utilService
 * @requires shared.service.prefixes
 *
 * @description
 * `settingGroup` is a component that consisting of a series of {@link shared.component:settingForm settingForm}.
 */
@Component({
    selector: 'setting-group',
    templateUrl: './settingGroup.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingGroupComponent implements OnChanges {
    @Input() settingType;
    @Input() group;

    errorMessage = '';
    settings = {};
    settingIRIs = [];

    constructor(@Inject('settingManagerService') private sm, @Inject('utilService') private util, @Inject('prefixes') private prefixes, private ref: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.retrieveSettings();
    }

    retrieveSettings(): void {
        this.sm.getSettings(this.settingType.iri)
            .then(response => {
                this.errorMessage = '';
                const settingResponse = response.data;
                this.sm.getSettingDefinitions(this.group, this.settingType.iri)
                    .then(response => {
                        this.settings = {};
                        const shapeDefinitions = {};
                        const settingObject = {};
                        forEach(response.data, shape => {
                            shapeDefinitions[shape['@id']] = shape;
                            if (this.isTopLevelNodeShape(shape)) {
                                settingObject[shape['@id']] = shape;
                            }
                        });
                        forEach(settingObject, (settingJson:any, settingType: string) => {
                            let setting: Setting;
                            if (SettingUtils.isSimpleSetting(settingJson, shapeDefinitions)) {
                                setting = new SimpleSetting(settingJson, shapeDefinitions, this.util, this.prefixes);
                                setting.populate(settingResponse[settingType]);
                                this.settings[settingType] = setting;
                            } else {
                                this.util.createErrorToast('Complex Settings are not yet supported.');
                            }
                        });
                        this.settingIRIs = Object.keys(this.settings);
                        this.ref.markForCheck();
                    }, error => this.errorMessage = error);
            }, error => this.errorMessage = error);
    }

    updateSetting(setting: Setting): void {
        if (setting.exists()) {
            this.sm.updateSetting(this.settingType.iri, setting.topLevelSettingNodeshapeInstanceId, setting.type, setting.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrieveSettings();
                    this.util.createSuccessToast('Successfully updated the setting');
                }, error => this.errorMessage = error);
        } else {
            this.sm.createSetting(this.settingType.iri, setting.type, setting.asJsonLD())
                .then(() => {
                    this.errorMessage = '';
                    this.retrieveSettings();
                    this.util.createSuccessToast('Successfully created the setting');
                }, error => this.errorMessage = error);
        }
    }

    isTopLevelNodeShape(shape): boolean {
        return has(shape, this.prefixes.setting + 'inGroup');
    }
}
