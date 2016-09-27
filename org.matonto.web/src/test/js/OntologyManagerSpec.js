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
describe('Ontology Manager service', function() {
    var $httpBackend;

    beforeEach(function() {
        module('ontologyManager');
        mockPrefixes();
        mockUpdateRefs();
        mockResponseObj();
        mockPropertyManager();

        inject(function(ontologyManagerService, _$httpBackend_) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
        });
    });

    //TODO: I'm not sure what to expect here.
    /*it('the getAllOntologyIds function should call correct REST endpoint', function() {
        var ontologyIds = ['id1', 'id2'];
        $httpBackend.whenGET('/matontorest/ontologies/ontologyids').respond(200, ontologyIds);
        $httpBackend.flush();
    });*/


});
