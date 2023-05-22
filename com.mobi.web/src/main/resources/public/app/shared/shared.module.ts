/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';
import { ShowdownModule } from 'ngx-showdown';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatMarkdownEditorModule } from 'mat-markdown-editor/dist';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { ActivityTitleComponent } from './components/activityTitle/activityTitle.component';
import { BlankNodeValueDisplayComponent } from './components/blankNodeValueDisplay/blankNodeValueDisplay.component';
import { BranchSelectComponent } from './components/branchSelect/branchSelect.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { DatasetSelectComponent } from './components/datasetSelect/datasetSelect.component';
import { CircleButtonStackComponent } from './components/circleButtonStack/circleButtonStack.component';
import { CommitChangesDisplayComponent } from './components/commitChangesDisplay/commitChangesDisplay.component';
import { CommitCompiledResourceComponent } from './components/commitCompiledResource/commitCompiledResource.component';
import { CommitDifferenceTabsetComponent } from './components/commitDifferenceTabset/commitDifferenceTabset.component';
import { CommitHistoryTableComponent } from './components/commitHistoryTable/commitHistoryTable.component';
import { CommitInfoOverlayComponent } from './components/commitInfoOverlay/commitInfoOverlay.component';
import { ConfirmModalComponent } from './components/confirmModal/confirmModal.component';
import { EditIriOverlayComponent } from './components/editIriOverlay/editIriOverlay.component';
import { ErrorDisplayComponent } from './components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from './components/fileInput/fileInput.component';
import { InfoMessageComponent } from './components/infoMessage/infoMessage.component';
import { InlineEditComponent } from './components/inlineEdit/inlineEdit.component';
import { IriSelectComponent } from './components/iriSelect/iriSelect.component';
import { KeywordSelectComponent } from './components/keywordSelect/keywordSelect.component';
import { LanguageSelectComponent } from './components/languageSelect/languageSelect.component';
import { LimitDescriptionComponent } from './components/limitDescription/limitDescription.component';
import { MarkdownEditorComponent } from './components/markdownEditor/markdownEditor.component';
import { ResolveConflictsBlock } from './components/resolveConflictsBlock/resolveConflictsBlock.component';
import { ResolveConflictsFormComponent } from './components/resolveConflictsForm/resolveConflictsForm.component';
import { SearchBarComponent } from './components/searchBar/searchBar.component';
import { SettingEditPageComponent } from './components/settingEditPage/settingEditPage.component';
import { SettingFormComponent } from './components/settingForm/settingForm.component';
import { SettingFormFieldComponent } from './components/settingFormField/settingFormField.component';
import { SettingGroupComponent } from './components/settingGroup/settingGroup.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SpinnerComponent } from './components/progress-spinner/components/spinner/spinner.component';
import { UnmaskPasswordComponent } from './components/unmaskPassword/unmaskPassword.component';
import { UserAccessControlsComponent } from './components/userAccessControls/userAccessControls.component';
import { ValueDisplayComponent } from './components/valueDisplay/valueDisplay.component';
import { WarningMessageComponent } from './components/warningMessage/warningMessage.component';

import { CopyClipboardDirective } from './directives/copyClipboard/copyClipboard.directive';
import { DragFileDirective } from './directives/dragFile/dragFile.directive';
import { FocusDirective } from './directives/focus/focus.directive';

import { CatalogManagerService } from './services/catalogManager.service';
import { CatalogStateService } from './services/catalogState.service';
import { D3TransformerService } from './services/d3Transformer.service';
import { DatasetManagerService } from './services/datasetManager.service';
import { DatasetStateService } from './services/datasetState.service';
import { DelimitedManagerService } from './services/delimitedManager.service';
import { DiscoverStateService } from './services/discoverState.service';
import { LoginManagerService } from './services/loginManager.service';
import { ManchesterConverterService } from './services/manchesterConverter.service';
import { MapperStateService } from './services/mapperState.service';
import { MappingManagerService } from './services/mappingManager.service';
import { MergeRequestManagerService } from './services/mergeRequestManager.service';
import { MergeRequestsStateService } from './services/mergeRequestsState.service';
import { OntologyManagerService } from './services/ontologyManager.service';
import { OntologyStateService } from './services/ontologyState.service';
import { PolicyEnforcementService } from './services/policyEnforcement.service';
import { PolicyManagerService } from './services/policyManager.service';
import { ProgressSpinnerService } from '../shared/components/progress-spinner/services/progressSpinner.service';
import { PropertyManagerService } from './services/propertyManager.service';
import { ProvManagerService } from './services/provManager.service';
import { RecordPermissionsManagerService } from './services/recordPermissionsManager.service';
import { RepositoryManagerService } from './services/repositoryManager.service';
import { SettingManagerService } from './services/settingManager.service';
import { ShapesGraphManagerService } from './services/shapesGraphManager.service';
import { ShapesGraphStateService } from './services/shapesGraphState.service';
import { SparqlManagerService } from './services/sparqlManager.service';
import { StateManagerService } from './services/stateManager.service';
import { UpdateRefsService } from './services/updateRefs.service';
import { UserManagerService } from './services/userManager.service';
import { UserStateService } from './services/userState.service';
import { UtilService } from './services/util.service';
import { WindowRef } from './services/windowRef.service';
import { YasguiService } from './services/yasgui.service';

