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
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import '@sourceflow/gitgraph-js';
import 'chroma-js';
import 'lodash';
import 'jquery';
import 'popper.js';
import 'daemonite-material';
import 'sparqljs';
import 'bootstrap';
import 'font-awesome/css/font-awesome.min.css';
import './css/angular-material.scss';
import './css/customMaterial.scss';
import './css/manchestersyntax.scss';
import './css/styles.scss';
import '@triply/yasgui/build/yasgui.min.css';
import './css/yasgui.scss';
import 'gridjs/dist/theme/mermaid.min.css';

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
import { VersionedRdfRecordEditorModule } from './versioned-rdf-record-editor/versioned-rdf-record-editor.module';
import { LoginLayoutComponent } from './layouts/login-layout.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { WorkflowsModule } from './workflows/workflows.module';
import { AppRoutingModule } from './app-routing.module';
import { EntitySearchModule } from './entity-search/entity-search.module';
import { AuthInterceptor } from './auth.interceptor';

@NgModule({
    imports: [
        AppRoutingModule,
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot(),
        SharedModule,
        CatalogModule,
        DatasetsModule,
        LoginModule,
        MapperModule,
        HomeModule,
        DiscoverModule,
        EntitySearchModule,
        OntologyEditorModule,
        OntologyVisualizationModule,
        MergeRequestsModule,
        SettingsModule,
        ShapesGraphEditorModule,
        UserManagementModule,
        VersionedRdfRecordEditorModule,
        WorkflowsModule
    ],
    declarations: [
        AppComponent,
        LoginLayoutComponent,
        MainLayoutComponent
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {
    constructor() {}
}
