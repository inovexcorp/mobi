package org.matonto.catalog.config;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConsumerConfig;

@Meta.OCD
public interface CatalogConfig extends RepositoryConsumerConfig {

    String title();

    String description();

    String iri();
}
