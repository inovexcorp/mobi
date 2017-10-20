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
describe('Catalog State service', function() {
    var $httpBackend,
        catalogStateSvc,
        catalogManagerSvc,
        utilSvc;

    beforeEach(function() {
        module('catalogState');
        mockCatalogManager();
        mockUtil();

        inject(function(catalogStateService, _catalogManagerService_, _utilService_) {
            catalogStateSvc = catalogStateService;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
        });
    });

    it('should initialize catalogs state', function() {
        catalogManagerSvc.sortOptions = [{}];
        catalogManagerSvc.localCatalog = {};
        catalogManagerSvc.distributedCatalog = {};
        catalogStateSvc.initialize();
        expect(catalogStateSvc.catalogs.local.catalog).toBe(catalogManagerSvc.localCatalog);
        expect(catalogStateSvc.catalogs.local.openedPath).toEqual([catalogManagerSvc.localCatalog]);
        expect(catalogStateSvc.catalogs.distributed.catalog).toBe(catalogManagerSvc.distributedCatalog);
        expect(catalogStateSvc.catalogs.distributed.openedPath).toEqual([catalogManagerSvc.distributedCatalog]);
        _.forEach(_.filter(catalogStateSvc.catalogs.local, function(val) {
            return _.has(val, 'sortOption');
        }), function(obj) {
            expect(obj.sortOption).toBe(catalogManagerSvc.sortOptions[0]);
        });
    });
    it('should reset all state variables', function() {
        spyOn(catalogStateSvc, 'resetPagination');
        catalogStateSvc.reset();
        expect(catalogStateSvc.resetPagination).toHaveBeenCalled();
    });
    it('should reset all pagination related state variables', function() {
        catalogStateSvc.resetPagination();
        expect(catalogStateSvc.currentPage).toBe(0);
        expect(catalogStateSvc.totalSize).toBe(0);
        expect(catalogStateSvc.links).toEqual({next: '', prev: ''});
        expect(catalogStateSvc.results).toEqual([]);
    });
    describe('should set the pagination variables based on a response', function() {
        beforeEach(function() {
            this.headers = {
                'x-total-count': 0
            };
            this.response = {
                data: [],
                headers: jasmine.createSpy('headers').and.returnValue(this.headers)
            };
        });
        it('if it has links', function() {
            var nextLink = 'http://example.com/next';
            var prevLink = 'http://example.com/prev';
            this.headers.link = '<' + nextLink + '>; rel=\"next\", <' + prevLink + '>; rel=\"prev\"';
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
            catalogStateSvc.setPagination(this.response);
            expect(catalogStateSvc.results).toEqual(this.response.data);
            expect(catalogStateSvc.totalSize).toEqual(this.headers['x-total-count']);
            expect(catalogStateSvc.links.next).toBe(nextLink);
            expect(catalogStateSvc.links.prev).toBe(prevLink);
        });
        it('if it does not have links', function() {
            catalogStateSvc.setPagination(this.response);
            expect(catalogStateSvc.results).toEqual(this.response.data);
            expect(catalogStateSvc.totalSize).toEqual(this.headers['x-total-count']);
            expect(catalogStateSvc.links.next).toBe('');
            expect(catalogStateSvc.links.prev).toBe('');
        });
    });
    it('should retrieve the current catalog state object', function() {
        catalogStateSvc.catalogs.local.show = true;
        expect(catalogStateSvc.getCurrentCatalog()).toBe(catalogStateSvc.catalogs.local);

        catalogStateSvc.catalogs.local.show = false;
        catalogStateSvc.catalogs.distributed.show = true;
        expect(catalogStateSvc.getCurrentCatalog()).toBe(catalogStateSvc.catalogs.distributed);
    });
});