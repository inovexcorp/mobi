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
describe('Record View component', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, utilSvc, prefixes, userManagerSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'limit-description');
        mockCatalogManager();
        mockCatalogState();
        mockUtil();
        mockPrefixes();
        mockUserManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _utilService_, _prefixes_, _userManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            userManagerSvc = _userManagerService_;
        });

        this.catalogId = 'catalogId';
        this.recordId = 'recordId';
        this.userId = 'userId';
        this.username = 'user';
        this.keywords = [{'@value': 'B'}, {'@value': 'A'}];
        this.record = {'@id': this.recordId, [prefixes.catalog + 'keyword']: this.keywords};
        utilSvc.getPropertyId.and.callFake((obj, propId) => {
            if (propId === prefixes.catalog + 'catalog') {
                return this.catalogId;
            }
            return '';
        });
        utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
        utilSvc.getDctermsId.and.callFake((obj, prop) => {
            if (prop === 'publisher') {
                return this.userId;
            }
            return '';
        });
        utilSvc.getDate.and.returnValue('date');
        userManagerSvc.users = [{iri: this.userId, username: this.username}];
        catalogStateSvc.selectedRecord = this.record;
        catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
        this.element = $compile(angular.element('<record-view></record-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        utilSvc = null;
        prefixes = null;
        userManagerSvc = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('if the record is found', function() {
            expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(this.controller.record).toEqual(this.record);
            expect(catalogStateSvc.selectedRecord).toEqual(this.record);
            expect(this.controller.title).toEqual('title');
            expect(this.controller.description).toEqual('description');
            expect(this.controller.publisherName).toEqual(this.username);
            expect(this.controller.modified).toEqual('date');
            expect(this.controller.issued).toEqual('date');
            expect(this.controller.keywords).toEqual(['A', 'B']);
            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
        });
        it('unless the record is not found', function() {
            catalogManagerSvc.getRecord.and.returnValue($q.reject('Error message'));
            this.element = $compile(angular.element('<record-view></record-view>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('recordView');
            expect(this.controller.record).toBeUndefined();
            expect(catalogStateSvc.selectedRecord).toBeUndefined();
            expect(utilSvc.createWarningToast).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
           this.controller.goBack();
           expect(catalogStateSvc.selectedRecord).toBeUndefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-VIEW');
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.back-column').length).toEqual(1);
            expect(this.element.querySelectorAll('.record-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.record-sidebar').length).toEqual(1);
        });
        ['record-view-tabset', 'button', 'record-icon', 'dl', 'limit-description'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('depending on how many keywords there are', function() {
            expect(this.element.querySelectorAll('.keyword').length).toEqual(this.keywords.length);

            this.controller.keywords = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.keyword').length).toEqual(0);
        });
    });
    it('should go back to the catalog page when the button is clicked', function() {
        spyOn(this.controller, 'goBack');
        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(this.controller.goBack).toHaveBeenCalled();
    });
});