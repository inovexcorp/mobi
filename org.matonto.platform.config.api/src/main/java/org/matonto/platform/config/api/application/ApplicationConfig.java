package org.matonto.platform.config.api.application;

/*-
 * #%L
 * org.matonto.platform.config.api
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

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.repository.config.RepositoryConsumerConfig;

/**
 * Configuration for Application objects in the repository.
 */
@Meta.OCD
public interface ApplicationConfig extends RepositoryConsumerConfig {

    /**
     * The ID of the Application service. Used as the local name of the Application IRI.
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
