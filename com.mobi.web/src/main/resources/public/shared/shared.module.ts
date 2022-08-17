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
    MatSelectModule, 
    MatExpansionModule,
    MatChipsModule,
    MatCardModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatDividerModule,
    MatListModule,
    MatStepperModule,
    MatGridListModule,
    MatRadioModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatSnackBarModule} from '@angular/material';

import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';
import { ShowdownModule } from 'ngx-showdown';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatMarkdownEditorModule } from 'mat-markdown-editor';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { UiScrollModule } from 'ngx-ui-scroll';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import actionMenuComponent from './components/actionMenu/actionMenu.component';
import blankNodeValueDisplayComponent from './components/blankNodeValueDisplay/blankNodeValueDisplay.component';
import blockComponent from './components/block/block.component';
import blockContentComponent from './components/blockContent/blockContent.component';
import blockFooterComponent from './components/blockFooter/blockFooter.component';
import blockHeaderComponent from './components/blockHeader/blockHeader.component';
import blockSearchComponent from './components/blockSearch/blockSearch.component';
import circleButtonStackComponent from './components/circleButtonStack/circleButtonStack.component';
import commitCompiledResourceComponent from './components/commitCompiledResource/commitCompiledResource.component';
import confirmModalComponent from './components/confirmModal/confirmModal.component.ajs';
import editIriOverlayComponentAjs from './components/editIriOverlay/editIriOverlay.component.ajs';
import emailInputComponent from './components/emailInput/emailInput.component';
import entityDatesComponent from './components/entityDates/entityDates.component';
import entityDescriptionComponent from './components/entityDescription/entityDescription.component';
import warningMessageComponent from './components/warningMessage/warningMessage.component';
import iriSelectComponent from './components/iriSelect/iriSelect.component';
import languageSelectComponent from './components/languageSelect/languageSelect.component';
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

import emailIri from './directives/emailIri/emailIri.directive';
import aDisabled from './directives/aDisabled/aDisabled.directive';
import buttonHoverText from './directives/buttonHoverText/buttonHoverText.directive';
import clickAnywhereButHere from './directives/clickAnywhereButHere/clickAnywhereButHere.directive';
import clickToCopy from './directives/clickToCopy/clickToCopy.directive';
import disableAnimate from './directives/disableAnimate/disableAnimate.directive';
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
import { CamelCasePipe } from './pipes/camelCase.pipe';

import clickAnywhereButHereService from './services/clickAnywhereButHere.service';
import d3TransformerService from './services/d3Transformer.service';
import httpService from './services/http.service';
import loginManagerService from './services/loginManager.service';
import manchesterConverterService from './services/manchesterConverter.service';
import modalService from './services/modal.service';
import policyEnforcementService from './services/policyEnforcement.service';
import settingManagerService from './services/settingManager.service';
import prefixes from './services/prefixes.service';
import propertyManagerService from './services/propertyManager.service';
import provManagerService from './services/provManager.service';
import recordPermissionsManagerService from './services/recordPermissionsManager.service';
import updateRefsService from './services/updateRefs.service';
import utilService from './services/util.service';


// NgUpgrade
import {
    httpServiceProvider,
    loginManagerServiceProvider,
    manchesterConverterServiceProvider,
    modalServiceProvider,
    policyManagerServiceProvider,
    policyEnforcementServiceProvider,
    recordPermissionsManagerServiceProvider,
    propertyManagerServiceProvider,
    provManagerServiceProvider,
    settingManagerServiceProvider,
    toastrProvider,
    utilServiceProvider,
    updateRefsServiceProvider,
} from '../ajs.upgradedProviders';

