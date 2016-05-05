package org.matonto.persistence.utils;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

@Component(provide = org.matonto.persistence.utils.Values.class)
public class Values {

    private ValueFactory valueFactory;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    public Resource getIriOrBnode(String resourceString) {
        if (resourceString.trim().matches("^_:.*$")) {
            return valueFactory.createBNode(resourceString.trim());
        } else {
            return valueFactory.createIRI(resourceString.trim());
        }
    }
}
