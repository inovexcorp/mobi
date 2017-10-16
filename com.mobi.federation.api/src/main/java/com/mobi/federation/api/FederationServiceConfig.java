package com.mobi.federation.api;

/*-
 * #%L
 * federation.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

/**
 * This interface describes the base service configuration for a {@link FederationService} implementation.
 */
@Meta.OCD
public interface FederationServiceConfig {

    /**
     * An ID for the {@link FederationService} instance.
     */
    String id();

    /**
     * The name of the {@link FederationService} instance.
     */
    @Meta.AD(required = false)
    String title();

    /**
     * A brief description of the {@link FederationService}.
     */
    @Meta.AD(required = false)
    String description();

    /**
     * An encrypted key used to generate and verify the federation token.
     */
    @Meta.AD
    String sharedKey();
}
