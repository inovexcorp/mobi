/*-
 * #%L
 * org.matonto.web
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
describe('Catalog Manager service', function() {
    var $httpBackend,
        catalogManagerSvc,
        prefixes,
        ontologyManagerSvc;

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();
        mockOntologyManager();

        inject(function(catalogManagerService, _$httpBackend_, _$httpParamSerializer_, _prefixes_, _ontologyManagerService_) {
            catalogManagerSvc = catalogManagerService;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    it('should get the IRIs for all record types', function(done) {
        $httpBackend.whenGET('/matontorest/catalogs/record-types').respond(200, []);
        $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, []);
        $httpBackend.whenGET('/matontorest/catalogs').respond(200, []);
        catalogManagerSvc.getRecordTypes().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    it('should get the IRIs for all sort options', function(done) {
        $httpBackend.whenGET('/matontorest/catalogs/record-types').respond(200, []);
        $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, []);
        $httpBackend.whenGET('/matontorest/catalogs').respond(200, []);
        catalogManagerSvc.getSortOptions().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    describe('should retrieve a list of Records', function() {
        beforeEach(function(){
            $httpBackend.whenGET('/matontorest/catalogs/resource-types').respond(200, []);
            $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, []);
            $httpBackend.whenGET('/matontorest/catalogs').respond(200, []);

            this.limit = 10;
            this.catalogId = 'http://matonto.org/catalogs/local';
            this.currentPage = 0;
            this.sortOption = {
                field: 'http://purl.org/dc/terms/title',
                asc: true
            };
            this.type = prefixes.catalog + 'Record';
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * 10,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(this.catalogId) + '/records?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecords(this.catalogId, this.currentPage, this.limit, this.sortOption, '').then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a type filter', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * this.limit,
                sort: this.sortOption.field,
                type: this.type,
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(this.catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(this.catalogId, this.currentPage, this.limit, this.sortOption, this.type).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without a type filter', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * this.limit,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(this.catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(this.catalogId, this.currentPage, this.limit, this.sortOption, '').then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should get a page of results based on the passed URL', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/catalogs/resource-types').respond(200, []);
            $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, []);
            $httpBackend.whenGET('/matontorest/catalogs').respond(200, []);
            this.url = 'matontorest/catalogs/local/records';
        });
        it('unless there is an error', function(done) {
            $httpBackend.expectGET(this.url).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResultsPage(this.url).then(function(response) {
                fail('Promise should have rejected');
                done();
            },function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET(this.url).respond(200, []);
            catalogManagerSvc.getResultsPage(this.url).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
});