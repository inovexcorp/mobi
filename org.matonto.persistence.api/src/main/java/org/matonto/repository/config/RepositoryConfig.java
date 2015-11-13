package org.matonto.repository.config;

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface RepositoryConfig {

    String id();

    String title();

    @Meta.AD(required = false)
    String dataDir();
}
