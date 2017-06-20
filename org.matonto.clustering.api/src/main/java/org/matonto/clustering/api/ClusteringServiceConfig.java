package org.matonto.clustering.api;

import aQute.bnd.annotation.metatype.Meta;


@Meta.OCD
public interface ClusteringServiceConfig {

    String id();

    @Meta.AD(required = false)
    String title();

    @Meta.AD(required = false)
    String description();

}
