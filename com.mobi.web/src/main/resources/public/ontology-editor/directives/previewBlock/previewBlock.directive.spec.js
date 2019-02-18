describe('Preview Block directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('previewBlock');
        mockOntologyState();
        mockOntologyManager();
        mockModal();

        module(function($provide) {
            $provide.value('jsonFilter', () => 'json');
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<preview-block></preview-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('previewBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('preview-block')).toBe(true);
        });
        _.forEach(['card', 'card-header', 'card-body'], item => {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        _.forEach(['form', 'serialization-select'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('depending on whether a preview is generated', function() {
            expect(this.element.find('ui-codemirror').length).toBe(0);

            this.controller.activePage = {preview: 'test'};
            scope.$digest();
            expect(this.element.find('ui-codemirror').length).toBe(1);
        });
        it('depending on whether a serialization was selected', function() {
            var button = angular.element(this.element.querySelectorAll('.refresh-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.activePage = {serialization: 'test'};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should get a preview', function() {
            it('if the format is JSON-LD', function() {
                this.controller.activePage = {serialization: 'jsonld'};
                this.controller.getPreview();
                scope.$apply();
                expect(this.controller.activePage.mode).toBe('application/ld+json');
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'jsonld', false, true);
                expect(this.controller.activePage.preview).toEqual('json');
            });
            it('if the format is not JSON-LD', function() {
                [
                    {
                        serialization: 'turtle',
                        mode: 'text/turtle'
                    },
                    {
                        serialization: 'rdf/xml',
                        mode: 'application/xml'
                    }
                ].forEach(function(test) {
                    this.controller.activePage = {serialization: test.serialization};
                    this.controller.getPreview();
                    scope.$apply();
                    expect(this.controller.activePage.mode).toBe(test.mode);
                    expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, test.serialization, false, true);
                    expect(this.controller.activePage.preview).toEqual({});
                }.bind(this));
            });
        });
        it('should open the ontologyDownloadOverlay', function() {
            this.controller.showDownloadOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('ontologyDownloadOverlay');
        });
    });
    it('should call getPreview when the button is clicked', function() {
        spyOn(this.controller, 'getPreview');
        var button = angular.element(this.element.querySelectorAll('button.refresh-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.getPreview).toHaveBeenCalled();
    });
    it('should call showDownloadOverlay when the download button is clicked', function() {
        spyOn(this.controller, 'showDownloadOverlay');
        var button = angular.element(this.element.querySelectorAll('button.download-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDownloadOverlay).toHaveBeenCalled();
    });
});