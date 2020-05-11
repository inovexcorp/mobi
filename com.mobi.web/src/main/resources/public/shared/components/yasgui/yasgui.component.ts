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

import "@triply/yasgui/build/yasgui.min.css";
import './yasgui.component.scss';
import  * as Yasgui from '@triply/yasgui/build/yasgui.min.js';
import { merge } from 'lodash';
/**
 * @ngdoc component
 * @name shared.component:yasgui
 *
 */
const template = require('./yasgui.component.html');
const yasguiComponent = {
    template,
    controllerAs: 'dvm',
    controller: yasguiComponentCtrl
};


yasguiComponentCtrl.$inject = ['$element','REST_PREFIX'];

function yasguiComponentCtrl($element,REST_PREFIX) {
    let dvm = this;
    dvm.initYasgui = (element, config = {}) => {
        const path = REST_PREFIX + 'sparql/page';
        const { href } = new URL(path,document.location.origin);
        let localConfig = {
            requestConfig : {
            method: 'GET',
                endpoint: href
        },
        persistencyExpire: 0,
            populateFromUrl: false,
            copyEndpointOnNewTab: false
        };
        const configuration = merge(localConfig, config );
        let yasgui = new Yasgui(element, configuration);
        return yasgui;
    }

    dvm.$onInit = function() {
        let wrapper_element = $element.find('div')[0];
        let YASGUI = dvm.initYasgui(wrapper_element);
        console.log( 'Yasqe defaults', YASGUI);
        
    }


}

export default yasguiComponent;