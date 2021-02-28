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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { downgradeComponent } from '@angular/upgrade/static';

import actionMenuComponent from './components/actionMenu/actionMenu.component';
import blockComponent from './components/block/block.component';
import blockContentComponent from './components/blockContent/blockContent.component';
import blockFooterComponent from './components/blockFooter/blockFooter.component';
import blockHeaderComponent from './components/blockHeader/blockHeader.component';
import blockSearchComponent from './components/blockSearch/blockSearch.component';
import branchSelectComponent from './components/branchSelect/branchSelect.component';
import breadcrumbsComponent from './components/breadcrumbs/breadcrumbs.component';
import checkboxComponent from './components/checkbox/checkbox.component';
import circleButtonStackComponent from './components/circleButtonStack/circleButtonStack.component';
import commitChangesDisplayComponent from './components/commitChangesDisplay/commitChangesDisplay.component';
import commitCompiledResourceComponent from './components/commitCompiledResource/commitCompiledResource.component';
import commitDifferenceTabsetComponent from './components/commitDifferenceTabset/commitDifferenceTabset.component';
import commitHistoryTableComponent from './components/commitHistoryTable/commitHistoryTable.component';
import commitInfoOverlayComponent from './components/commitInfoOverlay/commitInfoOverlay.component';
import confirmModalComponent from './components/confirmModal/confirmModal.component';
import customLabelComponent from './components/customLabel/customLabel.component';
import editIriOverlayComponent from './components/editIriOverlay/editIriOverlay.component';
import emailInputComponent from './components/emailInput/emailInput.component';
import entityDatesComponent from './components/entityDates/entityDates.component';
import entityDescriptionComponent from './components/entityDescription/entityDescription.component';
import fileInputComponent from './components/fileInput/fileInput.component';
import warningMessageComponent from './components/warningMessage/warningMessage.component';
import inlineEditComponent from './components/inlineEdit/inlineEdit.component';
import iriSelectComponent from './components/iriSelect/iriSelect.component';
import keywordSelectComponent from './components/keywordSelect/keywordSelect.component';
import languageSelectComponent from './components/languageSelect/languageSelect.component';
import markdownEditorComponent from './components/markdownEditor/markdownEditor.component';
import materialTabComponent from './components/materialTab/materialTab.component';
import materialTabsetComponent from './components/materialTabset/materialTabset.component';
import pagingComponent from './components/paging/paging.component';
import radioButtonComponent from './components/radioButton/radioButton.component';
import rdfVisualizationComponent from './components/rdfVisualization/rdfVisualization.component';
import recordKeywordsComponent from './components/recordKeywords/recordKeywords.component';
import resolveConflictsFormComponent from './components/resolveConflictsForm/resolveConflictsForm.component';
import searchBarComponent from './components/searchBar/searchBar.component';
import sidebarComponent from './components/sidebar/sidebar.component';
import spinnerComponent from './components/spinner/spinner.component';
import statementContainerComponent from './components/statementContainer/statementContainer.component';
import statementDisplayComponent from './components/statementDisplay/statementDisplay.component';
import stepProgressBarComponent from './components/stepProgressBar/stepProgressBar.component';
import textAreaComponent from './components/textArea/textArea.component';
import textInputComponent from './components/textInput/textInput.component';
import unmaskPasswordComponent from './components/unmaskPassword/unmaskPassword.component.ajs';
import userAccessControlsComponent from './components/userAccessControls/userAccessControls.component';
import valueDisplayComponent from './components/valueDisplay/valueDisplay.component';

import emailIri from './directives/emailIri/emailIri.directive';
import aDisabled from './directives/aDisabled/aDisabled.directive';
import buttonHoverText from './directives/buttonHoverText/buttonHoverText.directive';
import clickAnywhereButHere from './directives/clickAnywhereButHere/clickAnywhereButHere.directive';
import clickToCopy from './directives/clickToCopy/clickToCopy.directive';
import disableAnimate from './directives/disableAnimate/disableAnimate.directive';
import dragFile from './directives/dragFile/dragFile.directive';
import dragMe from './directives/dragMe/dragMe.directive';
import dropOnMe from './directives/dropOnMe/dropOnMe.directive';
import fileChange from './directives/fileChange/fileChange.directive';
import focusMe from './directives/focusMe/focusMe.directive';
import hideLabel from './directives/hideLabel/hideLabel.directive';
import targetedSpinner from './directives/targetedSpinner/targetedSpinner.directive';
import uniqueValue from './directives/uniqueValue/uniqueValue.directive';

