/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { CdkTableModule } from '@angular/cdk/table';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { ErrorStateMatcher } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShowdownModule } from 'ngx-showdown';
import { MatMarkdownEditorModule } from 'mat-markdown-editor/dist';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

import { HistoryGraph } from '../history-graph/history-graph.module';
import { SHACLFormsModule } from '../shacl-forms/shacl-forms.module';

import { ActivityListComponent } from './components/activity-list/activity-list.component';
import { ActivityTitleComponent } from './components/activityTitle/activityTitle.component';
import { AdvancedLanguageSelectComponent } from './components/advancedLanguageSelect/advancedLanguageSelect.component';
import { BlankNodeValueDisplayComponent } from './components/blankNodeValueDisplay/blankNodeValueDisplay.component';
import { BranchSelectComponent } from './components/branchSelect/branchSelect.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { CircleButtonStackComponent } from './components/circleButtonStack/circleButtonStack.component';
import { CommitChangesDisplayComponent } from './components/commitChangesDisplay/commitChangesDisplay.component';
import { CommitCompiledResourceComponent } from './components/commitCompiledResource/commitCompiledResource.component';
import { CommitDifferenceTabsetComponent } from './components/commitDifferenceTabset/commitDifferenceTabset.component';
import { CommitHistoryTableComponent } from './components/commitHistoryTable/commitHistoryTable.component';
import { CommitInfoOverlayComponent } from './components/commitInfoOverlay/commitInfoOverlay.component';
import { ConfirmModalComponent } from './components/confirmModal/confirmModal.component';
import { DatasetSelectComponent } from './components/datasetSelect/datasetSelect.component';
import { DownloadQueryOverlayComponent } from './components/downloadQueryOverlay/downloadQueryOverlay.component';
import { EditIriOverlayComponent } from './components/editIriOverlay/editIriOverlay.component';
import { ErrorDisplayComponent } from './components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from './components/fileInput/fileInput.component';
import { FiltersSelectedListComponent } from './components/filters-selected-list/filters-selected-list.component';
import { ImportsBlockComponent } from './components/importsBlock/importsBlock.component';
import { ImportsOverlayComponent } from './components/importsOverlay/importsOverlay.component';
import { InfoMessageComponent } from './components/infoMessage/infoMessage.component';
import { InlineEditComponent } from './components/inlineEdit/inlineEdit.component';
import { IriSelectComponent } from './components/iriSelect/iriSelect.component';
import { KeywordSelectComponent } from './components/keywordSelect/keywordSelect.component';
import { LanguageSelectComponent } from './components/languageSelect/languageSelect.component';
import { LimitDescriptionComponent } from './components/limitDescription/limitDescription.component';
import { ListFiltersComponent } from './components/list-filters/list-filters.component';
import { MarkdownEditorComponent } from './components/markdownEditor/markdownEditor.component';
import { PropertiesBlockComponent } from './components/propertiesBlock/propertiesBlock.component';
import { PropertyOverlayComponent } from './components/propertyOverlay/propertyOverlay.component';
import { PropertyValuesComponent } from './components/propertyValues/propertyValues.component';
import { RecordIconComponent } from './components/recordIcon/recordIcon.component';
import { ResolveConflictsBlock } from './components/resolveConflictsBlock/resolveConflictsBlock.component';
import { ResolveConflictsFormComponent } from './components/resolveConflictsForm/resolveConflictsForm.component';
import { SearchBarComponent } from './components/searchBar/searchBar.component';
import { SelectedDetailsComponent } from './components/selectedDetails/selectedDetails.component';
import { SerializationSelectComponent } from './components/serializationSelect/serializationSelect.component';
import { SettingEditPageComponent } from './components/settingEditPage/settingEditPage.component';
import { SettingGroupComponent } from './components/settingGroup/settingGroup.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SpinnerComponent } from './components/progress-spinner/components/spinner/spinner.component';
import { StaticIriComponent } from '../shared/components/staticIri/staticIri.component';
import { UnmaskPasswordComponent } from './components/unmaskPassword/unmaskPassword.component';
import { UserAccessControlsComponent } from './components/userAccessControls/userAccessControls.component';
import { ValueDisplayComponent } from './components/valueDisplay/valueDisplay.component';
import { WarningMessageComponent } from './components/warningMessage/warningMessage.component';

