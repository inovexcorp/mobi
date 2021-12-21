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
import { downgradeComponent, downgradeInjectable } from '@angular/upgrade/static';
import {
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ErrorStateMatcher,
    MatIconModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatTabsModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule } from '@angular/material';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';

import actionMenuComponent from './components/actionMenu/actionMenu.component';
import blockComponent from './components/block/block.component';
import blockContentComponent from './components/blockContent/blockContent.component';
import blockFooterComponent from './components/blockFooter/blockFooter.component';
import blockHeaderComponent from './components/blockHeader/blockHeader.component';
import blockSearchComponent from './components/blockSearch/blockSearch.component';
import breadcrumbsComponent from './components/breadcrumbs/breadcrumbs.component';
import circleButtonStackComponent from './components/circleButtonStack/circleButtonStack.component';
import commitCompiledResourceComponent from './components/commitCompiledResource/commitCompiledResource.component';
import confirmModalComponent from './components/confirmModal/confirmModal.component.ajs';
import editIriOverlayComponent from './components/editIriOverlay/editIriOverlay.component';
import emailInputComponent from './components/emailInput/emailInput.component';
import entityDatesComponent from './components/entityDates/entityDates.component';
import entityDescriptionComponent from './components/entityDescription/entityDescription.component';
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
import searchBarComponent from './components/searchBar/searchBar.component';
import sidebarComponent from './components/sidebar/sidebar.component';
import stepProgressBarComponent from './components/stepProgressBar/stepProgressBar.component';
import textAreaComponent from './components/textArea/textArea.component';
import textInputComponent from './components/textInput/textInput.component';
import unmaskPasswordComponent from './components/unmaskPassword/unmaskPassword.component.ajs';
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
import settingManagerService from './services/settingManager.service';
import prefixes from './services/prefixes.service';
import propertyManagerService from './services/propertyManager.service';
import provManagerService from './services/provManager.service';
import recordPermissionsManagerService from './services/recordPermissionsManager.service';
import sparqlManagerService from './services/sparqlManager.service';
import stateManagerService from './services/stateManager.service';
import updateRefsService from './services/updateRefs.service';
import utilService from './services/util.service';
import yasguiService from './services/yasgui.service';
import { OntologyVisualizationService } from '../ontology-visualization/services/ontologyVisualizaton.service';

// NgUpgrade
import {
    httpServiceProvider,
    loginManagerServiceProvider,
    prefixesProvider,
    settingManagerServiceProvider,
    provManagerServiceProvider,
    utilServiceProvider,
    modalServiceProvider,
    ontologyStateServiceProvider,
    discoverStateServiceProvider,
    ontologyManagerServiceProvider,
    catalogManagerServiceProvider,
    stateManagerServiceProvider, toastrProvider
} from '../ajs.upgradedProviders';

import { ConfirmModalComponent } from './components/confirmModal/confirmModal.component';
import { ErrorDisplayComponent } from './components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from './components/infoMessage/infoMessage.component';
import { UnmaskPasswordComponent } from './components/unmaskPassword/unmaskPassword.component';
import { UserAccessControlsComponent } from './components/userAccessControls/userAccessControls.component';

import { HelperService } from './services/helper.service';
import { PolicyManagerService } from './services/policyManager.service';
import { UserManagerService } from './services/userManager.service';
import { UserStateService } from './services/userState.service';
import { ShapesGraphManagerService } from './services/shapesGraphManager.service';
import { ShapesGraphStateService } from './services/shapesGraphState.service';
import { WindowRef } from './services/windowRef.service';
import { HighlightTextPipe } from './pipes/highlightText.pipe';
import { MobiErrorStateMatcher } from './MobiErrorStateMatcher';
import { SpinnerComponent } from './components/progress-spinner/spinner.component';
import { TrustedHtmlPipe } from './pipes/trustedHtml.pipe';
import { FileInputComponent } from './components/fileInput/fileInput.component';
import { CustomLabelComponent } from './components/customLabel/customLabel.component';
import { StatementDisplayComponent } from './components/statementDisplay/statementDisplay.component';
import { StatementContainerComponent } from './components/statementContainer/statementContainer.component';
import { CommitHistoryTableComponent } from './components/commitHistoryTable/commitHistoryTable.component';
import { CommitInfoOverlayComponent } from './components/commitInfoOverlay/commitInfoOverlay.component';
import { CommitChangesDisplayComponent } from './components/commitChangesDisplay/commitChangesDisplay.component';
import { ResolveConflictsFormComponent } from './components/resolveConflictsForm/resolveConflictsForm.component';
import { CommitDifferenceTabsetComponent } from './components/commitDifferenceTabset/commitDifferenceTabset.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { BranchSelectComponent } from './components/branchSelect/branchSelect.component';
import { ResolveConflictsBlock } from './components/resolveConflictsBlock/resolveConflictsBlock.component';
import { PrefixationPipe } from './pipes/prefixation.pipe';
import { SplitIRIPipe } from './pipes/splitIRI.pipe';
import { CopyClipboardDirective } from './directives/copyClipboard/copyClipboard.directive';

