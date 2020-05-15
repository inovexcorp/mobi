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
import * as Yasgui from '@triply/yasgui/build/yasgui.min.js';
import * as YasrTurtlePlugin from '../../vendor/YASGUI/plugins/turtle/turtle';




import { merge } from 'lodash';

/**
 * @ngdoc service
 * @name shared.service:yasguiService
 * @requires shared.service:prefixes
 *
 */
yasguiService.$inject = ['REST_PREFIX'];

function yasguiService(REST_PREFIX) {
    const self = this;
    let hasInitialized = false
    const initPlugins = () => {
        //
        if (Yasgui.Yasr) {
            Yasgui.Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
        } else {
            if (window) {
                (window as any).Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
            }
        }
    }

    self.initYasgui = (element, config = {}) => {
        const path = REST_PREFIX + 'sparql/page';
        const { href } = new URL(path, document.location.origin);
        let localConfig = {
            requestConfig : {
                method: 'GET',
                endpoint: href
            },
            persistencyExpire: 0,
            populateFromUrl: false,
            copyEndpointOnNewTab: false
        };
        const configuration = merge({}, localConfig, config );
        initPlugins();
        self.yasgui = new Yasgui(element, configuration);
        hasInitialized = true;
        return self.yasgui;
    }
    // fire a new query
    self.submitQuery  = () => {
        if(hasInitialized){
            self.yasgui.getTab().yasqe.query();
        } else {
            throw 'Yasgui has not ben inizialize!';
        }
    }
}

export default yasguiService;
