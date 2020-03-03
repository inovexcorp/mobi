package com.mobi.persistence.utils.rio;

import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.api.Statement;

public class SkolemizeHandler implements StatementHandler {

    private BNodeService service;

    public SkolemizeHandler(BNodeService service) {
        this.service = service;
    }

    @Override
    public Statement handleStatement(Statement st) {
        return service.skolemize(st);
    }
}
