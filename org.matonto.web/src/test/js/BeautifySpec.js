describe('Beautify filter', function() {
    var $filter;

    beforeEach(function() {
        module('beautify');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    it('returns an empty string when given a falsey value', function() {
        var result;
        _.forEach([false, '', 0, undefined, null], function(value) {
            result = $filter('beautify')(value);
            expect(result).toEqual('');
        });
    });
    it('returns an empty string when passed an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('beautify')(value);
            expect(result).toEqual('');
        });
    });
    it('returns a beautified string when passed a string', function() {
        var tests = [
            {
                value: 'abc',
                result: 'Abc'
            },
            {
                value: 'abc.&#@_def',
                result: 'Abc.&#@_def'
            },
            {
                value: 'ABC',
                result: 'A B C'
            },
            {
                value: 'abc def',
                result: 'Abc def'
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('beautify')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});