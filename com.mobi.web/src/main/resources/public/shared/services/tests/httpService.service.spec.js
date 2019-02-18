describe('Http service', function() {
    var httpSvc, $http, $q;

    beforeEach(function() {
        module('httpService');

        inject(function(httpService, _$http_, _$q_) {
            httpSvc = httpService;
            $http = _$http_;
            $q = _$q_;
        });
    });

    afterEach(function() {
        httpSvc = null;
        $http = null;
        $q = null;
    });

    describe('isPending should return', function() {
        it('true if id exists in pending array', function() {
            httpSvc.pending = [{
                id: 'id'
            }];
            expect(httpSvc.isPending('id')).toBe(true);
        });
        it('false if id does not exist in pending array', function() {
            expect(httpSvc.isPending('id')).toBe(false);
        });
    });
    describe('cancel should resolve the correct canceller', function() {
        beforeEach(function() {
            this.resolve = jasmine.createSpy('resolve');
            httpSvc.pending = [{
                id: 'id',
                canceller: {
                    resolve: this.resolve
                }
            }];
        });
        it('if id is present', function() {
            spyOn(httpSvc, 'isPending').and.returnValue(true);
            httpSvc.cancel('id', false);
            expect(this.resolve).toHaveBeenCalled();
        });
        it('if id is not present', function() {
            spyOn(httpSvc, 'isPending').and.returnValue(false);
            httpSvc.cancel('not-there');
            expect(this.resolve).not.toHaveBeenCalled();
        });
    });
    describe('get should call the correct methods when id', function() {
        beforeEach(function() {
            spyOn($http, 'get').and.callThrough();
            spyOn($q, 'defer').and.returnValue({resolve: 'different'});
        });
        it('exists in the pending array', function() {
            httpSvc.pending = [{
                id: 'id',
                canceller: {
                    resolve: jasmine.createSpy('resolve')
                }
            }];
            httpSvc.get('url', {prop: 'prop'}, 'id');
            expect($http.get).toHaveBeenCalledWith('url', jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(2);
            expect(httpSvc.pending[1].canceller).toEqual({resolve: 'different'});
        });
        it('does not exist in the pending array', function() {
            httpSvc.get('url', {prop: 'prop'}, 'id');
            expect($http.get).toHaveBeenCalledWith('url', jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(1);
            expect(httpSvc.pending[0].canceller).toEqual({resolve: 'different'});
        });
    });
    describe('post should call the correct methods when id', function() {
        beforeEach(function() {
            spyOn($http, 'post').and.callThrough();
            spyOn($q, 'defer').and.returnValue({resolve: 'different'});
        });
        it('exists in the pending array', function() {
            httpSvc.pending = [{
                id: 'id',
                canceller: {
                    resolve: jasmine.createSpy('resolve')
                }
            }];
            httpSvc.post('url', {data: 'data'}, {prop: 'prop'}, 'id');
            expect($http.post).toHaveBeenCalledWith('url', {data: 'data'}, jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(2);
            expect(httpSvc.pending[1].canceller).toEqual({resolve: 'different'});
        });
        it('does not exist in the pending array', function() {
            httpSvc.post('url', {data: 'data'}, {prop: 'prop'}, 'id');
            expect($http.post).toHaveBeenCalledWith('url', {data: 'data'}, jasmine.objectContaining({prop: 'prop'}));
            expect(httpSvc.pending.length).toBe(1);
            expect(httpSvc.pending[0].canceller).toEqual({resolve: 'different'});
        });
    });
});
