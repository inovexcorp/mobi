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
import { Routes, RouterModule } from '@angular/router';
import { APP_BASE_HREF, HashLocationStrategy, LocationStrategy } from '@angular/common';

import { AlreadyAuthenticatedGuard } from './alreadyAuthenticated.guard';
import { AuthenticationGuard } from './authentication.guard';
import { AuthenticationHomeGuard } from './authenticationHome.guard';
import { CatalogPageComponent } from './catalog/components/catalogPage/catalogPage.component';
import { DatasetsPageComponent } from './datasets/components/datasetsPage/datasetsPage.component';
import { DiscoverPageComponent } from './discover/components/discoverPage/discoverPage.component';
import { EntitySearchPageComponent } from './entity-search/components/entity-search-page/entity-search-page.component';
import { HomePageComponent } from './home/components/homePage/homePage.component';
import { LoginLayoutComponent } from './layouts/login-layout.component';
import { LoginPageComponent } from './login/components/loginPage/loginPage.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { MapperPageComponent } from './mapper/components/mapperPage/mapperPage.component';
import { MergeRequestsPageComponent } from './merge-requests/components/mergeRequestsPage/mergeRequestsPage.component';
import { OntologyEditorPageComponent } from './ontology-editor/components/ontologyEditorPage/ontologyEditorPage.component';
import { PERSPECTIVES } from './shared/models/routePerspective.interface';
import { SettingsPageComponent } from './settings/components/settingsPage/settingsPage.component';
import { ShapesGraphEditorPageComponent } from './shapes-graph-editor/components/shapesGraphEditorPage/shapesGraphEditorPage.component';
import { UserManagementPageComponent } from './user-management/components/userManagementPage/userManagementPage.component';
import { WorkflowsComponent } from './workflows/components/workflows/workflows.component';

const routes: Routes = [
  {
    path: 'login', component: LoginLayoutComponent, canActivate: [AlreadyAuthenticatedGuard], children: [
      {path: '', component: LoginPageComponent, data: {title: 'Login'}},
    ]
  },
  {
    path: '', component: MainLayoutComponent, canActivate: [AuthenticationHomeGuard], children: [
      {path: '', redirectTo: '/home', pathMatch: 'full'},
      {path: 'home', component: HomePageComponent, canActivate: [AuthenticationGuard], data: {title: 'Home'}},
      {path: 'catalog', component: CatalogPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Catalog'}},
      {path: 'entity-search', component: EntitySearchPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Entity Search'}},
      {path: 'ontology-editor', component: OntologyEditorPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Ontology Editor'}},
      {path: 'shapes-graph-editor', component: ShapesGraphEditorPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Shapes Editor'}},
      {path: 'workflows', component: WorkflowsComponent, canActivate: [AuthenticationGuard], data: {title: 'Workflows'}},
      {path: 'discover', component: DiscoverPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Discover'}},
      {path: 'mapper', component: MapperPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Mapping Tool'}},
      {path: 'datasets', component: DatasetsPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Datasets'}},
      {path: 'settings', component: SettingsPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Settings'}},
      {path: 'user-management', component: UserManagementPageComponent, canActivate: [AuthenticationGuard], data: {title: 'User Management'}},
      {path: 'merge-requests', component: MergeRequestsPageComponent, canActivate: [AuthenticationGuard], data: {title: 'Merge Requests'}}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    {provide: APP_BASE_HREF, useValue: ''},
    {
      provide: PERSPECTIVES, useValue: [
        {icon: 'home', route: '/home', name: 'Home'},
        {icon: 'book', route: '/catalog', name: 'Catalog'},
        {icon: 'level-up fa-rotate-90', route: 'entity-search', name: 'Entity Search', sub: true},
        {icon: 'pencil-square-o', route: '/ontology-editor', name: 'Ontology Editor'},
        {mat: true, icon: 'rule', route: '/shapes-graph-editor', name: 'Shapes Editor'},
        {icon: 'envelope-o', route: '/merge-requests', name: 'Merge Requests'},
        {icon: 'map-o', route: '/mapper', name: 'Mapping Tool'},
        {icon: 'database', route: '/datasets', name: 'Datasets'},
        {icon: 'search', route: '/discover', name: 'Discover'},
        {mat: true, icon: 'fact_check', route: '/workflows', name: 'Workflows'},
      ]
    },
    AuthenticationGuard,
    AuthenticationHomeGuard,
    AlreadyAuthenticatedGuard
  ]
})
export class AppRoutingModule {}