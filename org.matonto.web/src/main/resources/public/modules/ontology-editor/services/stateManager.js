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
                    tab: 'everything',
                    editor: 'default',
                    editorTab: 'basic'
                },
                class: {
                    tab: 'class',
                    editor: 'default',
                    editorTab: 'basic'
                },
                object: {
                    tab: 'object',
                    editor: 'default',
                    editorTab: 'basic'
                },
                datatype: {
                    tab: 'datatype',
                    editor: 'default',
                    editorTab: 'basic'
                }
            }

            self.setTreeTab = function(tab) {
                self.states.current = tab;
            }

            self.setEditorTab = function(tab) {
                self.states[self.states.current].editorTab = tab;
            }

            self.getEditorTab = function() {
                return self.states[self.states.current].editorTab;
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

            self.setStateToNew = function(state, ontologies) {
                var editor,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi;
                if(oi === -1) {
                    oi = ontologies.length - 1;
                    editor = 'ontology-editor';
                } else if(ci === -1) {
                    ci = ontologies[oi].matonto.classes.length - 1;
                    editor = 'class-editor';
                } else {
                    pi = ontologies[oi].matonto.classes[ci].matonto.properties.length - 1;
                    editor = 'property-editor';
                }
                self.setState(editor, oi, ci, pi);
            }

            self.clearState = function(oi) {
                var prop, state;
                for(prop in self.states) {
                    if(self.states[prop].oi === oi) {
                        state = self.states[prop];
                        state.oi = undefined;
                        state.ci = undefined;
                        state.pi = undefined;
                        state.editor = 'default';
                    }
                }
            }
        }
})();