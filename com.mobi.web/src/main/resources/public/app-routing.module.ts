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
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { APP_BASE_HREF, HashLocationStrategy, LocationStrategy } from '@angular/common';

import { HomePageComponent } from './home/components/homePage/homePage.component';
import { DiscoverPageComponent } from './discover/components/discoverPage/discoverPage.component';
import { OntologyEditorPageComponent } from './ontology-editor/components/ontologyEditorPage/ontologyEditorPage.component';
import { CatalogPageComponent } from './catalog/components/catalogPage/catalogPage.component';
import { ShapesGraphEditorPageComponent } from './shapes-graph-editor/components/shapesGraphEditorPage/shapesGraphEditorPage.component';
import { MapperPageComponent } from './mapper/components/mapperPage/mapperPage.component';
import { SettingsPageComponent } from './settings/components/settingsPage/settingsPage.component';
import { UserManagementPageComponent } from './user-management/components/userManagementPage/userManagementPage.component';
import { DatasetsPageComponent } from './datasets/components/datasetsPage/datasetsPage.component';
import { MergeRequestsPageComponent } from './merge-requests/components/mergeRequestsPage/mergeRequestsPage.component';
import { AuthenticationGuard } from './authentication.guard';
import { LoginPageComponent } from './login/components/loginPage/loginPage.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { LoginLayoutComponent } from './layouts/login-layout.component';
import { AlreadyAuthenticatedGuard } from './alreadyAuthenticated.guard';

const routes: Routes = [
    {
        path: 'login', component: LoginLayoutComponent, canActivate: [ AlreadyAuthenticatedGuard ], children: [
          { path: '', component: LoginPageComponent, data: { title: 'Login' } },
        ]
      },
      {
        path: '', component: MainLayoutComponent, canActivate: [ AuthenticationGuard ], children: [
            { path: '', redirectTo: '/home', pathMatch: 'full'},
            { path: 'home', component: HomePageComponent, data: { title: 'Home' } },
            { path: 'catalog', component: CatalogPageComponent, data: { title: 'Catalog' } },
            { path: 'ontology-editor', component: OntologyEditorPageComponent, data: { title: 'Ontology Editor' } },
            { path: 'shapes-graph-editor', component: ShapesGraphEditorPageComponent, data: { title: 'Shapes Editor' } },
            { path: 'discover', component: DiscoverPageComponent, data: { title: 'Discover' } },
            { path: 'mapper', component: MapperPageComponent, data: { title: 'Mapping Tool' } },
            { path: 'datasets', component: DatasetsPageComponent, data: { title: 'Datasets' } },
            { path: 'settings', component: SettingsPageComponent, data: { title: 'Settings' } },
            { path: 'user-management', component: UserManagementPageComponent, data: { title: 'User Management' } },
            { path: 'merge-requests', component: MergeRequestsPageComponent, data: { title: 'Merge Requests' } }
        ]
      }
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: APP_BASE_HREF, useValue: ''},
        AuthenticationGuard,
        AlreadyAuthenticatedGuard
    ]
})
export class AppRoutingModule {}
