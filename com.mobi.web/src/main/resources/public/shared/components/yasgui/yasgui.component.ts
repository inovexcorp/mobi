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
import './yasgui.component.scss';
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

yasguiComponentCtrl.$inject = ['yasguiService'];

function yasguiComponentCtrl(yasguiService) {
    let dvm = this;
   
    dvm.$onInit = function() {

        //let wrapper_element2 = document.getElementsByClassName('yasgui-tst')[0];
       // dvm.yasgui = yasguiService.initYasgui(wrapper_element2, {name: 'dicovery query2'})
        let wrapper_element = document.getElementsByClassName('yasgui-editor')[0];
        dvm.yasgui = yasguiService.initYasgui(wrapper_element, {name: 'dicovery query'});
    }
}

export default yasguiComponent;