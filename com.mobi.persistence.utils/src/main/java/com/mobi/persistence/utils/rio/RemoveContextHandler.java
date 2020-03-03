package com.mobi.persistence.utils.rio;

import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;

public class RemoveContextHandler implements StatementHandler {

    ValueFactory vf;

    public RemoveContextHandler(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Override
    public Statement handleStatement(Statement st) {
        return vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject());
    }
}
