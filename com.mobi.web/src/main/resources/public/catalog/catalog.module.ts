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

import branchListComponent from './components/branchList/branchList.component';
import catalogPageComponent from './components/catalogPage/catalogPage.component';
import catalogRecordKeywordsComponent from './components/catalogRecordKeywords/catalogRecordKeywords.component';
import entityPublisherComponent from './components/entityPublisher/entityPublisher.component';
import limitDescriptionComponent from './components/limitDescription/limitDescription.component';
import openRecordButtonComponent from './components/openRecordButton/openRecordButton.component';
import manageRecordButtonComponent from './components/manageRecordButton/manageRecordButton.component';
import recordPermissionView from './components/recordPermissionView/recordPermissionView.component';
import recordCardComponent from './components/recordCard/recordCard.component';
import recordFiltersComponent from './components/recordFilters/recordFilters.component';
import recordIconComponent from './components/recordIcon/recordIcon.component';
import recordMarkdownComponent from './components/recordMarkdown/recordMarkdown.component';
import recordsViewComponent from './components/recordsView/recordsView.component';
import recordTypeComponent from './components/recordType/recordType.component';
import recordViewComponent from './components/recordView/recordView.component';
import recordViewTabsetComponent from './components/recordViewTabset/recordViewTabset.component';
import sortOptionsComponent from './components/sortOptions/sortOptions.component';

/**
 * @ngdoc overview
 * @name catalog
 *
 * @description
 * The `catalog` module provides components that make up the Catalog module in the Mobi application.
 */
angular.module('catalog', [])
    .component('branchList', branchListComponent)
    .component('catalogPage', catalogPageComponent)
    .component('catalogRecordKeywords', catalogRecordKeywordsComponent)
    .component('entityPublisher', entityPublisherComponent)
    .component('limitDescription', limitDescriptionComponent)
    .component('openRecordButton', openRecordButtonComponent)
    .component('manageRecordButton', manageRecordButtonComponent)
    .component('recordPermissionView', recordPermissionView)
    .component('recordCard', recordCardComponent)
    .component('recordFilters', recordFiltersComponent)
    .component('recordIcon', recordIconComponent)
    .component('recordMarkdown', recordMarkdownComponent)
    .component('recordsView', recordsViewComponent)
    .component('recordType', recordTypeComponent)
    .component('recordView', recordViewComponent)
    .component('recordViewTabset', recordViewTabsetComponent)
    .component('sortOptions', sortOptionsComponent);
