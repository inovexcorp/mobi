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
import 'hammerjs';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UIRouterUpgradeModule } from '@uirouter/angular-hybrid';

import { MODULE_NAME } from './app.module.ajs';

import { SharedModule } from './shared/shared.module';
import { ShapesGraphEditorModule } from './shapes-graph-editor/shapes-graph-editor.module';
import { LoginModule } from './login/login.module';
import { SettingsModule } from './settings/settings.module';
import { HomeModule } from './home/home.module';
import { UserManagementModule } from './user-management/user-management.module';
import { CatalogModule } from './catalog/catalog.module';
import { DatasetsModule } from './datasets/datasets.module';
import { OntologyVisualizationModule } from './ontology-visualization/ontologyVisualization.module';
import { AppComponent } from './app.component';
import { MergeRequestsModule } from './merge-requests/merge-requests.module';
import { MapperModule } from './mapper/mapper.module';
import { DiscoverModule } from './discover/discover.module';
import { OntologyEditorModule } from './ontology-editor/ontology-editor.module';

@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        HttpClientModule,
        BrowserAnimationsModule,
        UIRouterUpgradeModule.forRoot(),
        SharedModule,
        CatalogModule,
        DatasetsModule,
        LoginModule,
        MapperModule,
        HomeModule,
        DiscoverModule,
        OntologyEditorModule,
        OntologyVisualizationModule,
        MergeRequestsModule,
        SettingsModule,
        ShapesGraphEditorModule,
        UserManagementModule
    ],
    declarations: [
        AppComponent
    ],
    entryComponents: [
        AppComponent
    ],
    providers: []
})
export class AppModule {
    constructor(private upgrade: UpgradeModule) {

    }

    ngDoBootstrap(): void {
        this.upgrade.bootstrap(document.documentElement, [MODULE_NAME], { strictDi: true });
    }
}
