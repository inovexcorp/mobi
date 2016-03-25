package org.matonto.catalog.config;

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface CatalogConfig {

    String title();

    String description();

    String iri();
}
