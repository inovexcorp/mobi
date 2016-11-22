package org.matonto.platform.config.api.application;

import aQute.bnd.annotation.metatype.Meta;

/**
 * Configuration for Application objects in the repository.
 */
public interface ApplicationConfig {

    /**
     * The id of the Application service. Used as the local name of the Application IRI.
     *
     * @return the id of the Application
     */
    @Meta.AD
    String id();

    /**
     * The title of the Application. Used as the dct:title of the Application object.
     *
     * @return the display title of the Application
     */
    @Meta.AD(required = false)
    String title();

    /**
     * The description of the Application. Used as the dct:description of the Application object.
     *
     * @return the description of the Application
     */
    @Meta.AD(required = false)
    String description();
}
