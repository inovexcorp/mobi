package org.matonto.rdf.core.impl.sesame.factory;

import org.matonto.rdf.api.Resource;
import org.matonto.rdf.core.utils.Values;

public class ResourceValueFactory implements SesameMatOntoValueFactory<Resource, org.openrdf.model.Resource> {

    @Override
    public Resource asMatOntoObject(org.openrdf.model.Resource object) {
        return Values.matontoResource(object);
    }
}