import beautify from './filters/beautify.filter';
import branchesToDisplay from './filters/branchesToDisplay.filter';
import camelCase from './filters/camelCase.filter';
import escapeHTML from './filters/escapeHTML.filter';
import inArray from './filters/inArray.filter';
import prefixation from './filters/prefixation.filter';
import removeIriFromArray from './filters/removeIriFromArray.filter';
import showProperties from './filters/showProperties.filter';
import splitIRI from './filters/splitIRI.filter';
import trusted from './filters/trusted.filter';
import uniqueKey from './filters/uniqueKey.filter';

import catalogManagerService from './services/catalogManager.service';
import catalogStateService from './services/catalogState.service';
import clickAnywhereButHereService from './services/clickAnywhereButHere.service';
import d3TransformerService from './services/d3Transformer.service';
import datasetManagerService from './services/datasetManager.service';
import datasetStateService from './services/datasetState.service';
import delimitedManagerService from './services/delimitedManager.service';
import discoverStateService from './services/discoverState.service';
import httpService from './services/http.service';
import loginManagerService from './services/loginManager.service';
import manchesterConverterService from './services/manchesterConverter.service';
import mapperStateService from './services/mapperState.service';
import mappingManagerService from './services/mappingManager.service';
import mergeRequestManagerService from './services/mergeRequestManager.service';
import mergeRequestsStateService from './services/mergeRequestsState.service';
import modalService from './services/modal.service';
import ontologyManagerService from './services/ontologyManager.service';
import ontologyStateService from './services/ontologyState.service';
import policyEnforcementService from './services/policyEnforcement.service';
import policyManagerService from './services/policyManager.service';
import prefixes from './services/prefixes.service';
import propertyManagerService from './services/propertyManager.service';
import provManagerService from './services/provManager.service';
import recordPermissionsManagerService from './services/recordPermissionsManager.service';
import settingsManagerService from './services/settingsManager.service';
import sparqlManagerService from './services/sparqlManager.service';
import stateManagerService from './services/stateManager.service';
import updateRefsService from './services/updateRefs.service';
import userManagerService from './services/userManager.service';
import userStateService from './services/userState.service';
import utilService from './services/util.service';
import yasguiService from './services/yasgui.service';

// NgUpgrade
import {
    httpServiceProvider,
    loginManagerServiceProvider,
    prefixesProvider,
    provManagerServiceProvider,
    userManagerServiceProvider,
    utilServiceProvider,
    ontologyStateServiceProvider,
    discoverStateServiceProvider,
} from '../ajs.upgradedProviders';

import { ErrorDisplayComponent } from './components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from './components/infoMessage/infoMessage.component';
import { UnmaskPasswordComponent } from './components/unmaskPassword/unmaskPassword.component';
import { WindowRef } from "./services/windowRef.service";

/**
 * @namespace shared
 *
 * The `shared` module provides common components, directives, filters, and services that make up the Shared module in
 * the Mobi application.
 */
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent
    ],
    entryComponents: [
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent
    ],
    providers: [
        loginManagerServiceProvider,
        utilServiceProvider,
        provManagerServiceProvider,
        prefixesProvider,
        httpServiceProvider,
        userManagerServiceProvider,
        ontologyStateServiceProvider,
        discoverStateServiceProvider,
        WindowRef
    ]
})
export class SharedModule {}

