package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.Set;

public abstract class AbstractPublishedResource implements PublishedResource {

    protected String title;
    protected String description;
    protected OffsetDateTime issued;
    protected OffsetDateTime modified;
    protected String identifier;
    protected Set<String> keywords;
    protected Set<Distribution> distributions;
    protected Resource resource;
    protected Set<Resource> types;

    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public OffsetDateTime getIssued() {
        return issued;
    }

    @Override
    public OffsetDateTime getModified() {
        return modified;
    }

    @Override
    public String getIdentifier() {
        return identifier;
    }

    @Override
    public Set<String> getKeywords() {
        return keywords;
    }

    @Override
    public Set<Distribution> getDistributions() {
        return distributions;
    }

    @Override
    public Resource getResource() {
        return resource;
    }

    @Override
    public Set<Resource> getTypes() {
        return types;
    }
}
