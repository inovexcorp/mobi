package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.Set;

public interface PublishedResource {

    String getTitle();

    String getDescription();

    OffsetDateTime getIssued();

    OffsetDateTime getModified();

    String getIdentifier();

    Set<String> getKeywords();

    Set<Distribution> getDistributions();

    Resource getResource();

    Resource getType();
}
