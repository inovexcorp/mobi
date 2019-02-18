describe('Show Properties filter', function() {
    var $filter;

    beforeEach(function() {
        module('showProperties');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });

        this.entity = {'prop1': '', 'prop2': ''};
        this.properties = ['prop1', 'prop2'];
    });

    afterEach(function() {
        $filter = null;
    });

    describe('returns an empty array', function() {
        it('if properties is not an array', function() {
            _.forEach([false, '', 0, undefined, null], function(value) {
                var result = $filter('showProperties')(this.entity, value);
                expect(result).toEqual([]);
            });
        });
        it('if entity does not have the property', function() {
            var result = $filter('showProperties')(this.entity, ['prop3', 'prop4']);
            expect(result).toEqual([]);
        });
    });
    it('returns an array of items that are validated', function() {
        var result = $filter('showProperties')(this.entity, this.properties);
        expect(result.length).toBe(2);

        result = $filter('showProperties')(this.entity, ['prop1', 'prop2', 'prop3', 'prop4']);
        expect(result.length).toBe(2);
    });
});
