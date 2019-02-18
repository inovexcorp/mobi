describe('Escape HTML filter', function() {
    var $filter;

    beforeEach(function() {
        module('escapeHTML');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    afterEach(function() {
        $filter = null;
    });

    it('returns an empty string when given a falsey value', function() {
        var result;
        _.forEach([false, '', 0, undefined, null], function(value) {
            result = $filter('escapeHTML')(value);
            expect(result).toEqual('');
        });
    });
    it('returns the string representation of an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('escapeHTML')(value);
            expect(result).toEqual(value.toString());
        });
    });
    it('returns a copy of the string with escaped special characters', function() {
        result = $filter('escapeHTML')('<>&');
        expect(result).toEqual('&lt;&gt;&amp;');
    });
});