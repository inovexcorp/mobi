package org.matonto.catalog.api;

import java.time.OffsetDateTime;

public interface Catalog {

    String getTitle();

    String getDescription();

    OffsetDateTime getIssued();

    OffsetDateTime getModified();

    String getLanguage();

    String getLicense();

    String getRights();
}