import { BeautifyPipe } from './pipes/beautify.pipe';
import { CamelCasePipe } from './pipes/camelCase.pipe';
import { HighlightTextPipe } from './pipes/highlightText.pipe';
import { PrefixationPipe } from './pipes/prefixation.pipe';
import { ShowPropertiesPipe } from './pipes/showProperties.pipe';
import { SplitIRIPipe } from './pipes/splitIRI.pipe';
import { TrustedHtmlPipe } from './pipes/trustedHtml.pipe';

import { MobiErrorStateMatcher } from './MobiErrorStateMatcher';
import { HistoryGraph } from '../history-graph/history-graph.module';
import { ActivityListComponent } from './components/activity-list/activity-list.component';

/**
 * @namespace shared
 *
 * The `shared` module provides common components, directives, filters, and services that make up the Shared module in
 * the Mobi application.
 */
@NgModule({
    imports: [
        RouterModule,
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
        HistoryGraph
    ],
    declarations: [
        ActivityListComponent,
        ActivityTitleComponent,
        BlankNodeValueDisplayComponent,
        BranchSelectComponent,
        BreadcrumbsComponent,
        CommitCompiledResourceComponent,
        CommitHistoryTableComponent,
        CommitChangesDisplayComponent,
        CommitDifferenceTabsetComponent,
        CommitInfoOverlayComponent,
        ConfirmModalComponent,
        DatasetSelectComponent,
        EditIriOverlayComponent,
        ErrorDisplayComponent,
        FileInputComponent,
        InfoMessageComponent,
        InlineEditComponent,
        IriSelectComponent,
        KeywordSelectComponent,
        LanguageSelectComponent,
        LimitDescriptionComponent,
        MarkdownEditorComponent,
        ResolveConflictsBlock,
        ResolveConflictsFormComponent,
        SearchBarComponent,
        SettingEditPageComponent,
        SettingFormComponent,
        SettingFormFieldComponent,
        SettingGroupComponent,
        SidebarComponent,
        SpinnerComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        ValueDisplayComponent,
        WarningMessageComponent,
        BeautifyPipe,
        CamelCasePipe,
        CopyClipboardDirective,
        DragFileDirective,
        FocusDirective,
        HighlightTextPipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe,
        CircleButtonStackComponent,
        LanguageSelectComponent,
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
        ActivityListComponent,
        ActivityTitleComponent,
        BlankNodeValueDisplayComponent,
        BranchSelectComponent,
        BreadcrumbsComponent,
        CommitChangesDisplayComponent,
        CommitDifferenceTabsetComponent,
        CommitHistoryTableComponent,
        CommitInfoOverlayComponent,
        ConfirmModalComponent,
        DatasetSelectComponent,
        ErrorDisplayComponent,
        FileInputComponent,
        InfoMessageComponent,
        InlineEditComponent,
        IriSelectComponent,
        KeywordSelectComponent,
        LanguageSelectComponent,
        LimitDescriptionComponent,
        MarkdownEditorComponent,
        ResolveConflictsBlock,
        ResolveConflictsFormComponent,
        SearchBarComponent,
        SettingEditPageComponent,
        SidebarComponent,
        SpinnerComponent,
        UnmaskPasswordComponent,
        UserAccessControlsComponent,
        ValueDisplayComponent,
        WarningMessageComponent,
        BeautifyPipe,
        CamelCasePipe,
        HighlightTextPipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe,
        CopyClipboardDirective,
        DragFileDirective,
        FocusDirective,
        CircleButtonStackComponent,
        CommitCompiledResourceComponent
    ],
    providers: [
        CatalogManagerService,
        CatalogStateService,
        D3TransformerService,
        DatasetManagerService,
        DatasetStateService,
        DelimitedManagerService,
        DiscoverStateService,
        LoginManagerService,
        ManchesterConverterService,
        MapperStateService,
        MappingManagerService,
        MergeRequestManagerService,
        MergeRequestsStateService,
        OntologyManagerService,
        OntologyStateService,
        PolicyEnforcementService,
        PolicyManagerService,
        ProgressSpinnerService,
        PropertyManagerService,
        ProvManagerService,
        RecordPermissionsManagerService,
        RepositoryManagerService,
        SettingManagerService,
        ShapesGraphManagerService,
        ShapesGraphStateService,
        SparqlManagerService,
        StateManagerService,
        UpdateRefsService,
        UserManagerService,
        UserStateService,
        UtilService,
        WindowRef,
        YasguiService,
        BeautifyPipe,
        CamelCasePipe,
        PrefixationPipe,
        ShowPropertiesPipe,
        SplitIRIPipe,
        TrustedHtmlPipe,
        { provide: ErrorStateMatcher, useClass: MobiErrorStateMatcher }
    ]
})
export class SharedModule {}
