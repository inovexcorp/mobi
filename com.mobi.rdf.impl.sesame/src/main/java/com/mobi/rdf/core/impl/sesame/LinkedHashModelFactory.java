package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

public class LinkedHashModelFactory extends LinkedHashModelFactoryService {

    private LinkedHashModelFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of LinkedHashModelFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final LinkedHashModelFactory INSTANCE = new LinkedHashModelFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static LinkedHashModelFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
