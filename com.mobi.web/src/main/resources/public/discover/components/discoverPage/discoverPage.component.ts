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
import './discoverPage.component.scss';

const template = require('./discoverPage.component.html');

/**
 * @ngdoc component
 * @name discover.component:discoverPage
 *
 * @description
 * `discoverPage` is a component which creates the main page of the Discover module. The component contains
 * a {@link discover.component.discoverTabset discoverTabset} for navigating the Discover module
 */
const discoverPageComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: discoverPageComponentCtrl
};

function discoverPageComponentCtrl() {}

export default discoverPageComponent;