import { BranchSelectComponent } from './components/branchSelect/branchSelect.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { DatasetSelectComponent } from './components/datasetSelect/datasetSelect.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { CommitChangesDisplayComponent } from './components/commitChangesDisplay/commitChangesDisplay.component';
import { CommitDifferenceTabsetComponent } from './components/commitDifferenceTabset/commitDifferenceTabset.component';
import { CommitHistoryTableComponent } from './components/commitHistoryTable/commitHistoryTable.component';
import { CommitInfoOverlayComponent } from './components/commitInfoOverlay/commitInfoOverlay.component';
import { ConfirmModalComponent } from './components/confirmModal/confirmModal.component';
import { CustomLabelComponent } from './components/customLabel/customLabel.component';
import { editIriOverlayComponent } from './components/editIriOverlay/editIriOverlay.component';
import { ErrorDisplayComponent } from './components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from './components/fileInput/fileInput.component';
import { InfoMessageComponent } from './components/infoMessage/infoMessage.component';
import { InlineEditComponent } from './components/inlineEdit/inlineEdit.component';
import { KeywordSelectComponent } from './components/keywordSelect/keywordSelect.component';
import { LimitDescriptionComponent } from './components/limitDescription/limitDescription.component';
import { MarkdownEditorComponent } from './components/markdownEditor/markdownEditor.component';
import { ResolveConflictsBlock } from './components/resolveConflictsBlock/resolveConflictsBlock.component';
import { ResolveConflictsFormComponent } from './components/resolveConflictsForm/resolveConflictsForm.component';
import { SettingEditPageComponent } from './components/settingEditPage/settingEditPage.component';
import { SettingFormComponent } from './components/settingForm/settingForm.component';
import { SettingFormFieldComponent } from './components/settingFormField/settingFormField.component';
import { SettingGroupComponent } from './components/settingGroup/settingGroup.component';
import { SpinnerComponent } from './components/progress-spinner/components/spinner/spinner.component';
import { StatementDisplayComponent } from './components/statementDisplay/statementDisplay.component';
import { StatementContainerComponent } from './components/statementContainer/statementContainer.component';
import { UnmaskPasswordComponent } from './components/unmaskPassword/unmaskPassword.component';
import { UserAccessControlsComponent } from './components/userAccessControls/userAccessControls.component';
import { ValueDisplayComponent } from './components/valueDisplay/valueDisplay.component';

import { CopyClipboardDirective } from './directives/copyClipboard/copyClipboard.directive';
import { DragFileDirective } from './directives/dragFile/dragFile.directive';
import { FocusDirective } from './directives/focus/focus.directive';

import { CatalogManagerService } from './services/catalogManager.service';
import { CatalogStateService } from './services/catalogState.service';
import { DatasetManagerService } from './services/datasetManager.service';
import { DatasetStateService } from './services/datasetState.service';
import { DelimitedManagerService } from './services/delimitedManager.service';
import { DiscoverStateService } from './services/discoverState.service';
import { HelperService } from './services/helper.service';
import { MapperStateService } from './services/mapperState.service';
import { MappingManagerService } from './services/mappingManager.service';
import { MergeRequestManagerService } from './services/mergeRequestManager.service';
import { MergeRequestsStateService } from './services/mergeRequestsState.service';
import { OntologyManagerService } from './services/ontologyManager.service';
import { OntologyStateService } from './services/ontologyState.service';
import { OntologyVisualizationService } from '../ontology-visualization/services/ontologyVisualizaton.service';
import { PolicyManagerService } from './services/policyManager.service';
import { ProgressSpinnerService } from '../shared/components/progress-spinner/services/progressSpinner.service';
import { ShapesGraphManagerService } from './services/shapesGraphManager.service';
import { ShapesGraphStateService } from './services/shapesGraphState.service';
import { SparqlManagerService } from './services/sparqlManager.service';
import { StateManagerService } from './services/stateManager.service';
import { UserManagerService } from './services/userManager.service';
import { UserStateService } from './services/userState.service';
import { WindowRef } from './services/windowRef.service';
import { YasguiService } from './services/yasgui.service';

import { HighlightTextPipe } from './pipes/highlightText.pipe';
import { PrefixationPipe } from './pipes/prefixation.pipe';
import { ShowPropertiesPipe } from './pipes/showProperties.pipe';
import { SplitIRIPipe } from './pipes/splitIRI.pipe';
import { TrustedHtmlPipe } from './pipes/trustedHtml.pipe';

import { MobiErrorStateMatcher } from './MobiErrorStateMatcher';

