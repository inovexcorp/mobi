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
import * as angular from 'angular';

import downloadQueryOverlayComponent from './components/downloadQueryOverlay/downloadQueryOverlay.component';
import queryTabComponent from './components/queryTab/queryTab.component';

/**
 * @ngdoc overview
 * @name query
 *
 * @description
 * The `query` module provides components that make up the Query submodule of the Discover module in the Mobi
 * application.
 */
angular.module('query', [])
    .component('downloadQueryOverlay', downloadQueryOverlayComponent)
    .component('queryTab', queryTabComponent);
