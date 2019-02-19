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
describe('Commit Compiled Resource component', function() {
    var $compile, scope, $q, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('commitCompiledResource');
        injectChromaConstant();
        injectTrustedFilter();
        mockCatalogManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _$q_, _httpService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            httpSrc = _httpService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        this.error = 'error';
        this.commitId = 'commit';
        this.entityId = 'entity';
        this.resource = 'resource';
        this.additions = 'addition';
        this.deletions = 'deletion';

        catalogManagerSvc.getCompiledResource.and.returnValue($q.when([this.resource]));
        catalogManagerSvc.getCommit.and.returnValue($q.when([this.commitId]));

        scope.commits = [{id: this.commitId}];
        scope.entityId = [{id: this.entityId}];
        this.element = $compile(angular.element('<commit-compiled-resource commit-id="commitId" entity-id="entityId"></commit-compiled-resource>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitCompiledResource');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('commits is one way bound', function() {
            this.controller.commits = this.commits;
            scope.$digest();
            expect(scope.commits).toEqual([ {'id': this.commitId} ]);
            expect(scope.entityId).toEqual([ {'id': this.entityId} ]);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.controller.commitId = this.commitId;
            this.controller.entityId = this.entityId;
        });
        it('should get compiled resource and the commit', function() {
            this.controller.setResource();
            scope.$apply();
            expect(catalogManagerSvc.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, 'commit-compiled-resource');
            expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
            expect(this.controller.resource).toBeDefined();
        });
        it('should set additions', function() {
            expect(this.controller.additions).toBeDefined();
        });
        it('should set deletions', function() {
            expect(this.controller.deletions).toBeDefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMIT-COMPILED-RESOURCE');
        });
        it('depending on whether a resource is found', function() {
            this.controller.resource = [{"@name": [
                                             "http://www.w3.org/2002/07/owl#Class"
                                           ]}];
            this.controller.commitId = 'commit';
            this.controller.entityId = 'entity';
            scope.$digest();
            expect(this.element.querySelectorAll('.wrapper').length).toBe(1);
            expect(this.element.querySelectorAll('.property-values').length).toBe(1);
            expect(this.element.querySelectorAll('.prop-value-container').length).toBe(1);
            expect(this.element.querySelectorAll('.value-display-wrapper').length).toBe(1);
            expect(this.element.querySelectorAll('.prop-header').length).toBe(1);
            expect(this.element.querySelectorAll('.value-signs').length).toBe(1);
            expect(this.element.querySelectorAll('.value-display').length).toBe(1);
        });
        it('depending on whether there is a error', function() {
            this.controller.error = undefined;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = this.error;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether there is no resource and no error', function() {
            this.controller.error = undefined;
            this.controller.resource = [{"@type": [
                                "http://www.w3.org/2002/07/owl#Class"
                              ]}];
            scope.$digest();
            expect(this.element.find('info-message').length).toBe(0);
            this.controller.resource = undefined;
            scope.$digest();
            expect(this.element.find('info-message').length).toBe(1);
        });
    });
});
