package org.matonto.repository.config;

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface RepositoryConsumerConfig {

    @Meta.AD(id = "repository.target")
    String repositoryId();
}
