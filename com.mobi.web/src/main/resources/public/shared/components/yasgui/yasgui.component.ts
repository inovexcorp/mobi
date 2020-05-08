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
//import '../../../vendor/Yasgui/build/yasgui.min.css';
//import * as YASGUI from 'yasgui'
//import * as YASQE from 'yasgui-yasqe';
// import from vendor
//import  * as YASQE from '../../../vendor/Yasgui/build/yasqe.min.js'
//import  * as YASGUI from '../../../vendor/Yasgui/build/yasgui.min.js'
//import Yasgui from "@triply/yasgui";
//import "@triply/yasgui/build/yasgui.min.css";
/**
 * @ngdoc component
 * @name shared.component:yasgui
 *
 */
const yasguiComponent = {
    template: '<div id="yasgui-editor">yasgui</div>',
    controllerAs: 'dvm',
    controller: yasguiComponentCtrl
};


yasguiComponentCtrl.$inject = ['$element'];

function yasguiComponentCtrl($element) {
    var dvm = this;

    dvm.$onInit = function() {
        let div = $element.find('div')[0];
        // let yas  = new YASGUI(div,{
        //     populateFromUrl: false
        // });
    }
}

export default yasguiComponent;