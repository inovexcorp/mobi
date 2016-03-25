package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.net.URL;
import java.time.OffsetDateTime;

public interface Distribution {

    String getTitle();

    String getDescription();

    OffsetDateTime getIssued();

    OffsetDateTime getModified();

    String getLicense();

    String getRights();

    URL getAccessURL();

    URL getDownloadURL();

    String getMediaType();

    String getFormat();

    long getByteSize();

    Resource getResource();
}
