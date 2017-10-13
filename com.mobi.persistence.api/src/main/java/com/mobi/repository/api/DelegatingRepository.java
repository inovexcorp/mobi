package com.mobi.repository.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

public interface DelegatingRepository extends Repository {

    /**
     * Gets the Repository wrapped by this DelegatingRepository.
     *
     * @return the Repository wrapped by this DelegatingRepository.
     */
    Repository getDelegate();

    /**
     * Sets the Repository wrapped by this DelegatingRepository.
     *
     * @param delegate - The Repository to be wrapped by this DelegatingRepository.
     */
    void setDelegate(Repository delegate);

    /**
     * Returns the ID of this Repository Object.
     *
     * @return The String representing the ID of this Repository Object.
     */
    String getRepositoryID();
}
