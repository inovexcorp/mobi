package org.matonto.rdf.core.impl.sesame;

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.NamedGraph;
import org.matonto.rdf.api.NamedGraphFactory;
import org.matonto.rdf.api.Resource;

@Component(
        provide = NamedGraphFactory.class,
        properties = {
                "service.ranking:Integer=10",
                "implType=tree"
        })
public class TreeNamedGraphFactoryService extends AbstractNamedGraphFactory {

    @Override
    public NamedGraph createNamedGraph(Resource graphID) {
        return new SimpleNamedGraph(graphID, TreeModelFactory.getInstance());
    }
}
