package org.matonto.rdf.core.impl.sesame;

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;

@Component(provide = ModelFactory.class,
        properties = {
                "service.ranking:Integer=10"
        })
public class TreeModelFactoryService extends AbstractModelFactory {

    @Override
    public Model createModel() {
        return new TreeModel();
    }
}
