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
import { Directive, ElementRef, Injector } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
import { filter, includes } from 'lodash';

import './groupTab.component.scss';

const template = require('./groupTab.component.html');

/**
 * @ngdoc component
 * @name settings.component:groupTab
 * @requires shared.service:userManagerService
 * @requires shared.service:loginManagerService
 *
 * @description
 * `groupTab` is a component which creates a Bootstrap list of groups a user is in.
 */
export const groupTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: groupTabComponentCtrl
};

groupTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService'];

function groupTabComponentCtrl(userManagerService, loginManagerService) {
    var dvm = this;
    dvm.um = userManagerService;
    dvm.lm = loginManagerService;
    dvm.groups = [];

    dvm.$onInit = function() {
        dvm.groups = filter(dvm.um.groups, group => includes(group.members, dvm.lm.currentUser));
    }
}

@Directive({
    selector: 'group-tab'
})
export class GroupTabDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super('groupTab', elementRef, injector);
    }
}