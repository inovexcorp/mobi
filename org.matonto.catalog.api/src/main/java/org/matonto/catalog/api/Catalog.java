package org.matonto.catalog.api;

import java.time.OffsetDateTime;

public interface Catalog {

    /**
     * Returns the title of the Catalog.
     *
     * @return The String representing the Catalog title.
     */
    String getTitle();

    /**
     * Returns the Catalog description.
     *
     * @return The String representing the Catalog description.
     */
    String getDescription();

    /**
     * Returns the Catalog issue datetime.
     *
     * @return The OffsetDateTime representing the Catalog issue datetime.
     */
    OffsetDateTime getIssued();

    /**
     * Returns the Catalog last modified datetime.
     *
     * @return The OffsetDateTime representing the Catalog last modified datetime.
     */
    OffsetDateTime getModified();

    /**
     * Returns the Catalog license.
     *
     * @return The String representing the Catalog license.
     */
    String getLicense();

    /**
     * Returns the Catalog rights.
     *
     * @return The String representing the Catalog rights.
     */
    String getRights();
}
