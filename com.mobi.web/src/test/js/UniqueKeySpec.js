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
describe('Unique Key filter', function() {
    var $filter;
    var entity1 = { entity: { orignalIRI: 'entity1id', label: 'Entity 1', ontologyIRI: 'ontology1' }, toplevelid: 'toplevel1' };
    var entity2 = { entity: { orignalIRI: 'entity2id', label: 'Entity 2', ontologyIRI: 'ontology1' }, toplevelid: 'toplevel4' };
    var entity3 = { entity: { orignalIRI: 'entity1id', label: 'Entity 3', ontologyIRI: 'ontology2' }, toplevelid: 'toplevel3' };
    var entity4 = { entity: { orignalIRI: 'entity4id', label: 'Entity 4', ontologyIRI: 'ontology3' }, toplevelid: 'toplevel4' };
    var collection = [entity1, entity2, entity3, entity4];

    beforeEach(function() {
        module('uniqueKey');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    it('returns subset of collection when there are duplicates', function() {
        var result = $filter('uniqueKey')(collection, 'toplevelid');
        expect(result).toEqual([entity1, entity2, entity3]);
    });
    it('returns subset of collection when there are duplicates and the keyfield is not top level', function() {
        var result = $filter('uniqueKey')(collection, 'entity.orignalIRI');
        expect(result).toEqual([entity1, entity2, entity4]);
    });
    it('returns all items when all items are unique', function() {
        var result = $filter('uniqueKey')(collection, 'entity.label');
        expect(result).toEqual(collection);
    });
    it('returns all items when keyfield is empty', function() {
        var result = $filter('uniqueKey')(collection, '');
        expect(result).toEqual(collection);
    });
    it('returns all items when keyfield is undefined', function() {
        var result = $filter('uniqueKey')(collection);
        expect(result).toEqual(collection);
    });
    it('returns no items when no items have the keyfield', function() {
        var result = $filter('uniqueKey')(collection, 'entity.orignalIRI.doesnotexist');
        expect(result).toEqual([]);
    });
});