describe('Click to Copy directive', function() {
    var $compile, scope, toastr;

    beforeEach(function() {
        module('templates');
        module('clickToCopy');
        mockToastr();

        inject(function(_$compile_, _$rootScope_, _toastr_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            toastr = _toastr_;
        });

        scope.text = 'text';
        this.element = $compile(angular.element('<div click-to-copy="text"></div>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        toastr = null;
        this.element.remove();
    });

    it('adds the appropriate attributes to the element', function() {
        expect(this.element.attr('click-to-copy')).toBeUndefined();
        expect(this.element.attr('uib-tooltip')).toEqual('Copy to clipboard');
        expect(this.element.attr('ngclipboard')).toEqual('');
        expect(this.element.attr('data-clipboard-text')).toEqual(scope.text);
        expect(this.element.attr('ngclipboard-success')).toEqual('onSuccess()');
    });
    it('updates the clipboard text when the value changes', function() {
        scope.text = 'something else';
        scope.$digest();
        expect(this.element.attr('data-clipboard-text')).toEqual(scope.text);
    });
    it('onSuccess calls correct toastr method', function() {
        scope.onSuccess();
        expect(toastr.success).toHaveBeenCalledWith('', 'Copied', {timeOut: 2000});
    });
});