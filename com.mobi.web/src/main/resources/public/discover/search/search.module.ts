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
import * as angular from 'angular';

import searchService from './services/search.service';
import discoverSearchTabComponent from './components/discoverSearchTab/discoverSearchTab.component';
import filterSelectorComponent from './components/filterSelector/filterSelector.component';
import propertyFilterOverlayComponent from './components/propertyFilterOverlay/propertyFilterOverlay.component';
import searchFormComponent from './components/searchForm/searchForm.component';
import propertySelectorComponent from './components/propertySelector/propertySelector.component';

/**
 * @ngdoc overview
 * @name search
 *
 * @description
 * The `search` module provides components that make up the Search submodule in the Mobi application.
 */
angular.module('search', [])
    .service('searchService', searchService)
    .component('discoverSearchTab', discoverSearchTabComponent)
    .component('filterSelector', filterSelectorComponent)
    .component('propertyFilterOverlay', propertyFilterOverlayComponent)
    .component('propertySelector', propertySelectorComponent)
    .component('searchForm', searchFormComponent);