import { CatalogManagerService } from './services/catalogManager.service';
import { CatalogStateService } from './services/catalogState.service';
import { CopyClipboardDirective } from './directives/copyClipboard/copyClipboard.directive';
import { D3TransformerService } from './services/d3Transformer.service';
import { DatasetManagerService } from './services/datasetManager.service';
import { DatasetStateService } from './services/datasetState.service';
import { DelimitedManagerService } from './services/delimitedManager.service';
import { DiscoverStateService } from './services/discoverState.service';
import { DragFileDirective } from './directives/dragFile/dragFile.directive';
import { FocusDirective } from './directives/focus/focus.directive';

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
import { ToastService } from './services/toast.service';
import { UpdateRefsService } from './services/updateRefs.service';
import { UserManagerService } from './services/userManager.service';
import { UserStateService } from './services/userState.service';
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
    MatBadgeModule,
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
    MatSliderModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    ShowdownModule.forRoot({flavor: 'github'}),
    HistoryGraph,
    SHACLFormsModule
  ],
  declarations: [
    ActivityListComponent,
    ActivityTitleComponent,
    AdvancedLanguageSelectComponent,
    BeautifyPipe,
    BlankNodeValueDisplayComponent,
    BranchSelectComponent,
    BreadcrumbsComponent,
    CamelCasePipe,
    CircleButtonStackComponent,
    CommitChangesDisplayComponent,
    CommitCompiledResourceComponent,
    CommitDifferenceTabsetComponent,
    CommitHistoryTableComponent,
    CommitInfoOverlayComponent,
    ConfirmModalComponent,
    CopyClipboardDirective,
    DatasetSelectComponent,
    DownloadQueryOverlayComponent,
    DragFileDirective,
    EditIriOverlayComponent,
    ErrorDisplayComponent,
    FileInputComponent,
    FiltersSelectedListComponent,
    FocusDirective,
    HighlightTextPipe,
    ImportsBlockComponent,
    ImportsOverlayComponent,
    InfoMessageComponent,
    InlineEditComponent,
    IriSelectComponent,
    KeywordSelectComponent,
    LanguageSelectComponent,
    LimitDescriptionComponent,
    ListFiltersComponent,
    MarkdownEditorComponent,
    PrefixationPipe,
    PropertiesBlockComponent,
    PropertyOverlayComponent,
    PropertyValuesComponent,
    RecordIconComponent,
    ResolveConflictsBlock,
    ResolveConflictsFormComponent,
    SearchBarComponent,
    SelectedDetailsComponent,
    SerializationSelectComponent,
    SettingEditPageComponent,
    SettingGroupComponent,
    ShowPropertiesPipe,
    SidebarComponent,
    SpinnerComponent,
    SplitIRIPipe,
    StaticIriComponent,
    TrustedHtmlPipe,
    UnmaskPasswordComponent,
    UserAccessControlsComponent,
    ValueDisplayComponent,
    WarningMessageComponent
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
    MatBadgeModule,
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
    MatSliderModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    ShowdownModule,
    SHACLFormsModule,
    ActivityListComponent,
    ActivityTitleComponent,
    AdvancedLanguageSelectComponent,
    BeautifyPipe,
    BlankNodeValueDisplayComponent,
    BranchSelectComponent,
    BreadcrumbsComponent,
    CamelCasePipe,
    CircleButtonStackComponent,
    CommitChangesDisplayComponent,
    CommitCompiledResourceComponent,
    CommitDifferenceTabsetComponent,
    CommitHistoryTableComponent,
    CommitInfoOverlayComponent,
    ConfirmModalComponent,
    CopyClipboardDirective,
    DatasetSelectComponent,
    DragFileDirective,
    ErrorDisplayComponent,
    FileInputComponent,
    FiltersSelectedListComponent,
    FocusDirective,
    HighlightTextPipe,
    ImportsBlockComponent,
    ImportsOverlayComponent,
    InfoMessageComponent,
    InlineEditComponent,
    IriSelectComponent,
    KeywordSelectComponent,
    LanguageSelectComponent,
    LimitDescriptionComponent,
    ListFiltersComponent,
    MarkdownEditorComponent,
    PrefixationPipe,
    PropertiesBlockComponent,
    PropertyOverlayComponent,
    PropertyValuesComponent,
    RecordIconComponent,
    ResolveConflictsBlock,
    ResolveConflictsFormComponent,
    SearchBarComponent,
    SelectedDetailsComponent,
    SerializationSelectComponent,
    SettingEditPageComponent,
    ShowPropertiesPipe,
    SidebarComponent,
    SpinnerComponent,
    SplitIRIPipe,
    StaticIriComponent,
    TrustedHtmlPipe,
    UnmaskPasswordComponent,
    UserAccessControlsComponent,
    ValueDisplayComponent,
    WarningMessageComponent
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
    ToastService,
    UpdateRefsService,
    UserManagerService,
    UserStateService,
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