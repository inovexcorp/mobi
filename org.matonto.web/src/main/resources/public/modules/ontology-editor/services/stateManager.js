(function() {
    'use strict';

    angular
        .module('stateManager', [])
        .service('stateManagerService', stateManagerService);

        stateManagerService.$inject = [];

        function stateManagerService() {
            var self = this;

            self.states = {
                current: 'everything',
                everything: {
                    id: 'everything',
                    editor: 'default',
                    editorTab: 'basic'
                },
                class: {
                    id: 'class',
                    editor: 'default',
                    editorTab: 'basic'
                },
                object: {
                    id: 'object',
                    editor: 'default',
                    editorTab: 'basic'
                },
                datatype: {
                    id: 'datatype',
                    editor: 'default',
                    editorTab: 'basic'
                }
            }

            self.changeTreeTab = function(tab) {
                self.states.current = tab;
            }

            self.changeEditorTab = function(tab) {
                self.states[self.states.current].editorTab = tab;
            }

            self.setState = function(editor, oi, ci, pi) {
                var state = self.states[self.states.current];
                state.oi = oi;
                state.ci = ci;
                state.pi = pi;
                state.editor = editor;
            }

            self.getState = function() {
                return self.states[self.states.current];
            }
        }
})();