describe('Blank Node Value Display directive', function() {
    var $compile, scope, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('blankNodeValueDisplay');
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        ontoUtils.getBlankNodeValue.and.returnValue('bnode');
        scope.nodeId = 'id';
        this.element = $compile(angular.element('<blank-node-value-display node-id="nodeId"></blank-node-value-display>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontoUtils = null;
    });

    it('initializes value correctly', function() {
        var controller = this.element.controller('blankNodeValueDisplay');
        expect(controller.value).toEqual('bnode');
        expect(ontoUtils.getBlankNodeValue).toHaveBeenCalledWith(scope.nodeId);
    });
    describe('in isolated scope', function() {
        it('nodeId should be one way bound', function() {
            var isolatedScope = this.element.isolateScope()
            isolatedScope.nodeId = 'different';
            scope.$digest();
            expect(scope.nodeId).toEqual('id');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('blank-node-value-display')).toBe(true);
        });
        it('with a ui-codemirror', function() {
            expect(this.element.find('ui-codemirror').length).toEqual(1);
        });
    });
});