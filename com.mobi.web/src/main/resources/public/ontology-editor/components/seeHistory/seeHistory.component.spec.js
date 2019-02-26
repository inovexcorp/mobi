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
describe('See History component', function() {
    var $compile, scope, $filter, catalogManagerSvc, manchesterConverterSvc, ontologyManagerSvc, ontologyStateSvc, ontologyUtilsManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('staticIri', 'staticIri');
        injectTrustedFilter();
        injectHighlightFilter();
        injectPrefixationFilter();
        mockCatalogManager();
        mockManchesterConverter();
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$filter_, _catalogManagerService_, _manchesterConverterService_, _ontologyManagerService_, _ontologyStateService_, _ontologyUtilsManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
            catalogManagerSvc = _catalogManagerService_;
            manchesterConverterSvc = _manchesterConverterService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            utilSvc = _utilService_;
        });

        this.commits = ['commits1', 'commits2'];
        this.element = $compile(angular.element('<see-history></see-history>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('seeHistory');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $filter = null;
        catalogManagerSvc = null;
        manchesterConverterSvc = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        ontologyUtilsManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should go to prev', function() {
            this.controller.commits = [this.commits];
            ontologyStateSvc.listItem.selectedCommit = this.controller.commits[1];
            scope.$digest();
            this.controller.prev();
            expect(ontologyStateSvc.listItem.selectedCommit).toEqual(this.controller.commits[0]);
        });
        it('should go to next', function() {
            this.controller.commits = [this.commits];
            ontologyStateSvc.listItem.selectedCommit = this.controller.commits[0];
            scope.$digest();
            this.controller.next();
            expect(ontologyStateSvc.listItem.selectedCommit).toEqual(this.controller.commits[1]);
        });
        it('should go back', function() {
            this.controller.goBack();
            expect(ontologyStateSvc.listItem.seeHistory).toBeUndefined();
            expect(ontologyStateSvc.listItem.selectedCommit).toBeUndefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SEE-HISTORY');
        });
        it('for classes', function() {
            expect(this.element.querySelectorAll('.see-history-header').length).toBe(1);
            expect(this.element.querySelectorAll('.see-history-title').length).toBe(1);
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('components used', function() {
            ['commit-compiled-resource', 'commit-history-table'].forEach(test => {
                it('with a ' + test, function() {
                    expect(this.element.find(test).length).toEqual(1);
                });
            });

        });
    });
});