import { SettingEditPageComponent } from './components/settingEditPage/settingEditPage.component';
import { SettingGroupComponent } from './components/settingGroup/settingGroup.component';
import { SettingFormComponent } from './components/settingForm/settingForm.component';
import { SettingFormFieldComponent } from './components/settingFormField/settingFormField.component';

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
        ReactiveFormsModule,
        HttpClientModule,
        CdkTableModule,
        MatAutocompleteModule,
        MatMenuModule,
        MatDialogModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        MatTableModule,
        MatTooltipModule,
        MatSelectModule,
        MatCheckboxModule
    ],
    declarations: [
        ConfirmModalComponent,
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        SpinnerComponent,
        HighlightTextPipe,
        TrustedHtmlPipe,
        PrefixationPipe,
        SplitIRIPipe,
        FileInputComponent,
        CustomLabelComponent,
        SettingEditPageComponent,
        SettingGroupComponent,
        SettingFormComponent,
        SettingFormFieldComponent,
        StatementDisplayComponent,
        StatementContainerComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        CommitChangesDisplayComponent,
        ResolveConflictsFormComponent,
        CommitDifferenceTabsetComponent,
        CheckboxComponent,
        BranchSelectComponent,
        ResolveConflictsBlock,
        CopyClipboardDirective
    ],
    entryComponents: [
        ConfirmModalComponent,
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent,
        SpinnerComponent,
        UserAccessControlsComponent,
        FileInputComponent,
        CustomLabelComponent,
        StatementDisplayComponent,
        StatementContainerComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        CommitChangesDisplayComponent,
        ResolveConflictsFormComponent,
        CommitDifferenceTabsetComponent,
        CheckboxComponent,
        BranchSelectComponent,
        ResolveConflictsBlock
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        CdkTableModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        ConfirmModalComponent,
        ErrorDisplayComponent,
        InfoMessageComponent,
        UnmaskPasswordComponent,
        SpinnerComponent,
        UserAccessControlsComponent,
        HighlightTextPipe,
        TrustedHtmlPipe,
        PrefixationPipe,
        SplitIRIPipe,
        FileInputComponent,
        CustomLabelComponent,
        SettingEditPageComponent,
        StatementDisplayComponent,
        StatementContainerComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        CommitChangesDisplayComponent,
        ResolveConflictsFormComponent,
        CommitDifferenceTabsetComponent,
        CheckboxComponent,
        BranchSelectComponent,
        ResolveConflictsBlock,
        CopyClipboardDirective
    ],
    providers: [
        loginManagerServiceProvider,
        utilServiceProvider,
        settingManagerServiceProvider,
        provManagerServiceProvider,
        prefixesProvider,
        httpServiceProvider,
        modalServiceProvider,
        ontologyStateServiceProvider,
        discoverStateServiceProvider,
        catalogManagerServiceProvider,
        ontologyManagerServiceProvider,
        stateManagerServiceProvider,
        toastrProvider,
        HelperService,
        PolicyManagerService,
        UserManagerService,
        UserStateService,
        ShapesGraphManagerService,
        ShapesGraphStateService,
        WindowRef,
        OntologyVisualizationService,
        { provide: ErrorStateMatcher, useClass: MobiErrorStateMatcher },
        PrefixationPipe,
        SplitIRIPipe
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
    .component('breadcrumbs', breadcrumbsComponent)
    .component('circleButtonStack', circleButtonStackComponent)
    .component('commitCompiledResource', commitCompiledResourceComponent)
    .component('confirmModalAjs', confirmModalComponent)
    .component('editIriOverlay', editIriOverlayComponent)
    .component('emailInput', emailInputComponent)
    .component('entityDates', entityDatesComponent)
    .component('entityDescription', entityDescriptionComponent)
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
    .component('searchBar', searchBarComponent)
    .component('sidebar', sidebarComponent)
    .component('stepProgressBar', stepProgressBarComponent)
    .component('textArea', textAreaComponent)
    .component('textInput', textInputComponent)
    .component('unmaskPasswordAjs', unmaskPasswordComponent)
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
    .service('settingManagerService', settingManagerService)
    .service('prefixes', prefixes)
    .service('propertyManagerService', propertyManagerService)
    .service('provManagerService', provManagerService)
    .service('recordPermissionsManagerService', recordPermissionsManagerService)
    .service('sparqlManagerService', sparqlManagerService)
    .service('stateManagerService', stateManagerService)
    .service('updateRefsService', updateRefsService)
    .service('utilService', utilService)
    .factory('clickAnywhereButHereService', clickAnywhereButHereService)
    .service('yasguiService', yasguiService)
    .factory('policyManagerService', downgradeInjectable(PolicyManagerService))
    .factory('userManagerService', downgradeInjectable(UserManagerService))
    .factory('userStateService', downgradeInjectable(UserStateService))
    .factory('shapesGraphManagerService', downgradeInjectable(ShapesGraphManagerService))
    .factory('shapesGraphStateService', downgradeInjectable(ShapesGraphStateService))
    .directive('confirmModal', downgradeComponent({component: ConfirmModalComponent}) as angular.IDirectiveFactory)
    .directive('errorDisplay', downgradeComponent({component: ErrorDisplayComponent}) as angular.IDirectiveFactory)
    .directive('infoMessage', downgradeComponent({component: InfoMessageComponent}) as angular.IDirectiveFactory)
    .directive('unmaskPassword', downgradeComponent({component: UnmaskPasswordComponent}) as angular.IDirectiveFactory)
    .directive('progressSpinner', downgradeComponent({component: SpinnerComponent}) as angular.IDirectiveFactory)
    .directive('userAccessControls', downgradeComponent({component: UserAccessControlsComponent}) as angular.IDirectiveFactory)
    .directive('fileInput', downgradeComponent({component: FileInputComponent}) as angular.IDirectiveFactory)
    .directive('customLabel', downgradeComponent({component: CustomLabelComponent}) as angular.IDirectiveFactory)
    .directive('settingEditPage', downgradeComponent({component: SettingEditPageComponent}) as angular.IDirectiveFactory)
    .directive('settingGroup', downgradeComponent({component: SettingGroupComponent}) as angular.IDirectiveFactory)
    .directive('settingForm', downgradeComponent({component: SettingFormComponent}) as angular.IDirectiveFactory)
    .directive('settingFormField', downgradeComponent({component: SettingFormFieldComponent}) as angular.IDirectiveFactory)
    .directive('statementDisplay', downgradeComponent({component: StatementDisplayComponent}) as angular.IDirectiveFactory)
    .directive('statementContainer', downgradeComponent({component: StatementContainerComponent}) as angular.IDirectiveFactory)
    .directive('commitHistoryTable', downgradeComponent({component: CommitHistoryTableComponent}) as angular.IDirectiveFactory)
    .directive('commitInfoOverlay', downgradeComponent({component: CommitInfoOverlayComponent}) as angular.IDirectiveFactory)
    .directive('commitChangesDisplay', downgradeComponent({component: CommitChangesDisplayComponent}) as angular.IDirectiveFactory)
    .directive('resolveConflictsForm', downgradeComponent({component: ResolveConflictsFormComponent}) as angular.IDirectiveFactory)
    .directive('commitDifferenceTabset', downgradeComponent({component: CommitDifferenceTabsetComponent}) as angular.IDirectiveFactory)
    .directive('checkbox', downgradeComponent({component: CheckboxComponent}) as angular.IDirectiveFactory)
    .directive('branchSelect', downgradeComponent({component: BranchSelectComponent}) as angular.IDirectiveFactory)
    .directive('resolveConflictsBlock', downgradeComponent({component: ResolveConflictsBlock}) as angular.IDirectiveFactory)
    .directive('copyClipboard', downgradeComponent({component: CopyClipboardDirective}) as angular.IDirectiveFactory);