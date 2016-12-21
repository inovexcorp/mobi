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
    var ontologyManagerSvc;

    beforeEach(function() {
        module('ontologyManager');
        mockPrefixes();
        mockUpdateRefs();
        mockResponseObj();
        mockPropertyManager();
        mockUtil();

        inject(function(ontologyManagerService, _$httpBackend_) {
            ontologyManagerSvc = ontologyManagerService;
            $httpBackend = _$httpBackend_;
        });

        ontologyManagerSvc.catalogId = 'local-catalog';
    });

    /*it('getAllOntologyIds parses out the dcterms:identifier from each record', function(done) {
        var ontologyIds = [{
            "@id": "https://matonto.org/records#931c73f0-31dd-4bcf-b40b-30586930d60d",
            "@type": ["http://matonto.org/ontologies/catalog#OntologyRecord"],
            "http://purl.org/dc/terms/identifier": [{"@value": "http://matonto.org/ontology/1.0"}]
        }, {
            "@id": "https://matonto.org/records#931c73f0-31dd-4bcf-b40b-30586930d60d2",
            "@type": ["http://matonto.org/ontologies/catalog#OntologyRecord"],
            "http://purl.org/dc/terms/identifier": [{"@value": "http://matonto.org/ontology/2.0"}]
        }];
        var expected = ["http://matonto.org/ontology/1.0", "http://matonto.org/ontology/2.0"];
        var config = {
            params: {
                type: 'http://matonto.org/ontologies/catalog#OntologyRecord'
            }
        }
        $httpBackend.whenGET('/matontorest/catalogs/' + ontologyManagerSvc.catalogId + '/records').respond(200,
            ontologyIds);
        ontologyManagerSvc.getAllOntologyIds().then(function(response) {
            expect(_.get(response, 'data', [])).toBe(expected);
            done();
        }, function(response) {
            fail('Promise should have resolved');
            done();
        });
        $httpBackend.flush();
    });*/
});
