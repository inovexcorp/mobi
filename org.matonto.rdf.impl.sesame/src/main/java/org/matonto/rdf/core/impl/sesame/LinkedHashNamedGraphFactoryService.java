package org.matonto.rdf.core.impl.sesame;

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.NamedGraph;
import org.matonto.rdf.api.NamedGraphFactory;
import org.matonto.rdf.api.Resource;

@Component(
        provide = NamedGraphFactory.class,
        properties = {
                "service.ranking:Integer=20",
                "implType=hash"
        })
public class LinkedHashNamedGraphFactoryService extends AbstractNamedGraphFactory {

    @Override
    public NamedGraph createNamedGraph(Resource graphID) {
        return new SimpleNamedGraph(graphID, LinkedHashModelFactory.getInstance());
    }
}
