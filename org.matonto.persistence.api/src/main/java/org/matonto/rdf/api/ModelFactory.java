package org.matonto.rdf.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Set;

public interface ModelFactory {

    /**
     * Creates an empty Model.
     *
     * @return The created Model.
     */
    Model createModel();

    /**
     * Creates a Model populated with the supplied Model as its contents and the supplied
     * Model's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Model model);

    /**
     * Creates a Model populated with the supplied Collection as its contents.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Collection<@Nonnull ? extends Statement> c);

    /**
     * Creates an empty Model with the supplied Model's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Set<Namespace> namespaces);

    /**
     * Creates a Model populated with the supplied Collection as its contents and the supplied
     * Collection's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Set<Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c);
}