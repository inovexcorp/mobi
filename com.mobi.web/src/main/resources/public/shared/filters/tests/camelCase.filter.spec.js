describe('Camel Case filter', function() {
    var $filter;

    beforeEach(function() {
        module('camelCase');

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
            result = $filter('camelCase')(value);
            expect(result).toEqual('');
            result = $filter('camelCase')(value, 'class');
            expect(result).toEqual('');
        });
    });
    it('returns an empty string when passed an object or an array', function() {
        var result;
        _.forEach([[], {}], function(value) {
            result = $filter('camelCase')(value);
            expect(result).toEqual('');
            result = $filter('camelCase')(value, 'class');
            expect(result).toEqual('');
        });
    });
    it('returns a class-wise camel case string when passed a string and type "class"', function() {
        var tests = [
            {
                value: 'abc',
                result: 'Abc'
            },
            {
                value: 'abc.&#@_def',
                result: 'Abcdef'
            },
            {
                value: 'ABC',
                result: 'ABC'
            },
            {
                value: 'abc def',
                result: 'AbcDef'
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('camelCase')(test.value, 'class');
            expect(result).toEqual(test.result);
        });
    });
    it('returns a general camel case string when passed a string and not type', function() {
        var tests = [
            {
                value: 'abc',
                result: 'abc'
            },
            {
                value: 'abc.&#@_def',
                result: 'abcdef'
            },
            {
                value: 'ABC',
                result: 'aBC'
            },
            {
                value: 'abc def',
                result: 'abcDef'
            }
        ];
        _.forEach(tests, function(test) {
            result = $filter('camelCase')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});