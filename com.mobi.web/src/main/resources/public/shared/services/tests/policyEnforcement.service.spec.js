describe('Policy Enforcement service', function() {
    var policyEnforcementSvc, scope, $httpBackend, $httpParamSerializer, utilSvc, $q;

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
        this.jsonRequest = {
            'resourceId':'urn:test',
            'actionId':'urn:test',
            'actionAttrs': {
                'urn:test':'urn:test'
            },
            'resourceAttrs': {
               'urn:test':'urn:test'
            },
            'subjectAttrs': {
              'urn:test':'urn:test'
            }
        };
    });

    afterEach(function() {
        policyEnforcementSvc = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        utilSvc = null;
        $q = null;
    });

    describe('should evaluate a request', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPOST('/mobirest/pep').respond(400, null, null, 'Error Message');
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
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
            $httpBackend.expectPOST('/mobirest/pep', this.jsonRequest).respond(200);
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('with additional fields when resolved', function() {
            var copy = JSON.parse(JSON.stringify(this.jsonRequest));
            $httpBackend.expectPOST('/mobirest/pep', copy).respond(200);
            this.jsonRequest.additionalField = 'urn:test';
            policyEnforcementSvc.evaluateRequest(this.jsonRequest)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            expect(policyEnforcementSvc.evaluateRequest)
            flushAndVerify($httpBackend);
        });
    });
});