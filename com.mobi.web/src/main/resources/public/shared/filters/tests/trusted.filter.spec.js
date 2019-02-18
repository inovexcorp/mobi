describe('Trusted filter', function() {
    var $filter, $sce;

    beforeEach(function() {
        module('trusted');

        inject(function(_$filter_, _$sce_) {
            $filter = _$filter_;
            $sce = _$sce_;
        });
    });

    afterEach(function() {
        $filter = null;
        $sce = null;
    });

    it('returns undefined if text is falsey or an object', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}, []], function(value) {
            result = $filter('trusted')(value);
            expect(result).toEqual(undefined);
        });
    });
    it('returns the result of $sce.trustAsHtml if text is truthy', function() {
        var result,
            tests = ['test', '<div></div>'];
        _.forEach(tests, function(test) {
            result = $filter('trusted')(test.value);
            expect(result).toEqual($sce.trustAsHtml(test.value));
        });
    });
});