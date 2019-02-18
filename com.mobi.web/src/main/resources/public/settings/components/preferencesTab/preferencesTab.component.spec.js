describe('Preferences Tab component', function() {
    var $compile, scope, settingsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('settings');
        mockComponent('settings', 'customPreference');
        mockComponent('settings', 'preferencesContainer');
        mockSettingsManager();

        inject(function(_$compile_, _$rootScope_, _settingsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            settingsManagerSvc = _settingsManagerService_;
        });

        this.element = $compile(angular.element('<preferences-tab></preferences-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('preferencesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        settingsManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should save the settings entered', function() {
            this.controller.settings = {};
            this.controller.save();
            expect(settingsManagerSvc.setSettings).toHaveBeenCalledWith(this.controller.settings);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PREFERENCES-TAB');
            expect(this.element.querySelectorAll('.preferences-tab').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-6').length).toEqual(1);
            expect(this.element.querySelectorAll('.offset-3').length).toEqual(1);
        });
        ['block', 'block-content', 'block-footer', 'preferences-container'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with custom-preferences', function() {
            expect(this.element.find('custom-preference').length).toEqual(2);
        });
        it('with a button to save', function() {
            expect(this.element.querySelectorAll('block-footer button').text().trim()).toEqual('Save');
        });
    });
    it('should save when the save button is clicked', function() {
        spyOn(this.controller, 'save');
        var saveBtn = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        saveBtn.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
});