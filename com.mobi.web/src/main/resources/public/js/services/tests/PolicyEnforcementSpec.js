describe('Policy Enforcement service', function() {
    var analyticManagerSvc, scope, $httpBackend, $httpParamSerializer, utilSvc, $q;

    beforeEach(function() {
        module('policyEnforcement');
        mockUtil();
        injectRestPathConstant();
        mockPrefixes();

        inject(function(policyEnforcementService, _$rootScope_, _utilService_, _$httpBackend_, _$httpParamSerializer_, _$q_) {
            policyEnforcementSvc = policyEnforcementService;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.subjectAttr = {};
        this.resourceId = {};
        this.resourceAttrs = {};
        this.actionId = {};
        this.actionAttrs = {};
    });

    afterEach(function() {
        analyticManagerSvc = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        utilSvc = null;
        $q = null;
    });

    describe('should update a policy', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/policy-enforcement').respond(400, null, null, 'Error Message');
            policyEnforcementSvc.evaluateRequest(this.subjectAttr, this.resourceId, this.resourceAttrs, this.actionId, this.actionAttrs)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('when resolved', function() {
            $httpBackend.whenPOST('/mobirest/policy-enforcement').respond(200);
            policyEnforcementSvc.evaluateRequest(this.subjectAttr, this.resourceId, this.resourceAttrs, this.actionId, this.actionAttrs)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});