angular.module('shared', [])
    .component('actionMenu', actionMenuComponent)
    .component('block', blockComponent)
    .component('blockContent', blockContentComponent)
    .component('blockFooter', blockFooterComponent)
    .component('blockHeader', blockHeaderComponent)
    .component('blockSearch', blockSearchComponent)
    .component('branchSelect', branchSelectComponent)
    .component('breadcrumbs', breadcrumbsComponent)
    .component('checkbox', checkboxComponent)
    .component('circleButtonStack', circleButtonStackComponent)
    .component('commitChangesDisplay', commitChangesDisplayComponent)
    .component('commitCompiledResource', commitCompiledResourceComponent)
    .component('commitDifferenceTabset', commitDifferenceTabsetComponent)
    .component('commitHistoryTable', commitHistoryTableComponent)
    .component('commitInfoOverlay', commitInfoOverlayComponent)
    .component('confirmModal', confirmModalComponent)
    .component('customLabel', customLabelComponent)
    .component('editIriOverlay', editIriOverlayComponent)
    .component('emailInput', emailInputComponent)
    .component('entityDates', entityDatesComponent)
    .component('entityDescription', entityDescriptionComponent)
    .component('fileInput', fileInputComponent)
    .component('warningMessage', warningMessageComponent)
    .component('inlineEdit', inlineEditComponent)
    .component('iriSelect', iriSelectComponent)
    .component('keywordSelect', keywordSelectComponent)
    .component('languageSelect', languageSelectComponent)
    .component('markdownEditor', markdownEditorComponent)
    .component('materialTab', materialTabComponent)
    .component('materialTabset', materialTabsetComponent)
    .component('paging', pagingComponent)
    .component('radioButton', radioButtonComponent)
    .component('rdfVisualization', rdfVisualizationComponent)
    .component('recordKeywords', recordKeywordsComponent)
    .component('resolveConflictsForm', resolveConflictsFormComponent)
    .component('searchBar', searchBarComponent)
    .component('sidebar', sidebarComponent)
    .component('spinner', spinnerComponent)
    .component('statementContainer', statementContainerComponent)
    .component('statementDisplay', statementDisplayComponent)
    .component('stepProgressBar', stepProgressBarComponent)
    .component('textArea', textAreaComponent)
    .component('textInput', textInputComponent)
    .component('unmaskPasswordAjs', unmaskPasswordComponent)
    .component('userAccessControls', userAccessControlsComponent)
    .component('valueDisplay', valueDisplayComponent)
    .directive('emailIri', emailIri)
    .directive('aDisabled', aDisabled)
    .directive('buttonHoverText', buttonHoverText)
    .directive('clickAnywhereButHere', clickAnywhereButHere)    
    .directive('clickToCopy', clickToCopy)
    .directive('disableAnimate', disableAnimate)
    .directive('dragFile', dragFile)
    .directive('dragMe', dragMe)
    .directive('dropOnMe', dropOnMe)
    .directive('fileChange', fileChange)
    .directive('focusMe', focusMe)
    .directive('hideLabel', hideLabel)
    .directive('targetedSpinner', targetedSpinner)
    .directive('uniqueValue', uniqueValue)
    .filter('beautify', beautify)
    .filter('branchesToDisplay', branchesToDisplay)
    .filter('camelCase', camelCase)
    .filter('escapeHTML', escapeHTML)
    .filter('inArray', inArray)
    .filter('prefixation', prefixation)
    .filter('removeIriFromArray', removeIriFromArray)
    .filter('showProperties', showProperties)
    .filter('splitIRI', splitIRI)
    .filter('trusted', trusted)
    .filter('uniqueKey', uniqueKey)
    .service('catalogManagerService', catalogManagerService)
    .service('catalogStateService', catalogStateService)
    .service('d3TransformerService', d3TransformerService)
    .service('datasetManagerService', datasetManagerService)
    .service('datasetStateService', datasetStateService)
    .service('delimitedManagerService', delimitedManagerService)
    .service('discoverStateService', discoverStateService)
    .service('httpService', httpService)
    .service('loginManagerService', loginManagerService)
    .service('manchesterConverterService', manchesterConverterService)
    .service('mapperStateService', mapperStateService)
    .service('mappingManagerService', mappingManagerService)
    .service('mergeRequestManagerService', mergeRequestManagerService)
    .service('mergeRequestsStateService', mergeRequestsStateService)
    .service('modalService', modalService)
    .service('ontologyManagerService', ontologyManagerService)
    .service('ontologyStateService', ontologyStateService)
    .service('policyEnforcementService', policyEnforcementService)
    .service('policyManagerService', policyManagerService)
    .service('prefixes', prefixes)
    .service('propertyManagerService', propertyManagerService)
    .service('provManagerService', provManagerService)
    .service('recordPermissionsManagerService', recordPermissionsManagerService)
    .service('settingsManagerService', settingsManagerService)
    .service('sparqlManagerService', sparqlManagerService)
    .service('stateManagerService', stateManagerService)
    .service('updateRefsService', updateRefsService)
    .service('userManagerService', userManagerService)
    .service('userStateService', userStateService)
    .service('utilService', utilService)
    .factory('clickAnywhereButHereService', clickAnywhereButHereService)
    .service('yasguiService',yasguiService)
    .directive('errorDisplay', downgradeComponent({component: ErrorDisplayComponent}) as angular.IDirectiveFactory)
    .directive('infoMessage', downgradeComponent({component: InfoMessageComponent}) as angular.IDirectiveFactory)
    .directive('unmaskPassword', downgradeComponent({component: UnmaskPasswordComponent}) as angular.IDirectiveFactory);
