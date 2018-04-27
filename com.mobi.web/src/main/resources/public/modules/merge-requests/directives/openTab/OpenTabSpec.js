/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Open Tab directive', function() {
    var $compile, scope, $q, catalogManagerSvc, mergeRequestManagerSvc, utilSvc, userManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('openTab');
        mockCatalogManager();
        mockUserManager();
        mockMergeRequestManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _mergeRequestManagerService_, _utilService_, _userManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
            userManagerSvc = _userManagerService_;
            prefixes = _prefixes_;
        });

        this.deferred = $q.defer();
        mergeRequestManagerSvc.getRequests.and.returnValue(this.deferred.promise);
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        this.element = $compile(angular.element('<open-tab></open-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('openTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        userManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize requests properly if getRequests', function() {
        describe('resolves', function() {
            beforeEach(function() {
                this.deferred.resolve([{id: 'request1'}]);
                utilSvc.getDctermsValue.and.callFake(function(entity, propId) {
                    return propId;
                });
                utilSvc.getDctermsId.and.callFake(function(entity, propId) {
                    return propId;
                });
                utilSvc.getPropertyId.and.returnValue('recordId');
                utilSvc.getDate.and.returnValue('date');
                userManagerSvc.users = [{iri: 'creator', username: 'username'}];
            });
            describe('and getRecord ', function() {
                it('resolves', function() {
                    catalogManagerSvc.getRecord.and.returnValue($q.when({'@id': 'recordId'}));
                    scope.$apply();
                    expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'issued');
                    expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith({id: 'request1'}, prefixes.mergereq + 'onRecord');
                    expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId'}, 'title');
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(this.controller.requests).toEqual([{
                        request: {id: 'request1'},
                        title: 'title',
                        creator: 'username',
                        date: 'date',
                        recordIri: 'recordId',
                        recordTitle: 'title'
                    }]);
                });
                it('rejects', function() {
                    catalogManagerSvc.getRecord.and.returnValue($q.reject('Error Message'));
                    scope.$apply();
                    expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'issued');
                    expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith({id: 'request1'}, prefixes.mergereq + 'onRecord');
                    expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                    expect(this.controller.requests).toEqual([]);
                });
            });
        });
        it('rejects', function() {
            this.deferred.reject('Error Message');
            scope.$apply();
            expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
            expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
            expect(utilSvc.getDctermsId).not.toHaveBeenCalled();
            expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            expect(this.controller.requests).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('open-tab')).toEqual(true);
            expect(this.element.hasClass('row')).toEqual(true);
            expect(this.element.querySelectorAll('.wrapping-column').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('depending on how many merge requests there are', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.request').length).toEqual(0);

            this.controller.requests = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.request').length).toEqual(this.controller.requests.length);
        });
    });
});
