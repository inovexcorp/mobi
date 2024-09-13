/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { SharedModule } from '../shared/shared.module';

import { BranchListComponent } from './components/branchList/branchList.component';
import { CatalogPageComponent } from './components/catalogPage/catalogPage.component';
import { CatalogRecordKeywordsComponent } from './components/catalogRecordKeywords/catalogRecordKeywords.component';
import { EntityPublisherComponent } from './components/entityPublisher/entityPublisher.component';
import { OpenRecordButtonComponent } from './components/openRecordButton/openRecordButton.component';
import { ManageRecordButtonComponent } from './components/manageRecordButton/manageRecordButton.component';
import { RecordPermissionViewComponent } from './components/recordPermissionView/recordPermissionView.component';
import { RecordCardComponent } from './components/recordCard/recordCard.component';
import { RecordFiltersComponent } from './components/recordFilters/recordFilters.component';
import { RecordMarkdownComponent } from './components/recordMarkdown/recordMarkdown.component';
import { RecordsViewComponent } from './components/recordsView/recordsView.component';
import { RecordViewComponent } from './components/recordView/recordView.component';
import { RecordViewTabsetComponent } from './components/recordViewTabset/recordViewTabset.component';
import { RecordTypeComponent } from './components/recordType/recordType.component';
import { ClipboardModule } from '@angular/cdk/clipboard';

/**
 * @namespace catalog
 *
 * The `catalog` module provides components that make up the Catalog module in the Mobi application.
 */
@NgModule({
    imports: [
        SharedModule,
        ClipboardModule
    ],
    declarations: [
        BranchListComponent,
        CatalogPageComponent,
        CatalogRecordKeywordsComponent,
        EntityPublisherComponent,
        OpenRecordButtonComponent,
        ManageRecordButtonComponent,
        RecordPermissionViewComponent,
        RecordCardComponent,
        RecordFiltersComponent,
        RecordMarkdownComponent,
        RecordsViewComponent,
        RecordViewComponent,
        RecordViewTabsetComponent,
        RecordTypeComponent,
    ]
})
export class CatalogModule {}
