/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
        module('shared');
        mockComponent('shared', 'valueDisplay');
        mockComponent('shared', 'infoMessage');
        mockComponent('shared', 'errorDisplay');
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
            httpSvc = _httpService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        this.error = 'error';
        this.commitId = 'commit';
        this.entityId = 'entity';
        this.resource = 'resource';

        catalogManagerSvc.getCompiledResource.and.returnValue($q.when([this.resource]));
        catalogManagerSvc.getCommit.and.returnValue($q.when([this.commitId]));

        scope.commitId = '';
        scope.entityId = '';
        this.element = $compile(angular.element('<commit-compiled-resource commit-id="commitId" entity-id="entityId"></commit-compiled-resource>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitCompiledResource');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        httpSvc = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('scope is one way bound', function() {
            this.controller.commitId = 'Test';
            this.controller.entityId = 'Test';
            scope.$digest();
            expect(scope.commitId).toEqual('');
            expect(scope.entityId).toEqual('');
        });
    });
    describe('controller method setResource', function() {
        beforeEach(function() {
            this.controller.commitId = this.commitId;
            this.controller.entityId = this.entityId;
        });
        it('should get compiled resource and the commit', function() {
            this.controller.setResource();
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.id);
            expect(catalogManagerSvc.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, 'commit-compiled-resource');
            expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
            expect(this.controller.resource[0]).toEqual(this.resource[0]);
        });
        it('with no commitId, should not be called', function() {
            this.controller.commitId = null;
            this.controller.setResource();
            scope.$apply();
            expect(httpSvc.cancel).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getCompiledResource).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getCommit).not.toHaveBeenCalled();
            expect(this.controller.resource).toBeUndefined();
        });
        it('with commitId, but rejection on getting compiled resource in setResource', function() {
            catalogManagerSvc.getCompiledResource.and.returnValue($q.reject('Error Message'))
            this.controller.setResource();
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.id);
            expect(catalogManagerSvc.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, 'commit-compiled-resource');
            expect(catalogManagerSvc.getCommit).not.toHaveBeenCalled();
            expect(this.controller.error).toEqual('Error Message');
        });
        it('with commitId, but rejection on getting the commit in setResource', function() {
            catalogManagerSvc.getCommit.and.returnValue($q.reject('Error Message'))
            this.controller.setResource();
            scope.$apply();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.id);
            expect(catalogManagerSvc.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, 'commit-compiled-resource');
            expect(catalogManagerSvc.getCommit).toHaveBeenCalledWith(this.commitId);
            expect(this.controller.error).toEqual('Error Message');
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
