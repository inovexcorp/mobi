package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;

public interface PublishedResourceBuilder<T extends PublishedResourceBuilder, U extends PublishedResource> {

    T description(String val);

    T issued(OffsetDateTime val);

    T modified(OffsetDateTime val);

    T identifier(String val);

    T addKeyword(String val);

    T addDistribution(Distribution val);

    T addType(Resource val);

    U build();
}
