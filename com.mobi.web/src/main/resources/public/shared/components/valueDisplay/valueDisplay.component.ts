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
import { has } from 'lodash';

import './valueDisplay.component.scss';

const template = require('./valueDisplay.component.html');

/**
 * @ngdoc component
 * @name shared.component:valueDisplay
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 *
 * @description
 * `valueDisplay` is a component which creates a span element for displaying json-ld values.
 * It is meant to be used to display a json-ld object in a readable format.
 *
 * @param {object} value the json-ld value to display to a user.
 */
const valueDisplayComponent = {
    template,
    bindings: {
        value: '<',
        highlightText: '<'
    },
    controllerAs: 'dvm',
    controller: valueDisplayComponentCtrl
};

valueDisplayComponentCtrl.$inject = ['discoverStateService', 'utilService'];

function valueDisplayComponentCtrl(discoverStateService, utilService) {
    var dvm = this;
    dvm.util = utilService;
    dvm.ds = discoverStateService;

    dvm.has = function(obj, key) {
        return has(obj, key);
    }
}

export default valueDisplayComponent;