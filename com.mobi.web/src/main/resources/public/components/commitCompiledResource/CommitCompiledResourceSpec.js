/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Commit Compiled Resource directive', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, ontologyUtilsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('commitCompiledResource');
        injectChromaConstant();
        mockCatalogManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _$q_, _httpService_, _catalogManagerService_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            httpSrc = _httpService_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
        });

        this.error = 'error';
        this.commitId = 'commit';
        this.commits = [{id: this.commitId}];

        scope.commitId = 'commit';
        scope.entityId = 'entity';
        scope.commitData = [];
        this.element = $compile(angular.element('<commit-compiled-resource commit-id="commitId" entity-id="entityId" commit-data="commitData"></commit-compiled-resource>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitCompiledResource');
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        ontologyUtilsManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.controller.commits = this.commits;
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commit-compiled-resource')).toBe(true);
            expect(this.element.querySelectorAll('.wrapper').length).toBe(1);
            expect(this.element.querySelectorAll('.property-values').length).toBe(1);
            expect(this.element.querySelectorAll('.prop-value-container').length).toBe(1);
            expect(this.element.querySelectorAll('.value-display-wrapper').length).toBe(1);
            expect(this.element.querySelectorAll('.prop-header').length).toBe(1);
            expect(this.element.querySelectorAll('.value-signs').length).toBe(1);
            expect(this.element.querySelectorAll('.value-display').length).toBe(1);
        });
        it('with tt', function() {
            expect(this.element.find('tt').length).toBe(2);
        });
        it('depending on whether there is a error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = this.error;
            scope.$apply();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether there are commits', function() {
            expect(this.element.find('info-message').length).toBe(0);
            this.controller.commits = [];
            scope.$apply();
            expect(this.element.find('info-message').length).toBe(1);
        });
    });
});
