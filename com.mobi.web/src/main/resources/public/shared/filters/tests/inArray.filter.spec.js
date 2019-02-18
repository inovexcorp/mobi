describe('Remove IRI From Array filter', function() {
    var $filter;

    beforeEach(function() {
        module('inArray');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    afterEach(function() {
        $filter = null;
    });

    it('returns an empty array if passed value is not an array', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}], function(value) {
            result = $filter('inArray')(value, []);
            expect(result).toEqual([]);
        });
    });
    it('returns an empty array if array filter is not an array', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}], function(value) {
            result = $filter('inArray')([], value);
            expect(result).toEqual([]);
        });
    });
    it('returns the intersection of the passed in array and the array filter', function() {
        var result,
            tests = [
            {
                arr: [''],
                filter: [],
                result: []
            },
            {
                arr: [],
                filter: [''],
                result: []
            },
            {
                arr: ['a', 'b'],
                filter: ['a'],
                result: ['a']
            },
            {
                arr: ['a'],
                filter: ['a', 'b'],
                result: ['a']
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('inArray')(test.arr, test.filter);
            expect(result).toEqual(test.result);
        });
    });
});