/**
 * @namespace shared
 *
 * The `shared` module provides common components, directives, filters, and services that make up the Shared module in
 * the Mobi application.
 */
@NgModule({
    imports: [
        BrowserAnimationsModule,
        CdkTableModule,
        CodemirrorModule,
        CommonModule,
        FlexLayoutModule,
        FormsModule,
        HttpClientModule,
        MatMarkdownEditorModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatStepperModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        ReactiveFormsModule,
        ShowdownModule.forRoot({flavor: 'github'}),
        UiScrollModule
    ],
    declarations: [
        BranchSelectComponent,
        BreadcrumbsComponent,
        CheckboxComponent,
        CommitHistoryTableComponent,
        CommitChangesDisplayComponent,
        CommitDifferenceTabsetComponent,
        CommitInfoOverlayComponent,
        ConfirmModalComponent,
        CustomLabelComponent,
        DatasetSelectComponent,
        editIriOverlayComponent,
        ErrorDisplayComponent,
        FileInputComponent,
        InfoMessageComponent,
        InlineEditComponent,
        KeywordSelectComponent,
        LimitDescriptionComponent,
        MarkdownEditorComponent,
        ResolveConflictsBlock,
        ResolveConflictsFormComponent,
        SettingEditPageComponent,
        SettingFormComponent,
        SettingFormFieldComponent,
        SettingGroupComponent,
        SpinnerComponent,
        StatementContainerComponent,
        StatementDisplayComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        ValueDisplayComponent,
        CamelCasePipe,
        CopyClipboardDirective,
        DragFileDirective,
        FocusDirective,
        HighlightTextPipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe
    ],
    entryComponents: [
        BranchSelectComponent,
        CheckboxComponent,
        CommitChangesDisplayComponent,
        CommitDifferenceTabsetComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        ConfirmModalComponent,
        CustomLabelComponent,
        editIriOverlayComponent,
        ErrorDisplayComponent,
        FileInputComponent,
        InfoMessageComponent,
        ResolveConflictsBlock,
        ResolveConflictsFormComponent,
        SpinnerComponent,
        StatementDisplayComponent,
        StatementContainerComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        ValueDisplayComponent
    ],
    exports: [
        BrowserAnimationsModule,
        CdkTableModule,
        CodemirrorModule,
        CommonModule,
        FormsModule,
        HttpClientModule,
        MatMarkdownEditorModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatStepperModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        ReactiveFormsModule,
        ShowdownModule,
        UiScrollModule,
        BranchSelectComponent,
        BreadcrumbsComponent,
        CheckboxComponent,
        CommitChangesDisplayComponent,
        CommitDifferenceTabsetComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        ConfirmModalComponent,
        CustomLabelComponent,
        DatasetSelectComponent,
        ErrorDisplayComponent,
        FileInputComponent,
        InfoMessageComponent,
        InlineEditComponent,
        KeywordSelectComponent,
        LimitDescriptionComponent,
        MarkdownEditorComponent,
        ResolveConflictsBlock,
        ResolveConflictsFormComponent,
        SettingEditPageComponent,
        SpinnerComponent,
        StatementContainerComponent,
        StatementDisplayComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        ValueDisplayComponent,
        CamelCasePipe,
        HighlightTextPipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe,
        CopyClipboardDirective,
        DragFileDirective,
        FocusDirective
    ],
    providers: [
        httpServiceProvider,
        loginManagerServiceProvider,
        manchesterConverterServiceProvider,
        modalServiceProvider,
        policyEnforcementServiceProvider,
        propertyManagerServiceProvider,
        recordPermissionsManagerServiceProvider,
        policyEnforcementServiceProvider,
        policyManagerServiceProvider,
        propertyManagerServiceProvider,
        provManagerServiceProvider,
        settingManagerServiceProvider,
        toastrProvider,
        updateRefsServiceProvider,
        utilServiceProvider,
        CatalogManagerService,
        CatalogStateService,
        DatasetManagerService,
        DatasetStateService,
        DelimitedManagerService,
        DiscoverStateService,
        HelperService,
        MapperStateService,
        MappingManagerService,
        MergeRequestManagerService,
        MergeRequestsStateService,
        OntologyManagerService,
        OntologyStateService,
        OntologyVisualizationService,
        ProgressSpinnerService,
        PolicyManagerService,
        ShapesGraphManagerService,
        ShapesGraphStateService,
        SparqlManagerService,
        StateManagerService,
        UserManagerService,
        UserStateService,
        WindowRef,
        YasguiService,
        CamelCasePipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe,
        { provide: ErrorStateMatcher, useClass: MobiErrorStateMatcher }
    ]
})
export class SharedModule {}

