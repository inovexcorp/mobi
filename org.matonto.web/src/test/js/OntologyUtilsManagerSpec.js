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
describe('Ontology Utils Manager service', function() {
    var ontologyUtilsManagerSvc;
    var ontologyManagerSvc;
    var ontologyStateSvc;

    beforeEach(function() {
        module('ontologyUtilsManager');
        mockOntologyManager();
        mockOntologyState();
        mockUpdateRefs();

        inject(function(ontologyUtilsManagerService, _ontologyManagerService_, _ontologyStateService_) {
            ontologyUtilsManagerSvc = ontologyUtilsManagerService;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });
    });

    it('isBlankNodeString tests whether an id is a blank node', function() {
        var falseTests = ['', [], {}, true, false, undefined, null, 0, 1];
        var result;
        _.forEach(falseTests, function(test) {
            result = ontologyUtilsManagerSvc.isBlankNodeString(test);
            expect(result).toBe(false);
        });

        result = ontologyUtilsManagerSvc.isBlankNodeString('_:b');
        expect(result).toBe(true);
    });
    describe('getBlankNodeValue returns', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.blankNodes = {key1: 'value1'};
        });
        it('value for the key provided contained in the object', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(ontologyStateSvc.listItem.blankNodes['key1']);
        });
        it('key for the key provided not contained in the object', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key2')).toEqual('key2');
        });
        it('undefined if isBlankNodeString returns false', function() {
            spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(false);
            expect(ontologyUtilsManagerSvc.getBlankNodeValue('key1')).toEqual(undefined);
        });
    });
    it('isLinkable returns proper value', function() {
        ontologyStateSvc.listItem.index = {iri: 0, '_:b': 1};
        expect(ontologyUtilsManagerSvc.isLinkable('iri')).toEqual(true);
        expect(ontologyUtilsManagerSvc.isLinkable('word')).toEqual(false);
        spyOn(ontologyUtilsManagerSvc, 'isBlankNodeString').and.returnValue(true);
        expect(ontologyUtilsManagerSvc.isLinkable('_:b')).toEqual(false);
    });
    it('getNameByIRI should call the proper methods', function() {
        var entity = {'@id': 'id'};
        var iri = 'iri';
        var recordId = 'recordId';
        ontologyStateSvc.listItem.recordId = recordId;
        ontologyManagerSvc.getEntityByRecordId.and.returnValue(entity);
        ontologyUtilsManagerSvc.getNameByIRI(iri);
        expect(ontologyManagerSvc.getEntityByRecordId).toHaveBeenCalledWith(recordId, iri);
        expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(entity);
    });
    it('getNameByNode calls the correct method', function() {
        spyOn(ontologyUtilsManagerSvc, 'getNameByIRI');
        ontologyUtilsManagerSvc.getNameByNode({entityIRI: 'iri'});
        expect(ontologyUtilsManagerSvc.getNameByIRI).toHaveBeenCalledWith('iri');
    });
});