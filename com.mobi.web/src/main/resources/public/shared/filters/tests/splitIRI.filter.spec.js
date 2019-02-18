describe('Split IRI filter', function() {
    var $filter;

    beforeEach(function() {
        module('splitIRI');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    afterEach(function() {
        $filter = null;
    });

    it('returns an object with empty string values if iri is falsey or an object', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}, []], function(value) {
            result = $filter('splitIRI')(value);
            expect(result).toEqual({begin: '', then: '', end: ''});
        });
    });
    it('returns the split apart iri if passed a string', function() {
        var results,
            tests = [
                {
                    value: 'a#a',
                    result: {
                        begin: 'a',
                        then: '#',
                        end: 'a'
                    }
                },
                {
                    value: 'a/a',
                    result: {
                        begin: 'a',
                        then: '/',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a',
                    result: {
                        begin: 'a',
                        then: ':',
                        end: 'a'
                    }
                },
                {
                    value: 'a/a/a',
                    result: {
                        begin: 'a/a',
                        then: '/',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a:a',
                    result: {
                        begin: 'a:a',
                        then: ':',
                        end: 'a'
                    }
                },
                {
                    value: 'a:a/a:a',
                    result: {
                        begin: 'a:a/a',
                        then: ':',
                        end: 'a'
                    }
                }
            ];
        _.forEach(tests, function(test) {
            result = $filter('splitIRI')(test.value);
            expect(result).toEqual(test.result);
        });
    });
});