angular.module('shared', [])
    .component('actionMenu', actionMenuComponent)
    .component('blankNodeValueDisplay', blankNodeValueDisplayComponent)
    .component('block', blockComponent)
    .component('blockContent', blockContentComponent)
    .component('blockFooter', blockFooterComponent)
    .component('blockHeader', blockHeaderComponent)
    .component('blockSearch', blockSearchComponent)
    .component('circleButtonStack', circleButtonStackComponent)
    .component('commitCompiledResource', commitCompiledResourceComponent)
    .component('confirmModalAjs', confirmModalComponent)
    .component('editIriOverlayAjs', editIriOverlayComponentAjs)
    .component('emailInput', emailInputComponent)
    .component('entityDates', entityDatesComponent)
    .component('entityDescription', entityDescriptionComponent)
    .component('warningMessage', warningMessageComponent)
    .component('iriSelect', iriSelectComponent)
    .component('languageSelect', languageSelectComponent)
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
    .directive('emailIri', emailIri)
    .directive('aDisabled', aDisabled)
    .directive('buttonHoverText', buttonHoverText)
    .directive('clickAnywhereButHere', clickAnywhereButHere)    
    .directive('clickToCopy', clickToCopy)
    .directive('disableAnimate', disableAnimate)
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
    .service('d3TransformerService', d3TransformerService)
    .service('httpService', httpService)
    .service('loginManagerService', loginManagerService)
    .service('manchesterConverterService', manchesterConverterService)
    .service('modalService', modalService)
    .service('policyEnforcementService', policyEnforcementService)
    .service('settingManagerService', settingManagerService)
    .service('prefixes', prefixes)
    .service('propertyManagerService', propertyManagerService)
    .service('provManagerService', provManagerService)
    .service('recordPermissionsManagerService', recordPermissionsManagerService)
    .service('updateRefsService', updateRefsService)
    .service('utilService', utilService)
    .factory('clickAnywhereButHereService', clickAnywhereButHereService)
    .factory('catalogManagerService', downgradeInjectable(CatalogManagerService))
    .factory('catalogStateService', downgradeInjectable(CatalogStateService))
    .factory('datasetManagerService', downgradeInjectable(DatasetManagerService))
    .factory('datasetStateService', downgradeInjectable(DatasetStateService))
    .factory('delimitedManagerService', downgradeInjectable(DelimitedManagerService))
    .factory('discoverStateService', downgradeInjectable(DiscoverStateService))
    .factory('mapperStateService', downgradeInjectable(MapperStateService))
    .factory('mappingManagerService', downgradeInjectable(MappingManagerService))
    .factory('mergeRequestManagerService', downgradeInjectable(MergeRequestManagerService))
    .factory('mergeRequestsStateService', downgradeInjectable(MergeRequestsStateService))
    .factory('ontologyManagerService', downgradeInjectable(OntologyManagerService))
    .factory('ontologyStateService', downgradeInjectable(OntologyStateService))
    .factory('ontologyVisualizationService', downgradeInjectable(OntologyVisualizationService))
    .factory('policyManagerService', downgradeInjectable(PolicyManagerService))
    .factory('progressSpinnerService', downgradeInjectable(ProgressSpinnerService)) 
    .factory('shapesGraphManagerService', downgradeInjectable(ShapesGraphManagerService))
    .factory('shapesGraphStateService', downgradeInjectable(ShapesGraphStateService))
    .factory('sparqlManagerService', downgradeInjectable(SparqlManagerService))
    .factory('stateManagerService', downgradeInjectable(StateManagerService))
    .factory('userManagerService', downgradeInjectable(UserManagerService))
    .factory('userStateService', downgradeInjectable(UserStateService))
    .factory('yasguiService', downgradeInjectable(YasguiService))
    .directive('branchSelect', downgradeComponent({component: BranchSelectComponent}) as angular.IDirectiveFactory)
    .directive('breadcrumbs', downgradeComponent({component: BreadcrumbsComponent}) as angular.IDirectiveFactory)
    .directive('checkbox', downgradeComponent({component: CheckboxComponent}) as angular.IDirectiveFactory)
    .directive('commitChangesDisplay', downgradeComponent({component: CommitChangesDisplayComponent}) as angular.IDirectiveFactory)
    .directive('commitDifferenceTabset', downgradeComponent({component: CommitDifferenceTabsetComponent}) as angular.IDirectiveFactory)
    .directive('commitHistoryTable', downgradeComponent({component: CommitHistoryTableComponent}) as angular.IDirectiveFactory)
    .directive('commitInfoOverlay', downgradeComponent({component: CommitInfoOverlayComponent}) as angular.IDirectiveFactory)
    .directive('confirmModal', downgradeComponent({component: ConfirmModalComponent}) as angular.IDirectiveFactory)
    .directive('customLabel', downgradeComponent({component: CustomLabelComponent}) as angular.IDirectiveFactory)
    .directive('datasetSelect', downgradeComponent({component: DatasetSelectComponent}) as angular.IDirectiveFactory)
    .directive('errorDisplay', downgradeComponent({component: ErrorDisplayComponent}) as angular.IDirectiveFactory)
    .directive('fileInput', downgradeComponent({component: FileInputComponent}) as angular.IDirectiveFactory)
    .directive('infoMessage', downgradeComponent({component: InfoMessageComponent}) as angular.IDirectiveFactory)
    .directive('inlineEdit', downgradeComponent({component: InlineEditComponent}) as angular.IDirectiveFactory)
    .directive('keywordSelect', downgradeComponent({component: KeywordSelectComponent}) as angular.IDirectiveFactory)
    .directive('limitDescription', downgradeComponent({component: LimitDescriptionComponent}) as angular.IDirectiveFactory)
    .directive('markdownEditor', downgradeComponent({component: MarkdownEditorComponent}) as angular.IDirectiveFactory)
    .directive('progressSpinner', downgradeComponent({component: SpinnerComponent}) as angular.IDirectiveFactory)
    .directive('resolveConflictsBlock', downgradeComponent({component: ResolveConflictsBlock}) as angular.IDirectiveFactory)
    .directive('resolveConflictsForm', downgradeComponent({component: ResolveConflictsFormComponent}) as angular.IDirectiveFactory)
    .directive('settingEditPage', downgradeComponent({component: SettingEditPageComponent}) as angular.IDirectiveFactory)
    .directive('settingForm', downgradeComponent({component: SettingFormComponent}) as angular.IDirectiveFactory)
    .directive('settingFormField', downgradeComponent({component: SettingFormFieldComponent}) as angular.IDirectiveFactory)
    .directive('settingGroup', downgradeComponent({component: SettingGroupComponent}) as angular.IDirectiveFactory)
    .directive('statementContainer', downgradeComponent({component: StatementContainerComponent}) as angular.IDirectiveFactory)
    .directive('statementDisplay', downgradeComponent({component: StatementDisplayComponent}) as angular.IDirectiveFactory)
    .directive('unmaskPassword', downgradeComponent({component: UnmaskPasswordComponent}) as angular.IDirectiveFactory)
    .directive('userAccessControls', downgradeComponent({component: UserAccessControlsComponent}) as angular.IDirectiveFactory)
    .directive('valueDisplay', downgradeComponent({component: ValueDisplayComponent}) as angular.IDirectiveFactory)
    .directive('dragFile', downgradeComponent({component: DragFileDirective}) as angular.IDirectiveFactory)
    .directive('copyClipboard', downgradeComponent({component: CopyClipboardDirective}) as angular.IDirectiveFactory)
    .directive('editIriOverlay', downgradeComponent({component: editIriOverlayComponent}) as angular.IDirectiveFactory);
