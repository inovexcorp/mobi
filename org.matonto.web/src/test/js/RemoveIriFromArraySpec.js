describe('Remove IRI From Array filter', function() {
    var $filter,
        responseObjSvc;

    beforeEach(function() {
        module('responseObj');
        module('removeIriFromArray');

        inject(function(_$filter_, _responseObj_) {
            $filter = _$filter_;
            responseObjSvc = _responseObj_;
            spyOn(responseObjSvc, 'getItemIri').and.callFake(function(obj) {
                return _.get(obj, 'iri', '');
            });
        });
    });

    it('returns an array with the passed value if not an array and item is falsey', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}], function(value) {
            result = $filter('removeIriFromArray')(value, false);
            expect(result).toEqual([value]);
            result = $filter('removeIriFromArray')(value, '');
            expect(result).toEqual([value]);
            result = $filter('removeIriFromArray')(value, 0);
            expect(result).toEqual([value]);
            result = $filter('removeIriFromArray')(value, undefined);
            expect(result).toEqual([value]);
            result = $filter('removeIriFromArray')(value, null);
            expect(result).toEqual([value]);
        });
    });
    it('returns an empty array if passed value is not an array or an empty array and item is truthy', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}, []], function(value) {
            result = $filter('removeIriFromArray')(value, 'Test');
            expect(result).toEqual([]);
            result = $filter('removeIriFromArray')(value, 1);
            expect(result).toEqual([]);
            result = $filter('removeIriFromArray')(value, {});
            expect(result).toEqual([]);
            result = $filter('removeIriFromArray')(value, []);
            expect(result).toEqual([]);
        });
    });
    it('returns a copy of the passed in array with all objects with matching ids when item is a string', function() {
        var result,
            tests = [
            {
                arr: [{iri: 'test'}],
                item: 'test',
                result: []
            },
            {
                arr: [{iri: 'test'}],
                item: 'iri',
                result: [{iri: 'test'}]
            },
            {
                arr: [{iri: 'test'}],
                item: [{'@id': 'test'}],
                result: []
            },
            {
                arr: [{iri: 'test'}, {iri: 'test1'}],
                item: [{'@id': 'test'}, {'@id': 'test1'}],
                result: []
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('removeIriFromArray')(test.arr, test.item);
            expect(result).toEqual(test.result);
        });
    });
});